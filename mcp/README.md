# Gestor Funciones — Servidor MCP

Servidor [MCP](https://modelcontextprotocol.io) que conecta **Claude** (Claude Desktop, Claude Code, etc.) con la información que tu plugin de Obsidian **Gestión Producto** guarda en tus vaults.

Permite hablarle a Claude en lenguaje natural para **leer y gestionar** tus épicas, tareas, sub-tareas, pendientes, apuntes, reuniones, insumos e historias.

- ✅ **100% local.** No usa internet. Lee y escribe directamente los archivos `.md` de tus vaults en tu disco.
- ✅ **Multi-vault sin mezclar.** Cada operación indica sobre qué vault trabaja; el servidor nunca cruza información entre vaults distintos.

---

## Requisitos

- **Node.js 18 o superior** instalado. Compruébalo con `node --version`.
  - Si no lo tienes: descárgalo de [nodejs.org](https://nodejs.org).
- El plugin **Gestión Producto** instalado y usado en uno o más vaults de Obsidian.

---

## Instalación

1. Abre una terminal en esta carpeta (`mcp/`) e instala las dependencias:

   ```bash
   cd mcp
   npm install
   ```

2. **Configura tus vaults.** Crea un archivo `vaults.json` (puedes copiar `vaults.example.json`) que liste cada vault con un nombre corto y su ruta absoluta:

   ```json
   {
     "vaults": [
       { "nombre": "trabajo", "ruta": "/Users/leo/Documents/MiVaultTrabajo" },
       { "nombre": "personal", "ruta": "/Users/leo/Documents/MiVaultPersonal" }
     ]
   }
   ```

   - El `nombre` es como te referirás al vault al hablar con Claude ("usa el vault de trabajo").
   - La `ruta` es la carpeta raíz del vault (la que abres en Obsidian).
   - Para saber la ruta exacta en Mac: en Obsidian, clic derecho sobre cualquier nota → "Show in system explorer", o revisa Settings → About.

   > Si solo configuras **un** vault, no hace falta nombrarlo al hablar con Claude.

---

## Conectar con Claude Desktop

Claude Desktop lee su configuración de MCP desde un archivo JSON. En **Mac** está en:

```
~/Library/Application Support/Claude/claude_desktop_config.json
```

> La forma fácil de abrirlo: en Claude Desktop ve a **Settings → Developer → Edit Config**. Eso crea y abre el archivo por ti.

Añade tu servidor dentro de `mcpServers` (ajusta las rutas a las tuyas):

```json
{
  "mcpServers": {
    "gestor-funciones": {
      "command": "node",
      "args": ["/Users/leo/Documents/plugin-gestor-funciones/mcp/src/index.js"],
      "env": {
        "GESTOR_VAULTS_CONFIG": "/Users/leo/Documents/plugin-gestor-funciones/mcp/vaults.json"
      }
    }
  }
}
```

Notas:
- `command` debe ser la ruta a `node`. Si `node` no se encuentra, usa la ruta completa (en tu Mac con Homebrew suele ser `/opt/homebrew/bin/node`).
- Si ya tienes otros servidores en `mcpServers`, solo agrega la entrada `"gestor-funciones"` junto a los demás.

Guarda el archivo y **reinicia Claude Desktop por completo** (ciérralo desde el menú, no solo la ventana). Al volver a abrir, deberías ver las herramientas del servidor disponibles (icono de herramientas / conectores).

---

## Cómo usarlo (ejemplos)

Una vez conectado, háblale a Claude con naturalidad:

- "Lista las épicas de mi vault de trabajo."
- "Dame el detalle de la épica *Sistema de Login*: ¿qué tareas y pendientes tiene y en qué estado?"
- "Crea una tarea *Validar formulario* en la épica *Sistema de Login*."
- "Crea una sub-tarea *Bocetos en Figma* dentro de la tarea *Diseñar pantalla de login*."
- "Marca la tarea *Diseñar pantalla de login* como en-progreso."
- "Crea una nota de reunión *Kickoff con diseño* en esa épica."
- "Busca dónde menciono 'contraseñas' en el vault personal."

> Como el MCP escribe los mismos archivos que el plugin, los cambios aparecen en Obsidian automáticamente (puede que tardes un segundo o necesites cambiar de nota para refrescar el dashboard).

---

## Herramientas disponibles

| Herramienta | Qué hace |
|---|---|
| `listar_vaults` | Lista los vaults configurados. |
| `listar_epicas` | Lista las épicas (activas e inactivas) de un vault. |
| `detalle_epica` | Detalle completo de una épica: tareas, sub-tareas, pendientes, apuntes, reuniones, insumos, historias. |
| `leer_nota` | Lee el Markdown completo de una nota. |
| `buscar` | Busca texto en nombres y contenido de las notas. |
| `crear_epica` | Crea una épica nueva. |
| `crear_funcionalidad` | Crea una funcionalidad dentro de una épica. |
| `crear_tarea` | Crea una tarea y la enlaza en el dashboard. |
| `crear_subtarea` | Crea una sub-tarea dentro de una tarea. |
| `crear_pendiente` | Crea un pendiente. |
| `crear_apunte` | Crea un apunte (opcionalmente con texto). |
| `crear_reunion` | Crea una nota de reunión. |
| `crear_insumo` | Crea un insumo. |
| `crear_historia` | Crea una historia de usuario. |
| `cambiar_estado` | Cambia el `estado` (backlog, pendiente, en-progreso, completado…) de una nota. |

---

## Seguridad y privacidad

El servidor solo accede a las carpetas que listes en `vaults.json` y se comunica con Claude por entrada/salida estándar en tu propia máquina. **Tus notas no salen de tu computadora.**

`vaults.json` está en `.gitignore` para que no subas tus rutas locales a GitHub.

---

## Mantener sincronizado con el plugin

Este servidor replica las convenciones del plugin (estructura de carpetas y plantillas de frontmatter) en:

- `src/slug.js` ← `src/utils.ts` del plugin
- `src/templates.js` ← `src/templates.ts` del plugin
- `src/vault.js` ← lógica de `src/files.ts` del plugin

Si cambias esas convenciones en el plugin, actualiza también estos archivos.
