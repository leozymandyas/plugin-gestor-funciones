// Réplica de src/templates.ts del plugin. Mantener sincronizado para que las
// notas creadas por el MCP sean idénticas a las creadas desde Obsidian.

import { escapeYaml } from "./slug.js";

function cuerpoSecciones(nombre) {
	return `# ${nombre}

## Descripción
<!-- Escribe aquí la descripción de la funcionalidad -->

## Links relacionados
<!-- Pega aquí los links del proyecto, tickets, documentos, etc. -->

## Tareas
<!-- Las tareas aparecen aquí automáticamente cuando las creas desde el plugin -->

## Apuntes
<!-- Los apuntes aparecen aquí automáticamente cuando los creas desde el plugin -->

## Notas de reunión
<!-- Las notas de reunión aparecen aquí automáticamente cuando las creas desde el plugin -->

## Pendientes
<!-- Los pendientes aparecen aquí automáticamente cuando los creas desde el plugin -->

## Insumos
<!-- Los insumos aparecen aquí automáticamente cuando los creas desde el plugin -->

## Historias
<!-- Las historias aparecen aquí automáticamente cuando las creas desde el plugin -->
`;
}

export function funcionalidad(nombre, fecha) {
	return `---
tipo: epica
nombre: "${escapeYaml(nombre)}"
fecha-creacion: ${fecha}
---

${cuerpoSecciones(nombre)}`;
}

export function funcionalidadNueva(nombre, epicaSlug, fecha) {
	return `---
tipo: funcionalidad
epica: "[[${epicaSlug}]]"
nombre: "${escapeYaml(nombre)}"
estado: backlog
fecha-creacion: ${fecha}
---

${cuerpoSecciones(nombre)}`;
}

export function insumo(nombre, funcSlug, fecha) {
	return `---
tipo: insumo
epica: "[[${funcSlug}]]"
nombre: "${escapeYaml(nombre)}"
fecha: ${fecha}
---

# ${nombre}

<!-- Escribe el insumo aquí -->
`;
}

export function historia(nombre, funcSlug, fecha) {
	return `---
tipo: historia
epica: "[[${funcSlug}]]"
nombre: "${escapeYaml(nombre)}"
fecha: ${fecha}
---

# ${nombre}

<!-- Escribe la historia aquí -->
`;
}

export function tarea(nombre, funcSlug, fecha) {
	return `---
tipo: tarea
funcionalidad: "[[${funcSlug}]]"
nombre: "${escapeYaml(nombre)}"
estado: pendiente
fecha-creacion: ${fecha}
---

# ${nombre}

## Descripción
<!-- Escribe aquí los detalles de la tarea -->

## Notas
<!-- Apuntes relacionados a esta tarea -->
`;
}
export function apunte(nombre, funcSlug, fecha) {
	return `---
tipo: apunte
funcionalidad: "[[${funcSlug}]]"
nombre: "${escapeYaml(nombre)}"
fecha: ${fecha}
---

# ${nombre}

<!-- Escribe tu apunte aquí -->
`;
}

export function pendiente(nombre, funcSlug, fecha) {
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

## Descripción
<!-- Describe el pendiente -->

## Criterio de completado
<!-- ¿Cuándo se considera resuelto este pendiente? -->
`;
}
export function reunion(nombre, funcSlug, fecha) {
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
<!-- Lista los asistentes de la reunión -->

## Temas tratados
<!-- Resume los temas principales discutidos -->

## Acuerdos y decisiones
<!-- Documenta los acuerdos a los que se llegó -->

## Próximos pasos
<!-- Tareas o acciones derivadas de la reunión -->
`;
}
