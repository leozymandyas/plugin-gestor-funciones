import { ItemView, WorkspaceLeaf } from "obsidian";
import type GestorFuncionesPlugin from "./main";
import { FuncRef, leerSprints, listFuncionalidades, listFuncionalidadesDe } from "./files";
import { AsignarSprintModal } from "./modals";

export const VIEW_TYPE_ROADMAP = "gestor-funciones-roadmap";

interface FilaRoadmap {
	ref: FuncRef;
	tipo: "epica" | "funcionalidad";
	/** Para funcionalidades: slug de su épica (para precargar el modal). */
	epicaSlug: string;
	etiqueta: string;
	estado: string;
	/** número de sprint → etiquetas asignadas en el año visible. */
	porSprint: Map<number, string[]>;
}

export class RoadmapView extends ItemView {
	private plugin: GestorFuncionesPlugin;
	private anio = new Date().getFullYear();
	private desde = 1;
	private hasta = 52;
	private estadosSel = new Set<string>();
	private estadosVistos = new Set<string>();
	/** Filtro por tipo de fila: épicas y/o funcionalidades. */
	private tiposSel = new Set<"epica" | "funcionalidad">(["epica", "funcionalidad"]);

	constructor(leaf: WorkspaceLeaf, plugin: GestorFuncionesPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_ROADMAP;
	}

	getDisplayText(): string {
		return "Roadmap — Gestión Producto";
	}

	getIcon(): string {
		return "map";
	}

	async onOpen(): Promise<void> {
		await this.render();
	}

	private async datos(): Promise<{ filas: FilaRoadmap[]; estados: string[] }> {
		const filas: FilaRoadmap[] = [];
		const estados = new Set<string>(this.plugin.settings.estados.map((e) => e.valor));
		const admin = this.plugin.settings.carpetaAdmin.trim();
		if (!admin) return { filas, estados: [...estados] };

		const agregar = async (
			ref: FuncRef,
			tipo: FilaRoadmap["tipo"],
			epicaSlug: string,
			etiqueta: string
		) => {
			const estado = ref.estado ?? "pendiente";
			estados.add(estado);
			const sprints = (await leerSprints(this.app, ref)).filter((s) => s.anio === this.anio);
			if (sprints.length === 0) return;
			const porSprint = new Map<number, string[]>();
			for (const s of sprints) porSprint.set(s.sprint, s.etiquetas);
			filas.push({ ref, tipo, epicaSlug, etiqueta, estado, porSprint });
		};

		for (const epica of listFuncionalidades(this.app, admin)) {
			await agregar(epica, "epica", epica.slug, epica.nombre);
			for (const fn of listFuncionalidadesDe(this.app, epica.folder)) {
				await agregar(fn, "funcionalidad", epica.slug, `${epica.nombre} › ${fn.nombre}`);
			}
		}
		return { filas, estados: [...estados] };
	}

