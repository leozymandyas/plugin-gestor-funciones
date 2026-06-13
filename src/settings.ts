import { App, Modal, PluginSettingTab, Setting } from "obsidian";
import type GestorFuncionesPlugin from "./main";
import { CARPETA_ACTIVAS, CARPETA_INACTIVAS } from "./files";
import { slugify } from "./utils";

export interface KanbanState {
	carriles: string[];
	/** Ruta relativa de la tarea (sin .md) → nombre del carril donde está su tarjeta. */
	tareas: Record<string, string>;
	pendientes: Record<string, string>;
	/** Filtro de intervalo de sprints; se conserva entre sesiones. */
	filtroSprints: { desde: number; hasta: number };
}

export interface Etiqueta {
	nombre: string;
	/** Color en formato hex (#rrggbb). */
	color: string;
}

export interface EstadoEpica {
	nombre: string;
	/** Valor que se escribe en el frontmatter `estado`. */
	valor: string;
}

export interface GestorSettings {
	carpetaAdmin: string;
	etiquetas: Etiqueta[];
	estados: EstadoEpica[];
	/** Personas asignables a incidencias; mismo formato que las etiquetas. */
	colaboradores: Etiqueta[];
	kanban: KanbanState;
}

export const CARRILES_DEFECTO = ["BACKLOG", "POR HACER", "EN PROGRESO", "HECHO"];

export const COLOR_ETIQUETA_DEFECTO = "#5082ff";

/** Estados por defecto: no pueden eliminarse. Sus valores conservan la
 * convención de frontmatter existente (pendiente / en-progreso / completado). */
export const ESTADOS_DEFECTO: EstadoEpica[] = [
	{ nombre: "Backlog", valor: "backlog" },
	{ nombre: "Por hacer", valor: "pendiente" },
	{ nombre: "En progreso", valor: "en-progreso" },
	{ nombre: "Hecho", valor: "completado" },
];

export const DEFAULT_SETTINGS: GestorSettings = {
	carpetaAdmin: CARPETA_ACTIVAS,
	etiquetas: [],
	estados: [...ESTADOS_DEFECTO],
	colaboradores: [],
	kanban: {
		carriles: [...CARRILES_DEFECTO],
		tareas: {},
		pendientes: {},
		filtroSprints: { desde: 1, hasta: 52 },
	},
};

export function esEstadoDefecto(estado: EstadoEpica): boolean {
	return ESTADOS_DEFECTO.some((e) => e.valor === estado.valor);
}

export class GestorSettingTab extends PluginSettingTab {
	plugin: GestorFuncionesPlugin;

	constructor(app: App, plugin: GestorFuncionesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// Rutas informativas: las carpetas se crean desde el panel de acciones
		// con el botón "Crear carpetas de gestión" y no pueden modificarse.
		new Setting(containerEl)
			.setName("Épicas activas")
			.setDesc(`Ruta fija en la raíz del vault: ${CARPETA_ACTIVAS}`);
		new Setting(containerEl)
			.setName("Épicas inactivas")
			.setDesc(`Ruta fija en la raíz del vault: ${CARPETA_INACTIVAS}`);

		new Setting(containerEl).setName("Etiquetas de sprint").setHeading();
		const etiquetasCont = containerEl.createDiv();
		this.renderEtiquetas(etiquetasCont);

		new Setting(containerEl).setName("Estados de épica").setHeading();
		const estadosCont = containerEl.createDiv();
		this.renderEstados(estadosCont);
	}

	// ----- Etiquetas de sprint -----

