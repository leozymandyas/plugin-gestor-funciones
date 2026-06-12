# Servidor MCP — Gestión Producto

Servidor [MCP](https://modelcontextprotocol.io) que conecta un asistente de IA (como
**Claude Desktop**) con la información que el plugin **Gestión Producto** guarda en tus
vaults de Obsidian.

Con él puedes hablarle a la IA en lenguaje natural para **leer y gestionar** tus épicas,
funcionalidades, tareas, pendientes, apuntes, reuniones, insumos, historias y las
etiquetas de sprint.

- ✅ **100% local.** No usa internet: lee y escribe directamente los archivos `.md` de
  tus vaults, en tu propia máquina.
- ✅ **Multi-vault sin mezclar.** Cada operación indica sobre qué vault trabaja; el
  servidor nunca cruza información entre vaults distintos.

Es **opcional**: el plugin funciona perfectamente sin esto. Úsalo solo si quieres operar
tu sistema de producto desde una IA.

---

## Instalación

### Opción A — Instalación asistida por IA (recomendada)

Si usas un asistente de IA con acceso a tu equipo (como Claude), pídele que siga el
documento **[`INSTALACION-ASISTIDA.md`](INSTALACION-ASISTIDA.md)**. Ese archivo está
escrito para que la IA haga la instalación por ti, paso a paso, preguntándote solo lo
indispensable (como la ruta de tu vault).

### Opción B — Instalación manual

**Requisitos:** [Node.js](https://nodejs.org) 18 o superior (`node --version` para
comprobarlo).

1. **Instala las dependencias:**
   ```bash
   cd mcp
   npm install
   ```

2. **Configura tus vaults.** Copia el ejemplo y edítalo:
   ```bash
   cp vaults.example.json vaults.json
   ```
   Deja en `vaults.json` cada vault con un nombre corto y la ruta de la carpeta que abres
   en Obsidian:
   ```json
   {
     "vaults": [
       { "nombre": "trabajo", "ruta": "/ruta/a/tu/Vault" }
     ]
   }
   ```
   > Para conocer la ruta exacta: en Obsidian, clic derecho sobre cualquier nota →
   > "Show in system explorer". Si solo configuras un vault, no hace falta nombrarlo al
   > hablar con la IA.

3. **Conéctalo a Claude Desktop.** Abre **Settings → Developer → Edit Config** (eso abre
   el archivo `claude_desktop_config.json`) y añade tu servidor dentro de `mcpServers`,
   conservando lo que ya tenga el archivo:
   ```json
   {
     "mcpServers": {
       "gestor-funciones": {
         "command": "node",
         "args": ["/ruta/absoluta/al/repo/mcp/src/index.js"],
         "env": {
           "GESTOR_VAULTS_CONFIG": "/ruta/absoluta/al/repo/mcp/vaults.json"
         }
       }
     }
   }
   ```
   > Si `node` no se encuentra, usa su ruta completa (en macOS con Homebrew suele ser
   > `/opt/homebrew/bin/node`; compruébalo con `which node`).

4. **Reinicia Claude Desktop por completo** (ciérralo del todo y vuelve a abrirlo).

---

## Cómo usarlo

Háblale a la IA con naturalidad, por ejemplo:

- "Lista las épicas de mi vault de trabajo."
- "Dame el detalle de la épica *Sistema de Login*: ¿qué tareas y pendientes tiene y en qué estado?"
- "Crea una tarea *Validar formulario* en la épica *Sistema de Login*."
- "Marca esa tarea como en progreso."
- "Crea una nota de reunión *Kickoff* en esa épica."
- "Agrega las etiquetas de sprint *Frontend*, *Backend* y *QA*." (requiere recargar Obsidian)
- "Busca dónde menciono 'contraseñas'."

Como el servidor escribe los mismos archivos que el plugin, los cambios aparecen en
Obsidian (puede tardar un instante o requerir cambiar de nota para refrescar).

> ⚠️ **Etiquetas de sprint:** agregar o eliminar etiquetas modifica la configuración del
> plugin. Para que el cambio se vea, **recarga Obsidian** (paleta de comandos → "Reload
> app without saving") o ciérralo y ábrelo. La IA te lo recordará al hacerlo.

> ℹ️ **Tras actualizar el servidor:** si cambias el código del MCP, reinicia Claude
> Desktop para que cargue la versión nueva (el servidor no se recarga solo).

---

## Herramientas disponibles

| Herramienta | Qué hace |
|---|---|
| `listar_vaults` | Lista los vaults configurados. |
| `listar_epicas` | Lista las épicas (activas e inactivas) de un vault. |
| `detalle_epica` | Detalle completo de una épica: funcionalidades, tareas, sub-tareas, pendientes, apuntes, reuniones, insumos, historias. |
| `leer_nota` | Lee el Markdown completo de una nota. |
| `buscar` | Busca texto en nombres y contenido de las notas. |
| `crear_epica` | Crea una épica (elemento principal). |
| `crear_funcionalidad` | Crea una funcionalidad dentro de una épica. |
| `crear_tarea` | Crea una tarea y la enlaza en el dashboard. |
| `crear_subtarea` | Crea una sub-tarea dentro de una tarea. |
| `crear_pendiente` | Crea un pendiente. |
| `crear_apunte` | Crea un apunte (opcionalmente con texto). |
| `crear_reunion` | Crea una nota de reunión. |
| `crear_insumo` | Crea un insumo. |
| `crear_historia` | Crea una historia de usuario. |
| `cambiar_estado` | Cambia el estado de una nota (tarea, pendiente, funcionalidad…). |
| `listar_etiquetas` | Lista las etiquetas de sprint configuradas. |
| `agregar_etiqueta` | Agrega una etiqueta de sprint. |
| `eliminar_etiqueta` | Elimina una etiqueta de sprint. |

---

## Privacidad

El servidor solo accede a las carpetas que indiques en `vaults.json` y se comunica con la
IA por entrada/salida estándar, en tu propia máquina. **Tus notas no salen de tu equipo.**
El archivo `vaults.json` está en `.gitignore` para que tus rutas personales no se suban a
ningún repositorio.
