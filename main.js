var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => GestorFuncionesPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian9 = require("obsidian");

// src/settings.ts
var import_obsidian2 = require("obsidian");

// src/files.ts
var import_obsidian = require("obsidian");

// src/utils.ts
function slugify(input) {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function hoy() {
  const d = /* @__PURE__ */ new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}
function escapeYaml(valor) {
  return valor.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

// src/templates.ts
function funcionalidad(nombre, fecha) {
  return `---
tipo: epica
nombre: "${escapeYaml(nombre)}"
fecha-creacion: ${fecha}
---

${cuerpoSecciones(nombre)}`;
}
function funcionalidadNueva(nombre, epicaSlug, fecha) {
  return `---
tipo: funcionalidad
epica: "[[${epicaSlug}]]"
nombre: "${escapeYaml(nombre)}"
estado: backlog
fecha-creacion: ${fecha}
---

${cuerpoSecciones(nombre)}`;
}
function cuerpoSecciones(nombre) {
  return `# ${nombre}

## Descripci\xF3n
<!-- Escribe aqu\xED la descripci\xF3n de la funcionalidad -->

## Links relacionados
<!-- Pega aqu\xED los links del proyecto, tickets, documentos, etc. -->

## Tareas
<!-- Las tareas aparecen aqu\xED autom\xE1ticamente cuando las creas desde el plugin -->

## Apuntes
<!-- Los apuntes aparecen aqu\xED autom\xE1ticamente cuando los creas desde el plugin -->

## Notas de reuni\xF3n
<!-- Las notas de reuni\xF3n aparecen aqu\xED autom\xE1ticamente cuando las creas desde el plugin -->

## Pendientes
<!-- Los pendientes aparecen aqu\xED autom\xE1ticamente cuando los creas desde el plugin -->

## Insumos
<!-- Los insumos aparecen aqu\xED autom\xE1ticamente cuando los creas desde el plugin -->

## Historias
<!-- Las historias aparecen aqu\xED autom\xE1ticamente cuando las creas desde el plugin -->
`;
}
function insumo(nombre, funcSlug, fecha) {
  return `---
tipo: insumo
epica: "[[${funcSlug}]]"
nombre: "${escapeYaml(nombre)}"
fecha: ${fecha}
---

# ${nombre}

<!-- Escribe el insumo aqu\xED -->
`;
}
function historia(nombre, funcSlug, fecha) {
  return `---
tipo: historia
epica: "[[${funcSlug}]]"
nombre: "${escapeYaml(nombre)}"
fecha: ${fecha}
---

# ${nombre}

<!-- Escribe la historia aqu\xED -->
`;
}
function tarea(nombre, funcSlug, fecha) {
  return `---
tipo: tarea
funcionalidad: "[[${funcSlug}]]"
nombre: "${escapeYaml(nombre)}"
estado: pendiente
fecha-creacion: ${fecha}
---

# ${nombre}

## Descripci\xF3n
<!-- Escribe aqu\xED los detalles de la tarea -->

## Notas
<!-- Apuntes relacionados a esta tarea -->
`;
}
function apunte(nombre, funcSlug, fecha) {
  return `---
tipo: apunte
funcionalidad: "[[${funcSlug}]]"
nombre: "${escapeYaml(nombre)}"
fecha: ${fecha}
---

# ${nombre}

<!-- Escribe tu apunte aqu\xED -->
`;
}
function pendiente(nombre, funcSlug, fecha) {
  return `---
tipo: pendiente
funcionalidad: "[[${funcSlug}]]"
nombre: "${escapeYaml(nombre)}"
estado: pendiente
fecha: ${fecha}
---

# ${nombre}

**Fecha:** ${fecha}
**Funcionalidad relacionada:** [[${funcSlug}]]

## Descripci\xF3n
<!-- Describe el pendiente -->

## Criterio de completado
<!-- \xBFCu\xE1ndo se considera resuelto este pendiente? -->
`;
}
function reunion(nombre, funcSlug, fecha) {
  return `---
tipo: nota-reunion
funcionalidad: "[[${funcSlug}]]"
nombre: "${escapeYaml(nombre)}"
fecha: ${fecha}
---

# ${nombre}

**Fecha:** ${fecha}
**Funcionalidad relacionada:** [[${funcSlug}]]

## Asistentes
<!-- Lista los asistentes de la reuni\xF3n -->

## Temas tratados
<!-- Resume los temas principales discutidos -->

## Acuerdos y decisiones
<!-- Documenta los acuerdos a los que se lleg\xF3 -->

## Pr\xF3ximos pasos
<!-- Tareas o acciones derivadas de la reuni\xF3n -->
`;
}

// src/files.ts
var YaExisteError = class extends Error {
};
var CARPETA_ACTIVAS = "\xC9picas activas";
var CARPETA_INACTIVAS = "\xC9picas inactivas";
function carpetasGestionListas(app) {
  return app.vault.getAbstractFileByPath((0, import_obsidian.normalizePath)(CARPETA_ACTIVAS)) instanceof import_obsidian.TFolder && app.vault.getAbstractFileByPath((0, import_obsidian.normalizePath)(CARPETA_INACTIVAS)) instanceof import_obsidian.TFolder;
}
async function crearCarpetasGestion(app) {
  await ensureFolder(app, CARPETA_ACTIVAS);
  await ensureFolder(app, CARPETA_INACTIVAS);
}
function claveRelativa(adminPath, path) {
  const prefijo = (0, import_obsidian.normalizePath)(adminPath) + "/";
  const sinMd = path.endsWith(".md") ? path.slice(0, -3) : path;
  return sinMd.startsWith(prefijo) ? sinMd.slice(prefijo.length) : sinMd;
}
async function ensureFolder(app, path) {
  const norm = (0, import_obsidian.normalizePath)(path);
  const existente = app.vault.getAbstractFileByPath(norm);
  if (existente instanceof import_obsidian.TFolder)
    return existente;
  if (existente)
    throw new Error(`"${norm}" existe pero no es una carpeta.`);
  await app.vault.createFolder(norm);
  const creada = app.vault.getAbstractFileByPath(norm);
  if (!(creada instanceof import_obsidian.TFolder))
    throw new Error(`No se pudo crear la carpeta "${norm}".`);
  return creada;
}
function nombreDesdeFrontmatter(app, file, fallback) {
  var _a, _b;
  const nombre = (_b = (_a = app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter) == null ? void 0 : _b.nombre;
  return nombre ? String(nombre) : fallback;
}
function listFuncionalidades(app, adminPath) {
  var _a;
  const root = app.vault.getAbstractFileByPath((0, import_obsidian.normalizePath)(adminPath));
  if (!(root instanceof import_obsidian.TFolder))
    return [];
  const out = [];
  for (const child of root.children) {
    if (!(child instanceof import_obsidian.TFolder))
      continue;
    const main = child.children.find(
      (c) => c instanceof import_obsidian.TFile && c.extension === "md" && c.basename === child.name
    );
    if (!main)
      continue;
    const fm = (_a = app.metadataCache.getFileCache(main)) == null ? void 0 : _a.frontmatter;
    out.push({
      slug: child.name,
      nombre: (fm == null ? void 0 : fm.nombre) ? String(fm.nombre) : child.name,
      file: main,
      folder: child,
      estado: (fm == null ? void 0 : fm.estado) ? String(fm.estado) : void 0
    });
  }
  return out.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
function listFuncionalidadesDe(app, epicaFolder) {
  var _a;
  const dir = epicaFolder.children.find(
    (c) => c instanceof import_obsidian.TFolder && c.name === "funcionalidades"
  );
  if (!dir)
    return [];
  const out = [];
  for (const child of dir.children) {
    if (!(child instanceof import_obsidian.TFolder))
      continue;
    const main = child.children.find(
      (c) => c instanceof import_obsidian.TFile && c.extension === "md" && c.basename === child.name
    );
    if (!main)
      continue;
    const fm = (_a = app.metadataCache.getFileCache(main)) == null ? void 0 : _a.frontmatter;
    out.push({
      slug: child.name,
      nombre: (fm == null ? void 0 : fm.nombre) ? String(fm.nombre) : child.name,
      file: main,
      folder: child,
      estado: (fm == null ? void 0 : fm.estado) ? String(fm.estado) : void 0
    });
  }
  return out.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
async function createFuncionalidadEn(app, epica, nombre) {
  const slug = slugify(nombre);
  await ensureFolder(app, `${epica.folder.path}/funcionalidades`);
  const fnPath = (0, import_obsidian.normalizePath)(`${epica.folder.path}/funcionalidades/${slug}`);
  if (app.vault.getAbstractFileByPath(fnPath))
    throw new YaExisteError();
  await app.vault.createFolder(fnPath);
  return app.vault.create(
    `${fnPath}/${slug}.md`,
    funcionalidadNueva(nombre, epica.slug, hoy())
  );
}
function listTareas(app, funcFolder) {
  const dir = funcFolder.children.find(
    (c) => c instanceof import_obsidian.TFolder && c.name === "tareas"
  );
  if (!dir)
    return [];
  const out = [];
  for (const child of dir.children) {
    if (child instanceof import_obsidian.TFile && child.extension === "md") {
      out.push({
        slug: child.basename,
        nombre: nombreDesdeFrontmatter(app, child, child.basename),
        file: child
      });
    }
  }
  return out.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
function listPendientes(app, funcFolder) {
  const dir = funcFolder.children.find(
    (c) => c instanceof import_obsidian.TFolder && c.name === "pendientes"
  );
  if (!dir)
    return [];
  const out = [];
  for (const child of dir.children) {
    if (child instanceof import_obsidian.TFile && child.extension === "md") {
      out.push({
        slug: child.basename,
        nombre: nombreDesdeFrontmatter(app, child, child.basename),
        file: child
      });
    }
  }
  return out.sort((a, b) => a.slug.localeCompare(b.slug, "es"));
}
function listIncidencias(app, func) {
  const out = [];
  for (const t of listTareas(app, func.folder)) {
    out.push({ tipo: "tarea", file: t.file, nombre: t.nombre, nivel: 0 });
  }
  for (const p of listPendientes(app, func.folder)) {
    out.push({ tipo: "pendiente", file: p.file, nombre: p.nombre, nivel: 0 });
  }
  return out;
}
function getAsignados(app, file) {
  var _a, _b;
  const valor = (_b = (_a = app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter) == null ? void 0 : _b.asignados;
  return Array.isArray(valor) ? valor.map(String) : [];
}
function existeEnDir(app, dir, slug) {
  return !!app.vault.getAbstractFileByPath((0, import_obsidian.normalizePath)(`${dir}/${slug}.md`)) || !!app.vault.getAbstractFileByPath((0, import_obsidian.normalizePath)(`${dir}/${slug}`));
}
function slugDisponible(app, dir, slug) {
  if (!existeEnDir(app, dir, slug))
    return slug;
  let n = 2;
  while (existeEnDir(app, dir, `${slug}-${n}`))
    n++;
  return `${slug}-${n}`;
}
async function appendToSection(app, file, heading, linea) {
  await app.vault.process(file, (content) => {
    const lines = content.split("\n");
    const idx = lines.findIndex((l) => l.trim() === heading);
    if (idx === -1) {
      return content.trimEnd() + `

${heading}

${linea}
`;
    }
    let fin = lines.length;
    for (let i = idx + 1; i < lines.length; i++) {
      if (/^#{1,6}\s/.test(lines[i])) {
        fin = i;
        break;
      }
    }
    let insertarEn = fin;
    while (insertarEn > idx + 1 && lines[insertarEn - 1].trim() === "")
      insertarEn--;
    lines.splice(insertarEn, 0, linea);
    return lines.join("\n");
  });
}
async function createFuncionalidad(app, adminPath, nombre) {
  const slug = slugify(nombre);
  await ensureFolder(app, adminPath);
  const funcPath = (0, import_obsidian.normalizePath)(`${adminPath}/${slug}`);
  if (app.vault.getAbstractFileByPath(funcPath))
    throw new YaExisteError();
  await app.vault.createFolder(funcPath);
  return app.vault.create(`${funcPath}/${slug}.md`, funcionalidad(nombre, hoy()));
}
async function createTarea(app, func, slug, nombre) {
  await ensureFolder(app, `${func.folder.path}/tareas`);
  const dirTarea = (0, import_obsidian.normalizePath)(`${func.folder.path}/tareas`);
  const file = await app.vault.create(
    `${dirTarea}/${slug}.md`,
    tarea(nombre, func.slug, hoy())
  );
  await appendToSection(app, func.file, "## Tareas", `- [ ] [[${slug}|${nombre}]]`);
  return file;
}
async function createInsumo(app, func, slug, nombre) {
  const dir = `${func.folder.path}/insumos`;
  await ensureFolder(app, dir);
  const file = await app.vault.create(
    (0, import_obsidian.normalizePath)(`${dir}/${slug}.md`),
    insumo(nombre, func.slug, hoy())
  );
  await appendToSection(app, func.file, "## Insumos", `- [[${slug}|${nombre}]]`);
  return file;
}
async function createHistoria(app, func, slug, nombre) {
  const dir = `${func.folder.path}/historias`;
  await ensureFolder(app, dir);
  const file = await app.vault.create(
    (0, import_obsidian.normalizePath)(`${dir}/${slug}.md`),
    historia(nombre, func.slug, hoy())
  );
  await appendToSection(app, func.file, "## Historias", `- [[${slug}|${nombre}]]`);
  return file;
}
function archivoSprints(app, func) {
  const f = app.vault.getAbstractFileByPath((0, import_obsidian.normalizePath)(`${func.folder.path}/sprints.md`));
  return f instanceof import_obsidian.TFile ? f : null;
}
async function leerSprints(app, func) {
  var _a;
  const file = archivoSprints(app, func);
  if (!file)
    return [];
  const contenido = await app.vault.cachedRead(file);
  const m = contenido.match(/^---\n([\s\S]*?)\n---/);
  if (!m)
    return [];
  let fm;
  try {
    fm = (0, import_obsidian.parseYaml)(m[1]);
  } catch (e) {
    return [];
  }
  const lista = fm == null ? void 0 : fm.sprints;
  if (!Array.isArray(lista))
    return [];
  const out = [];
  for (const entrada of lista) {
    if (!entrada || typeof entrada !== "object")
      continue;
    const reg = entrada;
    const anio = Number((_a = reg["a\xF1o"]) != null ? _a : reg["anio"]);
    const sprint = Number(reg["sprint"]);
    const etiquetas = Array.isArray(reg["etiquetas"]) ? reg["etiquetas"].map(String) : [];
    if (Number.isFinite(anio) && anio > 0 && sprint >= 1 && sprint <= 52) {
      out.push({ anio, sprint, etiquetas });
    }
  }
  return out;
}
async function guardarSprints(app, func, sprints) {
  const orden = [...sprints].sort((a, b) => a.anio - b.anio || a.sprint - b.sprint);
  const lineas = ["---", "tipo: sprints", `epica: "[[${func.slug}]]"`];
  if (orden.length === 0) {
    lineas.push("sprints: []");
  } else {
    lineas.push("sprints:");
    for (const s of orden) {
      lineas.push(`  - a\xF1o: ${s.anio}`);
      lineas.push(`    sprint: ${s.sprint}`);
      lineas.push(
        `    etiquetas: [${s.etiquetas.map((e) => `"${escapeYaml(e)}"`).join(", ")}]`
      );
    }
  }
  lineas.push("---", "", `# Sprints \u2014 ${func.nombre}`, "");
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
    await app.vault.process(existente, () => contenido);
    return existente;
  }
  return app.vault.create((0, import_obsidian.normalizePath)(`${func.folder.path}/sprints.md`), contenido);
}
async function createPendiente(app, func, base, nombre, fecha) {
  await ensureFolder(app, `${func.folder.path}/pendientes`);
  const dirPend = (0, import_obsidian.normalizePath)(`${func.folder.path}/pendientes`);
  const file = await app.vault.create(
    `${dirPend}/${base}.md`,
    pendiente(nombre, func.slug, fecha)
  );
  await appendToSection(app, func.file, "## Pendientes", `- [ ] [[${base}|${nombre}]] \u2014 ${fecha}`);
  return file;
}
async function createApunte(app, func, base, nombre, fecha) {
  const dir = `${func.folder.path}/apuntes`;
  await ensureFolder(app, dir);
  const file = await app.vault.create(
    (0, import_obsidian.normalizePath)(`${dir}/${base}.md`),
    apunte(nombre, func.slug, fecha)
  );
  await appendToSection(app, func.file, "## Apuntes", `- [[${base}|${nombre}]] \u2014 ${fecha}`);
  return file;
}
async function createReunion(app, func, base, nombre, fecha) {
  const dir = `${func.folder.path}/reuniones`;
  await ensureFolder(app, dir);
  const file = await app.vault.create(
    (0, import_obsidian.normalizePath)(`${dir}/${base}.md`),
    reunion(nombre, func.slug, fecha)
  );
  await appendToSection(app, func.file, "## Notas de reuni\xF3n", `- [[${base}|${nombre}]] \u2014 ${fecha}`);
  return file;
}

// src/settings.ts
var CARRILES_DEFECTO = ["BACKLOG", "POR HACER", "EN PROGRESO", "HECHO"];
var COLOR_ETIQUETA_DEFECTO = "#5082ff";
var ESTADOS_DEFECTO = [
  { nombre: "Backlog", valor: "backlog" },
  { nombre: "Por hacer", valor: "pendiente" },
  { nombre: "En progreso", valor: "en-progreso" },
  { nombre: "Hecho", valor: "completado" }
];
var DEFAULT_SETTINGS = {
  carpetaAdmin: CARPETA_ACTIVAS,
  etiquetas: [],
  estados: [...ESTADOS_DEFECTO],
  colaboradores: [],
  kanban: {
    carriles: [...CARRILES_DEFECTO],
    tareas: {},
    pendientes: {},
    filtroSprints: { desde: 1, hasta: 52 }
  }
};
function esEstadoDefecto(estado) {
  return ESTADOS_DEFECTO.some((e) => e.valor === estado.valor);
}
var GestorSettingTab = class extends import_obsidian2.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian2.Setting(containerEl).setName("\xC9picas activas").setDesc(`Ruta fija en la ra\xEDz del vault: ${CARPETA_ACTIVAS}`);
    new import_obsidian2.Setting(containerEl).setName("\xC9picas inactivas").setDesc(`Ruta fija en la ra\xEDz del vault: ${CARPETA_INACTIVAS}`);
    new import_obsidian2.Setting(containerEl).setName("Etiquetas de sprint").setHeading();
    const etiquetasCont = containerEl.createDiv();
    this.renderEtiquetas(etiquetasCont);
    new import_obsidian2.Setting(containerEl).setName("Estados de \xE9pica").setHeading();
    const estadosCont = containerEl.createDiv();
    this.renderEstados(estadosCont);
  }
  // ----- Etiquetas de sprint -----
  renderEtiquetas(cont) {
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
        value: etiqueta.color
      });
      color.setAttr("title", "Color de la etiqueta");
      color.addEventListener("change", async () => {
        etiqueta.color = color.value;
        await this.plugin.saveSettings();
      });
      const nombre = fila.createEl("span", { text: etiqueta.nombre, cls: "gf-etiqueta-nombre" });
      nombre.setAttr("title", "Clic para editar");
      nombre.addEventListener("click", () => this.editarEtiqueta(cont, fila, nombre, indice));
      const del = fila.createEl("span", { text: "\xD7", cls: "gf-etiqueta-del" });
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
      value: COLOR_ETIQUETA_DEFECTO
    });
    const input = addRow.createEl("input", {
      type: "text",
      attr: { placeholder: "Nueva etiqueta" }
    });
    const btn = addRow.createEl("button", { text: "Agregar" });
    const error = cont.createDiv({ cls: "gf-campo-error" });
    error.hide();
    const agregar = async () => {
      const valor = input.value.trim();
      if (!valor)
        return;
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
  editarEtiqueta(cont, fila, nombre, indice) {
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
      if (terminado)
        return;
      const valor = input.value.trim();
      if (!valor || valor === original) {
        terminado = true;
        this.renderEtiquetas(cont);
        return;
      }
      if (etiquetas.some(
        (e, j) => j !== indice && e.nombre.toLowerCase() === valor.toLowerCase()
      )) {
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
  renderEstados(cont) {
    cont.empty();
    const estados = this.plugin.settings.estados;
    const lista = cont.createDiv({ cls: "gf-etiquetas" });
    estados.forEach((estado, indice) => {
      const fila = lista.createDiv({ cls: "gf-etiqueta" });
      const nombre = fila.createEl("span", {
        text: estado.nombre,
        cls: "gf-etiqueta-nombre"
      });
      nombre.setAttr("title", "Clic para renombrar");
      nombre.addEventListener("click", () => this.renombrarEstado(cont, fila, nombre, indice));
      if (esEstadoDefecto(estado)) {
        fila.createEl("span", { text: "por defecto", cls: "gf-campo-aviso" });
      } else {
        const del = fila.createEl("span", { text: "\xD7", cls: "gf-etiqueta-del" });
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
      attr: { placeholder: "Nuevo estado" }
    });
    const btn = addRow.createEl("button", { text: "Agregar" });
    const error = cont.createDiv({ cls: "gf-campo-error" });
    error.hide();
    const agregar = async () => {
      const nombre = input.value.trim();
      if (!nombre)
        return;
      const valor = slugify(nombre);
      if (estados.some(
        (e) => e.nombre.toLowerCase() === nombre.toLowerCase() || e.valor === valor
      )) {
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
  renombrarEstado(cont, fila, nombre, indice) {
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
      if (terminado)
        return;
      const valor = input.value.trim();
      if (!valor || valor === original) {
        terminado = true;
        this.renderEstados(cont);
        return;
      }
      if (estados.some((e, j) => j !== indice && e.nombre.toLowerCase() === valor.toLowerCase())) {
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
};
var ConfirmarEliminarEtiquetaModal = class extends import_obsidian2.Modal {
  constructor(plugin, etiqueta, onConfirmar) {
    super(plugin.app);
    this.etiqueta = etiqueta;
    this.onConfirmar = onConfirmar;
  }
  onOpen() {
    this.titleEl.setText("Eliminar etiqueta");
    this.contentEl.createEl("p", {
      text: `\xBFEliminar la etiqueta '${this.etiqueta}'? No se eliminar\xE1 de los sprints ya guardados.`
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
  onClose() {
    this.contentEl.empty();
  }
};

// src/dashboard.ts
var import_obsidian3 = require("obsidian");
var SECCIONES_GESTIONADAS = [
  "Tareas",
  "Apuntes",
  "Notas de reuni\xF3n",
  "Pendientes",
  "Insumos",
  "Historias"
];
var CARPETA_POR_SECCION = {
  Apuntes: "apuntes",
  "Notas de reuni\xF3n": "reuniones",
  Pendientes: "pendientes",
  Insumos: "insumos",
  Historias: "historias"
};
function registerDashboard(plugin) {
  plugin.registerMarkdownPostProcessor((el, ctx) => {
    var _a, _b, _c;
    const fm = (_a = plugin.app.metadataCache.getCache(ctx.sourcePath)) == null ? void 0 : _a.frontmatter;
    if (!fm || fm.tipo !== "epica" && fm.tipo !== "funcionalidad")
      return;
    const h2 = el.querySelector("h2");
    const titulo = (_c = (_b = h2 == null ? void 0 : h2.textContent) == null ? void 0 : _b.trim()) != null ? _c : "";
    if (h2 && SECCIONES_GESTIONADAS.includes(titulo)) {
      const funcFolder = carpetaDeFuncionalidad(plugin, ctx.sourcePath);
      if (!funcFolder)
        return;
      h2.createSpan({ cls: "gf-contador", text: ` (${contar(plugin, funcFolder, titulo)})` });
      const cont = el.createDiv({ cls: "gf-dash" });
      h2.insertAdjacentElement("afterend", cont);
      renderSeccion(plugin, cont, funcFolder, ctx.sourcePath, titulo);
      return;
    }
    const info = ctx.getSectionInfo(el);
    if (info && enSeccionGestionada(info.text, info.lineStart)) {
      el.addClass("gf-hidden");
    }
  });
}
function carpetaDeFuncionalidad(plugin, sourcePath) {
  const main = plugin.app.vault.getAbstractFileByPath(sourcePath);
  if (!(main instanceof import_obsidian3.TFile) || !main.parent)
    return null;
  return main.parent;
}
function enSeccionGestionada(textoCompleto, linea) {
  const lines = textoCompleto.split("\n");
  let actual = null;
  for (let i = 0; i <= linea && i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,6})\s+(.*)$/);
    if (m) {
      actual = m[1].length === 2 ? m[2].trim() : null;
    }
  }
  return actual !== null && SECCIONES_GESTIONADAS.includes(actual);
}
function contar(plugin, funcFolder, titulo) {
  if (titulo === "Tareas") {
    const dir2 = funcFolder.children.find(
      (c) => c instanceof import_obsidian3.TFolder && c.name === "tareas"
    );
    if (!dir2)
      return 0;
    return dir2.children.filter((c) => c instanceof import_obsidian3.TFolder).length;
  }
  if (titulo === "Pendientes") {
    return listPendientes(plugin.app, funcFolder).length;
  }
  const carpeta = CARPETA_POR_SECCION[titulo];
  const dir = funcFolder.children.find(
    (c) => c instanceof import_obsidian3.TFolder && c.name === carpeta
  );
  if (!dir)
    return 0;
  return dir.children.filter((c) => c instanceof import_obsidian3.TFile && c.extension === "md").length;
}
function renderSeccion(plugin, cont, funcFolder, sourcePath, titulo) {
  if (titulo === "Tareas") {
    renderTareas(plugin, cont, funcFolder, sourcePath);
  } else if (titulo === "Apuntes") {
    renderFechados(plugin, cont, funcFolder, "apuntes", "Sin apuntes a\xFAn.", sourcePath, false);
  } else if (titulo === "Notas de reuni\xF3n") {
    renderFechados(
      plugin,
      cont,
      funcFolder,
      "reuniones",
      "Sin notas de reuni\xF3n a\xFAn.",
      sourcePath,
      false
    );
  } else if (titulo === "Pendientes") {
    renderPendientes(plugin, cont, funcFolder, sourcePath);
  } else if (titulo === "Insumos") {
    renderFechados(plugin, cont, funcFolder, "insumos", "Sin insumos a\xFAn.", sourcePath, false);
  } else {
    renderFechados(
      plugin,
      cont,
      funcFolder,
      "historias",
      "Sin historias a\xFAn.",
      sourcePath,
      false
    );
  }
}
function renderTareas(plugin, cont, funcFolder, sourcePath) {
  const tareas = listTareas(plugin.app, funcFolder);
  if (tareas.length === 0) {
    cont.createEl("em", { text: "Sin tareas a\xFAn." });
    return;
  }
  const ul = cont.createEl("ul", { cls: "gf-lista-tareas contains-task-list" });
  for (const t of tareas) {
    const li = itemTarea(plugin, ul, t.file, t.nombre, sourcePath);
  }
}
function renderPendientes(plugin, cont, funcFolder, sourcePath) {
  const app = plugin.app;
  const pendientes = listPendientes(app, funcFolder);
  if (pendientes.length === 0) {
    cont.createEl("em", { text: "Sin pendientes a\xFAn." });
    return;
  }
  const items = pendientes.map((p) => {
    var _a, _b, _c;
    const fm = (_a = app.metadataCache.getFileCache(p.file)) == null ? void 0 : _a.frontmatter;
    const fechaFm = (fm == null ? void 0 : fm.fecha) ? String(fm.fecha).slice(0, 10) : "";
    const fecha = fechaFm || ((_c = (_b = p.slug.match(/^\d{4}-\d{2}-\d{2}/)) == null ? void 0 : _b[0]) != null ? _c : "");
    return { ...p, fecha };
  });
  items.sort((a, b) => b.fecha.localeCompare(a.fecha));
  const ul = cont.createEl("ul", { cls: "contains-task-list" });
  for (const p of items) {
    const li = itemTarea(plugin, ul, p.file, p.nombre, sourcePath);
    if (p.fecha)
      li.appendText(` \u2014 ${p.fecha}`);
  }
}
function itemTarea(plugin, ul, file, nombre, sourcePath) {
  var _a, _b;
  const app = plugin.app;
  const completado = ((_b = (_a = app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter) == null ? void 0 : _b.estado) === "completado";
  const li = ul.createEl("li", { cls: "task-list-item gf-tarea-item" });
  if (completado)
    li.addClass("is-checked");
  const cb = li.createEl("input", { type: "checkbox", cls: "task-list-item-checkbox" });
  cb.checked = completado;
  cb.addEventListener("change", () => {
    void app.fileManager.processFrontMatter(file, (f) => {
      f.estado = cb.checked ? "completado" : "pendiente";
    });
    li.toggleClass("is-checked", cb.checked);
  });
  const a = li.createEl("a", { cls: "internal-link", text: nombre });
  a.addEventListener("click", (e) => {
    e.preventDefault();
    void app.workspace.openLinkText(file.path, sourcePath);
  });
  return li;
}
function renderFechados(plugin, cont, funcFolder, nombreCarpeta, textoVacio, sourcePath, conCheckbox) {
  var _a;
  const app = plugin.app;
  const sub = funcFolder.children.find(
    (c) => c instanceof import_obsidian3.TFolder && c.name === nombreCarpeta
  );
  const archivos = ((_a = sub == null ? void 0 : sub.children) != null ? _a : []).filter(
    (c) => c instanceof import_obsidian3.TFile && c.extension === "md"
  );
  if (archivos.length === 0) {
    cont.createEl("em", { text: textoVacio });
    return;
  }
  const items = archivos.map((f) => {
    var _a2, _b, _c;
    const fm = (_a2 = app.metadataCache.getFileCache(f)) == null ? void 0 : _a2.frontmatter;
    const fechaFm = (fm == null ? void 0 : fm.fecha) ? String(fm.fecha).slice(0, 10) : "";
    const fecha = fechaFm || ((_c = (_b = f.basename.match(/^\d{4}-\d{2}-\d{2}/)) == null ? void 0 : _b[0]) != null ? _c : "");
    const nombre = (fm == null ? void 0 : fm.nombre) ? String(fm.nombre) : f.basename;
    return { file: f, nombre, fecha };
  });
  items.sort((a, b) => b.fecha.localeCompare(a.fecha));
  const ul = cont.createEl("ul", { cls: conCheckbox ? "contains-task-list" : "" });
  for (const it of items) {
    if (conCheckbox) {
      const li = itemTarea(plugin, ul, it.file, it.nombre, sourcePath);
      if (it.fecha)
        li.appendText(` \u2014 ${it.fecha}`);
    } else {
      const li = ul.createEl("li");
      const a = li.createEl("a", { cls: "internal-link", text: it.nombre });
      a.addEventListener("click", (e) => {
        e.preventDefault();
        void app.workspace.openLinkText(it.file.path, sourcePath);
      });
      if (it.fecha)
        li.appendText(` \u2014 ${it.fecha}`);
    }
  }
}

// src/acciones.ts
var import_obsidian4 = require("obsidian");

// src/icono.ts
var ICONO_PLUGIN = "gestion-producto";
var ICONO_PLUGIN_SVG = `<g transform="scale(0.19230769)" fill="currentColor"><g transform="matrix(1.472877,0,0,1.51955,-204.704019,-73.839992)"><path d="M311.84,336.445C310.777,341.514 306.122,345.335 300.548,345.335C294.19,345.335 289.029,340.364 289.029,334.241L289.029,259.925L226.583,304.643C221.543,308.252 214.409,307.09 210.661,302.05C206.913,297.01 207.963,289.988 213.003,286.379L289.029,231.936L289.029,183.801L213.907,183.801C207.667,183.801 202.602,178.736 202.602,172.497C202.602,166.257 207.667,161.192 213.907,161.192L268.038,161.192L221.755,128.048C216.715,124.439 215.666,117.416 219.413,112.377C223.161,107.337 230.296,106.175 235.336,109.784L307.123,161.192L323.893,161.192L395.68,109.784C400.72,106.175 407.854,107.337 411.602,112.377C415.35,117.416 414.301,124.439 409.261,128.048L362.977,161.192L417.109,161.192C423.348,161.192 428.414,166.257 428.414,172.497C428.414,178.736 423.348,183.801 417.109,183.801L341.987,183.801L341.987,231.936L418.013,286.379C423.053,289.988 424.102,297.01 420.354,302.05C416.607,307.09 409.472,308.252 404.432,304.643L341.987,259.925L341.987,334.241C341.987,340.364 336.825,345.335 330.467,345.335C324.893,345.335 320.239,341.514 319.176,336.445L319.176,244.305L319.162,244.305C318.997,242.49 317.423,241.064 315.508,241.064C313.592,241.064 312.018,242.49 311.854,244.305L311.84,244.305L311.84,336.445ZM315.508,151.615C303.155,151.615 293.125,141.773 293.125,129.65C293.125,117.527 303.155,107.685 315.508,107.685C327.861,107.685 337.89,117.527 337.89,129.65C337.89,141.773 327.861,151.615 315.508,151.615Z"/></g><g transform="matrix(1.472877,0,0,1.491196,-136.582285,-55.779129)"><path d="M269.257,50.911C358.057,50.911 430.194,122.963 430.194,211.762C430.194,300.562 358.057,372.614 269.257,372.614C180.457,372.614 108.32,300.562 108.32,211.762C108.32,122.963 180.457,50.911 269.257,50.911ZM269.257,64.695C188.112,64.695 122.276,130.617 122.276,211.762C122.276,292.907 188.112,358.829 269.257,358.829C350.402,358.829 416.238,292.907 416.238,211.762C416.238,130.617 350.402,64.695 269.257,64.695Z"/></g></g>`;

// src/acciones.ts
var VIEW_TYPE_ACCIONES = "gestor-funciones-acciones";
var SECCIONES = [
  {
    titulo: "\xC9picas",
    acciones: [
      { icono: "folder-plus", texto: "Crear \xE9pica", accion: (p) => p.abrirModal("funcionalidad") },
      { icono: "flag", texto: "Cambiar estado \xE9pica", accion: (p) => p.abrirModal("estado") },
      { icono: "calendar-days", texto: "Asignar sprint", accion: (p) => p.abrirModal("sprint") },
      { icono: "archive", texto: "Mover \xE9pica", accion: (p) => p.abrirModal("mover") },
      { icono: "map", texto: "Roadmap", accion: (p) => void p.abrirRoadmap() }
    ]
  },
  {
    titulo: "Funcionalidades",
    acciones: [
      {
        icono: "puzzle",
        texto: "Crear funcionalidad",
        accion: (p) => p.abrirModal("crearfn")
      },
      {
        icono: "flag",
        texto: "Cambiar estado funcionalidad",
        accion: (p) => p.abrirModal("estadofn")
      }
    ]
  },
  {
    titulo: "Incidencias",
    acciones: [
      { icono: "check-square", texto: "Crear tarea", accion: (p) => p.abrirModal("tarea") },
      { icono: "hourglass", texto: "Crear pendiente", accion: (p) => p.abrirModal("pendiente") },
      {
        icono: "kanban-square",
        texto: "Gesti\xF3n de incidencias",
        accion: (p) => void p.abrirKanban()
      }
    ]
  },
  {
    titulo: "Colaboradores",
    acciones: [
      {
        icono: "users",
        texto: "Colaboradores",
        accion: (p) => p.abrirModal("colaboradores")
      },
      {
        icono: "user-plus",
        texto: "Asignar colaborador",
        accion: (p) => p.abrirModal("asignar")
      },
      {
        icono: "user-check",
        texto: "Tareas por colaborador",
        accion: (p) => void p.abrirTareasColaborador()
      }
    ]
  },
  {
    titulo: "Acciones adicionales",
    acciones: [
      { icono: "pencil", texto: "Crear apunte", accion: (p) => p.abrirModal("apunte") },
      { icono: "users", texto: "Crear nota reuni\xF3n", accion: (p) => p.abrirModal("reunion") },
      { icono: "package", texto: "Crear insumo", accion: (p) => p.abrirModal("insumo") },
      { icono: "book-open", texto: "Crear historia", accion: (p) => p.abrirModal("historia") }
    ]
  }
];
var AccionesView = class extends import_obsidian4.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    /** Secciones colapsadas; todas inician descolapsadas. No se persiste. */
    this.colapsadas = /* @__PURE__ */ new Set();
    this.plugin = plugin;
  }
  getViewType() {
    return VIEW_TYPE_ACCIONES;
  }
  getDisplayText() {
    return "Gesti\xF3n Producto";
  }
  getIcon() {
    return ICONO_PLUGIN;
  }
  async onOpen() {
    const refrescar = (file) => {
      if (file.path === CARPETA_ACTIVAS || file.path === CARPETA_INACTIVAS)
        this.render();
    };
    this.registerEvent(this.app.vault.on("create", refrescar));
    this.registerEvent(this.app.vault.on("delete", refrescar));
    this.render();
  }
  render() {
    const cont = this.contentEl;
    cont.empty();
    cont.addClass("gf-acciones");
    if (!carpetasGestionListas(this.app)) {
      const btn = cont.createEl("button", { cls: "gf-accion mod-cta" });
      const icono = btn.createSpan({ cls: "gf-accion-icono" });
      (0, import_obsidian4.setIcon)(icono, "folder-plus");
      btn.createSpan({ text: "Crear carpetas de gesti\xF3n" });
      btn.addEventListener("click", async () => {
        try {
          await crearCarpetasGestion(this.app);
          new import_obsidian4.Notice("Gesti\xF3n Producto: carpetas de gesti\xF3n creadas.");
          this.render();
        } catch (e) {
          console.error(e);
          new import_obsidian4.Notice("Gesti\xF3n Producto: no se pudieron crear las carpetas.");
        }
      });
      cont.createDiv({
        cls: "gf-campo-aviso",
        text: 'Se crear\xE1n "\xC9picas activas" y "\xC9picas inactivas" en la ra\xEDz del vault.'
      });
      return;
    }
    for (const seccion of SECCIONES) {
      const colapsada = this.colapsadas.has(seccion.titulo);
      const header = cont.createDiv({ cls: "gf-acciones-seccion" });
      header.createSpan({
        cls: "gf-acciones-chevron",
        text: colapsada ? "\u25B8" : "\u25BE"
      });
      header.createSpan({ text: seccion.titulo });
      header.addEventListener("click", () => {
        if (colapsada)
          this.colapsadas.delete(seccion.titulo);
        else
          this.colapsadas.add(seccion.titulo);
        this.render();
      });
      if (colapsada)
        continue;
      for (const accion of seccion.acciones) {
        const btn = cont.createEl("button", { cls: "gf-accion" });
        const icono = btn.createSpan({ cls: "gf-accion-icono" });
        (0, import_obsidian4.setIcon)(icono, accion.icono);
        btn.createSpan({ text: accion.texto });
        btn.addEventListener("click", () => accion.accion(this.plugin));
      }
    }
  }
};

// src/kanban.ts
var import_obsidian5 = require("obsidian");
var VIEW_TYPE_KANBAN = "gestor-funciones-kanban";
function estadoDeCarril(carril) {
  if (carril === "BACKLOG")
    return "backlog";
  if (carril === "POR HACER")
    return "pendiente";
  if (carril === "EN PROGRESO")
    return "en-progreso";
  if (carril === "HECHO")
    return "completado";
  return slugify(carril);
}
var KanbanView = class extends import_obsidian5.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.renderTimer = null;
    /** Cards con el sub-tablero desplegado. No se persiste entre sesiones. */
    this.expandidas = /* @__PURE__ */ new Set();
    this.tareas = [];
    this.pendientes = [];
    this.plugin = plugin;
  }
  getViewType() {
    return VIEW_TYPE_KANBAN;
  }
  getDisplayText() {
    return "Gesti\xF3n de incidencias \u2014 Gesti\xF3n Producto";
  }
  getIcon() {
    return "kanban-square";
  }
  async onOpen() {
    this.expandidas.clear();
    const refrescar = (file) => {
      const admin = (0, import_obsidian5.normalizePath)(this.plugin.settings.carpetaAdmin.trim() || "/");
      if (file.path === admin || file.path.startsWith(admin + "/"))
        this.renderSoon();
    };
    this.registerEvent(this.app.vault.on("create", refrescar));
    this.registerEvent(this.app.vault.on("delete", refrescar));
    this.registerEvent(this.app.vault.on("rename", refrescar));
    await this.recargar();
  }
  /** Sincroniza desde el frontmatter de los .md y vuelve a renderizar. */
  async recargar() {
    await this.recolectar();
    this.sincronizarDesdeFrontmatter();
    this.render();
  }
  renderSoon() {
    if (this.renderTimer !== null)
      window.clearTimeout(this.renderTimer);
    this.renderTimer = window.setTimeout(() => {
      this.renderTimer = null;
      void this.recolectar().then(() => this.render());
    }, 150);
  }
  async recolectar() {
    const admin = this.plugin.settings.carpetaAdmin.trim();
    this.tareas = [];
    this.pendientes = [];
    if (!admin)
      return;
    const epicas = listFuncionalidades(this.app, admin);
    const { desde, hasta } = this.plugin.settings.kanban.filtroSprints;
    const filtrar = !(desde === 1 && hasta === 52);
    const anio = (/* @__PURE__ */ new Date()).getFullYear();
    const pasaSprints = async (ref) => {
      const sprints = await leerSprints(this.app, ref);
      return sprints.some((s) => s.anio === anio && s.sprint >= desde && s.sprint <= hasta);
    };
    for (const epica of epicas) {
      const epicaPasa = !filtrar || await pasaSprints(epica);
      if (epicaPasa)
        this.recolectarContenedor(admin, epica, epica.nombre);
      for (const fn of listFuncionalidadesDe(this.app, epica.folder)) {
        const fnPasa = epicaPasa || await pasaSprints(fn);
        if (fnPasa) {
          this.recolectarContenedor(admin, fn, `${epica.nombre} \u203A ${fn.nombre}`);
        }
      }
    }
  }
  /** Junta las incidencias de un contenedor (épica o funcionalidad). */
  recolectarContenedor(admin, ref, contexto) {
    for (const tarea2 of listTareas(this.app, ref.folder)) {
      this.tareas.push({
        key: claveRelativa(admin, tarea2.file.path),
        file: tarea2.file,
        nombre: tarea2.nombre,
        contexto
      });
    }
    for (const pend of listPendientes(this.app, ref.folder)) {
      this.pendientes.push({
        key: claveRelativa(admin, pend.file.path),
        file: pend.file,
        nombre: pend.nombre,
        contexto
      });
    }
  }
  mapa(grupo) {
    return grupo === "tareas" ? this.plugin.settings.kanban.tareas : this.plugin.settings.kanban.pendientes;
  }
  items(grupo) {
    return grupo === "tareas" ? this.tareas : this.pendientes;
  }
  /**
   * El `estado` del .md manda al abrir o recargar el tablero (sincronización
   * desde el archivo). Durante la sesión manda data.json.
   */
  sincronizarDesdeFrontmatter() {
    let cambio = false;
    const sincronizar = (grupo) => {
      const mapa = this.mapa(grupo);
      for (const it of this.items(grupo)) {
        const carril = this.carrilPorEstado(this.estadoDe(it.file));
        if (carril && mapa[it.key] !== carril) {
          mapa[it.key] = carril;
          cambio = true;
        }
      }
    };
    sincronizar("tareas");
    sincronizar("pendientes");
    if (cambio)
      void this.plugin.saveSettings();
  }
  estadoDe(file) {
    var _a, _b;
    const estado = (_b = (_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter) == null ? void 0 : _b.estado;
    return estado ? String(estado) : void 0;
  }
  carrilPorEstado(estado) {
    if (!estado)
      return null;
    for (const carril of this.plugin.settings.kanban.carriles) {
      if (estadoDeCarril(carril) === estado)
        return carril;
    }
    return null;
  }
  carrilDe(key, mapa) {
    const k = this.plugin.settings.kanban;
    const asignado = mapa[key];
    if (asignado && k.carriles.includes(asignado))
      return asignado;
    if (k.carriles.includes("POR HACER"))
      return "POR HACER";
    return k.carriles[0];
  }
  /** Elimina de data.json las entradas que ya no existen en disco. */
  podar() {
    const k = this.plugin.settings.kanban;
    const limpiar = (mapa, vivas) => {
      for (const key of Object.keys(mapa)) {
        if (!vivas.has(key))
          delete mapa[key];
      }
    };
    limpiar(k.tareas, new Set(this.tareas.map((it) => it.key)));
    limpiar(k.pendientes, new Set(this.pendientes.map((it) => it.key)));
  }
  async guardar() {
    this.podar();
    await this.plugin.saveSettings();
  }
  render() {
    const cont = this.contentEl;
    cont.empty();
    cont.addClass("gf-kanban");
    if (!carpetasGestionListas(this.app)) {
      const aviso = cont.createDiv({ cls: "gf-kanban-aviso" });
      aviso.createEl("p", {
        text: "Crea las carpetas de gesti\xF3n desde el panel de acciones antes de usar el tablero."
      });
      const btn = aviso.createEl("button", {
        text: "Abrir panel de acciones",
        cls: "mod-cta"
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
  renderFiltro(cont) {
    const filtro = this.plugin.settings.kanban.filtroSprints;
    const barra = cont.createDiv({ cls: "gf-roadmap-controles" });
    barra.createEl("span", { text: "Filtro de sprints:", cls: "gf-roadmap-lbl" });
    const inputDesde = barra.createEl("input", {
      type: "number",
      cls: "gf-roadmap-num",
      attr: { min: "1", max: "52" },
      value: String(filtro.desde)
    });
    barra.createEl("span", { text: "hasta", cls: "gf-roadmap-lbl" });
    const inputHasta = barra.createEl("input", {
      type: "number",
      cls: "gf-roadmap-num",
      attr: { min: "1", max: "52" },
      value: String(filtro.hasta)
    });
    const aplicar = async () => {
      const limpio = (v, defecto) => {
        const n = Math.trunc(Number(v));
        return Number.isFinite(n) && n >= 1 && n <= 52 ? n : defecto;
      };
      let desde = limpio(inputDesde.value, 1);
      let hasta = limpio(inputHasta.value, 52);
      if (desde > hasta)
        [desde, hasta] = [hasta, desde];
      this.plugin.settings.kanban.filtroSprints = { desde, hasta };
      await this.plugin.saveSettings();
      await this.recolectar();
      this.render();
    };
    inputDesde.addEventListener("change", () => void aplicar());
    inputHasta.addEventListener("change", () => void aplicar());
    barra.createEl("span", {
      text: "(1\u201352 muestra todo; otro rango filtra por sprints de la \xE9pica en el a\xF1o actual)",
      cls: "gf-roadmap-lbl"
    });
  }
  renderBoard(cont, grupo, conGestion) {
    const board = cont.createDiv({ cls: "gf-kanban-board" });
    const carriles = this.plugin.settings.kanban.carriles;
    for (let i = 0; i < carriles.length; i++) {
      this.renderCarril(board, i, grupo, conGestion);
    }
    if (conGestion)
      this.renderAgregarCarril(board);
  }
  renderCarril(board, indice, grupo, conGestion) {
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
      if (!payload)
        return;
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
        var _a;
        (_a = e.dataTransfer) == null ? void 0 : _a.setData(
          "text/plain",
          JSON.stringify({ tipo: "carril", valor: nombre })
        );
      });
      titulo.addEventListener(
        "dblclick",
        () => this.editarNombreCarril(header, titulo, indice)
      );
      const enUso = tarjetas.length > 0 || this.items(grupo === "tareas" ? "pendientes" : "tareas").some(
        (it) => this.carrilDe(it.key, this.mapa(grupo === "tareas" ? "pendientes" : "tareas")) === nombre
      );
      const del = header.createEl("span", {
        cls: "gf-kanban-del",
        text: "\xD7",
        attr: { role: "button" }
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
        text: grupo === "tareas" ? "Sin tareas a\xFAn." : "Sin pendientes a\xFAn."
      });
    }
    for (const it of tarjetas) {
      this.renderTarjeta(cuerpo, it, nombre, grupo);
    }
  }
  renderTarjeta(cuerpo, it, carrilActual, grupo) {
    const card = cuerpo.createDiv({ cls: "gf-kanban-card" });
    card.draggable = true;
    card.addEventListener("dragstart", (e) => {
      var _a;
      e.stopPropagation();
      (_a = e.dataTransfer) == null ? void 0 : _a.setData(
        "text/plain",
        JSON.stringify({ tipo: "card", grupo, valor: it.key })
      );
    });
    const head = card.createDiv({ cls: "gf-kanban-card-head" });
    head.createDiv({ cls: "gf-kanban-card-nombre", text: it.nombre });
    card.createDiv({ cls: "gf-kanban-card-func", text: it.contexto });
    const fecha = this.fechaCreacion(it.file);
    if (fecha)
      card.createDiv({ cls: "gf-kanban-card-fecha", text: fecha });
    card.addEventListener("click", () => {
      void this.app.workspace.getLeaf(false).openFile(it.file);
    });
    card.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const menu = new import_obsidian5.Menu();
      for (const carril of this.plugin.settings.kanban.carriles) {
        if (carril === carrilActual)
          continue;
        menu.addItem(
          (item) => item.setTitle(`Mover a: ${carril}`).onClick(() => void this.moverCard(grupo, it.key, carril))
        );
      }
      menu.showAtMouseEvent(e);
    });
  }
  fechaCreacion(file) {
    var _a, _b;
    const fm = (_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter;
    const valor = (_b = fm == null ? void 0 : fm["fecha-creacion"]) != null ? _b : fm == null ? void 0 : fm["fecha"];
    const m = String(valor != null ? valor : "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
  }
  async moverCard(grupo, key, carril) {
    const it = this.items(grupo).find((i) => i.key === key);
    if (!it)
      return;
    this.mapa(grupo)[key] = carril;
    await this.guardar();
    await this.app.fileManager.processFrontMatter(it.file, (fm) => {
      fm.estado = estadoDeCarril(carril);
    });
    this.render();
  }
  async moverCarril(nombre, destino) {
    const k = this.plugin.settings.kanban;
    const desde = k.carriles.indexOf(nombre);
    if (desde === -1 || desde === destino)
      return;
    k.carriles.splice(desde, 1);
    k.carriles.splice(destino > desde ? destino - 1 : destino, 0, nombre);
    await this.guardar();
    this.render();
  }
  editarNombreCarril(header, titulo, indice) {
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
      if (terminado)
        return;
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
      for (const mapa of [k.tareas, k.pendientes]) {
        for (const [key, carril] of Object.entries(mapa)) {
          if (carril === original)
            mapa[key] = nuevo;
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
  renderAgregarCarril(board) {
    const k = this.plugin.settings.kanban;
    const wrap = board.createDiv({ cls: "gf-kanban-add" });
    const btn = wrap.createEl("button", { text: "+ Agregar carril", cls: "gf-kanban-add-btn" });
    btn.addEventListener("click", () => {
      wrap.empty();
      const input = wrap.createEl("input", {
        type: "text",
        cls: "gf-kanban-input",
        attr: { placeholder: "Nombre del carril" }
      });
      const error = wrap.createDiv({ cls: "gf-campo-error" });
      error.hide();
      input.focus();
      let terminado = false;
      const confirmar = async () => {
        if (terminado)
          return;
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
};
function leerPayload(e) {
  var _a;
  const raw = (_a = e.dataTransfer) == null ? void 0 : _a.getData("text/plain");
  if (!raw)
    return null;
  try {
    return JSON.parse(raw);
  } catch (e2) {
    return null;
  }
}

// src/roadmap.ts
var import_obsidian7 = require("obsidian");

// src/modals.ts
var import_obsidian6 = require("obsidian");
var MSG_OBLIGATORIO = "Este campo es obligatorio.";
var MSG_DUPLICADO = "Ya existe un elemento con ese nombre. Haz clic en \xABCrear\xBB otra vez para crearlo con un sufijo num\xE9rico.";
var GestorModal = class extends import_obsidian6.Modal {
  constructor(plugin) {
    super(plugin.app);
    this.plugin = plugin;
  }
  campoTexto(label, placeholder) {
    const wrap = this.contentEl.createDiv({ cls: "gf-campo" });
    wrap.createEl("label", { text: label, cls: "gf-campo-label" });
    const input = wrap.createEl("input", {
      type: "text",
      cls: "gf-campo-input",
      attr: { placeholder }
    });
    const error = wrap.createDiv({ cls: "gf-campo-error" });
    error.hide();
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (!this.crearBtn.disabled)
          this.crearBtn.click();
      }
    });
    return { wrap, input, error };
  }
  campoSelect(label, placeholder) {
    const wrap = this.contentEl.createDiv({ cls: "gf-campo" });
    wrap.createEl("label", { text: label, cls: "gf-campo-label" });
    const select = wrap.createEl("select", { cls: "dropdown gf-campo-select" });
    this.setOpciones(select, placeholder, []);
    const error = wrap.createDiv({ cls: "gf-campo-error" });
    error.hide();
    return { wrap, select, error };
  }
  setOpciones(select, placeholder, opciones) {
    select.empty();
    const ph = select.createEl("option", { text: placeholder, value: "" });
    ph.disabled = true;
    ph.selected = true;
    for (const o of opciones) {
      const op = select.createEl("option", { text: o.label, value: o.value });
      if (o.cls)
        op.addClass(o.cls);
    }
  }
  /**
   * Selector de épica con checkbox "Mostrar épicas completadas" (desmarcado
   * por defecto, sin persistencia). Las completadas se ven atenuadas.
   */
  campoEpica(funcs) {
    const campo = this.campoSelect("\xC9pica", "Seleccionar \xE9pica");
    const chkLabel = campo.wrap.createEl("label", { cls: "gf-chk" });
    const chk = chkLabel.createEl("input", { type: "checkbox" });
    chkLabel.appendText(" Mostrar \xE9picas completadas");
    const repoblar = () => {
      const visibles = funcs.filter((f) => chk.checked || f.estado !== "completado");
      const anterior = campo.select.value;
      this.setOpciones(
        campo.select,
        "Seleccionar \xE9pica",
        visibles.map((f) => ({
          value: f.slug,
          label: f.nombre,
          cls: f.estado === "completado" ? "gf-opcion-completada" : void 0
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
      seleccionar: (slug) => {
        const f = funcs.find((x) => x.slug === slug);
        if (!f)
          return;
        if (f.estado === "completado" && !chk.checked) {
          chk.checked = true;
          repoblar();
        }
        campo.select.value = slug;
        campo.select.dispatchEvent(new Event("change"));
      }
    };
  }
  /**
   * Selector opcional de funcionalidad, dependiente del selector de épica.
   * Sin selección, las acciones operan a nivel de épica.
   */
  campoFuncionalidad(epica) {
    const campo = this.campoSelect("Funcionalidad", "Nivel \xE9pica (sin funcionalidad)");
    let lista = [];
    const repoblar = () => {
      const f = epica.getFunc();
      lista = f ? listFuncionalidadesDe(this.app, f.folder) : [];
      campo.select.empty();
      const nivel = campo.select.createEl("option", {
        text: "Nivel \xE9pica (sin funcionalidad)",
        value: ""
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
      getFn: () => {
        var _a;
        return (_a = lista.find((x) => x.slug === campo.select.value)) != null ? _a : null;
      },
      seleccionar: (slug) => {
        if (!lista.some((x) => x.slug === slug))
          return;
        campo.select.value = slug;
        campo.select.dispatchEvent(new Event("change"));
      }
    };
  }
  /** Chips de colaboradores para asignar al crear una incidencia. Opcional. */
  campoColaboradores() {
    const wrap = this.contentEl.createDiv({ cls: "gf-campo" });
    wrap.createEl("label", { text: "Colaboradores (opcional)", cls: "gf-campo-label" });
    const chipsDiv = wrap.createDiv({ cls: "gf-sprint-chips gf-colab-chips" });
    const seleccion = /* @__PURE__ */ new Set();
    const colaboradores = this.plugin.settings.colaboradores;
    const render = () => {
      chipsDiv.empty();
      if (colaboradores.length === 0) {
        chipsDiv.createEl("span", {
          cls: "gf-campo-aviso",
          text: "Sin colaboradores configurados."
        });
        return;
      }
      for (const colab of colaboradores) {
        const activo = seleccion.has(colab.nombre);
        const chip = chipsDiv.createEl("button", {
          text: colab.nombre,
          cls: "gf-chip" + (activo ? " gf-chip-on" : "")
        });
        if (activo) {
          chip.style.backgroundColor = colab.color;
          chip.style.borderColor = colab.color;
        } else {
          chip.style.borderColor = colab.color;
          chip.style.color = colab.color;
        }
        chip.addEventListener("click", (e) => {
          e.preventDefault();
          if (activo)
            seleccion.delete(colab.nombre);
          else
            seleccion.add(colab.nombre);
          render();
        });
      }
    };
    render();
    return { getSeleccionados: () => [...seleccion] };
  }
  async aplicarAsignados(file, asignados) {
    if (asignados.length === 0)
      return;
    await this.app.fileManager.processFrontMatter(file, (fm) => {
      fm.asignados = [...asignados].sort((a, b) => a.localeCompare(b, "es"));
    });
  }
  mostrarError(campo, msg) {
    campo.error.setText(msg);
    campo.error.show();
  }
  limpiarError(campo) {
    campo.error.hide();
    campo.error.setText("");
  }
  botones(onCrear, textoPrimario = "Crear") {
    const row = this.contentEl.createDiv({ cls: "gf-botones" });
    this.crearBtn = row.createEl("button", { text: textoPrimario, cls: "mod-cta" });
    this.crearBtn.addEventListener("click", onCrear);
    const cancelar = row.createEl("button", { text: "Cancelar" });
    cancelar.addEventListener("click", () => this.close());
  }
  sinEpicas(func) {
    func.select.disabled = true;
    func.wrap.createDiv({
      cls: "gf-campo-aviso",
      text: "No hay \xE9picas a\xFAn. Crea una primero."
    });
    this.crearBtn.disabled = true;
  }
  async abrirNota(file) {
    await this.app.workspace.getLeaf(false).openFile(file);
  }
  onClose() {
    this.contentEl.empty();
  }
};
var AvisoConfiguracionModal = class extends import_obsidian6.Modal {
  constructor(plugin) {
    super(plugin.app);
    this.plugin = plugin;
  }
  onOpen() {
    this.titleEl.setText("Gesti\xF3n Producto");
    this.contentEl.createEl("p", {
      text: "Crea las carpetas de gesti\xF3n con el bot\xF3n \xABCrear carpetas de gesti\xF3n\xBB del panel de acciones antes de continuar."
    });
    const row = this.contentEl.createDiv({ cls: "gf-botones" });
    const btn = row.createEl("button", { text: "Abrir panel de acciones", cls: "mod-cta" });
    btn.addEventListener("click", () => {
      this.close();
      void this.plugin.abrirAcciones();
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};
var CrearFuncionalidadModal = class extends GestorModal {
  onOpen() {
    this.titleEl.setText("Crear \xE9pica");
    const nombre = this.campoTexto("Nombre de la \xE9pica", "Escribe nombre de la \xE9pica");
    this.botones(async () => {
      this.limpiarError(nombre);
      const valor = nombre.input.value.trim();
      if (!valor || !slugify(valor)) {
        this.mostrarError(nombre, "El nombre es obligatorio.");
        return;
      }
      try {
        const file = await createFuncionalidad(
          this.app,
          this.plugin.settings.carpetaAdmin,
          valor
        );
        this.close();
        await this.abrirNota(file);
      } catch (e) {
        if (e instanceof YaExisteError) {
          this.mostrarError(nombre, "Ya existe una \xE9pica con ese nombre.");
        } else {
          console.error(e);
          new import_obsidian6.Notice("Gesti\xF3n Producto: error al crear la \xE9pica.");
        }
      }
    });
    nombre.input.focus();
  }
};
var CrearTareaModal = class extends GestorModal {
  constructor() {
    super(...arguments);
    this.duplicadoPendiente = null;
  }
  onOpen() {
    this.titleEl.setText("Crear tarea");
    const funcs = listFuncionalidades(this.app, this.plugin.settings.carpetaAdmin);
    const func = this.campoEpica(funcs);
    const fn = this.campoFuncionalidad(func);
    const nombre = this.campoTexto("Nombre de la tarea", "Escribe nombre de la tarea");
    const colaboradores = this.campoColaboradores();
    this.botones(async () => {
      var _a;
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
      if (!ok || !f)
        return;
      const destino = (_a = fn.getFn()) != null ? _a : f;
      let slug = slugify(valor);
      const dir = `${destino.folder.path}/tareas`;
      if (existeEnDir(this.app, dir, slug)) {
        const clave = `${destino.folder.path}/${slug}`;
        if (this.duplicadoPendiente !== clave) {
          this.duplicadoPendiente = clave;
          this.mostrarError(nombre, MSG_DUPLICADO);
          return;
        }
        slug = slugDisponible(this.app, dir, slug);
      }
      try {
        const file = await createTarea(this.app, destino, slug, valor);
        await this.aplicarAsignados(file, colaboradores.getSeleccionados());
        const admin = this.plugin.settings.carpetaAdmin;
        this.plugin.settings.kanban.tareas[claveRelativa(admin, `${dir}/${slug}`)] = "POR HACER";
        await this.plugin.saveSettings();
        this.close();
        await this.abrirNota(file);
      } catch (e) {
        console.error(e);
        new import_obsidian6.Notice("Gesti\xF3n Producto: error al crear la tarea.");
      }
    });
    if (funcs.length === 0) {
      this.sinEpicas(func);
    }
  }
};
var CrearFechadoModal = class extends GestorModal {
  constructor() {
    super(...arguments);
    /** Las incidencias (pendientes) ofrecen asignar colaboradores al crear. */
    this.conColaboradores = false;
    this.duplicadoPendiente = null;
  }
  onOpen() {
    this.titleEl.setText(this.titulo);
    const funcs = listFuncionalidades(this.app, this.plugin.settings.carpetaAdmin);
    const func = this.campoEpica(funcs);
    const fn = this.campoFuncionalidad(func);
    const nombre = this.campoTexto(this.labelNombre, this.placeholderNombre);
    const colaboradores = this.conColaboradores ? this.campoColaboradores() : null;
    this.botones(async () => {
      var _a;
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
      if (!ok || !f)
        return;
      const destino = (_a = fn.getFn()) != null ? _a : f;
      const fecha = hoy();
      let base = `${fecha}-${slugify(valor)}`;
      const dir = this.carpeta(destino);
      if (existeEnDir(this.app, dir, base)) {
        const clave = `${destino.folder.path}/${base}`;
        if (this.duplicadoPendiente !== clave) {
          this.duplicadoPendiente = clave;
          this.mostrarError(nombre, MSG_DUPLICADO);
          return;
        }
        base = slugDisponible(this.app, dir, base);
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
        new import_obsidian6.Notice("Gesti\xF3n Producto: error al crear el elemento.");
      }
    });
    if (funcs.length === 0) {
      this.sinEpicas(func);
    }
  }
};
var CrearApunteModal = class extends CrearFechadoModal {
  constructor() {
    super(...arguments);
    this.titulo = "Crear apunte";
    this.labelNombre = "Nombre del apunte";
    this.placeholderNombre = "Escribe un t\xEDtulo para el apunte";
  }
  carpeta(func) {
    return `${func.folder.path}/apuntes`;
  }
  crear(func, base, nombre, fecha) {
    return createApunte(this.app, func, base, nombre, fecha);
  }
};
var AgregarLinkModal = class extends GestorModal {
  constructor(plugin, editor) {
    super(plugin);
    this.editor = editor;
  }
  onOpen() {
    this.titleEl.setText("Agregar link");
    const nombre = this.campoTexto("Nombre", "Ej: Ticket de Jira");
    const desc = this.campoTexto("Descripci\xF3n", "Ej: Ticket relacionado al flujo de login");
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
    this.crearBtn.disabled = true;
    const actualizar = () => {
      this.crearBtn.disabled = !(nombre.input.value.trim() || desc.input.value.trim() || link.input.value.trim());
    };
    for (const campo of [nombre, desc, link]) {
      campo.input.addEventListener("input", actualizar);
    }
    nombre.input.focus();
  }
  insertarEnCursor(callout) {
    const editor = this.editor;
    const cursor = editor.getCursor();
    const linea = editor.getLine(cursor.line);
    const haySiguienteConTexto = cursor.line + 1 < editor.lineCount() && editor.getLine(cursor.line + 1).trim() !== "";
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
};
function construirCalloutLink(nombre, descripcion, link) {
  const titulo = nombre || "Link";
  const lineas = [`> [!link] ${titulo}`];
  if (descripcion)
    lineas.push(`> ${descripcion}`);
  if (link)
    lineas.push(`> [${nombre || link}](${link})`);
  return lineas.join("\n");
}
var CrearReunionModal = class extends CrearFechadoModal {
  constructor() {
    super(...arguments);
    this.titulo = "Crear nota de reuni\xF3n";
    this.labelNombre = "Nombre de la reuni\xF3n";
    this.placeholderNombre = "Ej: Revisi\xF3n de dise\xF1o sprint 3";
  }
  carpeta(func) {
    return `${func.folder.path}/reuniones`;
  }
  crear(func, base, nombre, fecha) {
    return createReunion(this.app, func, base, nombre, fecha);
  }
};
var AsignarSprintModal = class extends GestorModal {
  constructor(plugin, opts = {}) {
    super(plugin);
    /** Asignaciones del año visible: número de sprint → etiquetas seleccionadas. */
    this.edicion = /* @__PURE__ */ new Map();
    /** Todas las asignaciones leídas del archivo (todos los años). */
    this.todosLosSprints = [];
    this.opts = opts;
  }
  onOpen() {
    this.titleEl.setText("Asignar sprints");
    this.modalEl.addClass("gf-modal-sprints");
    const funcs = listFuncionalidades(this.app, this.plugin.settings.carpetaAdmin);
    const epica = this.campoEpica(funcs);
    const fn = this.campoFuncionalidad(epica);
    const anioCampo = this.campoSelect("A\xF1o", "A\xF1o");
    const actual = (/* @__PURE__ */ new Date()).getFullYear();
    const anios = [actual - 1, actual, actual + 1, actual + 2];
    this.setOpciones(
      anioCampo.select,
      "A\xF1o",
      anios.map((a) => ({ value: String(a), label: String(a) }))
    );
    anioCampo.select.value = String(
      this.opts.anio && anios.includes(this.opts.anio) ? this.opts.anio : actual
    );
    const listaWrap = this.contentEl.createDiv({ cls: "gf-sprints-lista" });
    const objetivo = () => {
      var _a;
      return (_a = fn.getFn()) != null ? _a : epica.getFunc();
    };
    this.botones(async () => {
      this.limpiarError(epica);
      const obj = objetivo();
      if (!obj) {
        this.mostrarError(epica, MSG_OBLIGATORIO);
        return;
      }
      const anio = Number(anioCampo.select.value);
      const otros = this.todosLosSprints.filter((s) => s.anio !== anio);
      const visibles = [...this.edicion.entries()].map(
        ([sprint, etiquetas]) => ({ anio, sprint, etiquetas: [...etiquetas] })
      );
      try {
        await guardarSprints(this.app, obj, [...otros, ...visibles]);
        this.close();
      } catch (e) {
        console.error(e);
        new import_obsidian6.Notice("Gesti\xF3n Producto: error al guardar los sprints.");
      }
    }, "Guardar");
    this.crearBtn.disabled = true;
    const cargar = async () => {
      const obj = objetivo();
      this.todosLosSprints = obj ? await leerSprints(this.app, obj) : [];
      this.armarEdicion(Number(anioCampo.select.value));
      this.renderLista(listaWrap);
      this.crearBtn.disabled = !obj;
    };
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
      if (this.opts.funcionalidadSlug)
        fn.seleccionar(this.opts.funcionalidadSlug);
    } else {
      void cargar();
    }
  }
  armarEdicion(anio) {
    this.edicion.clear();
    for (const s of this.todosLosSprints) {
      if (s.anio === anio)
        this.edicion.set(s.sprint, new Set(s.etiquetas));
    }
  }
  renderLista(cont) {
    var _a;
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
        if (!this.edicion.has(n))
          return;
        if (etiquetas.length === 0) {
          chipsWrap.createEl("span", {
            cls: "gf-campo-aviso",
            text: "No hay etiquetas configuradas. Agr\xE9galas en Settings > Gesti\xF3n Producto."
          });
          return;
        }
        const seleccion = this.edicion.get(n);
        if (!seleccion)
          return;
        for (const et of etiquetas) {
          const activa = seleccion.has(et.nombre);
          const chip = chipsWrap.createEl("button", {
            text: et.nombre,
            cls: "gf-chip" + (activa ? " gf-chip-on" : "")
          });
          if (activa) {
            chip.style.backgroundColor = et.color;
            chip.style.borderColor = et.color;
          } else {
            chip.style.borderColor = et.color;
            chip.style.color = et.color;
          }
          chip.addEventListener("click", (e) => {
            e.preventDefault();
            if (seleccion.has(et.nombre))
              seleccion.delete(et.nombre);
            else
              seleccion.add(et.nombre);
            renderChips();
          });
        }
      };
      chk.addEventListener("change", () => {
        var _a2;
        if (chk.checked)
          this.edicion.set(n, (_a2 = this.edicion.get(n)) != null ? _a2 : /* @__PURE__ */ new Set());
        else
          this.edicion.delete(n);
        renderChips();
      });
      renderChips();
    }
    if (this.opts.sprint) {
      (_a = cont.querySelector(`[data-sprint="${this.opts.sprint}"]`)) == null ? void 0 : _a.scrollIntoView({
        block: "center"
      });
    }
  }
};
var CrearPendienteModal = class extends CrearFechadoModal {
  constructor() {
    super(...arguments);
    this.titulo = "Crear pendiente";
    this.labelNombre = "Nombre del pendiente";
    this.placeholderNombre = "Ej: Revisar mockups con el equipo";
    this.conColaboradores = true;
  }
  carpeta(func) {
    return `${func.folder.path}/pendientes`;
  }
  crear(func, base, nombre, fecha) {
    return createPendiente(this.app, func, base, nombre, fecha);
  }
};
var CrearSimpleModal = class extends GestorModal {
  constructor() {
    super(...arguments);
    this.duplicadoPendiente = null;
  }
  onOpen() {
    this.titleEl.setText(this.titulo);
    const funcs = listFuncionalidades(this.app, this.plugin.settings.carpetaAdmin);
    const func = this.campoEpica(funcs);
    const fn = this.campoFuncionalidad(func);
    const nombre = this.campoTexto(this.labelNombre, this.placeholderNombre);
    this.botones(async () => {
      var _a;
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
      if (!ok || !f)
        return;
      const destino = (_a = fn.getFn()) != null ? _a : f;
      let slug = slugify(valor);
      const dir = this.carpeta(destino);
      if (existeEnDir(this.app, dir, slug)) {
        const clave = `${destino.folder.path}/${slug}`;
        if (this.duplicadoPendiente !== clave) {
          this.duplicadoPendiente = clave;
          this.mostrarError(nombre, MSG_DUPLICADO);
          return;
        }
        slug = slugDisponible(this.app, dir, slug);
      }
      try {
        const file = await this.crear(destino, slug, valor);
        this.close();
        await this.abrirNota(file);
      } catch (e) {
        console.error(e);
        new import_obsidian6.Notice("Gesti\xF3n Producto: error al crear el elemento.");
      }
    });
    if (funcs.length === 0) {
      this.sinEpicas(func);
    }
  }
};
var CrearInsumoModal = class extends CrearSimpleModal {
  constructor() {
    super(...arguments);
    this.titulo = "Crear insumo";
    this.labelNombre = "Nombre del insumo";
    this.placeholderNombre = "Escribe un t\xEDtulo para el insumo";
  }
  carpeta(func) {
    return `${func.folder.path}/insumos`;
  }
  crear(func, slug, nombre) {
    return createInsumo(this.app, func, slug, nombre);
  }
};
var CrearHistoriaModal = class extends CrearSimpleModal {
  constructor() {
    super(...arguments);
    this.titulo = "Crear historia";
    this.labelNombre = "Nombre de la historia";
    this.placeholderNombre = "Escribe un t\xEDtulo para la historia";
  }
  carpeta(func) {
    return `${func.folder.path}/historias`;
  }
  crear(func, slug, nombre) {
    return createHistoria(this.app, func, slug, nombre);
  }
};
var MoverEpicaModal = class extends GestorModal {
  onOpen() {
    this.titleEl.setText("Mover \xE9pica");
    const activas = listFuncionalidades(this.app, CARPETA_ACTIVAS);
    const inactivas = listFuncionalidades(this.app, CARPETA_INACTIVAS);
    const seleccion = [];
    const renderGrupo = (titulo, lista, destino) => {
      const grupo = this.contentEl.createDiv({ cls: "gf-campo" });
      grupo.createEl("label", { text: titulo, cls: "gf-campo-label" });
      if (lista.length === 0) {
        grupo.createDiv({ cls: "gf-campo-aviso", text: "Sin \xE9picas." });
        return;
      }
      for (const func of lista) {
        const fila = grupo.createEl("label", { cls: "gf-chk gf-mover-fila" });
        const chk = fila.createEl("input", { type: "checkbox" });
        fila.appendText(` ${func.nombre}`);
        seleccion.push({ func, destino, chk });
      }
    };
    renderGrupo("Activas \u2192 mover a inactivas", activas, CARPETA_INACTIVAS);
    renderGrupo("Inactivas \u2192 regresar a activas", inactivas, CARPETA_ACTIVAS);
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
          new import_obsidian6.Notice(`Gesti\xF3n Producto: ya existe "${s.func.nombre}" en la carpeta destino.`);
          continue;
        }
        try {
          await this.app.fileManager.renameFile(s.func.folder, destino);
          movidas++;
        } catch (e) {
          console.error(e);
          new import_obsidian6.Notice(`Gesti\xF3n Producto: no se pudo mover "${s.func.nombre}".`);
        }
      }
      if (movidas > 0)
        new import_obsidian6.Notice(`Gesti\xF3n Producto: ${movidas} \xE9pica(s) movida(s).`);
      this.close();
    }, "Mover");
    if (activas.length === 0 && inactivas.length === 0) {
      this.crearBtn.disabled = true;
    }
  }
};
var GestionColaboradoresModal = class extends GestorModal {
  onOpen() {
    this.titleEl.setText("Colaboradores");
    const cont = this.contentEl.createDiv();
    this.renderLista(cont);
    const row = this.contentEl.createDiv({ cls: "gf-botones" });
    const cerrar = row.createEl("button", { text: "Cerrar", cls: "mod-cta" });
    cerrar.addEventListener("click", () => this.close());
  }
  renderLista(cont) {
    cont.empty();
    const colaboradores = this.plugin.settings.colaboradores;
    const lista = cont.createDiv({ cls: "gf-etiquetas" });
    if (colaboradores.length === 0) {
      lista.createEl("em", { cls: "gf-campo-aviso", text: "Sin colaboradores a\xFAn." });
    }
    colaboradores.forEach((colab, indice) => {
      const fila = lista.createDiv({ cls: "gf-etiqueta" });
      const color = fila.createEl("input", {
        type: "color",
        cls: "gf-etiqueta-color",
        value: colab.color
      });
      color.addEventListener("change", async () => {
        colab.color = color.value;
        await this.plugin.saveSettings();
      });
      const nombre = fila.createEl("span", { text: colab.nombre, cls: "gf-etiqueta-nombre" });
      nombre.setAttr("title", "Clic para editar");
      nombre.addEventListener("click", () => this.editarNombre(cont, fila, nombre, indice));
      const del = fila.createEl("span", { text: "\xD7", cls: "gf-etiqueta-del" });
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
      value: "#5082ff"
    });
    const input = addRow.createEl("input", {
      type: "text",
      attr: { placeholder: "Nuevo colaborador" }
    });
    const btn = addRow.createEl("button", { text: "Agregar" });
    const error = cont.createDiv({ cls: "gf-campo-error" });
    error.hide();
    const agregar = async () => {
      const valor = input.value.trim();
      if (!valor)
        return;
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
  editarNombre(cont, fila, nombre, indice) {
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
      if (terminado)
        return;
      const valor = input.value.trim();
      if (!valor || valor === original) {
        terminado = true;
        this.renderLista(cont);
        return;
      }
      if (colaboradores.some(
        (c, j) => j !== indice && c.nombre.toLowerCase() === valor.toLowerCase()
      )) {
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
};
var AsignarColaboradorModal = class extends GestorModal {
  constructor() {
    super(...arguments);
    this.seleccionados = /* @__PURE__ */ new Set();
    this.filas = [];
  }
  onOpen() {
    this.titleEl.setText("Asignar colaborador");
    this.modalEl.addClass("gf-modal-sprints");
    const funcs = listFuncionalidades(this.app, this.plugin.settings.carpetaAdmin);
    const epica = this.campoEpica(funcs);
    const fn = this.campoFuncionalidad(epica);
    const colWrap = this.contentEl.createDiv({ cls: "gf-campo" });
    colWrap.createEl("label", { text: "Colaboradores", cls: "gf-campo-label" });
    const chipsDiv = colWrap.createDiv({ cls: "gf-sprint-chips gf-colab-chips" });
    const addRow = colWrap.createDiv({ cls: "gf-etiqueta-add" });
    const inputNuevo = addRow.createEl("input", {
      type: "text",
      attr: { placeholder: "Nuevo colaborador" }
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
        const asignados = getAsignados(this.app, fila.file);
        fila.chk.checked = this.seleccionados.size > 0 && [...this.seleccionados].every((c) => asignados.includes(c));
      }
    };
    const renderChips = () => {
      chipsDiv.empty();
      const colaboradores = this.plugin.settings.colaboradores;
      if (colaboradores.length === 0) {
        chipsDiv.createEl("span", {
          cls: "gf-campo-aviso",
          text: "Sin colaboradores a\xFAn. Agrega uno abajo."
        });
      }
      for (const colab of colaboradores) {
        const activo = this.seleccionados.has(colab.nombre);
        const chip = chipsDiv.createEl("button", {
          text: colab.nombre,
          cls: "gf-chip" + (activo ? " gf-chip-on" : "")
        });
        if (activo) {
          chip.style.backgroundColor = colab.color;
          chip.style.borderColor = colab.color;
        } else {
          chip.style.borderColor = colab.color;
          chip.style.color = colab.color;
        }
        chip.addEventListener("click", (e) => {
          e.preventDefault();
          if (activo)
            this.seleccionados.delete(colab.nombre);
          else
            this.seleccionados.add(colab.nombre);
          renderChips();
          refrescarChecks();
          actualizarBoton();
        });
      }
    };
    const agregarColaborador = async () => {
      const valor = inputNuevo.value.trim();
      if (!valor)
        return;
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
    const ETIQUETA_TIPO = {
      tarea: "Tarea",
      pendiente: "Pendiente"
    };
    const renderIncidencias = () => {
      listaWrap.empty();
      this.filas = [];
      const f = epica.getFunc();
      if (!f)
        return;
      const seleccionFn = fn.getFn();
      const grupos = [];
      if (seleccionFn) {
        grupos.push({ origen: "", incidencias: listIncidencias(this.app, seleccionFn) });
      } else {
        grupos.push({ origen: "", incidencias: listIncidencias(this.app, f) });
        for (const hija of listFuncionalidadesDe(this.app, f.folder)) {
          grupos.push({
            origen: hija.nombre,
            incidencias: listIncidencias(this.app, hija)
          });
        }
      }
      const total = grupos.reduce((n, g) => n + g.incidencias.length, 0);
      if (total === 0) {
        listaWrap.createEl("em", {
          cls: "gf-campo-aviso",
          text: seleccionFn ? "Esta funcionalidad no tiene incidencias a\xFAn." : "Esta \xE9pica no tiene incidencias a\xFAn."
        });
        return;
      }
      for (const grupo of grupos) {
        for (const inc of grupo.incidencias) {
          const fila = listaWrap.createDiv({ cls: "gf-sprint-fila" });
          const cabecera = fila.createDiv({ cls: "gf-sprint-cabecera" });
          if (inc.nivel > 0)
            cabecera.addClass("gf-incidencia-sub");
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
      if (!f || this.seleccionados.size === 0)
        return;
      try {
        for (const fila of this.filas) {
          const previos = getAsignados(this.app, fila.file);
          const actuales = new Set(previos);
          if (fila.chk.checked) {
            for (const c of this.seleccionados)
              actuales.add(c);
          } else {
            for (const c of this.seleccionados)
              actuales.delete(c);
          }
          if (actuales.size === previos.length && previos.every((p) => actuales.has(p))) {
            continue;
          }
          await this.app.fileManager.processFrontMatter(fila.file, (fm) => {
            fm.asignados = [...actuales].sort((a, b) => a.localeCompare(b, "es"));
          });
        }
        this.close();
        new import_obsidian6.Notice("Gesti\xF3n Producto: asignaciones guardadas.");
      } catch (e) {
        console.error(e);
        new import_obsidian6.Notice("Gesti\xF3n Producto: error al guardar las asignaciones.");
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
};
var CrearFuncionalidadNuevaModal = class extends GestorModal {
  onOpen() {
    this.titleEl.setText("Crear funcionalidad");
    const funcs = listFuncionalidades(this.app, this.plugin.settings.carpetaAdmin);
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
      if (!ok || !f)
        return;
      try {
        const file = await createFuncionalidadEn(this.app, f, valor);
        this.close();
        await this.abrirNota(file);
      } catch (e) {
        if (e instanceof YaExisteError) {
          this.mostrarError(nombre, "Ya existe una funcionalidad con ese nombre.");
        } else {
          console.error(e);
          new import_obsidian6.Notice("Gesti\xF3n Producto: error al crear la funcionalidad.");
        }
      }
    });
    if (funcs.length === 0) {
      this.sinEpicas(epica);
    }
  }
};
var CambiarEstadoFuncionalidadModal = class extends GestorModal {
  onOpen() {
    this.titleEl.setText("Cambiar estado de funcionalidad");
    const funcs = listFuncionalidades(this.app, this.plugin.settings.carpetaAdmin);
    const epica = this.campoEpica(funcs);
    const funcionalidad2 = this.campoSelect("Funcionalidad", "Seleccionar funcionalidad");
    funcionalidad2.select.disabled = true;
    const estado = this.campoSelect("Estado", "Seleccionar estado");
    const estados = this.plugin.settings.estados;
    this.setOpciones(
      estado.select,
      "Seleccionar estado",
      estados.map((e) => ({ value: e.valor, label: e.nombre }))
    );
    let lista = [];
    let aviso = null;
    epica.select.addEventListener("change", () => {
      this.limpiarError(funcionalidad2);
      aviso == null ? void 0 : aviso.remove();
      aviso = null;
      const f = epica.getFunc();
      lista = f ? listFuncionalidadesDe(this.app, f.folder) : [];
      if (lista.length === 0) {
        funcionalidad2.select.disabled = true;
        this.setOpciones(funcionalidad2.select, "Seleccionar funcionalidad", []);
        if (f) {
          aviso = funcionalidad2.wrap.createDiv({
            cls: "gf-campo-aviso",
            text: "Esta \xE9pica no tiene funcionalidades a\xFAn."
          });
        }
        this.crearBtn.disabled = true;
      } else {
        funcionalidad2.select.disabled = false;
        this.setOpciones(
          funcionalidad2.select,
          "Seleccionar funcionalidad",
          lista.map((x) => ({ value: x.slug, label: x.nombre }))
        );
        this.crearBtn.disabled = false;
      }
    });
    funcionalidad2.select.addEventListener("change", () => {
      const fn = lista.find((x) => x.slug === funcionalidad2.select.value);
      if ((fn == null ? void 0 : fn.estado) && estados.some((e) => e.valor === fn.estado)) {
        estado.select.value = fn.estado;
      }
    });
    this.botones(async () => {
      this.limpiarError(epica);
      this.limpiarError(funcionalidad2);
      this.limpiarError(estado);
      const f = epica.getFunc();
      const fnSel = lista.find((x) => x.slug === funcionalidad2.select.value);
      const valor = estado.select.value;
      let ok = true;
      if (!f) {
        this.mostrarError(epica, MSG_OBLIGATORIO);
        ok = false;
      }
      if (!fnSel) {
        this.mostrarError(funcionalidad2, MSG_OBLIGATORIO);
        ok = false;
      }
      if (!valor) {
        this.mostrarError(estado, MSG_OBLIGATORIO);
        ok = false;
      }
      if (!ok || !fnSel)
        return;
      try {
        await this.app.fileManager.processFrontMatter(fnSel.file, (fm) => {
          fm.estado = valor;
        });
        this.close();
      } catch (e) {
        console.error(e);
        new import_obsidian6.Notice("Gesti\xF3n Producto: error al cambiar el estado.");
      }
    }, "Guardar");
    if (funcs.length === 0) {
      this.sinEpicas(epica);
    }
  }
};
var CambiarEstadoModal = class extends GestorModal {
  onOpen() {
    this.titleEl.setText("Cambiar estado de \xE9pica");
    const funcs = listFuncionalidades(this.app, this.plugin.settings.carpetaAdmin);
    const epica = this.campoEpica(funcs);
    const estado = this.campoSelect("Estado", "Seleccionar estado");
    const estados = this.plugin.settings.estados;
    this.setOpciones(
      estado.select,
      "Seleccionar estado",
      estados.map((e) => ({ value: e.valor, label: e.nombre }))
    );
    epica.select.addEventListener("change", () => {
      const f = epica.getFunc();
      if ((f == null ? void 0 : f.estado) && estados.some((e) => e.valor === f.estado)) {
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
      if (!ok || !f)
        return;
      try {
        await this.app.fileManager.processFrontMatter(f.file, (fm) => {
          fm.estado = valor;
        });
        this.close();
      } catch (e) {
        console.error(e);
        new import_obsidian6.Notice("Gesti\xF3n Producto: error al cambiar el estado.");
      }
    }, "Guardar");
    if (funcs.length === 0) {
      this.sinEpicas(epica);
    }
  }
};

// src/roadmap.ts
var VIEW_TYPE_ROADMAP = "gestor-funciones-roadmap";
var RoadmapView = class extends import_obsidian7.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.anio = (/* @__PURE__ */ new Date()).getFullYear();
    this.desde = 1;
    this.hasta = 52;
    this.estadosSel = /* @__PURE__ */ new Set();
    this.estadosVistos = /* @__PURE__ */ new Set();
    /** Filtro por tipo de fila: épicas y/o funcionalidades. */
    this.tiposSel = /* @__PURE__ */ new Set(["epica", "funcionalidad"]);
    this.plugin = plugin;
  }
  getViewType() {
    return VIEW_TYPE_ROADMAP;
  }
  getDisplayText() {
    return "Roadmap \u2014 Gesti\xF3n Producto";
  }
  getIcon() {
    return "map";
  }
  async onOpen() {
    await this.render();
  }
  async datos() {
    const filas = [];
    const estados = new Set(this.plugin.settings.estados.map((e) => e.valor));
    const admin = this.plugin.settings.carpetaAdmin.trim();
    if (!admin)
      return { filas, estados: [...estados] };
    const agregar = async (ref, tipo, epicaSlug, etiqueta) => {
      var _a;
      const estado = (_a = ref.estado) != null ? _a : "pendiente";
      estados.add(estado);
      const sprints = (await leerSprints(this.app, ref)).filter((s) => s.anio === this.anio);
      if (sprints.length === 0)
        return;
      const porSprint = /* @__PURE__ */ new Map();
      for (const s of sprints)
        porSprint.set(s.sprint, s.etiquetas);
      filas.push({ ref, tipo, epicaSlug, etiqueta, estado, porSprint });
    };
    for (const epica of listFuncionalidades(this.app, admin)) {
      await agregar(epica, "epica", epica.slug, epica.nombre);
      for (const fn of listFuncionalidadesDe(this.app, epica.folder)) {
        await agregar(fn, "funcionalidad", epica.slug, `${epica.nombre} \u203A ${fn.nombre}`);
      }
    }
    return { filas, estados: [...estados] };
  }
  async render() {
    var _a, _b;
    const cont = this.contentEl;
    cont.empty();
    cont.addClass("gf-roadmap");
    const { filas, estados } = await this.datos();
    for (const e of estados) {
      if (!this.estadosVistos.has(e)) {
        this.estadosVistos.add(e);
        this.estadosSel.add(e);
      }
    }
    const barra = cont.createDiv({ cls: "gf-roadmap-controles" });
    const actual = (/* @__PURE__ */ new Date()).getFullYear();
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
      value: String(this.desde)
    });
    rango.createEl("span", { text: "hasta", cls: "gf-roadmap-lbl" });
    const inputHasta = rango.createEl("input", {
      type: "number",
      cls: "gf-roadmap-num",
      attr: { min: "1", max: "52" },
      value: String(this.hasta)
    });
    const aplicarRango = () => {
      const limpio = (v, defecto) => {
        const n = Math.trunc(Number(v));
        return Number.isFinite(n) && n >= 1 && n <= 52 ? n : defecto;
      };
      this.desde = limpio(inputDesde.value, 1);
      this.hasta = limpio(inputHasta.value, 52);
      if (this.desde > this.hasta)
        [this.desde, this.hasta] = [this.hasta, this.desde];
      void this.render();
    };
    inputDesde.addEventListener("change", aplicarRango);
    inputHasta.addEventListener("change", aplicarRango);
    const tipos = barra.createDiv({ cls: "gf-roadmap-estados" });
    const TIPOS = [
      { valor: "epica", texto: "\xC9picas" },
      { valor: "funcionalidad", texto: "Funcionalidades" }
    ];
    for (const t of TIPOS) {
      const activo = this.tiposSel.has(t.valor);
      const chip = tipos.createEl("button", {
        text: t.texto,
        cls: "gf-chip" + (activo ? " gf-chip-on" : "")
      });
      chip.addEventListener("click", () => {
        if (this.tiposSel.has(t.valor))
          this.tiposSel.delete(t.valor);
        else
          this.tiposSel.add(t.valor);
        void this.render();
      });
    }
    const chips = barra.createDiv({ cls: "gf-roadmap-estados" });
    for (const estado of estados) {
      const activo = this.estadosSel.has(estado);
      const chip = chips.createEl("button", {
        text: estado,
        cls: "gf-chip" + (activo ? " gf-chip-on" : "")
      });
      chip.addEventListener("click", () => {
        if (this.estadosSel.has(estado))
          this.estadosSel.delete(estado);
        else
          this.estadosSel.add(estado);
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
        text: "No hay \xE9picas con sprints asignados para los filtros seleccionados."
      });
      return;
    }
    const wrap = cont.createDiv({ cls: "gf-roadmap-tabla-wrap" });
    const tabla = wrap.createEl("table", { cls: "gf-roadmap-tabla" });
    const trh = tabla.createEl("thead").createEl("tr");
    trh.createEl("th", { text: "\xC9pica", cls: "gf-roadmap-th-epica" });
    for (let n = this.desde; n <= this.hasta; n++) {
      trh.createEl("th", { text: String(n) });
    }
    const tbody = tabla.createEl("tbody");
    for (const fila of visibles) {
      const tr = tbody.createEl("tr");
      const tdNombre = tr.createEl("td", { cls: "gf-roadmap-epica" });
      const a = tdNombre.createEl("a", { cls: "internal-link", text: fila.etiqueta });
      if (fila.tipo === "funcionalidad")
        a.addClass("gf-roadmap-fn");
      a.addEventListener("click", (e) => {
        e.preventDefault();
        void this.app.workspace.getLeaf(false).openFile(fila.ref.file);
      });
      const nombreEstado = (_b = (_a = this.plugin.settings.estados.find((e) => e.valor === fila.estado)) == null ? void 0 : _a.nombre) != null ? _b : fila.estado;
      tdNombre.createEl("span", { cls: "gf-estado-badge", text: nombreEstado });
      for (let n = this.desde; n <= this.hasta; n++) {
        const td = tr.createEl("td", { cls: "gf-roadmap-celda" });
        const etiquetas = fila.porSprint.get(n);
        if (!etiquetas)
          continue;
        td.addClass("gf-roadmap-on");
        td.setAttr(
          "title",
          etiquetas.length > 0 ? etiquetas.join(", ") : `Sprint ${n}`
        );
        const colorPrimera = this.colorDe(etiquetas[0]);
        if (colorPrimera)
          td.style.backgroundColor = conAlpha(colorPrimera, 0.25);
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
          bloque.createEl("span", { cls: "gf-chip gf-chip-mini", text: "\u2026" });
        }
        td.addEventListener("click", () => {
          new AsignarSprintModal(this.plugin, {
            epicaSlug: fila.epicaSlug,
            funcionalidadSlug: fila.tipo === "funcionalidad" ? fila.ref.slug : void 0,
            anio: this.anio,
            sprint: n
          }).open();
        });
      }
    }
  }
  colorDe(nombreEtiqueta) {
    var _a;
    return (_a = this.plugin.settings.etiquetas.find((e) => e.nombre === nombreEtiqueta)) == null ? void 0 : _a.color;
  }
};
function conAlpha(hex, alpha) {
  const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m)
    return hex;
  return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${alpha})`;
}

// src/colaboradores.ts
var import_obsidian8 = require("obsidian");
var VIEW_TYPE_COLABORADORES = "gestor-funciones-colaboradores";
var TareasColaboradorView = class extends import_obsidian8.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    /** Colaboradores seleccionados en el filtro; vacío = mostrar todos. */
    this.seleccionFiltro = /* @__PURE__ */ new Set();
    this.plugin = plugin;
  }
  getViewType() {
    return VIEW_TYPE_COLABORADORES;
  }
  getDisplayText() {
    return "Tareas por colaborador \u2014 Gesti\xF3n Producto";
  }
  getIcon() {
    return "users";
  }
  async onOpen() {
    this.render();
  }
  render() {
    const cont = this.contentEl;
    cont.empty();
    cont.addClass("gf-colab");
    if (!carpetasGestionListas(this.app)) {
      const aviso = cont.createDiv({ cls: "gf-kanban-aviso" });
      aviso.createEl("p", {
        text: "Crea las carpetas de gesti\xF3n desde el panel de acciones antes de continuar."
      });
      const btn = aviso.createEl("button", { text: "Abrir panel de acciones", cls: "mod-cta" });
      btn.addEventListener("click", () => void this.plugin.abrirAcciones());
      return;
    }
    const barra = cont.createDiv({ cls: "gf-roadmap-controles" });
    barra.createEl("span", { text: "Filtrar:", cls: "gf-roadmap-lbl" });
    const chipsFiltro = barra.createDiv({ cls: "gf-roadmap-estados" });
    const renderChipsFiltro = () => {
      chipsFiltro.empty();
      const colaboradores = this.plugin.settings.colaboradores;
      if (colaboradores.length === 0) {
        chipsFiltro.createEl("span", {
          cls: "gf-campo-aviso",
          text: "Sin colaboradores configurados."
        });
        return;
      }
      for (const colab of colaboradores) {
        const activo = this.seleccionFiltro.has(colab.nombre);
        const chip = chipsFiltro.createEl("button", {
          text: colab.nombre,
          cls: "gf-chip" + (activo ? " gf-chip-on" : "")
        });
        if (activo) {
          chip.style.backgroundColor = colab.color;
          chip.style.borderColor = colab.color;
        } else {
          chip.style.borderColor = colab.color;
          chip.style.color = colab.color;
        }
        chip.addEventListener("click", () => {
          if (activo)
            this.seleccionFiltro.delete(colab.nombre);
          else
            this.seleccionFiltro.add(colab.nombre);
          renderChipsFiltro();
          renderCuerpo();
        });
      }
    };
    const recargar = barra.createEl("button", { text: "Recargar", cls: "gf-roadmap-recargar" });
    recargar.addEventListener("click", () => this.render());
    const cuerpo = cont.createDiv();
    const porColaborador = /* @__PURE__ */ new Map();
    for (const colab of this.plugin.settings.colaboradores) {
      porColaborador.set(colab.nombre, []);
    }
    const recoger = (ref, origen) => {
      var _a;
      for (const inc of listIncidencias(this.app, ref)) {
        for (const nombre of getAsignados(this.app, inc.file)) {
          const lista = (_a = porColaborador.get(nombre)) != null ? _a : [];
          lista.push({ ...inc, epica: origen });
          porColaborador.set(nombre, lista);
        }
      }
    };
    for (const func of listFuncionalidades(this.app, this.plugin.settings.carpetaAdmin)) {
      recoger(func, func.nombre);
      for (const fn of listFuncionalidadesDe(this.app, func.folder)) {
        recoger(fn, `${func.nombre} \u203A ${fn.nombre}`);
      }
    }
    const renderCuerpo = () => {
      var _a, _b;
      cuerpo.empty();
      const nombres = [...porColaborador.keys()].filter((n) => this.seleccionFiltro.size === 0 || this.seleccionFiltro.has(n)).sort((a, b) => a.localeCompare(b, "es"));
      if (nombres.length === 0) {
        cuerpo.createEl("em", {
          cls: "gf-kanban-vacio",
          text: "No hay colaboradores para mostrar."
        });
        return;
      }
      for (const nombre of nombres) {
        const incidencias = (_a = porColaborador.get(nombre)) != null ? _a : [];
        const tarjeta = cuerpo.createDiv({ cls: "gf-colab-card" });
        const head = tarjeta.createDiv({ cls: "gf-colab-head" });
        const punto = head.createDiv({ cls: "gf-colab-punto" });
        const color = (_b = this.plugin.settings.colaboradores.find(
          (c) => c.nombre === nombre
        )) == null ? void 0 : _b.color;
        if (color)
          punto.style.backgroundColor = color;
        head.createEl("span", { text: nombre, cls: "gf-colab-nombre" });
        const hechas = incidencias.filter(
          (i) => this.estadoDe(i.file) === "completado"
        ).length;
        const total = incidencias.length;
        const pct = total > 0 ? Math.round(hechas / total * 100) : 0;
        head.createEl("span", {
          cls: "gf-colab-conteo",
          text: total > 0 ? `${hechas} de ${total} hechas (${pct}%)` : "Sin incidencias"
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
            li.appendText(` \u2014 ${inc.epica} \xB7 ${this.estadoLegible(inc.file)}`);
          }
        }
      }
    };
    renderChipsFiltro();
    renderCuerpo();
  }
  estadoDe(file) {
    var _a, _b;
    const estado = (_b = (_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter) == null ? void 0 : _b.estado;
    return estado ? String(estado) : "pendiente";
  }
  estadoLegible(file) {
    var _a, _b;
    const valor = this.estadoDe(file);
    return (_b = (_a = this.plugin.settings.estados.find((e) => e.valor === valor)) == null ? void 0 : _a.nombre) != null ? _b : valor;
  }
  tipoLegible(tipo) {
    const nombres = {
      tarea: "Tarea",
      pendiente: "Pendiente"
    };
    return nombres[tipo];
  }
};

// src/main.ts
var GestorFuncionesPlugin = class extends import_obsidian9.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
  }
  async onload() {
    await this.loadSettings();
    (0, import_obsidian9.addIcon)(ICONO_PLUGIN, ICONO_PLUGIN_SVG);
    this.addSettingTab(new GestorSettingTab(this.app, this));
    registerDashboard(this);
    this.registerView(VIEW_TYPE_ACCIONES, (leaf) => new AccionesView(leaf, this));
    this.addRibbonIcon(
      ICONO_PLUGIN,
      "Gesti\xF3n Producto: Panel de acciones",
      () => void this.toggleAcciones()
    );
    this.registerView(VIEW_TYPE_KANBAN, (leaf) => new KanbanView(leaf, this));
    this.registerView(VIEW_TYPE_ROADMAP, (leaf) => new RoadmapView(leaf, this));
    this.registerView(VIEW_TYPE_COLABORADORES, (leaf) => new TareasColaboradorView(leaf, this));
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor) => {
        menu.addItem(
          (item) => item.setTitle("Agregar link").setIcon("link").onClick(() => new AgregarLinkModal(this, editor).open())
        );
      })
    );
    this.addCommand({
      id: "crear-funcionalidad",
      name: "Crear \xE9pica",
      callback: () => this.abrirModal("funcionalidad")
    });
    this.addCommand({
      id: "crear-funcionalidad-modulo",
      name: "Crear funcionalidad",
      callback: () => this.abrirModal("crearfn")
    });
    this.addCommand({
      id: "cambiar-estado-funcionalidad",
      name: "Cambiar estado de funcionalidad",
      callback: () => this.abrirModal("estadofn")
    });
    this.addCommand({
      id: "crear-tarea",
      name: "Crear tarea",
      callback: () => this.abrirModal("tarea")
    });
    this.addCommand({
      id: "crear-apunte",
      name: "Crear apunte",
      callback: () => this.abrirModal("apunte")
    });
    this.addCommand({
      id: "crear-nota-reunion",
      name: "Crear nota de reuni\xF3n",
      callback: () => this.abrirModal("reunion")
    });
    this.addCommand({
      id: "crear-pendiente",
      name: "Crear pendiente",
      callback: () => this.abrirModal("pendiente")
    });
    this.addCommand({
      id: "crear-insumo",
      name: "Crear insumo",
      callback: () => this.abrirModal("insumo")
    });
    this.addCommand({
      id: "crear-historia",
      name: "Crear historia",
      callback: () => this.abrirModal("historia")
    });
    this.addCommand({
      id: "asignar-sprints",
      name: "Asignar sprint",
      callback: () => this.abrirModal("sprint")
    });
    this.addCommand({
      id: "cambiar-estado-epica",
      name: "Cambiar estado de \xE9pica",
      callback: () => this.abrirModal("estado")
    });
    this.addCommand({
      id: "mover-epica",
      name: "Mover \xE9pica",
      callback: () => this.abrirModal("mover")
    });
    this.addCommand({
      id: "asignar-colaborador",
      name: "Asignar colaborador",
      callback: () => this.abrirModal("asignar")
    });
    this.addCommand({
      id: "gestion-colaboradores",
      name: "Colaboradores",
      callback: () => this.abrirModal("colaboradores")
    });
    this.addCommand({
      id: "tareas-por-colaborador",
      name: "Tareas por colaborador",
      callback: () => void this.abrirTareasColaborador()
    });
    this.addCommand({
      id: "abrir-tablero-kanban",
      name: "Abrir gesti\xF3n de incidencias",
      callback: () => void this.abrirKanban()
    });
    this.addCommand({
      id: "recargar-tablero",
      name: "Recargar tablero",
      callback: () => {
        const hoja = this.app.workspace.getLeavesOfType(VIEW_TYPE_KANBAN)[0];
        if (hoja && hoja.view instanceof KanbanView)
          void hoja.view.recargar();
      }
    });
    this.addCommand({
      id: "abrir-roadmap",
      name: "Abrir roadmap",
      callback: () => void this.abrirRoadmap()
    });
  }
  abrirModal(tipo) {
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
  async toggleAcciones() {
    const hojas = this.app.workspace.getLeavesOfType(VIEW_TYPE_ACCIONES);
    if (hojas.length > 0) {
      this.app.workspace.detachLeavesOfType(VIEW_TYPE_ACCIONES);
      return;
    }
    await this.abrirAcciones();
  }
  /** Abre el panel de acciones (sin alternar). */
  async abrirAcciones() {
    const existente = this.app.workspace.getLeavesOfType(VIEW_TYPE_ACCIONES)[0];
    if (existente) {
      await this.app.workspace.revealLeaf(existente);
      return;
    }
    const hoja = this.app.workspace.getLeftLeaf(false);
    if (!hoja)
      return;
    await hoja.setViewState({ type: VIEW_TYPE_ACCIONES, active: true });
    await this.app.workspace.revealLeaf(hoja);
  }
  async abrirKanban() {
    await this.abrirVistaEnPestana(VIEW_TYPE_KANBAN);
  }
  async abrirRoadmap() {
    await this.abrirVistaEnPestana(VIEW_TYPE_ROADMAP);
  }
  async abrirTareasColaborador() {
    await this.abrirVistaEnPestana(VIEW_TYPE_COLABORADORES);
  }
  /**
   * Abre la vista como pestaña del área principal. Si quedó anclada en un
   * panel lateral (layouts guardados de versiones anteriores), la desancla
   * y la vuelve a abrir como pestaña.
   */
  async abrirVistaEnPestana(tipo) {
    const existente = this.app.workspace.getLeavesOfType(tipo)[0];
    if (existente && existente.getRoot() === this.app.workspace.rootSplit) {
      await this.app.workspace.revealLeaf(existente);
      return;
    }
    existente == null ? void 0 : existente.detach();
    const hoja = this.app.workspace.getLeaf("tab");
    await hoja.setViewState({ type: tipo, active: true });
    await this.app.workspace.revealLeaf(hoja);
  }
  async loadSettings() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
    const data = (_a = await this.loadData()) != null ? _a : {};
    const etiquetas = ((_b = data.etiquetas) != null ? _b : []).map(
      (e) => typeof e === "string" ? { nombre: e, color: COLOR_ETIQUETA_DEFECTO } : { nombre: String(e.nombre), color: e.color || COLOR_ETIQUETA_DEFECTO }
    );
    const estados = ESTADOS_DEFECTO.map((defecto) => {
      var _a2, _b2;
      const guardado = ((_a2 = data.estados) != null ? _a2 : []).find((e) => (e == null ? void 0 : e.valor) === defecto.valor);
      return { nombre: (_b2 = guardado == null ? void 0 : guardado.nombre) != null ? _b2 : defecto.nombre, valor: defecto.valor };
    });
    for (const e of (_c = data.estados) != null ? _c : []) {
      if ((e == null ? void 0 : e.nombre) && (e == null ? void 0 : e.valor) && !estados.some((x) => x.valor === e.valor)) {
        estados.push({ nombre: String(e.nombre), valor: String(e.valor) });
      }
    }
    const colaboradores = ((_d = data.colaboradores) != null ? _d : []).map((c) => ({
      nombre: String(c.nombre),
      color: c.color || COLOR_ETIQUETA_DEFECTO
    }));
    const filtro = (_e = data.kanban) == null ? void 0 : _e.filtroSprints;
    let carriles = ((_g = (_f = data.kanban) == null ? void 0 : _f.carriles) == null ? void 0 : _g.length) ? [...data.kanban.carriles] : [...CARRILES_DEFECTO];
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
        tareas: { ...(_i = (_h = data.kanban) == null ? void 0 : _h.tareas) != null ? _i : {} },
        pendientes: { ...(_k = (_j = data.kanban) == null ? void 0 : _j.pendientes) != null ? _k : {} },
        filtroSprints: {
          desde: (filtro == null ? void 0 : filtro.desde) && filtro.desde >= 1 && filtro.desde <= 52 ? filtro.desde : 1,
          hasta: (filtro == null ? void 0 : filtro.hasta) && filtro.hasta >= 1 && filtro.hasta <= 52 ? filtro.hasta : 52
        }
      }
    };
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
