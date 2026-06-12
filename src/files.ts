import { App, TFile, TFolder, normalizePath, parseYaml } from "obsidian";
import { escapeYaml, hoy, slugify } from "./utils";
import * as tpl from "./templates";

/** Se lanza cuando ya existe una funcionalidad con el mismo slug. */
export class YaExisteError extends Error {}

/** Carpetas de gestión, fijas en la raíz del vault. */
export const CARPETA_ACTIVAS = "Épicas activas";
export const CARPETA_INACTIVAS = "Épicas inactivas";

export function carpetasGestionListas(app: App): boolean {
	return (
		app.vault.getAbstractFileByPath(normalizePath(CARPETA_ACTIVAS)) instanceof TFolder &&
		app.vault.getAbstractFileByPath(normalizePath(CARPETA_INACTIVAS)) instanceof TFolder
	);
}

export async function crearCarpetasGestion(app: App): Promise<void> {
	await ensureFolder(app, CARPETA_ACTIVAS);
	await ensureFolder(app, CARPETA_INACTIVAS);
}

/** Clave de data.json: ruta relativa a la carpeta de épicas, sin extensión .md. */
export function claveRelativa(adminPath: string, path: string): string {
	const prefijo = normalizePath(adminPath) + "/";
	const sinMd = path.endsWith(".md") ? path.slice(0, -3) : path;
	return sinMd.startsWith(prefijo) ? sinMd.slice(prefijo.length) : sinMd;
}

export interface FuncRef {
	slug: string;
	nombre: string;
	file: TFile;
	folder: TFolder;
	/** Valor de `estado` del frontmatter de la nota principal, si existe. */
	estado?: string;
}

export interface TareaRef {
	slug: string;
	nombre: string;
	file: TFile;
	/** Carpeta de la tarea (cada tarea es una carpeta con su .md adentro). */
	folder: TFolder;
}

export interface PendienteRef {
	slug: string;
	nombre: string;
	file: TFile;
	/** Carpeta del pendiente; null si es un archivo plano (formato anterior). */
	folder: TFolder | null;
}

export interface Incidencia {
	tipo: "tarea" | "sub-tarea" | "pendiente" | "sub-pendiente";
	file: TFile;
	nombre: string;
	/** 0 para tareas/pendientes, 1 para sub-elementos. */
	nivel: number;
}

export async function ensureFolder(app: App, path: string): Promise<TFolder> {
	const norm = normalizePath(path);
	const existente = app.vault.getAbstractFileByPath(norm);
	if (existente instanceof TFolder) return existente;
	if (existente) throw new Error(`"${norm}" existe pero no es una carpeta.`);
	await app.vault.createFolder(norm);
	const creada = app.vault.getAbstractFileByPath(norm);
	if (!(creada instanceof TFolder)) throw new Error(`No se pudo crear la carpeta "${norm}".`);
	return creada;
}

function nombreDesdeFrontmatter(app: App, file: TFile, fallback: string): string {
	const nombre = app.metadataCache.getFileCache(file)?.frontmatter?.nombre;
	return nombre ? String(nombre) : fallback;
}

