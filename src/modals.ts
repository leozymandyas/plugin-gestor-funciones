import { Editor, Modal, Notice, TFile } from "obsidian";
import type GestorFuncionesPlugin from "./main";
import { hoy, slugify } from "./utils";
import * as files from "./files";

interface Campo {
	wrap: HTMLElement;
	error: HTMLElement;
}

interface CampoTexto extends Campo {
	input: HTMLInputElement;
}

interface CampoSelect extends Campo {
	select: HTMLSelectElement;
}

interface CampoEpica extends CampoSelect {
	getFunc: () => files.FuncRef | undefined;
	/** Selecciona una épica por slug, mostrando completadas si hace falta. */
	seleccionar: (slug: string) => void;
}

interface CampoFuncionalidad extends CampoSelect {
	/** Funcionalidad seleccionada, o null para trabajar a nivel de épica. */
	getFn: () => files.FuncRef | null;
	seleccionar: (slug: string) => void;
}

const MSG_OBLIGATORIO = "Este campo es obligatorio.";
const MSG_DUPLICADO =
	"Ya existe un elemento con ese nombre. Haz clic en «Crear» otra vez para crearlo con un sufijo numérico.";

abstract class GestorModal extends Modal {
	protected plugin: GestorFuncionesPlugin;
	protected crearBtn!: HTMLButtonElement;

	constructor(plugin: GestorFuncionesPlugin) {
		super(plugin.app);
		this.plugin = plugin;
	}