	async render(): Promise<void> {
		const cont = this.contentEl;
		cont.empty();
		cont.addClass("gf-roadmap");

		const { filas, estados } = await this.datos();
		// Los estados recién descubiertos entran seleccionados por defecto.
		for (const e of estados) {
			if (!this.estadosVistos.has(e)) {
				this.estadosVistos.add(e);
				this.estadosSel.add(e);
			}
		}

		const barra = cont.createDiv({ cls: "gf-roadmap-controles" });

		const actual = new Date().getFullYear();
		const anioSel = barra.createEl("select", { cls: "dropdown" });
		for (const a of [actual - 1, actual, actual + 1, actual + 2]) {
			anioSel.createEl("option", { text: String(a), value: String(a) });
		}
		anioSel.value = String(this.anio);
		anioSel.addEventListener("change", () => {
			this.anio = Number(anioSel.value);
			void this.render();
		});

		const rango = barra.createDiv({ cls: "gf-roadmap-rango" });
		rango.createEl("span", { text: "Sprint desde", cls: "gf-roadmap-lbl" });
		const inputDesde = rango.createEl("input", {
			type: "number",
			cls: "gf-roadmap-num",
			attr: { min: "1", max: "52" },
			value: String(this.desde),
		});
		rango.createEl("span", { text: "hasta", cls: "gf-roadmap-lbl" });
		const inputHasta = rango.createEl("input", {
			type: "number",
			cls: "gf-roadmap-num",
			attr: { min: "1", max: "52" },
			value: String(this.hasta),
		});
		const aplicarRango = () => {
			const limpio = (v: string, defecto: number) => {
				const n = Math.trunc(Number(v));
				return Number.isFinite(n) && n >= 1 && n <= 52 ? n : defecto;
			};
			this.desde = limpio(inputDesde.value, 1);
			this.hasta = limpio(inputHasta.value, 52);
			if (this.desde > this.hasta) [this.desde, this.hasta] = [this.hasta, this.desde];
			void this.render();
		};
		inputDesde.addEventListener("change", aplicarRango);
		inputHasta.addEventListener("change", aplicarRango);

		// Filtro por tipo de fila: épicas y/o funcionalidades.
		const tipos = barra.createDiv({ cls: "gf-roadmap-estados" });
		const TIPOS: Array<{ valor: "epica" | "funcionalidad"; texto: string }> = [
			{ valor: "epica", texto: "Épicas" },
			{ valor: "funcionalidad", texto: "Funcionalidades" },
		];
		for (const t of TIPOS) {
			const activo = this.tiposSel.has(t.valor);
			const chip = tipos.createEl("button", {
				text: t.texto,
				cls: "gf-chip" + (activo ? " gf-chip-on" : ""),
			});
			chip.addEventListener("click", () => {
				if (this.tiposSel.has(t.valor)) this.tiposSel.delete(t.valor);
				else this.tiposSel.add(t.valor);
				void this.render();
			});
		}

		const chips = barra.createDiv({ cls: "gf-roadmap-estados" });
		for (const estado of estados) {
			const activo = this.estadosSel.has(estado);
			const chip = chips.createEl("button", {
				text: estado,
				cls: "gf-chip" + (activo ? " gf-chip-on" : ""),
			});
			chip.addEventListener("click", () => {
				if (this.estadosSel.has(estado)) this.estadosSel.delete(estado);
				else this.estadosSel.add(estado);
				void this.render();
			});
		}

		const recargar = barra.createEl("button", { text: "Recargar", cls: "gf-roadmap-recargar" });
		recargar.addEventListener("click", () => void this.render());

		const visibles = filas.filter(
			(f) => this.estadosSel.has(f.estado) && this.tiposSel.has(f.tipo)
		);
		if (visibles.length === 0) {
			cont.createEl("p", {
				cls: "gf-kanban-vacio",
				text: "No hay épicas con sprints asignados para los filtros seleccionados.",
			});
			return;
		}

		const wrap = cont.createDiv({ cls: "gf-roadmap-tabla-wrap" });
		const tabla = wrap.createEl("table", { cls: "gf-roadmap-tabla" });
		const trh = tabla.createEl("thead").createEl("tr");
		trh.createEl("th", { text: "Épica", cls: "gf-roadmap-th-epica" });
		for (let n = this.desde; n <= this.hasta; n++) {
			trh.createEl("th", { text: String(n) });
		}
		const tbody = tabla.createEl("tbody");
		for (const fila of visibles) {
			const tr = tbody.createEl("tr");
			const tdNombre = tr.createEl("td", { cls: "gf-roadmap-epica" });
			const a = tdNombre.createEl("a", { cls: "internal-link", text: fila.etiqueta });
			if (fila.tipo === "funcionalidad") a.addClass("gf-roadmap-fn");
			a.addEventListener("click", (e) => {
				e.preventDefault();
				void this.app.workspace.getLeaf(false).openFile(fila.ref.file);
			});
			const nombreEstado =
				this.plugin.settings.estados.find((e) => e.valor === fila.estado)?.nombre ??
				fila.estado;
			tdNombre.createEl("span", { cls: "gf-estado-badge", text: nombreEstado });
			for (let n = this.desde; n <= this.hasta; n++) {
				const td = tr.createEl("td", { cls: "gf-roadmap-celda" });
				const etiquetas = fila.porSprint.get(n);
				if (!etiquetas) continue;
				td.addClass("gf-roadmap-on");
				td.setAttr(
					"title",
					etiquetas.length > 0 ? etiquetas.join(", ") : `Sprint ${n}`
				);
				// El bloque toma el color configurado de la primera etiqueta.
				const colorPrimera = this.colorDe(etiquetas[0]);
				if (colorPrimera) td.style.backgroundColor = conAlpha(colorPrimera, 0.25);
				const bloque = td.createDiv({ cls: "gf-roadmap-bloque" });
				for (const et of etiquetas.slice(0, 2)) {
					const chip = bloque.createEl("span", { cls: "gf-chip gf-chip-mini", text: et });
					const color = this.colorDe(et);
					if (color) {
						chip.style.backgroundColor = color;
						chip.style.borderColor = color;
						chip.style.color = "#ffffff";
					}
				}
				if (etiquetas.length > 2) {
					bloque.createEl("span", { cls: "gf-chip gf-chip-mini", text: "…" });
				}
				td.addEventListener("click", () => {
					new AsignarSprintModal(this.plugin, {
						epicaSlug: fila.epicaSlug,
						funcionalidadSlug:
							fila.tipo === "funcionalidad" ? fila.ref.slug : undefined,
						anio: this.anio,
						sprint: n,
					}).open();
				});
			}
		}
	}

	private colorDe(nombreEtiqueta: string): string | undefined {
		return this.plugin.settings.etiquetas.find((e) => e.nombre === nombreEtiqueta)?.color;
	}
}

/** Convierte #rrggbb a rgba con la opacidad dada. */
function conAlpha(hex: string, alpha: number): string {
	const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
	if (!m) return hex;
	return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${alpha})`;
}
