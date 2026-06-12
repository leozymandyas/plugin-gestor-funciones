# Instalación asistida por IA del servidor MCP

> **Para el usuario:** entrega este archivo a un asistente de IA que tenga acceso a una
> terminal en tu equipo (por ejemplo, Claude Code o Claude Desktop con herramientas de
> sistema) y pídele: *"Instala este MCP siguiendo este documento."* La IA hará el resto y
> te preguntará solo lo indispensable.

> **Para la IA:** este documento es un runbook. Ejecútalo paso por paso. No asumas rutas:
> detéctalas o pregúntalas. Antes de modificar cualquier archivo de configuración, haz un
> respaldo. Reporta al usuario el resultado de cada paso y, al final, qué debe hacer él.

---

## Objetivo

Dejar funcionando el servidor MCP `gestor-funciones` para que el usuario gestione su
plugin de Obsidian **Gestión Producto** desde una IA. La instalación implica: instalar
dependencias, crear `vaults.json` con la ruta del/los vault(s), y registrar el servidor
en la configuración del cliente de IA (Claude Desktop).

## Datos que necesitarás del usuario

Pregunta solo lo que no puedas detectar tú mismo:

1. **La ruta de la carpeta de su vault de Obsidian** (la carpeta que abre en Obsidian, la
   que contiene la subcarpeta oculta `.obsidian`). Si tiene varios vaults con el plugin,
   pídele la ruta y un nombre corto para cada uno.
2. **Qué cliente de IA usará** para hablar con el MCP (por defecto: Claude Desktop).

> Cómo ayudar al usuario a encontrar la ruta del vault: en Obsidian, clic derecho sobre
> cualquier nota → "Show in system explorer" / "Mostrar en el explorador"; la carpeta del
> vault es la raíz que contiene `.obsidian`.

---

## Paso 1 — Comprobar Node.js

Ejecuta `node --version`. Debe ser 18 o superior.

- Si no está instalado o es muy viejo, detente y pide al usuario que instale Node.js
  desde https://nodejs.org (versión LTS). No continúes sin esto.
- Guarda la ruta del ejecutable (`which node` en macOS/Linux, `where node` en Windows);
  la necesitarás en el Paso 4. En macOS con Homebrew suele ser `/opt/homebrew/bin/node`.

## Paso 2 — Instalar dependencias

Ubica la carpeta `mcp/` de este repositorio (es la carpeta donde está este archivo).
Desde ahí, ejecuta:

```bash
npm install
```

Verifica que termine sin errores y que exista `mcp/node_modules/@modelcontextprotocol`.

## Paso 3 — Crear `vaults.json`

1. Pregunta al usuario la ruta de su vault (y nombre corto) si aún no la tienes.
2. **Verifica que la ruta exista** y que contenga el plugin instalado, comprobando que
   exista el archivo:
   ```
   <ruta-del-vault>/.obsidian/plugins/gestor-funciones/data.json
   ```
   - Si NO existe `.obsidian` ahí, probablemente la ruta no es la raíz del vault: pídele
     que la confirme (puede que el vault esté en una subcarpeta).
   - Si existe `.obsidian` pero no la carpeta `gestor-funciones`, el plugin no está
     instalado/activado en ese vault: avísale antes de continuar.
3. Crea el archivo `mcp/vaults.json` con este contenido (un objeto por vault):
   ```json
   {
     "vaults": [
       { "nombre": "<nombre-corto>", "ruta": "<ruta-absoluta-del-vault>" }
     ]
   }
   ```
   Usa la ruta **absoluta** y tal cual (respeta espacios y caracteres especiales).

4. **Prueba que el MCP lea el vault** antes de seguir, con un proceso temporal:
   ```bash
   GESTOR_VAULTS_CONFIG="<ruta-abs>/mcp/vaults.json" node --input-type=module -e '
   import * as v from "./src/vault.js";
   const vault = await v.resolverVault();
   console.log("OK:", vault.nombre, "->", vault.ruta);
   console.log("Épicas:", (await v.listarEpicas(vault)).length);
   '
   ```
   Si imprime "OK" y un número de épicas (aunque sea 0), el servidor lee bien el vault.

## Paso 4 — Registrar el servidor en el cliente de IA

> Por defecto: **Claude Desktop**. Si el usuario usa otro cliente MCP, adapta la ubicación
> del archivo de configuración, pero el bloque `mcpServers` es el mismo.

Ubicación de `claude_desktop_config.json` según el sistema operativo:

| SO | Ruta |
|---|---|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

Procedimiento:

1. **Haz un respaldo** del archivo antes de tocarlo (cópialo con sufijo de fecha). Si el
   archivo no existe aún, créalo con `{}`.
2. **Lee el JSON, no lo sobrescribas a ciegas.** Conserva todas las claves existentes.
   Añade (o completa) la clave `mcpServers` con esta entrada:
   ```json
   "gestor-funciones": {
     "command": "<ruta-de-node>",
     "args": ["<ruta-abs>/mcp/src/index.js"],
     "env": {
       "GESTOR_VAULTS_CONFIG": "<ruta-abs>/mcp/vaults.json"
     }
   }
   ```
   - `<ruta-de-node>` es la ruta detectada en el Paso 1 (o simplemente `node` si está en
     el PATH del cliente; ante la duda, usa la ruta absoluta).
   - Usa rutas absolutas en `args` y en `env`.
3. **Vuelve a escribir el archivo como JSON válido** (con sangría). Verifica que siga
   siendo parseable.

## Paso 5 — Verificación final

Lanza el servidor con el comando exacto que usará el cliente y comprueba que responde.
Por ejemplo, simulando el protocolo MCP:

```bash
printf '%s\n' \
'{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}' \
'{"jsonrpc":"2.0","method":"notifications/initialized"}' \
'{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
| GESTOR_VAULTS_CONFIG="<ruta-abs>/mcp/vaults.json" <ruta-de-node> "<ruta-abs>/mcp/src/index.js" 2>/dev/null
```

Si en la salida aparece la lista de herramientas (`listar_epicas`, `crear_epica`, etc.),
la instalación está completa.

## Paso 6 — Indicaciones para el usuario

Dile al usuario, de forma clara:

1. Que **reinicie el cliente de IA por completo** (cerrar del todo y volver a abrir) para
   que cargue el nuevo servidor.
2. Cómo probarlo: pedirle a la IA *"Lista las épicas de mi vault"*. La IA pedirá permiso
   para usar la herramienta; al aceptar y recibir respuesta, está listo.
3. Recordatorio: al agregar/eliminar **etiquetas de sprint**, Obsidian debe recargarse
   para verlas.

---

## Problemas comunes

- **La IA no ve las herramientas:** el cliente no se reinició por completo, o la ruta en
  `args`/`command` es incorrecta. Verifica rutas absolutas y reinicia.
- **"No encuentro la configuración de vaults":** falta `vaults.json` o la variable
  `GESTOR_VAULTS_CONFIG` no apunta a él.
- **"La ruta del vault no existe":** revisa la ruta en `vaults.json` (espacios, mayúsculas,
  unidades de nube como Google Drive).
- **El servidor corre código viejo:** un servidor MCP no se recarga solo. Tras cambiar el
  código o la configuración, reinicia el cliente de IA.