	protected campoTexto(label: string, placeholder: string): CampoTexto {
		const wrap = this.contentEl.createDiv({ cls: "gf-campo" });
		wrap.createEl("label", { text: label, cls: "gf-campo-label" });
		const input = wrap.createEl("input", {
			type: "text",
			cls: "gf-campo-input",
			attr: { placeholder },
		});
		const error = wrap.createDiv({ cls: "gf-campo-error" });
		error.hide();
		input.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				if (!this.crearBtn.disabled) this.crearBtn.click();
			}
		});
		return { wrap, input, error };
	}

	protected campoSelect(label: string, placeholder: string): CampoSelect {
		const wrap = this.contentEl.createDiv({ cls: "gf-campo" });
		wrap.createEl("label", { text: label, cls: "gf-campo-label" });
		const select = wrap.createEl("select", { cls: "dropdown gf-campo-select" });
		this.setOpciones(select, placeholder, []);
		const error = wrap.createDiv({ cls: "gf-campo-error" });
		error.hide();
		return { wrap, select, error };
	}

	protected setOpciones(
		select: HTMLSelectElement,
		placeholder: string,
		opciones: { value: string; label: string; cls?: string }[]
	): void {
		select.empty();
		const ph = select.createEl("option", { text: placeholder, value: "" });
		ph.disabled = true;
		ph.selected = true;
		for (const o of opciones) {
			const op = select.createEl("option", { text: o.label, value: o.value });
			if (o.cls) op.addClass(o.cls);
		}
	}

	/**
	 * Selector de épica con checkbox "Mostrar épicas completadas" (desmarcado
	 * por defecto, sin persistencia). Las completadas se ven atenuadas.
	 */
	protected campoEpica(funcs: files.FuncRef[]): CampoEpica {
		const campo = this.campoSelect("Épica", "Seleccionar épica");
		const chkLabel = campo.wrap.createEl("label", { cls: "gf-chk" });
		const chk = chkLabel.createEl("input", { type: "checkbox" });
		chkLabel.appendText(" Mostrar épicas completadas");

		const repoblar = () => {
			const visibles = funcs.filter((f) => chk.checked || f.estado !== "completado");
			const anterior = campo.select.value;
			this.setOpciones(
				campo.select,
				"Seleccionar épica",
				visibles.map((f) => ({
					value: f.slug,
					label: f.nombre,
					cls: f.estado === "completado" ? "gf-opcion-completada" : undefined,
				}))
			);
			if (anterior && visibles.some((f) => f.slug === anterior)) {
				campo.select.value = anterior;
			}
			campo.select.dispatchEvent(new Event("change"));
		};
		chk.addEventListener("change", repoblar);
		repoblar();

		return {
			...campo,
			getFunc: () => funcs.find((f) => f.slug === campo.select.value),
			seleccionar: (slug: string) => {
				const f = funcs.find((x) => x.slug === slug);
				if (!f) return;
				if (f.estado === "completado" && !chk.checked) {
					chk.checked = true;
					repoblar();
				}
				campo.select.value = slug;
				campo.select.dispatchEvent(new Event("change"));
			},
		};
	}

	/**
	 * Selector opcional de funcionalidad, dependiente del selector de épica.
	 * Sin selección, las acciones operan a nivel de épica.
	 */
	protected campoFuncionalidad(epica: CampoEpica): CampoFuncionalidad {
		const campo = this.campoSelect("Funcionalidad", "Nivel épica (sin funcionalidad)");
		let lista: files.FuncRef[] = [];

		const repoblar = () => {
			const f = epica.getFunc();
			lista = f ? files.listFuncionalidadesDe(this.app, f.folder) : [];
			campo.select.empty();
			const nivel = campo.select.createEl("option", {
				text: "Nivel épica (sin funcionalidad)",
				value: "",
			});
			nivel.selected = true;
			for (const fn of lista) {
				campo.select.createEl("option", { text: fn.nombre, value: fn.slug });
			}
			campo.select.disabled = lista.length === 0;
			campo.select.dispatchEvent(new Event("change"));
		};
		epica.select.addEventListener("change", repoblar);
		repoblar();

		return {
			...campo,
			getFn: () => lista.find((x) => x.slug === campo.select.value) ?? null,
			seleccionar: (slug: string) => {
				if (!lista.some((x) => x.slug === slug)) return;
				campo.select.value = slug;
				campo.select.dispatchEvent(new Event("change"));
			},
		};
	}

	/** Chips de colaboradores para asignar al crear una incidencia. Opcional. */
	protected campoColaboradores(): { getSeleccionados: () => string[] } {
		const wrap = this.contentEl.createDiv({ cls: "gf-campo" });
		wrap.createEl("label", { text: "Colaboradores (opcional)", cls: "gf-campo-label" });
		const chipsDiv = wrap.createDiv({ cls: "gf-sprint-chips gf-colab-chips" });
		const seleccion = new Set<string>();
		const colaboradores = this.plugin.settings.colaboradores;

		const render = () => {
			chipsDiv.empty();
			if (colaboradores.length === 0) {
				chipsDiv.createEl("span", {
					cls: "gf-campo-aviso",
					text: "Sin colaboradores configurados.",
				});
				return;
			}
			for (const colab of colaboradores) {
				const activo = seleccion.has(colab.nombre);
				const chip = chipsDiv.createEl("button", {
					text: colab.nombre,
					cls: "gf-chip" + (activo ? " gf-chip-on" : ""),
				});
				if (activo) {
					chip.setCssStyles({ backgroundColor: colab.color });
					chip.setCssStyles({ borderColor: colab.color });
				} else {
					chip.setCssStyles({ borderColor: colab.color });
					chip.setCssStyles({ color: colab.color });
				}
				chip.addEventListener("click", (e) => {
					e.preventDefault();
					if (activo) seleccion.delete(colab.nombre);
					else seleccion.add(colab.nombre);
					render();
				});
			}
		};
		render();
		return { getSeleccionados: () => [...seleccion] };
	}

	protected async aplicarAsignados(file: TFile, asignados: string[]): Promise<void> {
		if (asignados.length === 0) return;
		await this.app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
			fm.asignados = [...asignados].sort((a, b) => a.localeCompare(b, "es"));
		});
	}

	protected mostrarError(campo: Campo, msg: string): void {
		campo.error.setText(msg);
		campo.error.show();
	}

	protected limpiarError(campo: Campo): void {
		campo.error.hide();
		campo.error.setText("");
	}

	protected botones(onCrear: () => void | Promise<void>, textoPrimario = "Crear"): void {
		const row = this.contentEl.createDiv({ cls: "gf-botones" });
		this.crearBtn = row.createEl("button", { text: textoPrimario, cls: "mod-cta" });
		this.crearBtn.addEventListener("click", () => void onCrear());
		const cancelar = row.createEl("button", { text: "Cancelar" });
		cancelar.addEventListener("click", () => this.close());
	}

	protected sinEpicas(func: CampoSelect): void {
		func.select.disabled = true;
		func.wrap.createDiv({
			cls: "gf-campo-aviso",
			text: "No hay épicas aún. Crea una primero.",
		});
		this.crearBtn.disabled = true;
	}

	protected async abrirNota(file: TFile): Promise<void> {
		await this.app.workspace.getLeaf(false).openFile(file);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

/** Aviso cuando la carpeta de administración no está configurada. */
export class AvisoConfiguracionModal extends Modal {
	private plugin: GestorFuncionesPlugin;

	constructor(plugin: GestorFuncionesPlugin) {
		super(plugin.app);
		this.plugin = plugin;
	}

	onOpen(): void {
		this.titleEl.setText("Gestión Producto");
		this.contentEl.createEl("p", {
			text: "Crea las carpetas de gestión con el botón «Crear carpetas de gestión» del panel de acciones antes de continuar.",
		});
		const row = this.contentEl.createDiv({ cls: "gf-botones" });
		const btn = row.createEl("button", { text: "Abrir panel de acciones", cls: "mod-cta" });
		btn.addEventListener("click", () => {
			this.close();
			void this.plugin.abrirAcciones();
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

export class CrearFuncionalidadModal extends GestorModal {
	onOpen(): void {
		this.titleEl.setText("Crear épica");
		const nombre = this.campoTexto("Nombre de la épica", "Escribe nombre de la épica");
		this.botones(async () => {
			this.limpiarError(nombre);
			const valor = nombre.input.value.trim();
			if (!valor || !slugify(valor)) {
				this.mostrarError(nombre, "El nombre es obligatorio.");
				return;
			}
			try {
				const file = await files.createFuncionalidad(
					this.app,
					this.plugin.settings.carpetaAdmin,
					valor
				);
				this.close();
				await this.abrirNota(file);
			} catch (e) {
				if (e instanceof files.YaExisteError) {
					this.mostrarError(nombre, "Ya existe una épica con ese nombre.");
				} else {
					console.error(e);
					new Notice("Gestión Producto: error al crear la épica.");
				}
			}
		});
		nombre.input.focus();
	}
}

export class CrearTareaModal extends GestorModal {
	private duplicadoPendiente: string | null = null;

	onOpen(): void {
		this.titleEl.setText("Crear tarea");
		const funcs = files.listFuncionalidades(this.app, this.plugin.settings.carpetaAdmin);
		const func = this.campoEpica(funcs);
		const fn = this.campoFuncionalidad(func);
		const nombre = this.campoTexto("Nombre de la tarea", "Escribe nombre de la tarea");
		const colaboradores = this.campoColaboradores();

		this.botones(async () => {
			this.limpiarError(func);
			this.limpiarError(nombre);
			const f = func.getFunc();
			const valor = nombre.input.value.trim();
			let ok = true;
			if (!f) {
				this.mostrarError(func, MSG_OBLIGATORIO);
				ok = false;
			}
			if (!valor || !slugify(valor)) {
				this.mostrarError(nombre, MSG_OBLIGATORIO);
				ok = false;
			}
			if (!ok || !f) return;
			const destino = fn.getFn() ?? f;

			let slug = slugify(valor);
			const dir = `${destino.folder.path}/tareas`;
			if (files.existeEnDir(this.app, dir, slug)) {
				const clave = `${destino.folder.path}/${slug}`;
				if (this.duplicadoPendiente !== clave) {
					this.duplicadoPendiente = clave;
					this.mostrarError(nombre, MSG_DUPLICADO);
					return;
				}
				slug = files.slugDisponible(this.app, dir, slug);
			}
			try {
				const file = await files.createTarea(this.app, destino, slug, valor);
				await this.aplicarAsignados(file, colaboradores.getSeleccionados());
				// Las tareas nuevas entran al tablero en POR HACER.
				const admin = this.plugin.settings.carpetaAdmin;
				this.plugin.settings.kanban.tareas[
					files.claveRelativa(admin, `${dir}/${slug}`)
				] = "POR HACER";
				await this.plugin.saveSettings();
				this.close();
				await this.abrirNota(file);
			} catch (e) {
				console.error(e);
				new Notice("Gestión Producto: error al crear la tarea.");
			}
		});

		if (funcs.length === 0) {
			this.sinEpicas(func);
		}
	}
}

/** Base compartida para apuntes y notas de reunión (archivos con prefijo de fecha). */
abstract class CrearFechadoModal extends GestorModal {
	protected abstract titulo: string;
	protected abstract labelNombre: string;
	protected abstract placeholderNombre: string;
	protected abstract crear(
		func: files.FuncRef,
		base: string,
		nombre: string,
		fecha: string
	): Promise<TFile>;
	protected abstract carpeta(func: files.FuncRef): string;
	/** Las incidencias (pendientes) ofrecen asignar colaboradores al crear. */
	protected conColaboradores = false;

	private duplicadoPendiente: string | null = null;

	onOpen(): void {
		this.titleEl.setText(this.titulo);
		const funcs = files.listFuncionalidades(this.app, this.plugin.settings.carpetaAdmin);
		const func = this.campoEpica(funcs);
		const fn = this.campoFuncionalidad(func);
		const nombre = this.campoTexto(this.labelNombre, this.placeholderNombre);
		const colaboradores = this.conColaboradores ? this.campoColaboradores() : null;

		this.botones(async () => {
			this.limpiarError(func);
			this.limpiarError(nombre);
			const f = func.getFunc();
			const valor = nombre.input.value.trim();
			let ok = true;
			if (!f) {
				this.mostrarError(func, MSG_OBLIGATORIO);
				ok = false;
			}
			if (!valor || !slugify(valor)) {
				this.mostrarError(nombre, MSG_OBLIGATORIO);
				ok = false;
			}
			if (!ok || !f) return;
			const destino = fn.getFn() ?? f;

			const fecha = hoy();
			let base = `${fecha}-${slugify(valor)}`;
			const dir = this.carpeta(destino);
			if (files.existeEnDir(this.app, dir, base)) {
				const clave = `${destino.folder.path}/${base}`;
				if (this.duplicadoPendiente !== clave) {
					this.duplicadoPendiente = clave;
					this.mostrarError(nombre, MSG_DUPLICADO);
					return;
				}
				base = files.slugDisponible(this.app, dir, base);
			}
			try {
				const file = await this.crear(destino, base, valor, fecha);
				if (colaboradores) {
					await this.aplicarAsignados(file, colaboradores.getSeleccionados());
				}
				this.close();
				await this.abrirNota(file);
			} catch (e) {
				console.error(e);
				new Notice("Gestión Producto: error al crear el elemento.");
			}
		});

		if (funcs.length === 0) {
			this.sinEpicas(func);
		}
	}
}

export class CrearApunteModal extends CrearFechadoModal {
	protected titulo = "Crear apunte";
	protected labelNombre = "Nombre del apunte";
	protected placeholderNombre = "Escribe un título para el apunte";

	protected carpeta(func: files.FuncRef): string {
		return `${func.folder.path}/apuntes`;
	}

	protected crear(func: files.FuncRef, base: string, nombre: string, fecha: string): Promise<TFile> {
		return files.createApunte(this.app, func, base, nombre, fecha);
	}
}

/** Modal "Agregar link": inserta un callout [!link] en la posición del cursor. */
export class AgregarLinkModal extends GestorModal {
	private editor: Editor;

	constructor(plugin: GestorFuncionesPlugin, editor: Editor) {
		super(plugin);
		this.editor = editor;
	}

	onOpen(): void {
		this.titleEl.setText("Agregar link");
		const nombre = this.campoTexto("Nombre", "Ej: Ticket de Jira");
		const desc = this.campoTexto("Descripción", "Ej: Ticket relacionado al flujo de login");
		const link = this.campoTexto("Link", "https://");

		this.botones(() => {
			const callout = construirCalloutLink(
				nombre.input.value.trim(),
				desc.input.value.trim(),
				link.input.value.trim()
			);
			this.insertarEnCursor(callout);
			this.close();
		}, "Agregar");

		// Los tres campos son opcionales, pero al menos uno debe tener contenido.
		this.crearBtn.disabled = true;
		const actualizar = () => {
			this.crearBtn.disabled = !(
				nombre.input.value.trim() ||
				desc.input.value.trim() ||
				link.input.value.trim()
			);
		};
		for (const campo of [nombre, desc, link]) {
			campo.input.addEventListener("input", actualizar);
		}
		nombre.input.focus();
	}

	private insertarEnCursor(callout: string): void {
		const editor = this.editor;
		const cursor = editor.getCursor();
		const linea = editor.getLine(cursor.line);
		// Línea en blanco después del callout si lo siguiente tiene contenido,
		// para que el blockquote no absorba el texto de abajo.
		const haySiguienteConTexto =
			cursor.line + 1 < editor.lineCount() && editor.getLine(cursor.line + 1).trim() !== "";
		const sufijo = haySiguienteConTexto ? "\n" : "";
		if (linea.trim() === "") {
			editor.replaceRange(
				callout + sufijo,
				{ line: cursor.line, ch: 0 },
				{ line: cursor.line, ch: linea.length }
			);
		} else {
			editor.replaceRange("\n" + callout + sufijo, { line: cursor.line, ch: linea.length });
		}
	}
}

function construirCalloutLink(nombre: string, descripcion: string, link: string): string {
	const titulo = nombre || "Link";
	const lineas = [`> [!link] ${titulo}`];
	if (descripcion) lineas.push(`> ${descripcion}`);
	if (link) lineas.push(`> [${nombre || link}](${link})`);
	return lineas.join("\n");
}

export class CrearReunionModal extends CrearFechadoModal {
	protected titulo = "Crear nota de reunión";
	protected labelNombre = "Nombre de la reunión";
	protected placeholderNombre = "Ej: Revisión de diseño sprint 3";

	protected carpeta(func: files.FuncRef): string {
		return `${func.folder.path}/reuniones`;
	}

	protected crear(func: files.FuncRef, base: string, nombre: string, fecha: string): Promise<TFile> {
		return files.createReunion(this.app, func, base, nombre, fecha);
	}
}

export interface OpcionesSprint {
	epicaSlug?: string;
	/** Funcionalidad objetivo; sin ella los sprints son de la épica. */
	funcionalidadSlug?: string;
	anio?: number;
	/** Sprint hacia el que hacer scroll al abrir (desde el roadmap). */
	sprint?: number;
}

/** Modal "Asignar sprints": crea o edita el archivo sprints.md de una épica. */
export class AsignarSprintModal extends GestorModal {
	private opts: OpcionesSprint;
	/** Asignaciones del año visible: número de sprint → etiquetas seleccionadas. */
	private edicion = new Map<number, Set<string>>();
	/** Todas las asignaciones leídas del archivo (todos los años). */
	private todosLosSprints: files.SprintAsignado[] = [];

	constructor(plugin: GestorFuncionesPlugin, opts: OpcionesSprint = {}) {
		super(plugin);
		this.opts = opts;
	}

	onOpen(): void {
		this.titleEl.setText("Asignar sprints");
		this.modalEl.addClass("gf-modal-sprints");

		const funcs = files.listFuncionalidades(this.app, this.plugin.settings.carpetaAdmin);
		const epica = this.campoEpica(funcs);
		const fn = this.campoFuncionalidad(epica);

		const anioCampo = this.campoSelect("Año", "Año");
		const actual = new Date().getFullYear();
		const anios = [actual - 1, actual, actual + 1, actual + 2];
		this.setOpciones(
			anioCampo.select,
			"Año",
			anios.map((a) => ({ value: String(a), label: String(a) }))
		);
		anioCampo.select.value = String(
			this.opts.anio && anios.includes(this.opts.anio) ? this.opts.anio : actual
		);

		const listaWrap = this.contentEl.createDiv({ cls: "gf-sprints-lista" });

		// El objetivo de los sprints es la funcionalidad elegida o, sin ella, la épica.
		const objetivo = () => fn.getFn() ?? epica.getFunc();

		this.botones(async () => {
			this.limpiarError(epica);
			const obj = objetivo();
			if (!obj) {
				this.mostrarError(epica, MSG_OBLIGATORIO);
				return;
			}
			const anio = Number(anioCampo.select.value);
			// Solo se actualiza el año visible; los demás años se conservan.
			const otros = this.todosLosSprints.filter((s) => s.anio !== anio);
			const visibles: files.SprintAsignado[] = [...this.edicion.entries()].map(
				([sprint, etiquetas]) => ({ anio, sprint, etiquetas: [...etiquetas] })
			);
			try {
				await files.guardarSprints(this.app, obj, [...otros, ...visibles]);
				this.close();
			} catch (e) {
				console.error(e);
				new Notice("Gestión Producto: error al guardar los sprints.");
			}
		}, "Guardar");
		this.crearBtn.disabled = true;

		const cargar = async () => {
			const obj = objetivo();
			this.todosLosSprints = obj ? await files.leerSprints(this.app, obj) : [];
			this.armarEdicion(Number(anioCampo.select.value));
			this.renderLista(listaWrap);
			this.crearBtn.disabled = !obj;
		};

		// El cambio de épica repuebla el selector de funcionalidad, que a su vez
		// dispara su propio change; basta con escuchar este último.
		fn.select.addEventListener("change", () => void cargar());
		anioCampo.select.addEventListener("change", () => {
			this.armarEdicion(Number(anioCampo.select.value));
			this.renderLista(listaWrap);
		});

		if (funcs.length === 0) {
			this.sinEpicas(epica);
			return;
		}
		if (this.opts.epicaSlug) {
			epica.seleccionar(this.opts.epicaSlug);
			if (this.opts.funcionalidadSlug) fn.seleccionar(this.opts.funcionalidadSlug);
		} else {
			void cargar();
		}
	}

	private armarEdicion(anio: number): void {
		this.edicion.clear();
		for (const s of this.todosLosSprints) {
			if (s.anio === anio) this.edicion.set(s.sprint, new Set(s.etiquetas));
		}
	}

	private renderLista(cont: HTMLElement): void {
		cont.empty();
		const etiquetas = this.plugin.settings.etiquetas;
		for (let n = 1; n <= 52; n++) {
			const fila = cont.createDiv({ cls: "gf-sprint-fila", attr: { "data-sprint": String(n) } });
			const cabecera = fila.createDiv({ cls: "gf-sprint-cabecera" });
			const chk = cabecera.createEl("input", { type: "checkbox" });
			chk.checked = this.edicion.has(n);
			cabecera.createEl("span", { text: `Sprint ${n}`, cls: "gf-sprint-nombre" });
			const chipsWrap = fila.createDiv({ cls: "gf-sprint-chips" });

			const renderChips = () => {
				chipsWrap.empty();
				if (!this.edicion.has(n)) return;
				if (etiquetas.length === 0) {
					chipsWrap.createEl("span", {
						cls: "gf-campo-aviso",
						text: "No hay etiquetas configuradas. Agrégalas en Settings > Gestión Producto.",
					});
					return;
				}
				const seleccion = this.edicion.get(n);
				if (!seleccion) return;
				for (const et of etiquetas) {
					const activa = seleccion.has(et.nombre);
					const chip = chipsWrap.createEl("button", {
						text: et.nombre,
						cls: "gf-chip" + (activa ? " gf-chip-on" : ""),
					});
					// El color configurado de la etiqueta tiñe el chip.
					if (activa) {
						chip.setCssStyles({ backgroundColor: et.color });
						chip.setCssStyles({ borderColor: et.color });
					} else {
						chip.setCssStyles({ borderColor: et.color });
						chip.setCssStyles({ color: et.color });
					}
					chip.addEventListener("click", (e) => {
						e.preventDefault();
						if (seleccion.has(et.nombre)) seleccion.delete(et.nombre);
						else seleccion.add(et.nombre);
						renderChips();
					});
				}
			};

			chk.addEventListener("change", () => {
				if (chk.checked) this.edicion.set(n, this.edicion.get(n) ?? new Set());
				else this.edicion.delete(n);
				renderChips();
			});
			renderChips();
		}
		if (this.opts.sprint) {
			cont.querySelector(`[data-sprint="${this.opts.sprint}"]`)?.scrollIntoView({
				block: "center",
			});
		}
	}
}

export class CrearPendienteModal extends CrearFechadoModal {
	protected titulo = "Crear pendiente";
	protected labelNombre = "Nombre del pendiente";
	protected placeholderNombre = "Ej: Revisar mockups con el equipo";
	protected conColaboradores = true;

	protected carpeta(func: files.FuncRef): string {
		return `${func.folder.path}/pendientes`;
	}

	protected crear(func: files.FuncRef, base: string, nombre: string, fecha: string): Promise<TFile> {
		return files.createPendiente(this.app, func, base, nombre, fecha);
	}
}

/** Como los apuntes, pero el nombre del archivo no lleva prefijo de fecha. */
abstract class CrearSimpleModal extends GestorModal {
	protected abstract titulo: string;
	protected abstract labelNombre: string;
	protected abstract placeholderNombre: string;
	protected abstract carpeta(func: files.FuncRef): string;
	protected abstract crear(func: files.FuncRef, slug: string, nombre: string): Promise<TFile>;

	private duplicadoPendiente: string | null = null;

	onOpen(): void {
		this.titleEl.setText(this.titulo);
		const funcs = files.listFuncionalidades(this.app, this.plugin.settings.carpetaAdmin);
		const func = this.campoEpica(funcs);
		const fn = this.campoFuncionalidad(func);
		const nombre = this.campoTexto(this.labelNombre, this.placeholderNombre);

		this.botones(async () => {
			this.limpiarError(func);
			this.limpiarError(nombre);
			const f = func.getFunc();
			const valor = nombre.input.value.trim();
			let ok = true;
			if (!f) {
				this.mostrarError(func, MSG_OBLIGATORIO);
				ok = false;
			}
			if (!valor || !slugify(valor)) {
				this.mostrarError(nombre, MSG_OBLIGATORIO);
				ok = false;
			}
			if (!ok || !f) return;
			const destino = fn.getFn() ?? f;

			let slug = slugify(valor);
			const dir = this.carpeta(destino);
			if (files.existeEnDir(this.app, dir, slug)) {
				const clave = `${destino.folder.path}/${slug}`;
				if (this.duplicadoPendiente !== clave) {
					this.duplicadoPendiente = clave;
					this.mostrarError(nombre, MSG_DUPLICADO);
					return;
				}
				slug = files.slugDisponible(this.app, dir, slug);
			}
			try {
				const file = await this.crear(destino, slug, valor);
				this.close();
				await this.abrirNota(file);
			} catch (e) {
				console.error(e);
				new Notice("Gestión Producto: error al crear el elemento.");
			}
		});

		if (funcs.length === 0) {
			this.sinEpicas(func);
		}
	}
}

export class CrearInsumoModal extends CrearSimpleModal {
	protected titulo = "Crear insumo";
	protected labelNombre = "Nombre del insumo";
	protected placeholderNombre = "Escribe un título para el insumo";

	protected carpeta(func: files.FuncRef): string {
		return `${func.folder.path}/insumos`;
	}

	protected crear(func: files.FuncRef, slug: string, nombre: string): Promise<TFile> {
		return files.createInsumo(this.app, func, slug, nombre);
	}
}

export class CrearHistoriaModal extends CrearSimpleModal {
	protected titulo = "Crear historia";
	protected labelNombre = "Nombre de la historia";
	protected placeholderNombre = "Escribe un título para la historia";

	protected carpeta(func: files.FuncRef): string {
		return `${func.folder.path}/historias`;
	}

	protected crear(func: files.FuncRef, slug: string, nombre: string): Promise<TFile> {
		return files.createHistoria(this.app, func, slug, nombre);
	}
}


/** Mover épicas entre las carpetas de activas e inactivas. */
export class MoverEpicaModal extends GestorModal {
	onOpen(): void {
		this.titleEl.setText("Mover épica");
		const activas = files.listFuncionalidades(this.app, files.CARPETA_ACTIVAS);
		const inactivas = files.listFuncionalidades(this.app, files.CARPETA_INACTIVAS);

		const seleccion: Array<{ func: files.FuncRef; destino: string; chk: HTMLInputElement }> = [];

		const renderGrupo = (titulo: string, lista: files.FuncRef[], destino: string) => {
			const grupo = this.contentEl.createDiv({ cls: "gf-campo" });
			grupo.createEl("label", { text: titulo, cls: "gf-campo-label" });
			if (lista.length === 0) {
				grupo.createDiv({ cls: "gf-campo-aviso", text: "Sin épicas." });
				return;
			}
			for (const func of lista) {
				const fila = grupo.createEl("label", { cls: "gf-chk gf-mover-fila" });
				const chk = fila.createEl("input", { type: "checkbox" });
				fila.appendText(` ${func.nombre}`);
				seleccion.push({ func, destino, chk });
			}
		};

		renderGrupo("Activas → mover a inactivas", activas, files.CARPETA_INACTIVAS);
		renderGrupo("Inactivas → regresar a activas", inactivas, files.CARPETA_ACTIVAS);

		this.botones(async () => {
			const marcadas = seleccion.filter((s) => s.chk.checked);
			if (marcadas.length === 0) {
				this.close();
				return;
			}
			let movidas = 0;
			for (const s of marcadas) {
				const destino = `${s.destino}/${s.func.slug}`;
				if (this.app.vault.getAbstractFileByPath(destino)) {
					new Notice(`Gestión Producto: ya existe "${s.func.nombre}" en la carpeta destino.`);
					continue;
				}
				try {
					await this.app.fileManager.renameFile(s.func.folder, destino);
					movidas++;
				} catch (e) {
					console.error(e);
					new Notice(`Gestión Producto: no se pudo mover "${s.func.nombre}".`);
				}
			}
			if (movidas > 0) new Notice(`Gestión Producto: ${movidas} épica(s) movida(s).`);
			this.close();
		}, "Mover");

		if (activas.length === 0 && inactivas.length === 0) {
			this.crearBtn.disabled = true;
		}
	}
}

/** CRUD de colaboradores: como las etiquetas de sprint, con color. */
export class GestionColaboradoresModal extends GestorModal {
	onOpen(): void {
		this.titleEl.setText("Colaboradores");
		const cont = this.contentEl.createDiv();
		this.renderLista(cont);
		const row = this.contentEl.createDiv({ cls: "gf-botones" });
		const cerrar = row.createEl("button", { text: "Cerrar", cls: "mod-cta" });
		cerrar.addEventListener("click", () => this.close());
	}

	private renderLista(cont: HTMLElement): void {
		cont.empty();
		const colaboradores = this.plugin.settings.colaboradores;
		const lista = cont.createDiv({ cls: "gf-etiquetas" });

		if (colaboradores.length === 0) {
			lista.createEl("em", { cls: "gf-campo-aviso", text: "Sin colaboradores aún." });
		}

		colaboradores.forEach((colab, indice) => {
			const fila = lista.createDiv({ cls: "gf-etiqueta" });
			const color = fila.createEl("input", {
				type: "color",
				cls: "gf-etiqueta-color",
				value: colab.color,
			});
			color.addEventListener("change", async () => {
				colab.color = color.value;
				await this.plugin.saveSettings();
			});
			const nombre = fila.createEl("span", { text: colab.nombre, cls: "gf-etiqueta-nombre" });
			nombre.setAttr("title", "Clic para editar");
			nombre.addEventListener("click", () => this.editarNombre(cont, fila, nombre, indice));
			const del = fila.createEl("span", { text: "×", cls: "gf-etiqueta-del" });
			del.setAttr("title", "Eliminar colaborador");
			del.addEventListener("click", async () => {
				colaboradores.splice(indice, 1);
				await this.plugin.saveSettings();
				this.renderLista(cont);
			});
		});

		const addRow = cont.createDiv({ cls: "gf-etiqueta-add" });
		const colorNuevo = addRow.createEl("input", {
			type: "color",
			cls: "gf-etiqueta-color",
			value: "#5082ff",
		});
		const input = addRow.createEl("input", {
			type: "text",
			attr: { placeholder: "Nuevo colaborador" },
		});
		const btn = addRow.createEl("button", { text: "Agregar" });
		const error = cont.createDiv({ cls: "gf-campo-error" });
		error.hide();

		const agregar = async () => {
			const valor = input.value.trim();
			if (!valor) return;
			if (colaboradores.some((c) => c.nombre.toLowerCase() === valor.toLowerCase())) {
				error.setText("Ya existe un colaborador con ese nombre.");
				error.show();
				return;
			}
			error.hide();
			colaboradores.push({ nombre: valor, color: colorNuevo.value });
			await this.plugin.saveSettings();
			this.renderLista(cont);
		};
		btn.addEventListener("click", () => void agregar());
		input.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				void agregar();
			}
		});
	}

	private editarNombre(
		cont: HTMLElement,
		fila: HTMLElement,
		nombre: HTMLElement,
		indice: number
	): void {
		const colaboradores = this.plugin.settings.colaboradores;
		const original = colaboradores[indice].nombre;
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
				this.renderLista(cont);
				return;
			}
			if (
				colaboradores.some(
					(c, j) => j !== indice && c.nombre.toLowerCase() === valor.toLowerCase()
				)
			) {
				error.setText("Ya existe un colaborador con ese nombre.");
				error.show();
				return;
			}
			terminado = true;
			colaboradores[indice].nombre = valor;
			await this.plugin.saveSettings();
			this.renderLista(cont);
		};

		input.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				void confirmar();
			} else if (e.key === "Escape") {
				terminado = true;
				this.renderLista(cont);
			}
		});
		input.addEventListener("blur", () => void confirmar());
	}
}

