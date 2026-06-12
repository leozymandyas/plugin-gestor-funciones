# Gestor Funciones — Plugin para Obsidian

Plugin para Product Owners que concentra toda la información de una funcionalidad de software en un solo lugar: tareas, sub-tareas, apuntes y notas de reunión, todo como archivos `.md` dentro del vault.

## Características

- **Botón flotante (FAB)** con ícono de chip en la esquina inferior derecha del editor, con menú para crear funcionalidades, tareas, sub-tareas, apuntes y notas de reunión.
- **Comandos en la paleta** (`Cmd/Ctrl + P`): los cinco mismos accesos como `Gestor Funciones: Crear …`.
- **Estructura de carpetas automática** por funcionalidad: `tareas/`, `apuntes/`, `reuniones/`, con nombres slugificados (`Diseñar pantalla de login` → `disenar-pantalla-de-login.md`).
- **Vista unificada**: la nota principal de cada funcionalidad (frontmatter `tipo: funcionalidad`) se renderiza en modo lectura como dashboard, con tareas como checkboxes (que actualizan el `estado` del frontmatter de la tarea al hacer clic), sub-tareas anidadas, y apuntes/reuniones ordenados por fecha descendente.
- **Conversión automática de tareas en carpetas** al crear su primera sub-tarea; la nota de la tarea se mueve adentro y Obsidian actualiza los wikilinks.

## Configuración

Settings > Community plugins > Gestor Funciones > Options:

- **Carpeta de administración**: ruta relativa dentro del vault donde se guardan las funcionalidades (ej. `Admin en Obsidian`). Si no existe, se crea automáticamente.

Si intentas crear algo sin haber configurado la carpeta, el plugin muestra un aviso con un botón que abre la configuración.

## Instalación manual (descargando desde GitHub)

> Mientras el plugin no esté disponible en los _Community plugins_ oficiales de Obsidian, esta es la forma de instalarlo.

1. Descarga estos **tres archivos** desde este repositorio (botón derecho → "Guardar enlace como…", o ábrelos y usa el botón de descarga **Download raw file**):
   - `manifest.json`
   - `main.js`
   - `styles.css`
2. En tu vault de Obsidian, crea (si no existe) la carpeta:
   ```
   <tu-vault>/.obsidian/plugins/gestor-funciones/
   ```
   > La carpeta `.obsidian` está oculta. En Mac pulsa `Cmd + Shift + .` en Finder para ver carpetas ocultas.
3. Copia los tres archivos descargados dentro de esa carpeta.
4. Abre Obsidian, ve a **Settings → Community plugins**, activa el modo (si te lo pide) y enciende **Gestión Producto**.

> 💡 Si actualizo el plugin, solo vuelve a descargar `main.js` (y `manifest.json` si cambió la versión) y reemplaza los archivos. Luego desactiva y reactiva el plugin en Obsidian.

## Desarrollo

```bash
npm install
npm run dev     # compila en modo watch
npm run build   # verificación de tipos + build de producción (main.js)
```

Solo Obsidian Desktop (Mac/Windows/Linux). Interfaz en español.

## Publicar en Obsidian

Para llevar el plugin al catálogo oficial de Community Plugins, sigue
[`PUBLICAR-EN-OBSIDIAN.md`](PUBLICAR-EN-OBSIDIAN.md). El historial de versiones está
en [`CHANGELOG.md`](CHANGELOG.md).

## Integración con Claude (MCP)

En la carpeta [`mcp/`](mcp/) hay un servidor MCP local que permite gestionar tus épicas, tareas y notas hablándole en lenguaje natural a Claude (Claude Desktop, Claude Code, etc.), sin conexión a internet y respetando la separación entre distintos vaults. Consulta [`mcp/README.md`](mcp/README.md) para instalarlo y conectarlo.
