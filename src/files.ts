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
}

export interface PendienteRef {
	slug: string;
	nombre: string;
	file: TFile;
}

export interface Incidencia {
	tipo: "tarea" | "pendiente";
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
	for (const child of dir.children) {
		if (child instanceof TFile && child.extension === "md") {
			out.push({
				slug: child.basename,
				nombre: nombreDesdeFrontmatter(app, child, child.basename),
				file: child,
			});
		}
	}
	return out.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

/** Pendientes: archivo plano en formato actual. */
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
			});
		}
	}
	return out.sort((a, b) => a.slug.localeCompare(b.slug, "es"));
}

/** Todas las incidencias de una épica: tareas y pendientes. */
export function listIncidencias(app: App, func: FuncRef): Incidencia[] {
	const out: Incidencia[] = [];
	for (const t of listTareas(app, func.folder)) {
		out.push({ tipo: "tarea", file: t.file, nombre: t.nombre, nivel: 0 });
	}
	for (const p of listPendientes(app, func.folder)) {
		out.push({ tipo: "pendiente", file: p.file, nombre: p.nombre, nivel: 0 });
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
	// Ninguna subcarpeta existe por defecto: tareas/, apuntes/, reuniones/,
	// pendientes/, insumos/ e historias/ se crean al crear su primer elemento.
	return app.vault.create(`${funcPath}/${slug}.md`, tpl.funcionalidad(nombre, hoy()));
}

export async function createTarea(
	app: App,
	func: FuncRef,
	slug: string,
	nombre: string
): Promise<TFile> {
	await ensureFolder(app, `${func.folder.path}/tareas`);
	const dirTarea = normalizePath(`${func.folder.path}/tareas`);
	const file = await app.vault.create(
		`${dirTarea}/${slug}.md`,
		tpl.tarea(nombre, func.slug, hoy())
	);
	await appendToSection(app, func.file, "## Tareas", `- [ ] [[${slug}|${nombre}]]`);
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
	await ensureFolder(app, `${func.folder.path}/pendientes`);
	const dirPend = normalizePath(`${func.folder.path}/pendientes`);
	const file = await app.vault.create(
		`${dirPend}/${base}.md`,
		tpl.pendiente(nombre, func.slug, fecha)
	);
	// appendToSection crea la sección ## Pendientes si la nota principal no la tiene.
	await appendToSection(app, func.file, "## Pendientes", `- [ ] [[${base}|${nombre}]] — ${fecha}`);
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
