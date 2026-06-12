// Réplica exacta de src/utils.ts del plugin, para que el MCP genere los mismos
// nombres de archivo/carpeta que genera Obsidian. NO cambiar sin sincronizar.

/**
 * "Diseñar pantalla de login" -> "disenar-pantalla-de-login"
 */
export function slugify(input) {
	return input
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

/** Fecha local de hoy en formato YYYY-MM-DD. */
export function hoy() {
	const d = new Date();
	const mes = String(d.getMonth() + 1).padStart(2, "0");
	const dia = String(d.getDate()).padStart(2, "0");
	return `${d.getFullYear()}-${mes}-${dia}`;
}

/** Escapa un valor para usarlo entre comillas dobles en YAML. */
export function escapeYaml(valor) {
	return valor.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
