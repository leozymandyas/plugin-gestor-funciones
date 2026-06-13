#!/usr/bin/env node
// Servidor MCP de "Gestión Producto" (gestor-funciones).
// Expone como herramientas las operaciones del plugin sobre uno o varios vaults
// locales de Obsidian. Funciona 100% en local, sin conexión a internet.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
	cargarVaults,
	resolverVault,
	listarEpicas,
	detalleEpica,
	leerNota,
	buscar,
	crearEpica,
	crearFuncionalidad,
	crearTarea,
	crearPendiente,
	crearApunte,
	crearReunion,
	crearInsumo,
	crearHistoria,
	cambiarEstado,
	listarEtiquetas,
	agregarEtiqueta,
	eliminarEtiqueta,
} from "./vault.js";

const server = new McpServer({
	name: "gestor-funciones",
	version: "1.0.0",
});

// Devuelve el resultado como texto JSON. Centraliza el manejo de errores para
// que Claude reciba un mensaje claro en vez de que el proceso falle.
function ok(data) {
	return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}
function fail(error) {
	return {
		isError: true,
		content: [{ type: "text", text: `Error: ${error?.message || String(error)}` }],
	};
}

const AVISO_REINICIO =
	"⚠️ IMPORTANTE: Los cambios en las etiquetas de sprint modifican la configuración interna del plugin. " +
	"El usuario debe reiniciar Obsidian (cerrar y volver a abrir, o usar Ctrl/Cmd+R para recargar) " +
	"para que los cambios se reflejen en la interfaz.";

/** Igual que ok() pero añade un aviso de reinicio al final. */
function okConAvisoReinicio(data) {
	return {
		content: [
			{ type: "text", text: JSON.stringify(data, null, 2) },
			{ type: "text", text: AVISO_REINICIO },
		],
	};
}

const vaultArg = z
	.string()
	.optional()
	.describe("Nombre del vault configurado. Opcional si solo hay uno configurado.");

// ---------------------------------------------------------------------------
// Lectura
// ---------------------------------------------------------------------------

server.tool(
	"listar_vaults",
	"Lista los vaults de Obsidian configurados para este MCP (nombre y ruta). Útil para saber sobre cuál se puede trabajar.",
	{},
	async () => {
		try {
			const vaults = await cargarVaults();
			return ok(vaults);
		} catch (e) {
			return fail(e);
		}
	}
);

server.tool(
	"listar_epicas",
	"Lista todas las épicas de un vault (activas e inactivas), con su nombre, slug y estado.",
	{ vault: vaultArg },
	async ({ vault }) => {
		try {
			const v = await resolverVault(vault);
			const epicas = await listarEpicas(v);
			return ok(
				epicas.map((e) => ({ slug: e.slug, nombre: e.nombre, estado: e.estado }))
			);
		} catch (e) {
			return fail(e);
		}
	}
);

server.tool(
	"detalle_epica",
	"Devuelve el detalle completo de una épica: tareas (con su estado), pendientes, apuntes, reuniones, insumos, historias y funcionalidades. La épica se identifica por su nombre o slug.",
	{ vault: vaultArg, epica: z.string().describe("Nombre o slug de la épica.") },
	async ({ vault, epica }) => {
		try {
			const v = await resolverVault(vault);
			return ok(await detalleEpica(v, epica));
		} catch (e) {
			return fail(e);
		}
	}
);

server.tool(
	"leer_nota",
	"Lee el contenido Markdown completo de una nota a partir de su ruta relativa al vault (la que devuelven las otras herramientas en el campo 'ruta' o 'file').",
	{ vault: vaultArg, ruta: z.string().describe("Ruta de la nota relativa a la raíz del vault.") },
	async ({ vault, ruta }) => {
		try {
			const v = await resolverVault(vault);
			const contenido = await leerNota(v, ruta);
			return { content: [{ type: "text", text: contenido }] };
		} catch (e) {
			return fail(e);
		}
	}
);

server.tool(
	"buscar",
	"Busca un texto en los nombres y el contenido de las notas dentro de las carpetas de épicas del vault. Devuelve rutas y extractos.",
	{ vault: vaultArg, texto: z.string().describe("Texto a buscar.") },
	async ({ vault, texto }) => {
		try {
			const v = await resolverVault(vault);
			return ok(await buscar(v, texto));
		} catch (e) {
			return fail(e);
		}
	}
);

// ---------------------------------------------------------------------------
// Escritura
// ---------------------------------------------------------------------------

server.tool(
	"crear_epica",
	"Crea una nueva épica en la carpeta de épicas activas del vault, con su estructura inicial.",
	{ vault: vaultArg, nombre: z.string().describe("Nombre de la épica.") },
	async ({ vault, nombre }) => {
		try {
			const v = await resolverVault(vault);
			return ok(await crearEpica(v, nombre));
		} catch (e) {
			return fail(e);
		}
	}
);

server.tool(
	"crear_funcionalidad",
	"Crea una funcionalidad dentro de una épica (subcarpeta funcionalidades/).",
	{
		vault: vaultArg,
		epica: z.string().describe("Nombre o slug de la épica."),
		nombre: z.string().describe("Nombre de la funcionalidad."),
	},
	async ({ vault, epica, nombre }) => {
		try {
			const v = await resolverVault(vault);
			return ok(await crearFuncionalidad(v, epica, nombre));
		} catch (e) {
			return fail(e);
		}
	}
);

