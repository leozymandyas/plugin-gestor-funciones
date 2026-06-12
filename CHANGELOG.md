# Registro de cambios

Todas las versiones notables del plugin se documentan en este archivo.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el versionado [SemVer](https://semver.org/lang/es/).

## [1.6.0] - 2026-06-12

### Añadido
- Vista de **Roadmap** y vista **Kanban** con arrastrar y soltar.
- **Sprints** por funcionalidad con etiquetas configurables.
- **Colaboradores** asignables a tareas y pendientes.
- **Pendientes** y **sub-pendientes** con su propia estructura de carpetas.
- **Insumos** e **historias** de usuario por funcionalidad.
- Estructura de **épicas** (activas / inactivas) con funcionalidades anidadas.
- Servidor **MCP** local (carpeta `mcp/`) para gestionar los vaults desde Claude.

### Cambiado
- La nota principal de cada épica se renderiza como dashboard en modo lectura.
- Las tareas se convierten en carpetas al crear su primera sub-tarea.

## [1.0.0] - 2026-06-11

### Añadido
- Primera versión: creación de funcionalidades, tareas, sub-tareas, apuntes y
  notas de reunión como archivos Markdown dentro del vault.
- Botón flotante (FAB) y comandos en la paleta.
- Configuración de la carpeta de administración.
