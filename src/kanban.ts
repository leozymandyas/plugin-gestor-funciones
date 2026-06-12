import {
	ItemView,
	Menu,
	TAbstractFile,
	TFile,
	WorkspaceLeaf,
	normalizePath,
} from "obsidian";
import type GestorFuncionesPlugin from "./main";
import {
	FuncRef,
	carpetasGestionListas,
	claveRelativa,
	leerSprints,
	listFuncionalidades,
	listFuncionalidadesDe,
	listPendientes,
	listSubPendientes,
	listSubTareas,
	listTareas,
} from "./files";
import { slugify } from "./utils";

export const VIEW_TYPE_KANBAN = "gestor-funciones-kanban";

/** Nombre de carril → valor del campo `estado` en el frontmatter. */
export function estadoDeCarril(carril: string): string {
	if (carril === "BACKLOG") return "backlog";
	if (carril === "POR HACER") return "pendiente";
	if (carril === "EN PROGRESO") return "en-progreso";
	if (carril === "HECHO") return "completado";
	return slugify(carril);
}

interface ItemSub {
	key: string;
	file: TFile;
}

interface ItemCard {
	key: string;
	file: TFile;
	nombre: string;
	/** Texto de contexto: nombre de la épica o "Épica › Funcionalidad". */
	contexto: string;
	subs: ItemSub[];
}

type Grupo = "tareas" | "pendientes";

interface DragPayload {
	tipo: "card" | "sub" | "carril";
	grupo?: Grupo;
	valor: string;
	/** Para subs: clave de la card a la que pertenece su sub-tablero. */
	cardKey?: string;
}

export class KanbanView extends ItemView {
	private plugin: GestorFuncionesPlugin;
	private renderTimer: number | null = null;
	/** Cards con el sub-tablero desplegado. No se persiste entre sesiones. */
	private expandidas = new Set<string>();
	private tareas: ItemCard[] = [];
	private pendientes: ItemCard[] = [];

	constructor(leaf: WorkspaceLeaf, plugin: GestorFuncionesPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_KANBAN;
	}

	getDisplayText(): string {
		return "Gestión de incidencias — Gestión Producto";
	}

	getIcon(): string {
		return "kanban-square";
	}

	async onOpen(): Promise<void> {
		this.expandidas.clear();
		const refrescar = (file: TAbstractFile) => {
			const admin = normalizePath(this.plugin.settings.carpetaAdmin.trim() || "/");
			if (file.path === admin || file.path.startsWith(admin + "/")) this.renderSoon();
		};
		this.registerEvent(this.app.vault.on("create", refrescar));
		this.registerEvent(this.app.vault.on("delete", refrescar));
		this.registerEvent(this.app.vault.on("rename", refrescar));
		await this.recargar();
	}

	/** Sincroniza desde el frontmatter de los .md y vuelve a renderizar. */
	async recargar(): Promise<void> {
		await this.recolectar();
		this.sincronizarDesdeFrontmatter();
		this.render();
	}

	private renderSoon(): void {
		if (this.renderTimer !== null) window.clearTimeout(this.renderTimer);
		this.renderTimer = window.setTimeout(() => {
			this.renderTimer = null;
			void this.recolectar().then(() => this.render());
		}, 150);
	}

	private async recolectar(): Promise<void> {
		const admin = this.plugin.settings.carpetaAdmin.trim();
		this.tareas = [];
		this.pendientes = [];
		if (!admin) return;
		const epicas = listFuncionalidades(this.app, admin);

		// Filtro de intervalo de sprints (persistido): si no es el rango completo,
		// solo se muestran incidencias de épicas o funcionalidades con sprints
		// en ese intervalo para el año en curso.
		const { desde, hasta } = this.plugin.settings.kanban.filtroSprints;
		const filtrar = !(desde === 1 && hasta === 52);
		const anio = new Date().getFullYear();
		const pasaSprints = async (ref: FuncRef): Promise<boolean> => {
			const sprints = await leerSprints(this.app, ref);
			return sprints.some((s) => s.anio === anio && s.sprint >= desde && s.sprint <= hasta);
		};

		for (const epica of epicas) {
			const epicaPasa = !filtrar || (await pasaSprints(epica));
			if (epicaPasa) this.recolectarContenedor(admin, epica, epica.nombre);
			for (const fn of listFuncionalidadesDe(this.app, epica.folder)) {
				const fnPasa = epicaPasa || (await pasaSprints(fn));
				if (fnPasa) {
					this.recolectarContenedor(admin, fn, `${epica.nombre} › ${fn.nombre}`);
				}
			}
		}
	}

