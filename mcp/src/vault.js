// Operaciones de sistema de archivos sobre uno o varios vaults de Obsidian.
// Replica las convenciones de carpetas/frontmatter del plugin (src/files.ts).
//
// AISLAMIENTO ENTRE VAULTS: cada operación recibe el nombre de un vault, que se
// resuelve a una ruta absoluta única. El servidor nunca cruza información entre
// vaults distintos.

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import matter from "gray-matter";

import { slugify, hoy } from "./slug.js";
import * as tpl from "./templates.js";

// Carpetas raíz del plugin, fijas en la raíz del vault.
const CARPETA_ACTIVAS = "Épicas activas";
const CARPETA_INACTIVAS = "Épicas inactivas";

// ---------------------------------------------------------------------------
// Configuración de vaults
// ---------------------------------------------------------------------------

function rutaConfigPorDefecto() {
	return path.join(os.homedir(), ".gestor-funciones-mcp", "vaults.json");
}

/**
 * Devuelve la lista de vaults configurados: [{ nombre, ruta }].
 * Fuentes (en orden de prioridad):
 *   1. Variable de entorno GESTOR_VAULTS con un JSON: [{"nombre":"x","ruta":"/..."}]
 *   2. Archivo apuntado por GESTOR_VAULTS_CONFIG
 *   3. Archivo ~/.gestor-funciones-mcp/vaults.json
 */
export async function cargarVaults() {
	let crudo;

	if (process.env.GESTOR_VAULTS) {
		crudo = process.env.GESTOR_VAULTS;
	} else {
		const ruta = process.env.GESTOR_VAULTS_CONFIG || rutaConfigPorDefecto();
		try {
			crudo = await fs.readFile(ruta, "utf8");
		} catch {
			throw new Error(
				`No encuentro la configuración de vaults. Crea el archivo "${ruta}" con el ` +
					`formato:\n{\n  "vaults": [\n    { "nombre": "trabajo", "ruta": "/ruta/a/tu/Vault" }\n  ]\n}`
			);
		}
	}

	let datos;
	try {
		datos = JSON.parse(crudo);
	} catch {
		throw new Error("La configuración de vaults no es un JSON válido.");
	}

	const lista = Array.isArray(datos) ? datos : datos.vaults;
	if (!Array.isArray(lista) || lista.length === 0) {
		throw new Error('La configuración debe contener una lista "vaults" con al menos un vault.');
	}

	return lista.map((v) => {
		if (!v || !v.nombre || !v.ruta) {
			throw new Error('Cada vault debe tener "nombre" y "ruta".');
		}
		return { nombre: String(v.nombre), ruta: path.resolve(String(v.ruta).replace(/^~/, os.homedir())) };
	});
}

/**
 * Resuelve el vault a usar. Si hay uno solo, `nombre` es opcional. Con varios,
 * `nombre` es obligatorio para evitar mezclar información.
 */
export async function resolverVault(nombre) {
	const vaults = await cargarVaults();
	if (!nombre) {
		if (vaults.length === 1) return vaults[0];
		const nombres = vaults.map((v) => `"${v.nombre}"`).join(", ");
		throw new Error(
			`Hay varios vaults configurados (${nombres}). Indica cuál usar en el parámetro "vault".`
		);
	}
	const encontrado = vaults.find((v) => v.nombre.toLowerCase() === String(nombre).toLowerCase());
	if (!encontrado) {
		const nombres = vaults.map((v) => `"${v.nombre}"`).join(", ");
		throw new Error(`No existe el vault "${nombre}". Vaults configurados: ${nombres}.`);
	}
	// Verifica que la carpeta exista realmente.
	if (!(await esDir(encontrado.ruta))) {
		throw new Error(`La ruta del vault "${encontrado.nombre}" no existe: ${encontrado.ruta}`);
	}
	return encontrado;
}

// ---------------------------------------------------------------------------
// Helpers de sistema de archivos
// ---------------------------------------------------------------------------

async function esDir(p) {
	try {
		return (await fs.stat(p)).isDirectory();
	} catch {
		return false;
	}
}

