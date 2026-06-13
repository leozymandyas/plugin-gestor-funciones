import { Plugin, addIcon } from "obsidian";
import {
	CARRILES_DEFECTO,
	COLOR_ETIQUETA_DEFECTO,
	DEFAULT_SETTINGS,
	ESTADOS_DEFECTO,
	EstadoEpica,
	Etiqueta,
	GestorSettings,
	GestorSettingTab,
} from "./settings";
import { carpetasGestionListas } from "./files";
import { registerDashboard } from "./dashboard";
import { AccionesView, VIEW_TYPE_ACCIONES } from "./acciones";
import { KanbanView, VIEW_TYPE_KANBAN } from "./kanban";
import { RoadmapView, VIEW_TYPE_ROADMAP } from "./roadmap";
import { TareasColaboradorView, VIEW_TYPE_COLABORADORES } from "./colaboradores";
import { ICONO_PLUGIN, ICONO_PLUGIN_SVG } from "./icono";
import {
	AgregarLinkModal,
	AsignarColaboradorModal,
	AsignarSprintModal,
	AvisoConfiguracionModal,
	CambiarEstadoFuncionalidadModal,
	CambiarEstadoModal,
	CrearApunteModal,
	CrearFuncionalidadModal,
	CrearFuncionalidadNuevaModal,
	CrearHistoriaModal,
	CrearInsumoModal,
	CrearPendienteModal,
	CrearReunionModal,
	CrearTareaModal,
	GestionColaboradoresModal,
	MoverEpicaModal,
} from "./modals";

export type TipoModal =
	| "funcionalidad"
	| "crearfn"
	| "estadofn"
	| "tarea"
	| "apunte"
	| "reunion"
	| "pendiente"
	| "insumo"
	| "historia"
	| "sprint"
	| "estado"
	| "mover"
	| "asignar"
	| "colaboradores";

export default class GestorFuncionesPlugin extends Plugin {
	settings: GestorSettings = DEFAULT_SETTINGS;