export function listFuncionalidades(app: App, adminPath: string): FuncRef[] {
	const root = app.vault.getAbstractFileByPath(normalizePath(adminPath));
	if (!(root instanceof TFolder)) return [];
	const out: FuncRef[] = [];
	for (const child of root.children) {
		if (!(child instanceof TFolder)) continue;
		const main = child.children.find(
			(c): c is TFile => c instanceof TFile && c.extension === "md" && c.basename === child.name
		);
		if (!main) continue;
		const fm = app.metadataCache.getFileCache(main)?.frontmatter;
		out.push({
			slug: child.name,
			nombre: fm?.nombre ? String(fm.nombre) : child.name,
			file: main,
			folder: child,
			estado: fm?.estado ? String(fm.estado) : undefined,
		});
	}
	return out.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

/**
 * Funcionalidades de una épica: carpetas dentro de <épica>/funcionalidades/.
 * Comparten la forma de FuncRef, así que las operaciones de incidencias y
 * acciones adicionales funcionan igual a nivel de funcionalidad.
 */
export function listFuncionalidadesDe(app: App, epicaFolder: TFolder): FuncRef[] {
	const dir = epicaFolder.children.find(
		(c): c is TFolder => c instanceof TFolder && c.name === "funcionalidades"
	);
	if (!dir) return [];
	const out: FuncRef[] = [];
	for (const child of dir.children) {
		if (!(child instanceof TFolder)) continue;
		const main = child.children.find(
			(c): c is TFile => c instanceof TFile && c.extension === "md" && c.basename === child.name
		);
		if (!main) continue;
		const fm = app.metadataCache.getFileCache(main)?.frontmatter;
		out.push({
			slug: child.name,
			nombre: fm?.nombre ? String(fm.nombre) : child.name,
			file: main,
			folder: child,
			estado: fm?.estado ? String(fm.estado) : undefined,
		});
	}
	return out.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export async function createFuncionalidadEn(
	app: App,
	epica: FuncRef,
	nombre: string
): Promise<TFile> {
	const slug = slugify(nombre);
	await ensureFolder(app, `${epica.folder.path}/funcionalidades`);
	const fnPath = normalizePath(`${epica.folder.path}/funcionalidades/${slug}`);
	if (app.vault.getAbstractFileByPath(fnPath)) throw new YaExisteError();
	await app.vault.createFolder(fnPath);
	return app.vault.create(
		`${fnPath}/${slug}.md`,
		tpl.funcionalidadNueva(nombre, epica.slug, hoy())
	);
}

export function listTareas(app: App, funcFolder: TFolder): TareaRef[] {
	const dir = funcFolder.children.find(
		(c): c is TFolder => c instanceof TFolder && c.name === "tareas"
	);
	if (!dir) return [];
	const out: TareaRef[] = [];
	// Cada tarea es una carpeta dentro de tareas/ con su .md principal adentro.
	for (const child of dir.children) {
		if (!(child instanceof TFolder)) continue;
		const main = child.children.find(
			(c): c is TFile => c instanceof TFile && c.extension === "md" && c.basename === child.name
		);
		if (!main) continue;
		out.push({
			slug: child.name,
			nombre: nombreDesdeFrontmatter(app, main, child.name),
			file: main,
			folder: child,
		});
	}
	return out.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

/** Sub-tareas de una tarea: archivos en <carpeta-tarea>/subtareas/. */
export function listSubTareas(tareaFolder: TFolder): TFile[] {
	const dir = tareaFolder.children.find(
		(c): c is TFolder => c instanceof TFolder && c.name === "subtareas"
	);
	if (!dir) return [];
	return dir.children
		.filter((c): c is TFile => c instanceof TFile && c.extension === "md")
		.sort((a, b) => a.basename.localeCompare(b.basename, "es"));
}

/** Pendientes: carpeta por pendiente (formato actual) o archivo plano (anterior). */
export function listPendientes(app: App, funcFolder: TFolder): PendienteRef[] {
	const dir = funcFolder.children.find(
		(c): c is TFolder => c instanceof TFolder && c.name === "pendientes"
	);
	if (!dir) return [];
	const out: PendienteRef[] = [];
	for (const child of dir.children) {
		if (child instanceof TFile && child.extension === "md") {
			out.push({
				slug: child.basename,
				nombre: nombreDesdeFrontmatter(app, child, child.basename),
				file: child,
				folder: null,
			});
		} else if (child instanceof TFolder) {
			const main = child.children.find(
				(c): c is TFile => c instanceof TFile && c.extension === "md" && c.basename === child.name
			);
			if (!main) continue;
			out.push({
				slug: child.name,
				nombre: nombreDesdeFrontmatter(app, main, child.name),
				file: main,
				folder: child,
			});
		}
	}
	return out.sort((a, b) => a.slug.localeCompare(b.slug, "es"));
}

export function listSubPendientes(pendFolder: TFolder): TFile[] {
	const dir = pendFolder.children.find(
		(c): c is TFolder => c instanceof TFolder && c.name === "subpendientes"
	);
	if (!dir) return [];
	return dir.children
		.filter((c): c is TFile => c instanceof TFile && c.extension === "md")
		.sort((a, b) => a.basename.localeCompare(b.basename, "es"));
}

/** Todas las incidencias de una épica: tareas, sub-tareas, pendientes y sub-pendientes. */
export function listIncidencias(app: App, func: FuncRef): Incidencia[] {
	const out: Incidencia[] = [];
	for (const t of listTareas(app, func.folder)) {
		out.push({ tipo: "tarea", file: t.file, nombre: t.nombre, nivel: 0 });
		for (const s of listSubTareas(t.folder)) {
			out.push({
				tipo: "sub-tarea",
				file: s,
				nombre: nombreDesdeFrontmatter(app, s, s.basename),
				nivel: 1,
			});
		}
	}
	for (const p of listPendientes(app, func.folder)) {
		out.push({ tipo: "pendiente", file: p.file, nombre: p.nombre, nivel: 0 });
		if (p.folder) {
			for (const s of listSubPendientes(p.folder)) {
				out.push({
					tipo: "sub-pendiente",
					file: s,
					nombre: nombreDesdeFrontmatter(app, s, s.basename),
					nivel: 1,
				});
			}
		}
	}
	return out;
}

/** Colaboradores asignados en el frontmatter `asignados` de una incidencia. */
export function getAsignados(app: App, file: TFile): string[] {
	const valor = app.metadataCache.getFileCache(file)?.frontmatter?.asignados;
	return Array.isArray(valor) ? valor.map(String) : [];
}

/** ¿Existe ya un archivo .md o una carpeta con ese slug dentro de dir? */
export function existeEnDir(app: App, dir: string, slug: string): boolean {
	return (
		!!app.vault.getAbstractFileByPath(normalizePath(`${dir}/${slug}.md`)) ||
		!!app.vault.getAbstractFileByPath(normalizePath(`${dir}/${slug}`))
	);
}

/** Devuelve el slug libre más cercano agregando sufijo numérico: slug, slug-2, slug-3… */
export function slugDisponible(app: App, dir: string, slug: string): string {
	if (!existeEnDir(app, dir, slug)) return slug;
	let n = 2;
	while (existeEnDir(app, dir, `${slug}-${n}`)) n++;
	return `${slug}-${n}`;
}

/** Inserta una línea al final de la sección indicada (antes del siguiente encabezado). */
export async function appendToSection(
	app: App,
	file: TFile,
	heading: string,
	linea: string
): Promise<void> {
	await app.vault.process(file, (content) => {
		const lines = content.split("\n");
		const idx = lines.findIndex((l) => l.trim() === heading);
		if (idx === -1) {
			return content.trimEnd() + `\n\n${heading}\n\n${linea}\n`;
		}
		let fin = lines.length;
		for (let i = idx + 1; i < lines.length; i++) {
			if (/^#{1,6}\s/.test(lines[i])) {
				fin = i;
				break;
			}
		}
		let insertarEn = fin;
		while (insertarEn > idx + 1 && lines[insertarEn - 1].trim() === "") insertarEn--;
		lines.splice(insertarEn, 0, linea);
		return lines.join("\n");
	});
}

export async function createFuncionalidad(
	app: App,
	adminPath: string,
	nombre: string
): Promise<TFile> {
	const slug = slugify(nombre);
	await ensureFolder(app, adminPath);
	const funcPath = normalizePath(`${adminPath}/${slug}`);
	if (app.vault.getAbstractFileByPath(funcPath)) throw new YaExisteError();
	await app.vault.createFolder(funcPath);
	// Solo tareas/ existe por defecto; las demás carpetas (apuntes, reuniones,
	// pendientes, insumos, historias) se crean al usar su botón del panel.
	await app.vault.createFolder(`${funcPath}/tareas`);
	return app.vault.create(`${funcPath}/${slug}.md`, tpl.funcionalidad(nombre, hoy()));
}

export async function createTarea(
	app: App,
	func: FuncRef,
	slug: string,
	nombre: string
): Promise<TFile> {
	// Cada tarea crea su propia carpeta; subtareas/ no se crea hasta la primera sub-tarea.
	await ensureFolder(app, `${func.folder.path}/tareas`);
	const dirTarea = normalizePath(`${func.folder.path}/tareas/${slug}`);
	await app.vault.createFolder(dirTarea);
	const file = await app.vault.create(
		`${dirTarea}/${slug}.md`,
		tpl.tarea(nombre, func.slug, hoy())
	);
	await appendToSection(app, func.file, "## Tareas", `- [ ] [[${slug}|${nombre}]]`);
	return file;
}

export async function createSubTarea(
	app: App,
	func: FuncRef,
	tarea: TareaRef,
	slug: string,
	nombre: string
): Promise<TFile> {
	const dir = `${tarea.folder.path}/subtareas`;
	await ensureFolder(app, dir);
	const file = await app.vault.create(
		normalizePath(`${dir}/${slug}.md`),
		tpl.subTarea(nombre, tarea.slug, func.slug, hoy())
	);
	await appendToSection(app, tarea.file, "## Sub-tareas", `- [ ] [[${slug}|${nombre}]]`);
	return file;
}

/** Insumos e historias: como los apuntes, pero sin fecha en el nombre del archivo. */
export async function createInsumo(
	app: App,
	func: FuncRef,
	slug: string,
	nombre: string
): Promise<TFile> {
	const dir = `${func.folder.path}/insumos`;
	await ensureFolder(app, dir);
	const file = await app.vault.create(
		normalizePath(`${dir}/${slug}.md`),
		tpl.insumo(nombre, func.slug, hoy())
	);
	await appendToSection(app, func.file, "## Insumos", `- [[${slug}|${nombre}]]`);
	return file;
}

export async function createHistoria(
	app: App,
	func: FuncRef,
	slug: string,
	nombre: string
): Promise<TFile> {
	const dir = `${func.folder.path}/historias`;
	await ensureFolder(app, dir);
	const file = await app.vault.create(
		normalizePath(`${dir}/${slug}.md`),
		tpl.historia(nombre, func.slug, hoy())
	);
	await appendToSection(app, func.file, "## Historias", `- [[${slug}|${nombre}]]`);
	return file;
}

export interface SprintAsignado {
	anio: number;
	sprint: number;
	etiquetas: string[];
}

export function archivoSprints(app: App, func: FuncRef): TFile | null {
	const f = app.vault.getAbstractFileByPath(normalizePath(`${func.folder.path}/sprints.md`));
	return f instanceof TFile ? f : null;
}

/** Lee las asignaciones de sprints.md (el frontmatter YAML es la fuente de verdad). */
export async function leerSprints(app: App, func: FuncRef): Promise<SprintAsignado[]> {
	const file = archivoSprints(app, func);
	if (!file) return [];
	const contenido = await app.vault.cachedRead(file);
	const m = contenido.match(/^---\n([\s\S]*?)\n---/);
	if (!m) return [];
	let fm: unknown;
	try {
		fm = parseYaml(m[1]);
	} catch {
		return [];
	}
	const lista = (fm as { sprints?: unknown } | null)?.sprints;
	if (!Array.isArray(lista)) return [];
	const out: SprintAsignado[] = [];
	for (const entrada of lista) {
		if (!entrada || typeof entrada !== "object") continue;
		const reg = entrada as Record<string, unknown>;
		const anio = Number(reg["año"] ?? reg["anio"]);
		const sprint = Number(reg["sprint"]);
		const etiquetas = Array.isArray(reg["etiquetas"])
			? (reg["etiquetas"] as unknown[]).map(String)
			: [];
		if (Number.isFinite(anio) && anio > 0 && sprint >= 1 && sprint <= 52) {
			out.push({ anio, sprint, etiquetas });
		}
	}
	return out;
}

/** Regenera sprints.md completo (frontmatter + tabla legible por año). */
export async function guardarSprints(
	app: App,
	func: FuncRef,
	sprints: SprintAsignado[]
): Promise<TFile> {
	const orden = [...sprints].sort((a, b) => a.anio - b.anio || a.sprint - b.sprint);
	const lineas: string[] = ["---", "tipo: sprints", `epica: "[[${func.slug}]]"`];
	if (orden.length === 0) {
		lineas.push("sprints: []");
	} else {
		lineas.push("sprints:");
		for (const s of orden) {
			lineas.push(`  - año: ${s.anio}`);
			lineas.push(`    sprint: ${s.sprint}`);
			lineas.push(
				`    etiquetas: [${s.etiquetas.map((e) => `"${escapeYaml(e)}"`).join(", ")}]`
			);
		}
	}
	lineas.push("---", "", `# Sprints — ${func.nombre}`, "");
	if (orden.length === 0) {
		lineas.push("| Sprint | Etiquetas |", "|---|---|", "");
	} else {
		for (const anio of [...new Set(orden.map((s) => s.anio))]) {
			lineas.push(`## ${anio}`, "", "| Sprint | Etiquetas |", "|---|---|");
			for (const s of orden.filter((x) => x.anio === anio)) {
				lineas.push(`| Sprint ${s.sprint} | ${s.etiquetas.join(", ")} |`);
			}
			lineas.push("");
		}
	}
	const contenido = lineas.join("\n");
	const existente = archivoSprints(app, func);
	if (existente) {
		await app.vault.modify(existente, contenido);
		return existente;
	}
	return app.vault.create(normalizePath(`${func.folder.path}/sprints.md`), contenido);
}

export async function createPendiente(
	app: App,
	func: FuncRef,
	base: string,
	nombre: string,
	fecha: string
): Promise<TFile> {
	// Cada pendiente crea su propia carpeta (como las tareas); subpendientes/
	// no se crea hasta el primer sub-pendiente.
	await ensureFolder(app, `${func.folder.path}/pendientes`);
	const dirPend = normalizePath(`${func.folder.path}/pendientes/${base}`);
	await app.vault.createFolder(dirPend);
	const file = await app.vault.create(
		`${dirPend}/${base}.md`,
		tpl.pendiente(nombre, func.slug, fecha)
	);
	// appendToSection crea la sección ## Pendientes si la nota principal no la tiene.
	await appendToSection(app, func.file, "## Pendientes", `- [ ] [[${base}|${nombre}]] — ${fecha}`);
	return file;
}

export async function createSubPendiente(
	app: App,
	func: FuncRef,
	pendiente: PendienteRef,
	slug: string,
	nombre: string
): Promise<TFile> {
	let carpeta = pendiente.folder;
	if (!carpeta) {
		// Pendiente en formato plano (versiones anteriores): se convierte en
		// carpeta y la nota se mueve adentro. renameFile actualiza wikilinks.
		const dirPath = normalizePath(`${func.folder.path}/pendientes/${pendiente.slug}`);
		await app.vault.createFolder(dirPath);
		await app.fileManager.renameFile(
			pendiente.file,
			normalizePath(`${dirPath}/${pendiente.slug}.md`)
		);
		const f = app.vault.getAbstractFileByPath(dirPath);
		if (!(f instanceof TFolder)) throw new Error("No se pudo convertir el pendiente en carpeta.");
		carpeta = f;
	}
	const dir = `${carpeta.path}/subpendientes`;
	await ensureFolder(app, dir);
	const file = await app.vault.create(
		normalizePath(`${dir}/${slug}.md`),
		tpl.subPendiente(nombre, pendiente.slug, func.slug, hoy())
	);
	await appendToSection(app, pendiente.file, "## Sub-pendientes", `- [ ] [[${slug}|${nombre}]]`);
	return file;
}

export async function createApunte(
	app: App,
	func: FuncRef,
	base: string,
	nombre: string,
	fecha: string
): Promise<TFile> {
	const dir = `${func.folder.path}/apuntes`;
	await ensureFolder(app, dir);
	const file = await app.vault.create(
		normalizePath(`${dir}/${base}.md`),
		tpl.apunte(nombre, func.slug, fecha)
	);
	await appendToSection(app, func.file, "## Apuntes", `- [[${base}|${nombre}]] — ${fecha}`);
	return file;
}

export async function createReunion(
	app: App,
	func: FuncRef,
	base: string,
	nombre: string,
	fecha: string
): Promise<TFile> {
	const dir = `${func.folder.path}/reuniones`;
	await ensureFolder(app, dir);
	const file = await app.vault.create(
		normalizePath(`${dir}/${base}.md`),
		tpl.reunion(nombre, func.slug, fecha)
	);
	await appendToSection(app, func.file, "## Notas de reunión", `- [[${base}|${nombre}]] — ${fecha}`);
	return file;
}