	private renderEtiquetas(cont: HTMLElement): void {
		cont.empty();
		const etiquetas = this.plugin.settings.etiquetas;
		const lista = cont.createDiv({ cls: "gf-etiquetas" });

		if (etiquetas.length === 0) {
			lista.createEl("em", { cls: "gf-campo-aviso", text: "Sin etiquetas configuradas." });
		}

		etiquetas.forEach((etiqueta, indice) => {
			const fila = lista.createDiv({ cls: "gf-etiqueta" });

			const color = fila.createEl("input", {
				type: "color",
				cls: "gf-etiqueta-color",
				value: etiqueta.color,
			});
			color.setAttr("title", "Color de la etiqueta");
			color.addEventListener("change", async () => {
				etiqueta.color = color.value;
				await this.plugin.saveSettings();
			});

			const nombre = fila.createEl("span", { text: etiqueta.nombre, cls: "gf-etiqueta-nombre" });
			nombre.setAttr("title", "Clic para editar");
			nombre.addEventListener("click", () => this.editarEtiqueta(cont, fila, nombre, indice));

			const del = fila.createEl("span", { text: "×", cls: "gf-etiqueta-del" });
			del.setAttr("title", "Eliminar etiqueta");
			del.addEventListener("click", () => {
				new ConfirmarEliminarEtiquetaModal(this.plugin, etiqueta.nombre, async () => {
					this.plugin.settings.etiquetas.splice(indice, 1);
					await this.plugin.saveSettings();
					this.renderEtiquetas(cont);
				}).open();
			});
		});

		const addRow = cont.createDiv({ cls: "gf-etiqueta-add" });
		const colorNuevo = addRow.createEl("input", {
			type: "color",
			cls: "gf-etiqueta-color",
			value: COLOR_ETIQUETA_DEFECTO,
		});
		const input = addRow.createEl("input", {
			type: "text",
			attr: { placeholder: "Nueva etiqueta" },
		});
		const btn = addRow.createEl("button", { text: "Agregar" });
		const error = cont.createDiv({ cls: "gf-campo-error" });
		error.hide();

		const agregar = async () => {
			const valor = input.value.trim();
			if (!valor) return;
			if (etiquetas.some((e) => e.nombre.toLowerCase() === valor.toLowerCase())) {
				error.setText("Ya existe una etiqueta con ese nombre.");
				error.show();
				return;
			}
			error.hide();
			etiquetas.push({ nombre: valor, color: colorNuevo.value });
			await this.plugin.saveSettings();
			this.renderEtiquetas(cont);
		};
		btn.addEventListener("click", () => void agregar());
		input.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				void agregar();
			}
		});
	}

	private editarEtiqueta(
		cont: HTMLElement,
		fila: HTMLElement,
		nombre: HTMLElement,
		indice: number
	): void {
		const etiquetas = this.plugin.settings.etiquetas;
		const original = etiquetas[indice].nombre;
		const input = createEl("input", { type: "text", value: original });
		nombre.replaceWith(input);
		const error = fila.createDiv({ cls: "gf-campo-error" });
		error.hide();
		input.focus();
		input.select();

		let terminado = false;
		const confirmar = async () => {
			if (terminado) return;
			const valor = input.value.trim();
			if (!valor || valor === original) {
				terminado = true;
				this.renderEtiquetas(cont);
				return;
			}
			if (
				etiquetas.some(
					(e, j) => j !== indice && e.nombre.toLowerCase() === valor.toLowerCase()
				)
			) {
				error.setText("Ya existe una etiqueta con ese nombre.");
				error.show();
				return;
			}
			terminado = true;
			etiquetas[indice].nombre = valor;
			await this.plugin.saveSettings();
			this.renderEtiquetas(cont);
		};

		input.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				void confirmar();
			} else if (e.key === "Escape") {
				terminado = true;
				this.renderEtiquetas(cont);
			}
		});
		input.addEventListener("blur", () => void confirmar());
	}

	// ----- Estados de épica -----

	private renderEstados(cont: HTMLElement): void {
		cont.empty();
		const estados = this.plugin.settings.estados;
		const lista = cont.createDiv({ cls: "gf-etiquetas" });

		estados.forEach((estado, indice) => {
			const fila = lista.createDiv({ cls: "gf-etiqueta" });
			const nombre = fila.createEl("span", {
				text: estado.nombre,
				cls: "gf-etiqueta-nombre",
			});
			nombre.setAttr("title", "Clic para renombrar");
			nombre.addEventListener("click", () => this.renombrarEstado(cont, fila, nombre, indice));
			if (esEstadoDefecto(estado)) {
				fila.createEl("span", { text: "por defecto", cls: "gf-campo-aviso" });
			} else {
				const del = fila.createEl("span", { text: "×", cls: "gf-etiqueta-del" });
				del.setAttr("title", "Eliminar estado");
				del.addEventListener("click", async () => {
					estados.splice(indice, 1);
					await this.plugin.saveSettings();
					this.renderEstados(cont);
				});
			}
		});

		const addRow = cont.createDiv({ cls: "gf-etiqueta-add" });
		const input = addRow.createEl("input", {
			type: "text",
			attr: { placeholder: "Nuevo estado" },
		});
		const btn = addRow.createEl("button", { text: "Agregar" });
		const error = cont.createDiv({ cls: "gf-campo-error" });
		error.hide();

		const agregar = async () => {
			const nombre = input.value.trim();
			if (!nombre) return;
			const valor = slugify(nombre);
			if (
				estados.some(
					(e) => e.nombre.toLowerCase() === nombre.toLowerCase() || e.valor === valor
				)
			) {
				error.setText("Ya existe un estado con ese nombre.");
				error.show();
				return;
			}
			error.hide();
			estados.push({ nombre, valor });
			await this.plugin.saveSettings();
			this.renderEstados(cont);
		};
		btn.addEventListener("click", () => void agregar());
		input.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				void agregar();
			}
		});
	}

	/** Renombra un estado (también los por defecto); el `valor` no cambia para
	 * no romper el frontmatter ya escrito. */
	private renombrarEstado(
		cont: HTMLElement,
		fila: HTMLElement,
		nombre: HTMLElement,
		indice: number
	): void {
		const estados = this.plugin.settings.estados;
		const original = estados[indice].nombre;
		const input = createEl("input", { type: "text", value: original });
		nombre.replaceWith(input);
		const error = fila.createDiv({ cls: "gf-campo-error" });
		error.hide();
		input.focus();
		input.select();

		let terminado = false;
		const confirmar = async () => {
			if (terminado) return;
			const valor = input.value.trim();
			if (!valor || valor === original) {
				terminado = true;
				this.renderEstados(cont);
				return;
			}
			if (
				estados.some((e, j) => j !== indice && e.nombre.toLowerCase() === valor.toLowerCase())
			) {
				error.setText("Ya existe un estado con ese nombre.");
				error.show();
				return;
			}
			terminado = true;
			estados[indice].nombre = valor;
			await this.plugin.saveSettings();
			this.renderEstados(cont);
		};

		input.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				void confirmar();
			} else if (e.key === "Escape") {
				terminado = true;
				this.renderEstados(cont);
			}
		});
		input.addEventListener("blur", () => void confirmar());
	}
}

class ConfirmarEliminarEtiquetaModal extends Modal {
	constructor(
		plugin: GestorFuncionesPlugin,
		private etiqueta: string,
		private onConfirmar: () => void
	) {
		super(plugin.app);
	}

	onOpen(): void {
		this.titleEl.setText("Eliminar etiqueta");
		this.contentEl.createEl("p", {
			text: `¿Eliminar la etiqueta '${this.etiqueta}'? No se eliminará de los sprints ya guardados.`,
		});
		const row = this.contentEl.createDiv({ cls: "gf-botones" });
		const eliminar = row.createEl("button", { text: "Eliminar", cls: "mod-warning" });
		eliminar.addEventListener("click", () => {
			this.close();
			this.onConfirmar();
		});
		const cancelar = row.createEl("button", { text: "Cancelar" });
		cancelar.addEventListener("click", () => this.close());
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
