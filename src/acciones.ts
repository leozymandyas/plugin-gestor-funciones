import { ItemView, Notice, TAbstractFile, WorkspaceLeaf, setIcon } from "obsidian";
import type GestorFuncionesPlugin from "./main";
import {
	CARPETA_ACTIVAS,
	CARPETA_INACTIVAS,
	carpetasGestionListas,
	crearCarpetasGestion,
} from "./files";
import { ICONO_PLUGIN } from "./icono";

export const VIEW_TYPE_ACCIONES = "gestor-funciones-acciones";

interface Accion {
	icono: string;
	texto: string;
	accion: (plugin: GestorFuncionesPlugin) => void;
}

const SECCIONES: Array<{ titulo: string; acciones: Accion[] }> = [
	{
		titulo: "Épicas",
		acciones: [
			{ icono: "folder-plus", texto: "Crear épica", accion: (p) => p.abrirModal("funcionalidad") },
			{ icono: "flag", texto: "Cambiar estado épica", accion: (p) => p.abrirModal("estado") },
			{ icono: "calendar-days", texto: "Asignar sprint", accion: (p) => p.abrirModal("sprint") },
			{ icono: "archive", texto: "Mover épica", accion: (p) => p.abrirModal("mover") },
			{ icono: "map", texto: "Roadmap", accion: (p) => void p.abrirRoadmap() },
		],
	},
	{
		titulo: "Funcionalidades",
		acciones: [
			{
				icono: "puzzle",
				texto: "Crear funcionalidad",
				accion: (p) => p.abrirModal("crearfn"),
			},
			{
				icono: "flag",
				texto: "Cambiar estado funcionalidad",
				accion: (p) => p.abrirModal("estadofn"),
			},
		],
	},
	{
		titulo: "Incidencias",
		acciones: [
			{ icono: "check-square", texto: "Crear tarea", accion: (p) => p.abrirModal("tarea") },
			{ icono: "hourglass", texto: "Crear pendiente", accion: (p) => p.abrirModal("pendiente") },
			{
				icono: "kanban-square",
				texto: "Gestión de incidencias",
				accion: (p) => void p.abrirKanban(),
			},
		],
	},
	{
		titulo: "Colaboradores",
		acciones: [
			{
				icono: "users",
				texto: "Colaboradores",
				accion: (p) => p.abrirModal("colaboradores"),
			},
			{
				icono: "user-plus",
				texto: "Asignar colaborador",
				accion: (p) => p.abrirModal("asignar"),
			},
			{
				icono: "user-check",
				texto: "Tareas por colaborador",
				accion: (p) => void p.abrirTareasColaborador(),
			},
		],
	},
	{
		titulo: "Acciones adicionales",
		acciones: [
			{ icono: "pencil", texto: "Crear apunte", accion: (p) => p.abrirModal("apunte") },
			{ icono: "users", texto: "Crear nota reunión", accion: (p) => p.abrirModal("reunion") },
			{ icono: "package", texto: "Crear insumo", accion: (p) => p.abrirModal("insumo") },
			{ icono: "book-open", texto: "Crear historia", accion: (p) => p.abrirModal("historia") },
		],
	},
];

/** Panel lateral con los accesos del plugin, agrupados por secciones. */
export class AccionesView extends ItemView {
	private plugin: GestorFuncionesPlugin;
	/** Secciones colapsadas; todas inician descolapsadas. No se persiste. */
	private colapsadas = new Set<string>();

	constructor(leaf: WorkspaceLeaf, plugin: GestorFuncionesPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_ACCIONES;
	}

	getDisplayText(): string {
		return "Gestión Producto";
	}

	getIcon(): string {
		return ICONO_PLUGIN;
	}

	async onOpen(): Promise<void> {
		// Si el usuario crea o borra las carpetas de gestión por fuera,
		// el panel se actualiza.
		const refrescar = (file: TAbstractFile) => {
			if (file.path === CARPETA_ACTIVAS || file.path === CARPETA_INACTIVAS) this.render();
		};
		this.registerEvent(this.app.vault.on("create", refrescar));
		this.registerEvent(this.app.vault.on("delete", refrescar));
		this.render();
	}

	render(): void {
		const cont = this.contentEl;
		cont.empty();
		cont.addClass("gf-acciones");

		// Hasta que existan las carpetas de gestión, solo se ofrece crearlas.
		if (!carpetasGestionListas(this.app)) {
			const btn = cont.createEl("button", { cls: "gf-accion mod-cta" });
			const icono = btn.createSpan({ cls: "gf-accion-icono" });
			setIcon(icono, "folder-plus");
			btn.createSpan({ text: "Crear carpetas de gestión" });
			btn.addEventListener("click", () => void (async () => {
				try {
					await crearCarpetasGestion(this.app);
					new Notice("Gestión Producto: carpetas de gestión creadas.");
					this.render();
				} catch (e) {
					console.error(e);
					new Notice("Gestión Producto: no se pudieron crear las carpetas.");
				}
			})());
			cont.createDiv({
				cls: "gf-campo-aviso",
				text: 'Se crearán "Épicas activas" y "Épicas inactivas" en la raíz del vault.',
			});
			return;
		}

		for (const seccion of SECCIONES) {
			const colapsada = this.colapsadas.has(seccion.titulo);
			const header = cont.createDiv({ cls: "gf-acciones-seccion" });
			header.createSpan({
				cls: "gf-acciones-chevron",
				text: colapsada ? "▸" : "▾",
			});
			header.createSpan({ text: seccion.titulo });
			header.addEventListener("click", () => {
				if (colapsada) this.colapsadas.delete(seccion.titulo);
				else this.colapsadas.add(seccion.titulo);
				this.render();
			});
			if (colapsada) continue;
			for (const accion of seccion.acciones) {
				const btn = cont.createEl("button", { cls: "gf-accion" });
				const icono = btn.createSpan({ cls: "gf-accion-icono" });
				setIcon(icono, accion.icono);
				btn.createSpan({ text: accion.texto });
				// El panel permanece abierto después de abrir el modal o la vista.
				btn.addEventListener("click", () => accion.accion(this.plugin));
			}
		}
	}
}
