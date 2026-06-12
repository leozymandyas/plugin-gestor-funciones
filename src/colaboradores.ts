import { ItemView, TFile, WorkspaceLeaf } from "obsidian";
import type GestorFuncionesPlugin from "./main";
import {
	Incidencia,
	carpetasGestionListas,
	getAsignados,
	listFuncionalidades,
	listFuncionalidadesDe,
	listIncidencias,
} from "./files";

export const VIEW_TYPE_COLABORADORES = "gestor-funciones-colaboradores";

interface IncidenciaAsignada extends Incidencia {
	epica: string;
}

export class TareasColaboradorView extends ItemView {
	private plugin: GestorFuncionesPlugin;
	/** Colaboradores seleccionados en el filtro; vacío = mostrar todos. */
	private seleccionFiltro = new Set<string>();

	constructor(leaf: WorkspaceLeaf, plugin: GestorFuncionesPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_COLABORADORES;
	}

	getDisplayText(): string {
		return "Tareas por colaborador — Gestión Producto";
	}

	getIcon(): string {
		return "users";
	}

	async onOpen(): Promise<void> {
		this.render();
	}

	render(): void {
		const cont = this.contentEl;
		cont.empty();
		cont.addClass("gf-colab");

		if (!carpetasGestionListas(this.app)) {
			const aviso = cont.createDiv({ cls: "gf-kanban-aviso" });
			aviso.createEl("p", {
				text: "Crea las carpetas de gestión desde el panel de acciones antes de continuar.",
			});
			const btn = aviso.createEl("button", { text: "Abrir panel de acciones", cls: "mod-cta" });
			btn.addEventListener("click", () => void this.plugin.abrirAcciones());
			return;
		}

		const barra = cont.createDiv({ cls: "gf-roadmap-controles" });
		barra.createEl("span", { text: "Filtrar:", cls: "gf-roadmap-lbl" });
		const chipsFiltro = barra.createDiv({ cls: "gf-roadmap-estados" });
		// Filtro por etiquetas de colaborador: sin selección se muestran todos.
		const renderChipsFiltro = () => {
			chipsFiltro.empty();
			const colaboradores = this.plugin.settings.colaboradores;
			if (colaboradores.length === 0) {
				chipsFiltro.createEl("span", {
					cls: "gf-campo-aviso",
					text: "Sin colaboradores configurados.",
				});
				return;
			}
			for (const colab of colaboradores) {
				const activo = this.seleccionFiltro.has(colab.nombre);
				const chip = chipsFiltro.createEl("button", {
					text: colab.nombre,
					cls: "gf-chip" + (activo ? " gf-chip-on" : ""),
				});
				if (activo) {
					chip.style.backgroundColor = colab.color;
					chip.style.borderColor = colab.color;
				} else {
					chip.style.borderColor = colab.color;
					chip.style.color = colab.color;
				}
				chip.addEventListener("click", () => {
					if (activo) this.seleccionFiltro.delete(colab.nombre);
					else this.seleccionFiltro.add(colab.nombre);
					renderChipsFiltro();
					renderCuerpo();
				});
			}
		};
		const recargar = barra.createEl("button", { text: "Recargar", cls: "gf-roadmap-recargar" });
		recargar.addEventListener("click", () => this.render());

		const cuerpo = cont.createDiv();

		// Incidencias de épicas activas agrupadas por colaborador asignado.
		const porColaborador = new Map<string, IncidenciaAsignada[]>();
		for (const colab of this.plugin.settings.colaboradores) {
			porColaborador.set(colab.nombre, []);
		}
		const recoger = (ref: Parameters<typeof listIncidencias>[1], origen: string) => {
			for (const inc of listIncidencias(this.app, ref)) {
				for (const nombre of getAsignados(this.app, inc.file)) {
					const lista = porColaborador.get(nombre) ?? [];
					lista.push({ ...inc, epica: origen });
					porColaborador.set(nombre, lista);
				}
			}
		};
		for (const func of listFuncionalidades(this.app, this.plugin.settings.carpetaAdmin)) {
			recoger(func, func.nombre);
			for (const fn of listFuncionalidadesDe(this.app, func.folder)) {
				recoger(fn, `${func.nombre} › ${fn.nombre}`);
			}
		}

		const renderCuerpo = () => {
			cuerpo.empty();
			const nombres = [...porColaborador.keys()]
				.filter((n) => this.seleccionFiltro.size === 0 || this.seleccionFiltro.has(n))
				.sort((a, b) => a.localeCompare(b, "es"));

			if (nombres.length === 0) {
				cuerpo.createEl("em", {
					cls: "gf-kanban-vacio",
					text: "No hay colaboradores para mostrar.",
				});
				return;
			}

			for (const nombre of nombres) {
				const incidencias = porColaborador.get(nombre) ?? [];
				const tarjeta = cuerpo.createDiv({ cls: "gf-colab-card" });

				const head = tarjeta.createDiv({ cls: "gf-colab-head" });
				const punto = head.createDiv({ cls: "gf-colab-punto" });
				const color = this.plugin.settings.colaboradores.find(
					(c) => c.nombre === nombre
				)?.color;
				if (color) punto.style.backgroundColor = color;
				head.createEl("span", { text: nombre, cls: "gf-colab-nombre" });

				// Progreso: hechas vs por hacer / en progreso.
				const hechas = incidencias.filter(
					(i) => this.estadoDe(i.file) === "completado"
				).length;
				const total = incidencias.length;
				const pct = total > 0 ? Math.round((hechas / total) * 100) : 0;
				head.createEl("span", {
					cls: "gf-colab-conteo",
					text: total > 0 ? `${hechas} de ${total} hechas (${pct}%)` : "Sin incidencias",
				});
				if (total > 0) {
					const barraProg = tarjeta.createDiv({ cls: "gf-kanban-progreso-barra" });
					const relleno = barraProg.createDiv({ cls: "gf-kanban-progreso-relleno" });
					relleno.style.width = `${pct}%`;
				}

				if (incidencias.length > 0) {
					const ul = tarjeta.createEl("ul", { cls: "gf-colab-lista" });
					for (const inc of incidencias) {
						const li = ul.createEl("li");
						li.createEl("span", { text: this.tipoLegible(inc.tipo), cls: "gf-tipo-badge" });
						const a = li.createEl("a", { cls: "internal-link", text: inc.nombre });
						a.addEventListener("click", (e) => {
							e.preventDefault();
							void this.app.workspace.getLeaf(false).openFile(inc.file);
						});
						li.appendText(` — ${inc.epica} · ${this.estadoLegible(inc.file)}`);
					}
				}
			}
		};

		renderChipsFiltro();
		renderCuerpo();
	}

	private estadoDe(file: TFile): string {
		const estado = this.app.metadataCache.getFileCache(file)?.frontmatter?.estado;
		return estado ? String(estado) : "pendiente";
	}

	private estadoLegible(file: TFile): string {
		const valor = this.estadoDe(file);
		return this.plugin.settings.estados.find((e) => e.valor === valor)?.nombre ?? valor;
	}

	private tipoLegible(tipo: Incidencia["tipo"]): string {
		const nombres: Record<Incidencia["tipo"], string> = {
			tarea: "Tarea",
			"sub-tarea": "Sub-tarea",
			pendiente: "Pendiente",
			"sub-pendiente": "Sub-pendiente",
		};
		return nombres[tipo];
	}
}
