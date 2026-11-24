# Roadmap post-MVP: backend de IssueFlow

Este roadmap cubre el trabajo posterior al MVP Angular, que permanece cerrado en
[`roadmap.md`](roadmap.md). Describe la dirección aprobada y las etapas previstas para una
futura ASP.NET Core Web API. La inclusión de una etapa no autoriza su implementación:
cada etapa requiere requisitos concretos, un plan revisable y aprobación antes de modificar
código.

## Decisiones registradas

Decisiones confirmadas por el usuario el **24 de noviembre de 2026**:

| ID         | Decisión                                                   | Estado   | Motivo y límites                                                                                                                                                                                 |
| ---------- | ---------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ADR-BE-001 | La API se desarrollará con ASP.NET Core sobre .NET 10 LTS. | Aprobada | .NET 10 es LTS. La versión exacta del SDK y sus actualizaciones se fijarán al crear el proyecto.                                                                                                 |
| ADR-BE-002 | La primera etapa no incluirá cuentas ni autenticación.     | Aprobada | Se prioriza mantener sencillo el primer backend. El diseño debe permitir revisar cuentas más adelante. No publicar una API accesible públicamente sin una decisión previa de acceso y seguridad. |
| ADR-BE-003 | PostgreSQL será la base de datos del backend.              | Aprobada | Decisión del usuario. El proveedor, versión, esquema y estrategia de migraciones se concretarán en el plan de persistencia.                                                                      |
| ADR-BE-004 | Se quiere poder ejecutar el entorno local con Docker.      | Aprobada | El diseño decidirá qué servicios se contenedorizan y cómo se configura el desarrollo local. No implica que el despliegue de producción vaya a usar Docker.                                       |

## Forma de trabajo

La implementación del backend se realizará en un editor independiente. Este repositorio
mantendrá los requisitos, las decisiones técnicas, los criterios de verificación y el estado
del roadmap. La asistencia se centrará en planificación, documentación y revisión; no añadirá
código backend salvo petición explícita.

## Estado de la preparación

**BE-001 completada el 24 de noviembre de 2026** en la rama
`chore/monorepo-backend-foundation`. La revisión independiente no dejó hallazgos pendientes.
Los archivos Angular se reconocen como renombres sin cambios de contenido. No se modificó
lógica ni presentación, no se creó un proyecto .NET y no se hizo commit ni merge.

Desde `frontend/`, `npm ci`, `npm run lint`, `npm run format:check`, `npm run build` y
`npm test -- --watch=false` pasaron; la suite ejecutó 165 pruebas en 9 archivos. Build y
tests necesitaron permisos ampliados porque el sandbox impedía leer directorios superiores
y devolvía `Access is denied`. El formato requirió `endOfLine: auto` por `core.autocrlf=true`;
la verificación ignora outputs generados. `git diff --check`, `git diff --cached --check` y
la comprobación de exclusión de `frontend/coverage/` y `frontend/out-tsc/` pasaron. Se
eliminaron caché y build generados por las verificaciones.

Decisiones que deben resolverse y aprobarse antes de las etapas que dependen de ellas:

| Tema                                    | Estado    | Cuándo resolverlo                                                                                                                                               |
| --------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contrato HTTP y formato de errores      | Pendiente | Antes de implementar endpoints; evaluar REST/JSON, versionado y Problem Details.                                                                                |
| Persistencia .NET para PostgreSQL       | Pendiente | Antes de crear el acceso a datos; comparar alternativas y coste de mantenimiento.                                                                               |
| Datos existentes en `localStorage`      | Pendiente | Antes de integrar el frontend; decidir si se migran, importan manualmente o se conservan solo en el navegador.                                                  |
| Alojamiento gratuito                    | Pendiente | Investigar límites, suspensión por inactividad, almacenamiento persistente, PostgreSQL, secretos y restricciones de red antes de elegir proveedor.              |
| Acceso para una API desplegada          | Pendiente | Obligatorio antes de exponer cualquier instancia fuera del entorno local; sin cuentas al inicio no significa que un endpoint público quede abierto por defecto. |
| Cuentas y aislamiento de datos a futuro | Diferido  | Requiere requisitos y aprobación propios si se decide incorporar usuarios.                                                                                      |
| Esquema de proyectos y capas .NET       | Pendiente | Decidir al crear la solución según el tamaño real; empezar con la estructura más sencilla que conserve responsabilidades claras.                                |

