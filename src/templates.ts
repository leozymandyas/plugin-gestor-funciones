import { escapeYaml } from "./utils";

export function funcionalidad(nombre: string, fecha: string): string {
	return `---
tipo: epica
nombre: "${escapeYaml(nombre)}"
fecha-creacion: ${fecha}
---

${cuerpoSecciones(nombre)}`;
}

/** Funcionalidad dentro de una épica: misma estructura de secciones, con
 * vínculo a su épica y estado propio. */
export function funcionalidadNueva(nombre: string, epicaSlug: string, fecha: string): string {
	return `---
tipo: funcionalidad
epica: "[[${epicaSlug}]]"
nombre: "${escapeYaml(nombre)}"
estado: backlog
fecha-creacion: ${fecha}
---

${cuerpoSecciones(nombre)}`;
}

function cuerpoSecciones(nombre: string): string {
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

export function insumo(nombre: string, funcSlug: string, fecha: string): string {
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

export function historia(nombre: string, funcSlug: string, fecha: string): string {
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

export function tarea(nombre: string, funcSlug: string, fecha: string): string {
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

export function apunte(nombre: string, funcSlug: string, fecha: string): string {
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

export function pendiente(nombre: string, funcSlug: string, fecha: string): string {
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

export function reunion(nombre: string, funcSlug: string, fecha: string): string {
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
