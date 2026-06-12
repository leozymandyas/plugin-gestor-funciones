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

## Instalación manual

Copia `manifest.json`, `main.js` y `styles.css` a:

```
<vault>/.obsidian/plugins/gestor-funciones/
```

Luego activa **Gestor Funciones** en Settings > Community plugins.

## Desarrollo

```bash
npm install
npm run dev     # compila en modo watch
npm run build   # verificación de tipos + build de producción (main.js)
```

Solo Obsidian Desktop (Mac/Windows/Linux). Interfaz en español.