server.tool(
	"crear_tarea",
	"Crea una tarea dentro de una épica y la enlaza en la sección Tareas de la nota principal.",
	{
		vault: vaultArg,
		epica: z.string().describe("Nombre o slug de la épica."),
		nombre: z.string().describe("Nombre de la tarea."),
	},
	async ({ vault, epica, nombre }) => {
		try {
			const v = await resolverVault(vault);
			return ok(await crearTarea(v, epica, nombre));
		} catch (e) {
			return fail(e);
		}
	}
);

server.tool(
	"crear_pendiente",
	"Crea un pendiente dentro de una épica y lo enlaza en la sección Pendientes.",
	{
		vault: vaultArg,
		epica: z.string().describe("Nombre o slug de la épica."),
		nombre: z.string().describe("Nombre del pendiente."),
	},
	async ({ vault, epica, nombre }) => {
		try {
			const v = await resolverVault(vault);
			return ok(await crearPendiente(v, epica, nombre));
		} catch (e) {
			return fail(e);
		}
	}
);

server.tool(
	"crear_apunte",
	"Crea un apunte dentro de una épica. Opcionalmente se puede pasar el texto del apunte.",
	{
		vault: vaultArg,
		epica: z.string().describe("Nombre o slug de la épica."),
		nombre: z.string().describe("Título del apunte."),
		texto: z.string().optional().describe("Contenido del apunte (opcional)."),
	},
	async ({ vault, epica, nombre, texto }) => {
		try {
			const v = await resolverVault(vault);
			return ok(await crearApunte(v, epica, nombre, texto));
		} catch (e) {
			return fail(e);
		}
	}
);

server.tool(
	"crear_reunion",
	"Crea una nota de reunión dentro de una épica con la plantilla de asistentes, temas, acuerdos y próximos pasos.",
	{
		vault: vaultArg,
		epica: z.string().describe("Nombre o slug de la épica."),
		nombre: z.string().describe("Título de la reunión."),
	},
	async ({ vault, epica, nombre }) => {
		try {
			const v = await resolverVault(vault);
			return ok(await crearReunion(v, epica, nombre));
		} catch (e) {
			return fail(e);
		}
	}
);

server.tool(
	"crear_insumo",
	"Crea un insumo dentro de una épica.",
	{
		vault: vaultArg,
		epica: z.string().describe("Nombre o slug de la épica."),
		nombre: z.string().describe("Nombre del insumo."),
	},
	async ({ vault, epica, nombre }) => {
		try {
			const v = await resolverVault(vault);
			return ok(await crearInsumo(v, epica, nombre));
		} catch (e) {
			return fail(e);
		}
	}
);

server.tool(
	"crear_historia",
	"Crea una historia de usuario dentro de una épica.",
	{
		vault: vaultArg,
		epica: z.string().describe("Nombre o slug de la épica."),
		nombre: z.string().describe("Nombre de la historia."),
	},
	async ({ vault, epica, nombre }) => {
		try {
			const v = await resolverVault(vault);
			return ok(await crearHistoria(v, epica, nombre));
		} catch (e) {
			return fail(e);
		}
	}
);

server.tool(
	"cambiar_estado",
	"Cambia el valor de 'estado' en el frontmatter de una nota (tarea, pendiente o funcionalidad), identificada por su ruta relativa al vault. Estados típicos: backlog, pendiente, en-progreso, completado.",
	{
		vault: vaultArg,
		ruta: z.string().describe("Ruta de la nota relativa a la raíz del vault."),
		estado: z.string().describe("Nuevo valor de estado."),
	},
	async ({ vault, ruta, estado }) => {
		try {
			const v = await resolverVault(vault);
			return ok(await cambiarEstado(v, ruta, estado));
		} catch (e) {
			return fail(e);
		}
	}
);

// ---------------------------------------------------------------------------
// Configuración del plugin: etiquetas de sprint
// ---------------------------------------------------------------------------

server.tool(
	"listar_etiquetas",
	"Lista las etiquetas de sprint configuradas en el plugin (nombre y color) para un vault.",
	{ vault: vaultArg },
	async ({ vault }) => {
		try {
			const v = await resolverVault(vault);
			return ok(await listarEtiquetas(v));
		} catch (e) {
			return fail(e);
		}
	}
);

server.tool(
	"agregar_etiqueta",
	"Agrega una etiqueta de sprint a la configuración del plugin. El color es opcional (hex #rrggbb). IMPORTANTE: Obsidian debe recargarse (cerrar y abrir, o recargar el vault) para que la etiqueta nueva aparezca en la interfaz.",
	{
		vault: vaultArg,
		nombre: z.string().describe("Nombre de la etiqueta de sprint."),
		color: z
			.string()
			.optional()
			.describe("Color en formato hex #rrggbb (opcional)."),
	},
	async ({ vault, nombre, color }) => {
		try {
			const v = await resolverVault(vault);
			return okConAvisoReinicio(await agregarEtiqueta(v, nombre, color));
		} catch (e) {
			return fail(e);
		}
	}
);

server.tool(
	"eliminar_etiqueta",
	"Elimina una etiqueta de sprint de la configuración del plugin por su nombre. Obsidian debe recargarse para reflejar el cambio.",
	{ vault: vaultArg, nombre: z.string().describe("Nombre de la etiqueta a eliminar.") },
	async ({ vault, nombre }) => {
		try {
			const v = await resolverVault(vault);
			return okConAvisoReinicio(await eliminarEtiqueta(v, nombre));
		} catch (e) {
			return fail(e);
		}
	}
);

// ---------------------------------------------------------------------------

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	// No imprimir en stdout: stdio es el canal del protocolo. Los logs van a stderr.
	console.error("gestor-funciones MCP iniciado.");
}

main().catch((e) => {
	console.error("Fallo al iniciar el MCP:", e);
	process.exit(1);
});