	/** Junta las incidencias de un contenedor (épica o funcionalidad). */
	private recolectarContenedor(admin: string, ref: FuncRef, contexto: string): void {
		for (const tarea of listTareas(this.app, ref.folder)) {
			const subs = listSubTareas(tarea.folder).map((s) => ({
				key: claveRelativa(admin, s.path),
				file: s,
			}));
			this.tareas.push({
				key: claveRelativa(admin, tarea.folder.path),
				file: tarea.file,
				nombre: tarea.nombre,
				contexto,
				subs,
			});
		}
		for (const pend of listPendientes(this.app, ref.folder)) {
			const subs = pend.folder
				? listSubPendientes(pend.folder).map((s) => ({
						key: claveRelativa(admin, s.path),
						file: s,
				  }))
				: [];
			this.pendientes.push({
				key: pend.folder
					? claveRelativa(admin, pend.folder.path)
					: claveRelativa(admin, pend.file.path),
				file: pend.file,
				nombre: pend.nombre,
				contexto,
				subs,
			});
		}
	}

	private mapa(grupo: Grupo): Record<string, string> {
		return grupo === "tareas"
			? this.plugin.settings.kanban.tareas
			: this.plugin.settings.kanban.pendientes;
	}

	private mapaSubs(grupo: Grupo): Record<string, string> {
		return grupo === "tareas"
			? this.plugin.settings.kanban.subtareas
			: this.plugin.settings.kanban.subpendientes;
	}

	private items(grupo: Grupo): ItemCard[] {
		return grupo === "tareas" ? this.tareas : this.pendientes;
	}

	/**
	 * El `estado` del .md manda al abrir o recargar el tablero (sincronización
	 * desde el archivo). Durante la sesión manda data.json.
	 */
	private sincronizarDesdeFrontmatter(): void {
		let cambio = false;
		const sincronizar = (grupo: Grupo) => {
			const mapa = this.mapa(grupo);
			const mapaSubs = this.mapaSubs(grupo);
			for (const it of this.items(grupo)) {
				const carril = this.carrilPorEstado(this.estadoDe(it.file));
				if (carril && mapa[it.key] !== carril) {
					mapa[it.key] = carril;
					cambio = true;
				}
				for (const sub of it.subs) {
					const carrilSub = this.carrilPorEstado(this.estadoDe(sub.file));
					if (carrilSub && mapaSubs[sub.key] !== carrilSub) {
						mapaSubs[sub.key] = carrilSub;
						cambio = true;
					}
				}
			}
		};
		sincronizar("tareas");
		sincronizar("pendientes");
		if (cambio) void this.plugin.saveSettings();
	}

	private estadoDe(file: TFile): string | undefined {
		const estado = this.app.metadataCache.getFileCache(file)?.frontmatter?.estado;
		return estado ? String(estado) : undefined;
	}

	private carrilPorEstado(estado: string | undefined): string | null {
		if (!estado) return null;
		for (const carril of this.plugin.settings.kanban.carriles) {
			if (estadoDeCarril(carril) === estado) return carril;
		}
		return null;
	}

	private carrilDe(key: string, mapa: Record<string, string>): string {
		const k = this.plugin.settings.kanban;
		const asignado = mapa[key];
		if (asignado && k.carriles.includes(asignado)) return asignado;
		if (k.carriles.includes("POR HACER")) return "POR HACER";
		return k.carriles[0];
	}

	/** Elimina de data.json las entradas que ya no existen en disco. */
	private podar(): void {
		const k = this.plugin.settings.kanban;
		const limpiar = (mapa: Record<string, string>, vivas: Set<string>) => {
			for (const key of Object.keys(mapa)) {
				if (!vivas.has(key)) delete mapa[key];
			}
		};
		limpiar(k.tareas, new Set(this.tareas.map((it) => it.key)));
		limpiar(k.subtareas, new Set(this.tareas.flatMap((it) => it.subs.map((s) => s.key))));
		limpiar(k.pendientes, new Set(this.pendientes.map((it) => it.key)));
		limpiar(
			k.subpendientes,
			new Set(this.pendientes.flatMap((it) => it.subs.map((s) => s.key)))
		);
	}