	async onload(): Promise<void> {
		await this.loadSettings();

		addIcon(ICONO_PLUGIN, ICONO_PLUGIN_SVG);

		this.addSettingTab(new GestorSettingTab(this.app, this));

		registerDashboard(this);

		// Panel lateral de acciones.
		this.registerView(VIEW_TYPE_ACCIONES, (leaf) => new AccionesView(leaf, this));
		this.addRibbonIcon(ICONO_PLUGIN, "Gestión Producto: Panel de acciones", () =>
			void this.toggleAcciones()
		);

		// Vistas de pestaña completa; se abren desde el panel de acciones.
		this.registerView(VIEW_TYPE_KANBAN, (leaf) => new KanbanView(leaf, this));
		this.registerView(VIEW_TYPE_ROADMAP, (leaf) => new RoadmapView(leaf, this));
		this.registerView(VIEW_TYPE_COLABORADORES, (leaf) => new TareasColaboradorView(leaf, this));

		// "Agregar link" en el menú contextual del editor, en cualquier nota.
		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor) => {
				menu.addItem((item) =>
					item
						.setTitle("Agregar link")
						.setIcon("link")
						.onClick(() => new AgregarLinkModal(this, editor).open())
				);
			})
		);

		// Obsidian antepone el nombre del plugin en la paleta:
		// "Gestión Producto: Crear épica", etc.
		this.addCommand({
			id: "crear-funcionalidad",
			name: "Crear épica",
			callback: () => this.abrirModal("funcionalidad"),
		});
		this.addCommand({
			id: "crear-funcionalidad-modulo",
			name: "Crear funcionalidad",
			callback: () => this.abrirModal("crearfn"),
		});
		this.addCommand({
			id: "cambiar-estado-funcionalidad",
			name: "Cambiar estado de funcionalidad",
			callback: () => this.abrirModal("estadofn"),
		});
		this.addCommand({
			id: "crear-tarea",
			name: "Crear tarea",
			callback: () => this.abrirModal("tarea"),
		});
		this.addCommand({
			id: "crear-apunte",
			name: "Crear apunte",
			callback: () => this.abrirModal("apunte"),
		});
		this.addCommand({
			id: "crear-nota-reunion",
			name: "Crear nota de reunión",
			callback: () => this.abrirModal("reunion"),
		});
		this.addCommand({
			id: "crear-pendiente",
			name: "Crear pendiente",
			callback: () => this.abrirModal("pendiente"),
		});
		this.addCommand({
			id: "crear-insumo",
			name: "Crear insumo",
			callback: () => this.abrirModal("insumo"),
		});
		this.addCommand({
			id: "crear-historia",
			name: "Crear historia",
			callback: () => this.abrirModal("historia"),
		});
		this.addCommand({
			id: "asignar-sprints",
			name: "Asignar sprint",
			callback: () => this.abrirModal("sprint"),
		});
		this.addCommand({
			id: "cambiar-estado-epica",
			name: "Cambiar estado de épica",
			callback: () => this.abrirModal("estado"),
		});
		this.addCommand({
			id: "mover-epica",
			name: "Mover épica",
			callback: () => this.abrirModal("mover"),
		});
		this.addCommand({
			id: "asignar-colaborador",
			name: "Asignar colaborador",
			callback: () => this.abrirModal("asignar"),
		});
		this.addCommand({
			id: "gestion-colaboradores",
			name: "Colaboradores",
			callback: () => this.abrirModal("colaboradores"),
		});
		this.addCommand({
			id: "tareas-por-colaborador",
			name: "Tareas por colaborador",
			callback: () => void this.abrirTareasColaborador(),
		});
		this.addCommand({
			id: "abrir-tablero-kanban",
			name: "Abrir gestión de incidencias",
			callback: () => void this.abrirKanban(),
		});
		this.addCommand({
			id: "recargar-tablero",
			name: "Recargar tablero",
			callback: () => {
				const hoja = this.app.workspace.getLeavesOfType(VIEW_TYPE_KANBAN)[0];
				if (hoja && hoja.view instanceof KanbanView) void hoja.view.recargar();
			},
		});
		this.addCommand({
			id: "abrir-roadmap",
			name: "Abrir roadmap",
			callback: () => void this.abrirRoadmap(),
		});
	}

	abrirModal(tipo: TipoModal): void {
		if (!carpetasGestionListas(this.app)) {
			new AvisoConfiguracionModal(this).open();
			return;
		}
		switch (tipo) {
			case "funcionalidad":
				new CrearFuncionalidadModal(this).open();
				break;
			case "crearfn":
				new CrearFuncionalidadNuevaModal(this).open();
				break;
			case "estadofn":
				new CambiarEstadoFuncionalidadModal(this).open();
				break;
			case "tarea":
				new CrearTareaModal(this).open();
				break;
			case "apunte":
				new CrearApunteModal(this).open();
				break;
			case "reunion":
				new CrearReunionModal(this).open();
				break;
			case "pendiente":
				new CrearPendienteModal(this).open();
				break;
			case "insumo":
				new CrearInsumoModal(this).open();
				break;
			case "historia":
				new CrearHistoriaModal(this).open();
				break;
			case "sprint":
				new AsignarSprintModal(this).open();
				break;
			case "estado":
				new CambiarEstadoModal(this).open();
				break;
			case "mover":
				new MoverEpicaModal(this).open();
				break;
			case "asignar":
				new AsignarColaboradorModal(this).open();
				break;
			case "colaboradores":
				new GestionColaboradoresModal(this).open();
				break;
		}
	}

	/** El ícono del panel de acciones alterna abrir/cerrar. */
	async toggleAcciones(): Promise<void> {
		const hojas = this.app.workspace.getLeavesOfType(VIEW_TYPE_ACCIONES);
		if (hojas.length > 0) {
			this.app.workspace.detachLeavesOfType(VIEW_TYPE_ACCIONES);
			return;
		}
		await this.abrirAcciones();
	}

	/** Abre el panel de acciones (sin alternar). */
	async abrirAcciones(): Promise<void> {
		const existente = this.app.workspace.getLeavesOfType(VIEW_TYPE_ACCIONES)[0];
		if (existente) {
			await this.app.workspace.revealLeaf(existente);
			return;
		}
		const hoja = this.app.workspace.getLeftLeaf(false);
		if (!hoja) return;
		await hoja.setViewState({ type: VIEW_TYPE_ACCIONES, active: true });
		await this.app.workspace.revealLeaf(hoja);
	}

	async abrirKanban(): Promise<void> {
		await this.abrirVistaEnPestana(VIEW_TYPE_KANBAN);
	}

	async abrirRoadmap(): Promise<void> {
		await this.abrirVistaEnPestana(VIEW_TYPE_ROADMAP);
	}

	async abrirTareasColaborador(): Promise<void> {
		await this.abrirVistaEnPestana(VIEW_TYPE_COLABORADORES);
	}

	/**
	 * Abre la vista como pestaña del área principal. Si quedó anclada en un
	 * panel lateral (layouts guardados de versiones anteriores), la desancla
	 * y la vuelve a abrir como pestaña.
	 */
	private async abrirVistaEnPestana(tipo: string): Promise<void> {
		const existente = this.app.workspace.getLeavesOfType(tipo)[0];
		if (existente && existente.getRoot() === this.app.workspace.rootSplit) {
			await this.app.workspace.revealLeaf(existente);
			return;
		}
		existente?.detach();
		const hoja = this.app.workspace.getLeaf("tab");
		await hoja.setViewState({ type: tipo, active: true });
		await this.app.workspace.revealLeaf(hoja);
	}

	async loadSettings(): Promise<void> {
		const data = ((await this.loadData()) ?? {}) as Partial<GestorSettings> & {
			etiquetas?: Array<string | Etiqueta>;
		};
		// Migración: las etiquetas eran strings antes de tener color.
		const etiquetas: Etiqueta[] = (data.etiquetas ?? []).map((e) =>
			typeof e === "string"
				? { nombre: e, color: COLOR_ETIQUETA_DEFECTO }
				: { nombre: String(e.nombre), color: e.color || COLOR_ETIQUETA_DEFECTO }
		);
		// Los estados por defecto siempre están presentes (con su nombre guardado
		// si el usuario los renombró); se conservan los personalizados.
		const estados: EstadoEpica[] = ESTADOS_DEFECTO.map((defecto) => {
			const guardado = (data.estados ?? []).find((e) => e?.valor === defecto.valor);
			return { nombre: guardado?.nombre ?? defecto.nombre, valor: defecto.valor };
		});
		for (const e of data.estados ?? []) {
			if (e?.nombre && e?.valor && !estados.some((x) => x.valor === e.valor)) {
				estados.push({ nombre: String(e.nombre), valor: String(e.valor) });
			}
		}
		const colaboradores: Etiqueta[] = (data.colaboradores ?? []).map((c) => ({
			nombre: String(c.nombre),
			color: c.color || COLOR_ETIQUETA_DEFECTO,
		}));
		const filtro = data.kanban?.filtroSprints;
		// Migración: tableros con los carriles por defecto anteriores reciben
		// el carril BACKLOG al frente; los personalizados no se tocan.
		let carriles = data.kanban?.carriles?.length
			? [...data.kanban.carriles]
			: [...CARRILES_DEFECTO];
		if (carriles.join("|") === "POR HACER|EN PROGRESO|HECHO") {
			carriles = [...CARRILES_DEFECTO];
		}
		this.settings = {
			// La carpeta de épicas activas es fija desde la v6.
			carpetaAdmin: DEFAULT_SETTINGS.carpetaAdmin,
			etiquetas,
			estados,
			colaboradores,
			kanban: {
				carriles,
				tareas: { ...(data.kanban?.tareas ?? {}) },
				pendientes: { ...(data.kanban?.pendientes ?? {}) },
				filtroSprints: {
					desde: filtro?.desde && filtro.desde >= 1 && filtro.desde <= 52 ? filtro.desde : 1,
					hasta: filtro?.hasta && filtro.hasta >= 1 && filtro.hasta <= 52 ? filtro.hasta : 52,
				},
			},
		};
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