/** Asignar colaboradores a incidencias (tareas y pendientes). */
export class AsignarColaboradorModal extends GestorModal {
	private seleccionados = new Set<string>();
	private filas: Array<{ file: TFile; chk: HTMLInputElement }> = [];

	onOpen(): void {
		this.titleEl.setText("Asignar colaborador");
		this.modalEl.addClass("gf-modal-sprints");

		const funcs = files.listFuncionalidades(this.app, this.plugin.settings.carpetaAdmin);
		const epica = this.campoEpica(funcs);
		const fn = this.campoFuncionalidad(epica);

		// Colaboradores: chips + alta rápida con nombre único.
		const colWrap = this.contentEl.createDiv({ cls: "gf-campo" });
		colWrap.createEl("label", { text: "Colaboradores", cls: "gf-campo-label" });
		const chipsDiv = colWrap.createDiv({ cls: "gf-sprint-chips gf-colab-chips" });
		const addRow = colWrap.createDiv({ cls: "gf-etiqueta-add" });
		const inputNuevo = addRow.createEl("input", {
			type: "text",
			attr: { placeholder: "Nuevo colaborador" },
		});
		const btnNuevo = addRow.createEl("button", { text: "Agregar" });
		const errorNuevo = colWrap.createDiv({ cls: "gf-campo-error" });
		errorNuevo.hide();

		const listaWrap = this.contentEl.createDiv({ cls: "gf-sprints-lista" });

		const actualizarBoton = () => {
			this.crearBtn.disabled = !epica.getFunc() || this.seleccionados.size === 0;
		};

		const refrescarChecks = () => {
			for (const fila of this.filas) {
				const asignados = files.getAsignados(this.app, fila.file);
				fila.chk.checked =
					this.seleccionados.size > 0 &&
					[...this.seleccionados].every((c) => asignados.includes(c));
			}
		};

		const renderChips = () => {
			chipsDiv.empty();
			const colaboradores = this.plugin.settings.colaboradores;
			if (colaboradores.length === 0) {
				chipsDiv.createEl("span", {
					cls: "gf-campo-aviso",
					text: "Sin colaboradores aún. Agrega uno abajo.",
				});
			}
			for (const colab of colaboradores) {
				const activo = this.seleccionados.has(colab.nombre);
				const chip = chipsDiv.createEl("button", {
					text: colab.nombre,
					cls: "gf-chip" + (activo ? " gf-chip-on" : ""),
				});
				if (activo) {
					chip.setCssStyles({ backgroundColor: colab.color });
					chip.setCssStyles({ borderColor: colab.color });
				} else {
					chip.setCssStyles({ borderColor: colab.color });
					chip.setCssStyles({ color: colab.color });
				}
				chip.addEventListener("click", (e) => {
					e.preventDefault();
					if (activo) this.seleccionados.delete(colab.nombre);
					else this.seleccionados.add(colab.nombre);
					renderChips();
					refrescarChecks();
					actualizarBoton();
				});
			}
		};

		const agregarColaborador = async () => {
			const valor = inputNuevo.value.trim();
			if (!valor) return;
			const colaboradores = this.plugin.settings.colaboradores;
			if (colaboradores.some((c) => c.nombre.toLowerCase() === valor.toLowerCase())) {
				errorNuevo.setText("Ya existe un colaborador con ese nombre.");
				errorNuevo.show();
				return;
			}
			errorNuevo.hide();
			colaboradores.push({ nombre: valor, color: "#5082ff" });
			await this.plugin.saveSettings();
			this.seleccionados.add(valor);
			inputNuevo.value = "";
			renderChips();
			refrescarChecks();
			actualizarBoton();
		};
		btnNuevo.addEventListener("click", () => void agregarColaborador());
		inputNuevo.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				void agregarColaborador();
			}
		});

		const ETIQUETA_TIPO: Record<files.Incidencia["tipo"], string> = {
			tarea: "Tarea",
			pendiente: "Pendiente",
		};

		const renderIncidencias = () => {
			listaWrap.empty();
			this.filas = [];
			const f = epica.getFunc();
			if (!f) return;
			// Con funcionalidad elegida se listan solo sus incidencias; sin ella,
			// las de nivel épica más las de todas sus funcionalidades.
			const seleccionFn = fn.getFn();
			const grupos: Array<{ origen: string; incidencias: files.Incidencia[] }> = [];
			if (seleccionFn) {
				grupos.push({ origen: "", incidencias: files.listIncidencias(this.app, seleccionFn) });
			} else {
				grupos.push({ origen: "", incidencias: files.listIncidencias(this.app, f) });
				for (const hija of files.listFuncionalidadesDe(this.app, f.folder)) {
					grupos.push({
						origen: hija.nombre,
						incidencias: files.listIncidencias(this.app, hija),
					});
				}
			}
			const total = grupos.reduce((n, g) => n + g.incidencias.length, 0);
			if (total === 0) {
				listaWrap.createEl("em", {
					cls: "gf-campo-aviso",
					text: seleccionFn
						? "Esta funcionalidad no tiene incidencias aún."
						: "Esta épica no tiene incidencias aún.",
				});
				return;
			}
			for (const grupo of grupos) {
				for (const inc of grupo.incidencias) {
					const fila = listaWrap.createDiv({ cls: "gf-sprint-fila" });
					const cabecera = fila.createDiv({ cls: "gf-sprint-cabecera" });
					if (inc.nivel > 0) cabecera.addClass("gf-incidencia-sub");
					const chk = cabecera.createEl("input", { type: "checkbox" });
					cabecera.createEl("span", { text: ETIQUETA_TIPO[inc.tipo], cls: "gf-tipo-badge" });
					cabecera.createEl("span", { text: inc.nombre, cls: "gf-sprint-nombre" });
					if (grupo.origen) {
						cabecera.createEl("span", { text: grupo.origen, cls: "gf-campo-aviso" });
					}
					this.filas.push({ file: inc.file, chk });
				}
			}
			refrescarChecks();
		};

		this.botones(async () => {
			const f = epica.getFunc();
			if (!f || this.seleccionados.size === 0) return;
			try {
				for (const fila of this.filas) {
					const previos = files.getAsignados(this.app, fila.file);
					const actuales = new Set(previos);
					if (fila.chk.checked) {
						for (const c of this.seleccionados) actuales.add(c);
					} else {
						for (const c of this.seleccionados) actuales.delete(c);
					}
					if (actuales.size === previos.length && previos.every((p) => actuales.has(p))) {
						continue;
					}
					await this.app.fileManager.processFrontMatter(fila.file, (fm: Record<string, unknown>) => {
						fm.asignados = [...actuales].sort((a, b) => a.localeCompare(b, "es"));
					});
				}
				this.close();
				new Notice("Gestión Producto: asignaciones guardadas.");
			} catch (e) {
				console.error(e);
				new Notice("Gestión Producto: error al guardar las asignaciones.");
			}
		}, "Guardar");
		this.crearBtn.disabled = true;

		fn.select.addEventListener("change", () => {
			renderIncidencias();
			actualizarBoton();
		});

		if (funcs.length === 0) {
			this.sinEpicas(epica);
			return;
		}
		renderChips();
	}
}