	private async guardar(): Promise<void> {
		this.podar();
		await this.plugin.saveSettings();
	}

	render(): void {
		const cont = this.contentEl;
		cont.empty();
		cont.addClass("gf-kanban");

		if (!carpetasGestionListas(this.app)) {
			const aviso = cont.createDiv({ cls: "gf-kanban-aviso" });
			aviso.createEl("p", {
				text: "Crea las carpetas de gestión desde el panel de acciones antes de usar el tablero.",
			});
			const btn = aviso.createEl("button", {
				text: "Abrir panel de acciones",
				cls: "mod-cta",
			});
			btn.addEventListener("click", () => void this.plugin.abrirAcciones());
			return;
		}

		this.renderFiltro(cont);
		cont.createDiv({ cls: "gf-kanban-seccion", text: "Tareas" });
		this.renderBoard(cont, "tareas", true);
		cont.createDiv({ cls: "gf-kanban-seccion", text: "Pendientes" });
		this.renderBoard(cont, "pendientes", false);
	}

	private renderFiltro(cont: HTMLElement): void {
		const filtro = this.plugin.settings.kanban.filtroSprints;
		const barra = cont.createDiv({ cls: "gf-roadmap-controles" });
		barra.createEl("span", { text: "Filtro de sprints:", cls: "gf-roadmap-lbl" });
		const inputDesde = barra.createEl("input", {
			type: "number",
			cls: "gf-roadmap-num",
			attr: { min: "1", max: "52" },
			value: String(filtro.desde),
		});
		barra.createEl("span", { text: "hasta", cls: "gf-roadmap-lbl" });
		const inputHasta = barra.createEl("input", {
			type: "number",
			cls: "gf-roadmap-num",
			attr: { min: "1", max: "52" },
			value: String(filtro.hasta),
		});
		const aplicar = async () => {
			const limpio = (v: string, defecto: number) => {
				const n = Math.trunc(Number(v));
				return Number.isFinite(n) && n >= 1 && n <= 52 ? n : defecto;
			};
			let desde = limpio(inputDesde.value, 1);
			let hasta = limpio(inputHasta.value, 52);
			if (desde > hasta) [desde, hasta] = [hasta, desde];
			this.plugin.settings.kanban.filtroSprints = { desde, hasta };
			await this.plugin.saveSettings();
			await this.recolectar();
			this.render();
		};
		inputDesde.addEventListener("change", () => void aplicar());
		inputHasta.addEventListener("change", () => void aplicar());
		barra.createEl("span", {
			text: "(1–52 muestra todo; otro rango filtra por sprints de la épica en el año actual)",
			cls: "gf-roadmap-lbl",
		});
	}

	private renderBoard(cont: HTMLElement, grupo: Grupo, conGestion: boolean): void {
		const board = cont.createDiv({ cls: "gf-kanban-board" });
		const carriles = this.plugin.settings.kanban.carriles;
		for (let i = 0; i < carriles.length; i++) {
			this.renderCarril(board, i, grupo, conGestion);
		}
		if (conGestion) this.renderAgregarCarril(board);
	}