## Etapas

| ID     | Etapa                                                                 | Estado     | Dependencias           |
| ------ | --------------------------------------------------------------------- | ---------- | ---------------------- |
| BE-001 | Preparación del monorepo y documentación de la dirección backend      | Completada | —                      |
| BE-002 | Requisitos del primer backend y cierre de decisiones de diseño        | Pendiente  | BE-001                 |
| BE-003 | Contrato de API y evaluación de opciones gratuitas de despliegue      | Pendiente  | BE-002                 |
| BE-004 | Solución ASP.NET Core .NET 10 y entorno local con Docker/PostgreSQL   | Pendiente  | BE-003                 |
| BE-005 | Dominio de incidencias, persistencia y pruebas del backend            | Pendiente  | BE-004                 |
| BE-006 | Endpoints, validación, errores y documentación de API                 | Pendiente  | BE-003, BE-005         |
| BE-007 | Integración Angular, estrategia de datos locales y pruebas integradas | Pendiente  | BE-006                 |
| BE-008 | Decisión de acceso, despliegue y operación                            | Pendiente  | BE-003, BE-006, BE-007 |

### BE-001 — Preparación del monorepo

Alcance: mover Angular a `frontend/`, reservar `backend/`, actualizar rutas de herramientas
y CI, y documentar la arquitectura objetivo y estas decisiones.

Finalización: la aplicación existente conserva su comportamiento y sus comprobaciones;
los comandos y referencias apuntan a `frontend/`; `backend/` todavía no contiene un proyecto
.NET; el roadmap del MVP sigue registrando únicamente el MVP cerrado; las decisiones
confirmadas y pendientes quedan visibles aquí. La evidencia y los resultados están en
[Estado de la preparación](#estado-de-la-preparaci%C3%B3n).

### BE-002 — Requisitos y decisiones para la primera API

Definir las operaciones incluidas en el primer servicio, reglas de incidencias en servidor,
responsabilidad de IDs y fechas, política de validación, configuración y límites del modo sin
cuentas. Resolver solo las decisiones necesarias para diseñar contrato y persistencia.
Actualizar requisitos post-MVP sin reabrir ni reescribir los requisitos del MVP.

### BE-003 — Contrato y evaluación de alojamiento

Proponer y aprobar rutas y métodos HTTP, representación JSON, versionado, respuestas de
error, OpenAPI y expectativas de compatibilidad Angular/API. Comparar destinos gratuitos
vigentes y sus condiciones para API y PostgreSQL, incluyendo persistencia, suspensión,
límites, secretos, red y necesidad de proteger el acceso. No desplegar todavía.

### BE-004 — Esqueleto .NET y entorno local

Crear la solución/proyecto ASP.NET Core sobre .NET 10 y el entorno de desarrollo Docker con
PostgreSQL, según decisiones aprobadas. Documentar comandos reproducibles, configuración
local y manejo de secretos. No añadir autenticación ni seleccionar infraestructura pública
por conveniencia del proveedor.

### BE-005 — Dominio y persistencia

Implementar las reglas acordadas para incidencias, almacenamiento PostgreSQL, cambios de
esquema y pruebas. Conservar las validaciones y valores de dominio del MVP, salvo cambios de
requisitos aprobados expresamente.

### BE-006 — API

Implementar el contrato aprobado, errores consistentes, validación del lado servidor y
documentación OpenAPI. Probar resultados normales, entradas inválidas, recursos inexistentes
y fallos de persistencia. Revisar acceso y seguridad antes de permitir tráfico no local.

### BE-007 — Integración frontend

Adaptar Angular para consumir la API y definir una transición explícita para los datos que
ya existan en `localStorage`. Probar los flujos de listado, búsqueda, filtros, dashboard,
alta, edición, eliminación y cambio de estado contra el backend; conservar diseño y
accesibilidad salvo cambios aprobados.

### BE-008 — Despliegue y operación

Elegir un destino tras la comparación de BE-003 y comprobar que sus límites siguen vigentes.
Resolver el modo de acceso antes de exposición pública. Documentar configuración, secretos,
persistencia, CORS, copias de seguridad, límites gratuitos y pasos para ejecutar todo en
local con Docker. El despliegue requerirá un plan y aprobación propios.