async function esArchivo(p) {
	try {
		return (await fs.stat(p)).isFile();
	} catch {
		return false;
	}
}

async function subcarpetas(dir) {
	if (!(await esDir(dir))) return [];
	const entradas = await fs.readdir(dir, { withFileTypes: true });
	return entradas.filter((e) => e.isDirectory()).map((e) => e.name);
}

async function archivosMd(dir) {
	if (!(await esDir(dir))) return [];
	const entradas = await fs.readdir(dir, { withFileTypes: true });
	return entradas.filter((e) => e.isFile() && e.name.endsWith(".md")).map((e) => e.name);
}

/** Lee un .md y devuelve { data: frontmatter, content: cuerpo }. */
async function leerMd(rutaAbs) {
	const crudo = await fs.readFile(rutaAbs, "utf8");
	const parsed = matter(crudo);
	return { data: parsed.data || {}, content: parsed.content || "" };
}

/** El parser YAML convierte fechas sin comillas en objetos Date; las normaliza
 *  de vuelta a "YYYY-MM-DD" (en UTC, como las escribe el plugin). */
function fechaTexto(valor) {
	if (valor instanceof Date) return valor.toISOString().slice(0, 10);
	return valor != null ? String(valor) : undefined;
}

function rutaRelativa(vault, rutaAbs) {
	return path.relative(vault.ruta, rutaAbs);
}

// ---------------------------------------------------------------------------
// Raíces de épicas (lee data.json del plugin para respetar configuración)
// ---------------------------------------------------------------------------

async function rootsEpicas(vault) {
	let activas = CARPETA_ACTIVAS;
	try {
		const dataJson = path.join(
			vault.ruta,
			".obsidian",
			"plugins",
			"gestor-funciones",
			"data.json"
		);
		const cfg = JSON.parse(await fs.readFile(dataJson, "utf8"));
		if (cfg.carpetaAdmin) activas = String(cfg.carpetaAdmin);
	} catch {
		// Sin data.json usamos la carpeta por defecto.
	}
	return [
		{ nombre: activas, estado: "activa", abs: path.join(vault.ruta, activas) },
		{ nombre: CARPETA_INACTIVAS, estado: "inactiva", abs: path.join(vault.ruta, CARPETA_INACTIVAS) },
	];
}

/** Carpeta principal de una épica: <root>/<slug>/<slug>.md debe existir. */
async function epicaDesdeCarpeta(carpetaAbs, slug, estado) {
	const mainAbs = path.join(carpetaAbs, `${slug}.md`);
	if (!(await esArchivo(mainAbs))) return null;
	let nombre = slug;
	let estadoFm;
	try {
		const { data } = await leerMd(mainAbs);
		if (data.nombre) nombre = String(data.nombre);
		if (data.estado) estadoFm = String(data.estado);
	} catch {
		// frontmatter ilegible: usamos el slug.
	}
	return { slug, nombre, estado, estadoFrontmatter: estadoFm, folder: carpetaAbs, file: mainAbs };
}

// ---------------------------------------------------------------------------
// Lectura
// ---------------------------------------------------------------------------