	private renderCarril(
		board: HTMLElement,
		indice: number,
		grupo: Grupo,
		conGestion: boolean
	): void {
		const k = this.plugin.settings.kanban;
		const nombre = k.carriles[indice];
		const col = board.createDiv({ cls: "gf-kanban-carril" });

		col.addEventListener("dragover", (e) => {
			e.preventDefault();
			col.addClass("gf-drop");
		});
		col.addEventListener("dragleave", () => col.removeClass("gf-drop"));
		col.addEventListener("drop", (e) => {
			e.preventDefault();
			col.removeClass("gf-drop");
			const payload = leerPayload(e);
			if (!payload) return;
			if (payload.tipo === "card" && payload.grupo) {
				void this.moverCard(payload.grupo, payload.valor, nombre);
			} else if (payload.tipo === "carril") {
				void this.moverCarril(payload.valor, indice);
			}
		});

		const header = col.createDiv({ cls: "gf-kanban-header" });
		const titulo = header.createEl("span", { cls: "gf-kanban-titulo", text: nombre });

		const tarjetas = this.items(grupo).filter(
			(it) => this.carrilDe(it.key, this.mapa(grupo)) === nombre
		);

		if (conGestion) {
			header.draggable = true;
			header.addEventListener("dragstart", (e) => {
				e.dataTransfer?.setData(
					"text/plain",
					JSON.stringify({ tipo: "carril", valor: nombre } satisfies DragPayload)
				);
			});
			titulo.addEventListener("dblclick", () =>
				this.editarNombreCarril(header, titulo, indice)
			);

			// Para eliminar, el carril debe estar vacío en ambos tableros.
			const enUso =
				tarjetas.length > 0 ||
				this.items(grupo === "tareas" ? "pendientes" : "tareas").some(
					(it) =>
						this.carrilDe(it.key, this.mapa(grupo === "tareas" ? "pendientes" : "tareas")) ===
						nombre
				);
			const del = header.createEl("span", {
				cls: "gf-kanban-del",
				text: "×",
				attr: { role: "button" },
			});
			if (k.carriles.length <= 1) {
				del.addClass("gf-disabled");
				del.setAttr("title", "El tablero debe tener al menos un carril.");
			} else if (enUso) {
				del.addClass("gf-disabled");
				del.setAttr("title", "Mueve las tarjetas antes de eliminar este carril.");
			} else {
				del.setAttr("title", "Eliminar carril");
				del.addEventListener("click", async () => {
					k.carriles.splice(indice, 1);
					await this.guardar();
					this.render();
				});
			}
		}

		const cuerpo = col.createDiv({ cls: "gf-kanban-cuerpo" });
		if (this.items(grupo).length === 0) {
			cuerpo.createEl("em", {
				cls: "gf-kanban-vacio",
				text: grupo === "tareas" ? "Sin tareas aún." : "Sin pendientes aún.",
			});
		}
		for (const it of tarjetas) {
			this.renderTarjeta(cuerpo, it, nombre, grupo);
		}
	}

	private renderTarjeta(
		cuerpo: HTMLElement,
		it: ItemCard,
		carrilActual: string,
		grupo: Grupo
	): void {
		const card = cuerpo.createDiv({ cls: "gf-kanban-card" });
		card.draggable = true;
		card.addEventListener("dragstart", (e) => {
			e.stopPropagation();
			e.dataTransfer?.setData(
				"text/plain",
				JSON.stringify({ tipo: "card", grupo, valor: it.key } satisfies DragPayload)
			);
		});

		const head = card.createDiv({ cls: "gf-kanban-card-head" });
		head.createDiv({ cls: "gf-kanban-card-nombre", text: it.nombre });
		if (it.subs.length > 0) {
			const expandida = this.expandidas.has(it.key);
			const btn = head.createEl("span", {
				cls: "gf-kanban-expand",
				text: expandida ? "▲" : "▼",
				attr: { role: "button", title: expandida ? "Colapsar" : "Ver sub-elementos" },
			});
			btn.addEventListener("click", (e) => {
				e.stopPropagation();
				if (expandida) this.expandidas.delete(it.key);
				else this.expandidas.add(it.key);
				this.render();
			});
		}

		card.createDiv({ cls: "gf-kanban-card-func", text: it.contexto });
		const fecha = this.fechaCreacion(it.file);
		if (fecha) card.createDiv({ cls: "gf-kanban-card-fecha", text: fecha });

		// Porcentaje de progreso según los sub-elementos completados.
		if (it.subs.length > 0) {
			const mapaSubs = this.mapaSubs(grupo);
			const hechas = it.subs.filter(
				(s) => estadoDeCarril(this.carrilDe(s.key, mapaSubs)) === "completado"
			).length;
			const pct = Math.round((hechas / it.subs.length) * 100);
			const prog = card.createDiv({ cls: "gf-kanban-progreso" });
			prog.createDiv({ cls: "gf-kanban-progreso-texto", text: `${pct}%` });
			const barra = prog.createDiv({ cls: "gf-kanban-progreso-barra" });
			const relleno = barra.createDiv({ cls: "gf-kanban-progreso-relleno" });
			relleno.style.width = `${pct}%`;
		}

		card.addEventListener("click", () => {
			void this.app.workspace.getLeaf(false).openFile(it.file);
		});
		card.addEventListener("contextmenu", (e) => {
			e.preventDefault();
			const menu = new Menu();
			for (const carril of this.plugin.settings.kanban.carriles) {
				if (carril === carrilActual) continue;
				menu.addItem((item) =>
					item
						.setTitle(`Mover a: ${carril}`)
						.onClick(() => void this.moverCard(grupo, it.key, carril))
				);
			}
			menu.showAtMouseEvent(e);
		});

		if (this.expandidas.has(it.key)) {
			this.renderSubTablero(card, it, grupo);
		}
	}