/** Crear una funcionalidad dentro de una épica: carpeta + nota de descripción. */
export class CrearFuncionalidadNuevaModal extends GestorModal {
	onOpen(): void {
		this.titleEl.setText("Crear funcionalidad");
		const funcs = files.listFuncionalidades(this.app, this.plugin.settings.carpetaAdmin);
		const epica = this.campoEpica(funcs);
		const nombre = this.campoTexto(
			"Nombre de la funcionalidad",
			"Escribe nombre de la funcionalidad"
		);

		this.botones(async () => {
			this.limpiarError(epica);
			this.limpiarError(nombre);
			const f = epica.getFunc();
			const valor = nombre.input.value.trim();
			let ok = true;
			if (!f) {
				this.mostrarError(epica, MSG_OBLIGATORIO);
				ok = false;
			}
			if (!valor || !slugify(valor)) {
				this.mostrarError(nombre, "El nombre es obligatorio.");
				ok = false;
			}
			if (!ok || !f) return;
			try {
				const file = await files.createFuncionalidadEn(this.app, f, valor);
				this.close();
				await this.abrirNota(file);
			} catch (e) {
				if (e instanceof files.YaExisteError) {
					this.mostrarError(nombre, "Ya existe una funcionalidad con ese nombre.");
				} else {
					console.error(e);
					new Notice("Gestión Producto: error al crear la funcionalidad.");
				}
			}
		});

		if (funcs.length === 0) {
			this.sinEpicas(epica);
		}
	}
}