export async function listarEpicas(vault) {
	const out = [];
	for (const root of await rootsEpicas(vault)) {
		for (const slug of await subcarpetas(root.abs)) {
			const e = await epicaDesdeCarpeta(path.join(root.abs, slug), slug, root.estado);
			if (e) out.push(e);
		}
	}
	return out.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

/** Resuelve una épica por slug o por nombre (sin distinguir mayúsculas). */
export async function resolverEpica(vault, ref) {
	const epicas = await listarEpicas(vault);
	const slugRef = slugify(ref);
	const encontrada = epicas.find(
		(e) => e.slug === slugRef || e.nombre.toLowerCase() === String(ref).toLowerCase()
	);
	if (!encontrada) {
		const nombres = epicas.map((e) => `"${e.nombre}"`).join(", ") || "(ninguna)";
		throw new Error(`No encontré la épica "${ref}" en el vault "${vault.nombre}". Épicas: ${nombres}.`);
	}
	return encontrada;
}

/** Tareas de una épica (cada tarea es un archivo .md). */
async function listarTareas(epica) {
	const dir = path.join(epica.folder, "tareas");
	const out = [];
	for (const archivo of await archivosMd(dir)) {
		const main = path.join(dir, archivo);
		let slug = archivo.replace(/\.md$/, "");
		let nombre = slug;
		let estado;
		try {
			const { data } = await leerMd(main);
			if (data.nombre) nombre = String(data.nombre);
			if (data.estado) estado = String(data.estado);
		} catch {}
		out.push({ slug, nombre, estado, file: main });
	}
	return out.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

/** Pendientes de una épica. */
async function listarPendientesDe(epica) {
	const dir = path.join(epica.folder, "pendientes");
	const out = [];
	if (!(await esDir(dir))) return out;
	for (const archivo of await archivosMd(dir)) {
		const abs = path.join(dir, archivo);
		let slug = archivo.replace(/\.md$/, "");
		let nombre = slug;
		let estado;
		try {
			const { data } = await leerMd(abs);
			if (data.nombre) nombre = String(data.nombre);
			if (data.estado) estado = String(data.estado);
		} catch {}
		out.push({ slug, nombre, estado, file: abs });
	}
	return out.sort((a, b) => a.slug.localeCompare(b.slug, "es"));
}

/** Lista archivos .md sueltos de una subcarpeta (apuntes, reuniones, insumos, historias). */
async function listarColeccion(epica, carpeta) {
	const dir = path.join(epica.folder, carpeta);
	const out = [];
	for (const archivo of await archivosMd(dir)) {
		const abs = path.join(dir, archivo);
		let nombre = archivo.replace(/\.md$/, "");
		let fecha;
		try {
			const { data } = await leerMd(abs);
			if (data.nombre) nombre = String(data.nombre);
			if (data.fecha) fecha = fechaTexto(data.fecha);
		} catch {}
		out.push({ slug: archivo.replace(/\.md$/, ""), nombre, fecha, file: abs });
	}
	return out;
}

/** Estructura completa de una épica, lista para que Claude la resuma. */
export async function detalleEpica(vault, ref) {
	const epica = await resolverEpica(vault, ref);
	const [tareas, pendientes, apuntes, reuniones, insumos, historias] = await Promise.all([
		listarTareas(epica),
		listarPendientesDe(epica),
		listarColeccion(epica, "apuntes"),
		listarColeccion(epica, "reuniones"),
		listarColeccion(epica, "insumos"),
		listarColeccion(epica, "historias"),
	]);
	// Funcionalidades anidadas (épicas grandes con subcarpeta funcionalidades/).
	const funcionalidades = [];
	for (const slug of await subcarpetas(path.join(epica.folder, "funcionalidades"))) {
		const f = await epicaDesdeCarpeta(
			path.join(epica.folder, "funcionalidades", slug),
			slug,
			epica.estado
		);
		if (f) funcionalidades.push({ slug: f.slug, nombre: f.nombre, estado: f.estadoFrontmatter });
	}

	const limpiar = (lista) =>
		lista.map((x) => ({
			...x,
			file: rutaRelativa(vault, x.file),
			folder: x.folder ? rutaRelativa(vault, x.folder) : undefined,
		}));

	return {
		vault: vault.nombre,
		epica: {
			slug: epica.slug,
			nombre: epica.nombre,
			estado: epica.estado,
			ruta: rutaRelativa(vault, epica.file),
		},
		funcionalidades,
		tareas: limpiar(tareas),
		pendientes: limpiar(pendientes),
		apuntes: limpiar(apuntes),
		reuniones: limpiar(reuniones),
		insumos: limpiar(insumos),
		historias: limpiar(historias),
	};
}

/** Lee el contenido bruto de una nota por su ruta relativa al vault. */
export async function leerNota(vault, rutaRel) {
	const abs = path.resolve(vault.ruta, rutaRel);
	if (!abs.startsWith(vault.ruta)) throw new Error("Ruta fuera del vault.");
	if (!(await esArchivo(abs))) throw new Error(`No existe la nota: ${rutaRel}`);
	return fs.readFile(abs, "utf8");
}

/** Busca texto en nombres de archivo y contenido dentro de las carpetas de épicas. */
export async function buscar(vault, texto, limite = 30) {
	const q = String(texto).toLowerCase();
	const resultados = [];
	for (const root of await rootsEpicas(vault)) {
		await recorrer(root.abs, async (abs) => {
			if (!abs.endsWith(".md")) return;
			const rel = rutaRelativa(vault, abs);
			const contenido = (await fs.readFile(abs, "utf8")).toLowerCase();
			const enNombre = path.basename(abs).toLowerCase().includes(q);
			const idx = contenido.indexOf(q);
			if (enNombre || idx !== -1) {
				let extracto;
				if (idx !== -1) {
					const ini = Math.max(0, idx - 40);
					extracto = contenido.slice(ini, idx + q.length + 40).replace(/\s+/g, " ").trim();
				}
				resultados.push({ ruta: rel, extracto });
			}
		});
	}
	return resultados.slice(0, limite);
}

async function recorrer(dir, fn) {
	let entradas;
	try {
		entradas = await fs.readdir(dir, { withFileTypes: true });
	} catch {
		return;
	}
	for (const ent of entradas) {
		const abs = path.join(dir, ent.name);
		if (ent.isDirectory()) await recorrer(abs, fn);
		else await fn(abs);
	}
}

// ---------------------------------------------------------------------------
// Escritura
// ---------------------------------------------------------------------------

async function asegurarCarpeta(abs) {
	await fs.mkdir(abs, { recursive: true });
}

async function existeSlugEn(dir, slug) {
	return (await esArchivo(path.join(dir, `${slug}.md`))) || (await esDir(path.join(dir, slug)));
}

async function slugDisponible(dir, slug) {
	if (!(await existeSlugEn(dir, slug))) return slug;
	let n = 2;
	while (await existeSlugEn(dir, `${slug}-${n}`)) n++;
	return `${slug}-${n}`;
}

/** Inserta una línea al final de la sección `heading` (replica appendToSection del plugin). */
async function appendToSection(fileAbs, heading, linea) {
	const content = await fs.readFile(fileAbs, "utf8");
	const lines = content.split("\n");
	const idx = lines.findIndex((l) => l.trim() === heading);
	let nuevo;
	if (idx === -1) {
		nuevo = content.replace(/\s+$/, "") + `\n\n${heading}\n\n${linea}\n`;
	} else {
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
		nuevo = lines.join("\n");
	}
	await fs.writeFile(fileAbs, nuevo, "utf8");
}

export async function crearEpica(vault, nombre) {
	const [root] = await rootsEpicas(vault); // siempre en "activas"
	await asegurarCarpeta(root.abs);
	const slug = await slugDisponible(root.abs, slugify(nombre));
	const carpeta = path.join(root.abs, slug);
	await asegurarCarpeta(carpeta);
	// Sin subcarpetas por defecto: tareas/ se crea al crear la primera tarea.
	const fileAbs = path.join(carpeta, `${slug}.md`);
	await fs.writeFile(fileAbs, tpl.funcionalidad(nombre, hoy()), "utf8");
	return { slug, nombre, ruta: rutaRelativa(vault, fileAbs) };
}

export async function crearFuncionalidad(vault, epicaRef, nombre) {
	const epica = await resolverEpica(vault, epicaRef);
	const dir = path.join(epica.folder, "funcionalidades");
	await asegurarCarpeta(dir);
	const slug = await slugDisponible(dir, slugify(nombre));
	const carpeta = path.join(dir, slug);
	await asegurarCarpeta(carpeta);
	const fileAbs = path.join(carpeta, `${slug}.md`);
	await fs.writeFile(fileAbs, tpl.funcionalidadNueva(nombre, epica.slug, hoy()), "utf8");
	return { slug, nombre, ruta: rutaRelativa(vault, fileAbs) };
}

export async function crearTarea(vault, epicaRef, nombre) {
	const epica = await resolverEpica(vault, epicaRef);
	const dir = path.join(epica.folder, "tareas");
	await asegurarCarpeta(dir);
	const slug = await slugDisponible(dir, slugify(nombre));
	const fileAbs = path.join(dir, `${slug}.md`);
	await fs.writeFile(fileAbs, tpl.tarea(nombre, epica.slug, hoy()), "utf8");
	await appendToSection(epica.file, "## Tareas", `- [ ] [[${slug}|${nombre}]]`);
	return { slug, nombre, ruta: rutaRelativa(vault, fileAbs) };
}

export async function crearPendiente(vault, epicaRef, nombre) {
	const epica = await resolverEpica(vault, epicaRef);
	const dir = path.join(epica.folder, "pendientes");
	await asegurarCarpeta(dir);
	const fecha = hoy();
	const slug = await slugDisponible(dir, slugify(nombre));
	const fileAbs = path.join(dir, `${slug}.md`);
	await fs.writeFile(fileAbs, tpl.pendiente(nombre, epica.slug, fecha), "utf8");
	await appendToSection(epica.file, "## Pendientes", `- [ ] [[${slug}|${nombre}]] — ${fecha}`);
	return { slug, nombre, ruta: rutaRelativa(vault, fileAbs) };
}

export async function crearApunte(vault, epicaRef, nombre, texto) {
	const epica = await resolverEpica(vault, epicaRef);
	const dir = path.join(epica.folder, "apuntes");
	await asegurarCarpeta(dir);
	const fecha = hoy();
	const slug = await slugDisponible(dir, `${fecha}-${slugify(nombre)}`);
	const fileAbs = path.join(dir, `${slug}.md`);
	let contenido = tpl.apunte(nombre, epica.slug, fecha);
	if (texto) contenido = contenido.replace("<!-- Escribe tu apunte aquí -->", texto);
	await fs.writeFile(fileAbs, contenido, "utf8");
	await appendToSection(epica.file, "## Apuntes", `- [[${slug}|${nombre}]] — ${fecha}`);
	return { slug, nombre, ruta: rutaRelativa(vault, fileAbs) };
}

export async function crearReunion(vault, epicaRef, nombre) {
	const epica = await resolverEpica(vault, epicaRef);
	const dir = path.join(epica.folder, "reuniones");
	await asegurarCarpeta(dir);
	const fecha = hoy();
	const slug = await slugDisponible(dir, `${fecha}-${slugify(nombre)}`);
	const fileAbs = path.join(dir, `${slug}.md`);
	await fs.writeFile(fileAbs, tpl.reunion(nombre, epica.slug, fecha), "utf8");
	await appendToSection(epica.file, "## Notas de reunión", `- [[${slug}|${nombre}]] — ${fecha}`);
	return { slug, nombre, ruta: rutaRelativa(vault, fileAbs) };
}

export async function crearInsumo(vault, epicaRef, nombre) {
	const epica = await resolverEpica(vault, epicaRef);
	const dir = path.join(epica.folder, "insumos");
	await asegurarCarpeta(dir);
	const slug = await slugDisponible(dir, slugify(nombre));
	const fileAbs = path.join(dir, `${slug}.md`);
	await fs.writeFile(fileAbs, tpl.insumo(nombre, epica.slug, hoy()), "utf8");
	await appendToSection(epica.file, "## Insumos", `- [[${slug}|${nombre}]]`);
	return { slug, nombre, ruta: rutaRelativa(vault, fileAbs) };
}

export async function crearHistoria(vault, epicaRef, nombre) {
	const epica = await resolverEpica(vault, epicaRef);
	const dir = path.join(epica.folder, "historias");
	await asegurarCarpeta(dir);
	const slug = await slugDisponible(dir, slugify(nombre));
	const fileAbs = path.join(dir, `${slug}.md`);
	await fs.writeFile(fileAbs, tpl.historia(nombre, epica.slug, hoy()), "utf8");
	await appendToSection(epica.file, "## Historias", `- [[${slug}|${nombre}]]`);
	return { slug, nombre, ruta: rutaRelativa(vault, fileAbs) };
}

/** Cambia el valor de `estado` en el frontmatter de una nota (tarea/pendiente/etc.). */
export async function cambiarEstado(vault, rutaRel, nuevoEstado) {
	const abs = path.resolve(vault.ruta, rutaRel);
	if (!abs.startsWith(vault.ruta)) throw new Error("Ruta fuera del vault.");
	if (!(await esArchivo(abs))) throw new Error(`No existe la nota: ${rutaRel}`);
	const contenido = await fs.readFile(abs, "utf8");
	const m = contenido.match(/^---\n([\s\S]*?)\n---/);
	if (!m) throw new Error("La nota no tiene frontmatter; no se puede cambiar el estado.");
	let bloque = m[1];
	if (/^estado:.*$/m.test(bloque)) {
		bloque = bloque.replace(/^estado:.*$/m, `estado: ${nuevoEstado}`);
	} else {
		bloque = bloque + `\nestado: ${nuevoEstado}`;
	}
	const nuevo = contenido.replace(m[0], `---\n${bloque}\n---`);
	await fs.writeFile(abs, nuevo, "utf8");
	return { ruta: rutaRel, estado: nuevoEstado };
}

// ---------------------------------------------------------------------------
// Configuración del plugin (data.json): etiquetas de sprint
// ---------------------------------------------------------------------------

const COLOR_ETIQUETA_DEFECTO = "#5082ff"; // mismo valor que el plugin

function rutaDataJson(vault) {
	return path.join(vault.ruta, ".obsidian", "plugins", "gestor-funciones", "data.json");
}

/** Lee data.json del plugin. Devuelve {} si aún no existe. */
async function leerData(vault) {
	try {
		return JSON.parse(await fs.readFile(rutaDataJson(vault), "utf8"));
	} catch {
		return {};
	}
}

async function guardarData(vault, data) {
	const ruta = rutaDataJson(vault);
	await fs.mkdir(path.dirname(ruta), { recursive: true });
	await fs.writeFile(ruta, JSON.stringify(data, null, 2), "utf8");
}

/** Lista las etiquetas de sprint configuradas en el plugin. */
export async function listarEtiquetas(vault) {
	const data = await leerData(vault);
	return Array.isArray(data.etiquetas) ? data.etiquetas : [];
}

/**
 * Agrega una etiqueta de sprint a la configuración del plugin.
 * `color` es opcional (hex #rrggbb); usa el color por defecto si no se indica.
 */
export async function agregarEtiqueta(vault, nombre, color) {
	const limpio = String(nombre).trim();
	if (!limpio) throw new Error("El nombre de la etiqueta no puede estar vacío.");
	const data = await leerData(vault);
	if (!Array.isArray(data.etiquetas)) data.etiquetas = [];
	if (data.etiquetas.some((e) => String(e.nombre).toLowerCase() === limpio.toLowerCase())) {
		throw new Error(`Ya existe una etiqueta de sprint llamada "${limpio}".`);
	}
	const etiqueta = { nombre: limpio, color: color || COLOR_ETIQUETA_DEFECTO };
	data.etiquetas.push(etiqueta);
	await guardarData(vault, data);
	return etiqueta;
}

/** Elimina una etiqueta de sprint por nombre (sin distinguir mayúsculas). */
export async function eliminarEtiqueta(vault, nombre) {
	const data = await leerData(vault);
	const antes = Array.isArray(data.etiquetas) ? data.etiquetas.length : 0;
	data.etiquetas = (data.etiquetas || []).filter(
		(e) => String(e.nombre).toLowerCase() !== String(nombre).toLowerCase()
	);
	if (data.etiquetas.length === antes) {
		throw new Error(`No encontré una etiqueta de sprint llamada "${nombre}".`);
	}
	await guardarData(vault, data);
	return { eliminada: nombre };
}