	/** Sub-tablero de sub-elementos: mini-carriles apilados con los carriles globales. */
	private renderSubTablero(card: HTMLElement, it: ItemCard, grupo: Grupo): void {
		const k = this.plugin.settings.kanban;
		const sub = card.createDiv({ cls: "gf-kanban-subboard" });
		sub.addEventListener("click", (e) => e.stopPropagation());

		for (const carril of k.carriles) {
			const mini = sub.createDiv({ cls: "gf-kanban-minilane" });
			mini.addEventListener("dragover", (e) => {
				e.preventDefault();
				e.stopPropagation();
				mini.addClass("gf-drop");
			});
			mini.addEventListener("dragleave", () => mini.removeClass("gf-drop"));
			mini.addEventListener("drop", (e) => {
				e.preventDefault();
				e.stopPropagation();
				mini.removeClass("gf-drop");
				const payload = leerPayload(e);
				if (payload?.tipo === "sub" && payload.cardKey === it.key && payload.grupo === grupo) {
					void this.moverSub(grupo, payload.valor, carril);
				}
			});
			mini.createDiv({ cls: "gf-kanban-minilane-titulo", text: carril });

			const mapaSubs = this.mapaSubs(grupo);
			const subsAqui = it.subs.filter((s) => this.carrilDe(s.key, mapaSubs) === carril);
			for (const s of subsAqui) {
				this.renderSubTarjeta(mini, s, it, carril, grupo);
			}
		}
	}

	private renderSubTarjeta(
		mini: HTMLElement,
		s: ItemSub,
		it: ItemCard,
		carrilActual: string,
		grupo: Grupo
	): void {
		const fm = this.app.metadataCache.getFileCache(s.file)?.frontmatter;
		const nombre = fm?.nombre ? String(fm.nombre) : s.file.basename;
		const card = mini.createDiv({ cls: "gf-kanban-subcard" });
		card.draggable = true;
		card.addEventListener("dragstart", (e) => {
			e.stopPropagation();
			e.dataTransfer?.setData(
				"text/plain",
				JSON.stringify({
					tipo: "sub",
					grupo,
					valor: s.key,
					cardKey: it.key,
				} satisfies DragPayload)
			);
		});
		card.createDiv({ cls: "gf-kanban-card-nombre", text: nombre });
		const fecha = this.fechaCreacion(s.file);
		if (fecha) card.createDiv({ cls: "gf-kanban-card-fecha", text: fecha });
		card.addEventListener("click", (e) => {
			e.stopPropagation();
			void this.app.workspace.getLeaf(false).openFile(s.file);
		});
		card.addEventListener("contextmenu", (e) => {
			e.preventDefault();
			e.stopPropagation();
			const menu = new Menu();
			for (const carril of this.plugin.settings.kanban.carriles) {
				if (carril === carrilActual) continue;
				menu.addItem((item) =>
					item
						.setTitle(`Mover a: ${carril}`)
						.onClick(() => void this.moverSub(grupo, s.key, carril))
				);
			}
			menu.showAtMouseEvent(e);
		});
	}

	private fechaCreacion(file: TFile): string {
		const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
		const valor = fm?.["fecha-creacion"] ?? fm?.["fecha"];
		const m = String(valor ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);
		return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
	}