/** Cambiar el estado de una funcionalidad (frontmatter `estado`). */
export class CambiarEstadoFuncionalidadModal extends GestorModal {
	onOpen(): void {
		this.titleEl.setText("Cambiar estado de funcionalidad");
		const funcs = files.listFuncionalidades(this.app, this.plugin.settings.carpetaAdmin);
		const epica = this.campoEpica(funcs);
		const funcionalidad = this.campoSelect("Funcionalidad", "Seleccionar funcionalidad");
		funcionalidad.select.disabled = true;
		const estado = this.campoSelect("Estado", "Seleccionar estado");
		const estados = this.plugin.settings.estados;
		this.setOpciones(
			estado.select,
			"Seleccionar estado",
			estados.map((e) => ({ value: e.valor, label: e.nombre }))
		);

		let lista: files.FuncRef[] = [];
		let aviso: HTMLElement | null = null;

		epica.select.addEventListener("change", () => {
			this.limpiarError(funcionalidad);
			aviso?.remove();
			aviso = null;
			const f = epica.getFunc();
			lista = f ? files.listFuncionalidadesDe(this.app, f.folder) : [];
			if (lista.length === 0) {
				funcionalidad.select.disabled = true;
				this.setOpciones(funcionalidad.select, "Seleccionar funcionalidad", []);
				if (f) {
					aviso = funcionalidad.wrap.createDiv({
						cls: "gf-campo-aviso",
						text: "Esta épica no tiene funcionalidades aún.",
					});
				}
				this.crearBtn.disabled = true;
			} else {
				funcionalidad.select.disabled = false;
				this.setOpciones(
					funcionalidad.select,
					"Seleccionar funcionalidad",
					lista.map((x) => ({ value: x.slug, label: x.nombre }))
				);
				this.crearBtn.disabled = false;
			}
		});

		// Al elegir funcionalidad, preselecciona su estado actual.
		funcionalidad.select.addEventListener("change", () => {
			const fn = lista.find((x) => x.slug === funcionalidad.select.value);
			if (fn?.estado && estados.some((e) => e.valor === fn.estado)) {
				estado.select.value = fn.estado;
			}
		});

		this.botones(async () => {
			this.limpiarError(epica);
			this.limpiarError(funcionalidad);
			this.limpiarError(estado);
			const f = epica.getFunc();
			const fnSel = lista.find((x) => x.slug === funcionalidad.select.value);
			const valor = estado.select.value;
			let ok = true;
			if (!f) {
				this.mostrarError(epica, MSG_OBLIGATORIO);
				ok = false;
			}
			if (!fnSel) {
				this.mostrarError(funcionalidad, MSG_OBLIGATORIO);
				ok = false;
			}
			if (!valor) {
				this.mostrarError(estado, MSG_OBLIGATORIO);
				ok = false;
			}
			if (!ok || !fnSel) return;
			try {
				await this.app.fileManager.processFrontMatter(fnSel.file, (fm: Record<string, unknown>) => {
					fm.estado = valor;
				});
				this.close();
			} catch (e) {
				console.error(e);
				new Notice("Gestión Producto: error al cambiar el estado.");
			}
		}, "Guardar");

		if (funcs.length === 0) {
			this.sinEpicas(epica);
		}
	}
}

