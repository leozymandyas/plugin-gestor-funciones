# Guía para publicar el plugin en los Community Plugins de Obsidian

Esta guía explica, paso a paso, cómo llevar **Gestión Producto** desde tu repositorio
de GitHub hasta el catálogo oficial de **Community Plugins** de Obsidian, para que
cualquier usuario lo instale desde la propia app sin descargar archivos a mano.

> Repositorio: `leozymandyas/plugin-gestor-funciones`
> ID del plugin: `gestor-funciones`

---

## Resumen del proceso

1. Cumplir los **requisitos** del repositorio (esta guía ya los deja casi listos).
2. Compilar `main.js` de producción.
3. Crear un **Release** en GitHub con los archivos del plugin.
4. Abrir un **Pull Request** al repo oficial `obsidianmd/obsidian-releases`.
5. Esperar la revisión del bot automático y del equipo de Obsidian.

La aprobación es **una sola vez**. Después, cada actualización solo necesita un nuevo
Release (paso 3); no hay que volver a abrir PRs.

---

## 1. Requisitos del repositorio

Obsidian exige que el repositorio público tenga, en la **raíz**:

| Archivo | Estado | Notas |
|---|---|---|
| `manifest.json` | ✅ | Con `id`, `name`, `version`, `minAppVersion`, `description`, `author`. |
| `main.js` | ✅ | El plugin compilado (ya no está ignorado por git). |
| `styles.css` | ✅ | Estilos del plugin. |
| `versions.json` | ✅ | Mapea cada versión con su `minAppVersion`. |
| `LICENSE` | ✅ | Licencia MIT incluida. |
| `README.md` | ✅ | Describe qué hace el plugin. |

### Revisa tu `manifest.json`

Las reglas que valida Obsidian:

- **`id`**: en minúsculas, con guiones, **sin** la palabra `obsidian`. → `gestor-funciones` ✅
- **`name`**: no debe contener la palabra "Obsidian". → `Gestión Producto` ✅
- **`description`**: máximo ~250 caracteres, en inglés idealmente pero se acepta otro
  idioma; debe terminar en punto y no empezar con "This plugin" / "A plugin".
  La tuya tiene 200 caracteres ✅
- **`isDesktopOnly`**: `true` porque usa funciones de escritorio. ✅
- **`version`**: debe coincidir **exactamente** con el tag del Release (ver paso 3).

**Campos opcionales recomendados** (puedes añadirlos a `manifest.json`):

```json
"authorUrl": "https://github.com/leozymandyas",
"fundingUrl": "https://github.com/sponsors/leozymandyas"
```

> `authorUrl` aparece como enlace bajo tu nombre en la lista de plugins.
> `fundingUrl` es opcional (donaciones); puedes omitirlo.

---

## 2. Compilar `main.js`

Antes de cada Release, genera el `main.js` de producción para asegurarte de que
incluye tus últimos cambios:

```bash
npm install      # solo la primera vez
npm run build    # verifica tipos y genera main.js
```

Confirma que `main.js`, `manifest.json` y `styles.css` están actualizados y commiteados.

---

## 3. Crear el Release en GitHub

El Release es lo que Obsidian descarga para instalar el plugin.

1. En GitHub, ve a tu repo → pestaña **Releases** → **Draft a new release**.
2. En **Choose a tag**, escribe el número de versión **exactamente igual** al
   `version` del `manifest.json`, **sin la letra `v`**.
   - Si `manifest.json` dice `"version": "1.6.0"`, el tag es `1.6.0` (❌ no `v1.6.0`).
3. Pon un título (por ejemplo `1.6.0`) y, opcionalmente, las notas del cambio.
4. En **Attach binaries**, sube **estos tres archivos** como adjuntos del Release:
   - `manifest.json`
   - `main.js`
   - `styles.css`
   > Es obligatorio subirlos como **archivos adjuntos** del Release, no basta con que
   > estén en el código fuente.
5. **Publish release**.

> ⚠️ El tag y el `version` del manifest deben ser idénticos o la validación falla.

---

## 4. Abrir el Pull Request a `obsidian-releases`

Este paso registra tu plugin en el catálogo. Solo se hace **una vez**.

1. Ve a [`obsidianmd/obsidian-releases`](https://github.com/obsidianmd/obsidian-releases).
2. Abre el archivo `community-plugins.json` y haz clic en el lápiz (editar): GitHub
   creará un fork automáticamente.
3. Al **final** del arreglo (después del último `}`, añadiendo una coma), agrega tu
   entrada:

   ```json
   {
       "id": "gestor-funciones",
       "name": "Gestión Producto",
       "author": "Leo",
       "description": "Concentra toda la información de una épica de producto en un solo lugar: tareas, sub-tareas, apuntes, reuniones, pendientes, insumos, historias, sprints y roadmap como notas Markdown dentro del vault.",
       "repo": "leozymandyas/plugin-gestor-funciones"
   }
   ```

   - `repo` es `usuario/repositorio` (sin `https://github.com/`).
   - `id`, `name`, `author` y `description` deben coincidir con tu `manifest.json`.
4. **Commit changes** → **Propose changes** → **Create pull request**.
5. Al abrir el PR aparece una **plantilla con una lista de verificación**: léela y
   marca las casillas que apliquen (confirmas que tienes el Release, LICENSE, etc.).

---

## 5. Revisión y aprobación

- Un **bot** valida automáticamente tu repo y tu Release (manifest, archivos
  adjuntos, coincidencia de versión, etc.). Si algo falla, comenta en el PR qué
  corregir; arréglalo y el bot vuelve a revisar.
- Después, un miembro del equipo de Obsidian hace una **revisión manual** del código.
  Puede pedir cambios (suele tardar; ten paciencia).
- Cuando lo aprueban y hacen merge, tu plugin aparece en
  **Settings → Community plugins → Browse** para todos los usuarios.

Errores comunes que rechazan el PR:
- El tag del Release tiene `v` (debe ser `1.6.0`, no `v1.6.0`).
- Falta subir `main.js`/`manifest.json` como adjuntos del Release.
- `id` o `description` no coinciden entre el PR y el manifest.
- Falta el archivo `LICENSE`.

---

## 6. Publicar actualizaciones más adelante

Una vez aprobado, actualizar es sencillo y **no** requiere otro PR:

1. Haz tus cambios y sube la versión en `manifest.json`, `package.json` y añade la
   nueva clave en `versions.json` (versión → `minAppVersion`).
2. `npm run build` para regenerar `main.js`.
3. Crea un **nuevo Release** con el tag de la nueva versión y los tres archivos
   adjuntos (paso 3).

Obsidian detecta el nuevo Release y ofrece la actualización a los usuarios.

> 💡 Truco: el comando `npm version <nueva-version>` puede automatizar el bump si
> configuras un `version-bump` script. Por ahora, hacerlo a mano está bien.

---

## Checklist rápido antes de enviar

- [ ] `manifest.json`, `main.js`, `styles.css`, `versions.json`, `LICENSE`, `README.md` en la raíz.
- [ ] `version` del manifest = tag del Release (sin `v`).
- [ ] Release publicado con los 3 archivos adjuntos.
- [ ] Repo público.
- [ ] Entrada añadida a `community-plugins.json` con datos que coinciden con el manifest.
- [ ] PR abierto con la lista de verificación marcada.