	private async moverCard(grupo: Grupo, key: string, carril: string): Promise<void> {
		const it = this.items(grupo).find((i) => i.key === key);
		if (!it) return;
		this.mapa(grupo)[key] = carril;
		await this.guardar();
		await this.app.fileManager.processFrontMatter(it.file, (fm) => {
			fm.estado = estadoDeCarril(carril);
		});
		this.render();
	}

	private async moverSub(grupo: Grupo, key: string, carril: string): Promise<void> {
		const sub = this.items(grupo)
			.flatMap((i) => i.subs)
			.find((s) => s.key === key);
		if (!sub) return;
		this.mapaSubs(grupo)[key] = carril;
		await this.guardar();
		await this.app.fileManager.processFrontMatter(sub.file, (fm) => {
			fm.estado = estadoDeCarril(carril);
		});
		this.render();
	}

	private async moverCarril(nombre: string, destino: number): Promise<void> {
		const k = this.plugin.settings.kanban;
		const desde = k.carriles.indexOf(nombre);
		if (desde === -1 || desde === destino) return;
		k.carriles.splice(desde, 1);
		k.carriles.splice(destino > desde ? destino - 1 : destino, 0, nombre);
		await this.guardar();
		this.render();
	}

	private editarNombreCarril(header: HTMLElement, titulo: HTMLElement, indice: number): void {
		const k = this.plugin.settings.kanban;
		const original = k.carriles[indice];
		const input = createEl("input", { type: "text", cls: "gf-kanban-input", value: original });
		titulo.replaceWith(input);
		const error = header.createDiv({ cls: "gf-campo-error" });
		error.hide();
		input.focus();
		input.select();

		let terminado = false;
		const confirmar = async () => {
			if (terminado) return;
			const nuevo = input.value.trim();
			if (nuevo === original) {
				terminado = true;
				this.render();
				return;
			}
			if (!nuevo) {
				error.setText("El nombre es obligatorio.");
				error.show();
				return;
			}
			if (k.carriles.includes(nuevo)) {
				error.setText("Ya existe un carril con ese nombre.");
				error.show();
				return;
			}
			terminado = true;
			k.carriles[indice] = nuevo;
			for (const mapa of [k.tareas, k.subtareas, k.pendientes, k.subpendientes]) {
				for (const [key, carril] of Object.entries(mapa)) {
					if (carril === original) mapa[key] = nuevo;
				}
			}
			await this.guardar();
			this.render();
		};

		input.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				void confirmar();
			} else if (e.key === "Escape") {
				terminado = true;
				this.render();
			}
		});
		input.addEventListener("blur", () => void confirmar());
	}

	private renderAgregarCarril(board: HTMLElement): void {
		const k = this.plugin.settings.kanban;
		const wrap = board.createDiv({ cls: "gf-kanban-add" });
		const btn = wrap.createEl("button", { text: "+ Agregar carril", cls: "gf-kanban-add-btn" });
		btn.addEventListener("click", () => {
			wrap.empty();
			const input = wrap.createEl("input", {
				type: "text",
				cls: "gf-kanban-input",
				attr: { placeholder: "Nombre del carril" },
			});
			const error = wrap.createDiv({ cls: "gf-campo-error" });
			error.hide();
			input.focus();

			let terminado = false;
			const confirmar = async () => {
				if (terminado) return;
				const nombre = input.value.trim();
				if (!nombre) {
					error.setText("El nombre es obligatorio.");
					error.show();
					return;
				}
				if (k.carriles.includes(nombre)) {
					error.setText("Ya existe un carril con ese nombre.");
					error.show();
					return;
				}
				terminado = true;
				k.carriles.push(nombre);
				await this.guardar();
				this.render();
			};

			input.addEventListener("keydown", (e) => {
				if (e.key === "Enter") {
					e.preventDefault();
					void confirmar();
				} else if (e.key === "Escape") {
					terminado = true;
					this.render();
				}
			});
			input.addEventListener("blur", () => {
				if (input.value.trim() === "") {
					terminado = true;
					this.render();
				} else {
					void confirmar();
				}
			});
		});
	}
}

function leerPayload(e: DragEvent): DragPayload | null {
	const raw = e.dataTransfer?.getData("text/plain");
	if (!raw) return null;
	try {
		return JSON.parse(raw) as DragPayload;
	} catch {
		return null;
	}
}