/** Modal "Cambiar estado de épica": actualiza el frontmatter `estado`. */
export class CambiarEstadoModal extends GestorModal {
	onOpen(): void {
		this.titleEl.setText("Cambiar estado de épica");
		const funcs = files.listFuncionalidades(this.app, this.plugin.settings.carpetaAdmin);
		const epica = this.campoEpica(funcs);
		const estado = this.campoSelect("Estado", "Seleccionar estado");
		const estados = this.plugin.settings.estados;
		this.setOpciones(
			estado.select,
			"Seleccionar estado",
			estados.map((e) => ({ value: e.valor, label: e.nombre }))
		);

		// Al elegir épica, preselecciona su estado actual si está en la lista.
		epica.select.addEventListener("change", () => {
			const f = epica.getFunc();
			if (f?.estado && estados.some((e) => e.valor === f.estado)) {
				estado.select.value = f.estado;
			}
		});

		this.botones(async () => {
			this.limpiarError(epica);
			this.limpiarError(estado);
			const f = epica.getFunc();
			const valor = estado.select.value;
			let ok = true;
			if (!f) {
				this.mostrarError(epica, MSG_OBLIGATORIO);
				ok = false;
			}
			if (!valor) {
				this.mostrarError(estado, MSG_OBLIGATORIO);
				ok = false;
			}
			if (!ok || !f) return;
			try {
				await this.app.fileManager.processFrontMatter(f.file, (fm: Record<string, unknown>) => {
					fm.estado = valor;
				});
				this.close();
			} catch (e) {
				console.error(e);
				new Notice("Gestión Producto: error al cambiar el estado.");
			}
		}, "Guardar");

		if (funcs.length === 0) {
			this.sinEpicas(epica);
		}
	}
}
