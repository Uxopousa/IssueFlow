# Roadmap post-MVP: backend de IssueFlow

Este roadmap cubre el trabajo posterior al MVP Angular, que permanece cerrado en
[`roadmap.md`](roadmap.md). Describe la dirección aprobada y las etapas previstas para una
futura ASP.NET Core Web API. La inclusión de una etapa no autoriza su implementación:
cada etapa requiere requisitos concretos, un plan revisable y aprobación antes de modificar
código.

## Decisiones registradas

Decisiones confirmadas por el usuario el **24 de noviembre de 2026**:

| ID         | Decisión                                                                                                           | Estado   | Motivo y límites                                                                                                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ADR-BE-001 | La API se desarrollará con ASP.NET Core sobre .NET 10 LTS.                                                         | Aprobada | .NET 10 es LTS. La versión exacta del SDK y sus actualizaciones se fijarán al crear el proyecto.                                                                                                 |
| ADR-BE-002 | La primera etapa no incluirá cuentas ni autenticación.                                                             | Aprobada | Se prioriza mantener sencillo el primer backend. El diseño debe permitir revisar cuentas más adelante. No publicar una API accesible públicamente sin una decisión previa de acceso y seguridad. |
| ADR-BE-003 | PostgreSQL será la base de datos del backend.                                                                      | Aprobada | Decisión del usuario. El proveedor, versión, esquema y estrategia de migraciones se concretarán en el plan de persistencia.                                                                      |
| ADR-BE-004 | Se quiere poder ejecutar el entorno local con Docker.                                                              | Aprobada | El diseño decidirá qué servicios se contenedorizan y cómo se configura el desarrollo local. No implica que el despliegue de producción vaya a usar Docker.                                       |
| ADR-BE-005 | El backend se ejecutará localmente con Docker; GitHub Pages seguirá publicando solo la demo estática del frontend. | Aprobada | La API no se desplegará por ahora. La demo publicada continuará usando `localStorage`; el frontend local podrá integrarse con la API en otra etapa.                                              |
| ADR-BE-006 | Se usará Minimal APIs en un solo proyecto como monolito modular inicial.                                           | Aprobada | Mantener una estructura sencilla; no incorporar microservicios ni proyectos/capas extra sin una necesidad demostrada.                                                                            |
| ADR-BE-007 | El contrato inicial será REST/JSON versionado en `/api/v1`.                                                        | Aprobada | Las rutas, DTO, filtros, validación y códigos HTTP están definidos en [`api-contract.md`](api-contract.md).                                                                                      |
| ADR-BE-008 | La versión inicial no paginará; el dashboard calculará estadísticas de la lista completa.                          | Aprobada | Mantiene el alcance y comportamiento del MVP. Revisar si crece el volumen de incidencias.                                                                                                        |

## Forma de trabajo

La implementación del backend se realizará en un editor independiente. Este repositorio
mantendrá los requisitos, las decisiones técnicas, los criterios de verificación y el estado
del roadmap. La asistencia se centrará en planificación, documentación y revisión; no añadirá
código backend salvo petición explícita.

## Ejecución local y publicación del frontend

El backend y PostgreSQL se ejecutarán en local mediante Docker. No habrá despliegue remoto
de la API en esta etapa. El workflow actual de GitHub Actions seguirá compilando y publicando
solo el frontend estático en GitHub Pages; la demo pública conservará `localStorage`.
Cuando se integre la API, el modo conectado se utilizará desde el entorno local. Una página
de GitHub Pages no puede conectarse al `localhost` del desarrollador para ofrecer la API a
otros visitantes: en sus navegadores `localhost` apunta a sus propios equipos. El workflow
podrá añadir build y tests del backend, pero no publicará el servicio.

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

## Estado de requisitos y contrato

**BE-002 y BE-003 completadas el 24 de noviembre de 2026.** Los requisitos están en
[`backend-requirements.md`](backend-requirements.md) y el contrato en
[`api-contract.md`](api-contract.md). La revisión independiente no encontró hallazgos ni
contradicciones con las decisiones aprobadas. Prettier pasó para los documentos modificados
y `git diff --check` pasó. EF Core/Npgsql y la estrategia de migración desde `localStorage`
siguen pendientes para sus respectivas etapas.

Decisiones que deben resolverse y aprobarse antes de las etapas que dependen de ellas:

| Tema                                    | Estado    | Cuándo resolverlo                                                                                                                                               |
| --------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Persistencia .NET para PostgreSQL       | Pendiente | EF Core con Npgsql es la recomendación inicial, pendiente de confirmar antes de crear el acceso a datos.                                                        |
| Datos existentes en `localStorage`      | Pendiente | Antes de integrar el frontend; decidir si se migran, importan manualmente o se conservan solo en el navegador.                                                  |
| Alojamiento gratuito                    | Diferido  | La comparación inicial está documentada abajo; reevaluar proveedores y límites solo si se decide desplegar la API remotamente.                                  |
| Acceso para una API desplegada          | Pendiente | Obligatorio antes de exponer cualquier instancia fuera del entorno local; sin cuentas al inicio no significa que un endpoint público quede abierto por defecto. |
| Cuentas y aislamiento de datos a futuro | Diferido  | Requiere requisitos y aprobación propios si se decide incorporar usuarios.                                                                                      |
| Organización interna del proyecto .NET  | Pendiente | Definir carpetas y responsabilidades al crear el proyecto, manteniendo un solo proyecto y evitando capas sin necesidad.                                         |

## Etapas

| ID     | Etapa                                                                 | Estado     | Dependencias           |
| ------ | --------------------------------------------------------------------- | ---------- | ---------------------- |
| BE-001 | Preparación del monorepo y documentación de la dirección backend      | Completada | —                      |
| BE-002 | Requisitos funcionales y alcance del primer backend                   | Completada | BE-001                 |
| BE-003 | Contrato de API y criterios de integración local                      | Completada | BE-002                 |
| BE-004 | Solución ASP.NET Core .NET 10 y entorno local con Docker/PostgreSQL   | Pendiente  | BE-003                 |
| BE-005 | Dominio de incidencias, persistencia y pruebas del backend            | Pendiente  | BE-004                 |
| BE-006 | Endpoints, validación, errores y documentación de API                 | Pendiente  | BE-003, BE-005         |
| BE-007 | Integración Angular, estrategia de datos locales y pruebas integradas | Pendiente  | BE-006                 |
| BE-008 | Revisión futura de acceso, alojamiento remoto y operación             | Diferida   | BE-003, BE-006, BE-007 |

### BE-001 — Preparación del monorepo

Alcance: mover Angular a `frontend/`, reservar `backend/`, actualizar rutas de herramientas
y CI, y documentar la arquitectura objetivo y estas decisiones.

Finalización: la aplicación existente conserva su comportamiento y sus comprobaciones;
los comandos y referencias apuntan a `frontend/`; `backend/` todavía no contiene un proyecto
.NET; el roadmap del MVP sigue registrando únicamente el MVP cerrado; las decisiones
confirmadas y pendientes quedan visibles aquí. La evidencia y los resultados están en
[Estado de la preparación](#estado-de-la-preparaci%C3%B3n).

### BE-002 — Requisitos funcionales y alcance para la primera API

Definir las operaciones incluidas en el primer servicio, reglas de incidencias en servidor,
responsabilidad de IDs y fechas, política de validación, configuración y límites del modo sin
cuentas. Evidencia: [requisitos iniciales del backend](backend-requirements.md). La elección
del proveedor .NET para PostgreSQL se resolverá antes de crear el acceso a datos en BE-005.

### BE-003 — Contrato y criterios de integración local

Rutas, métodos HTTP, representación JSON, versionado, respuestas de error, OpenAPI y
compatibilidad entre Angular local y API local están definidos en el
[contrato de API](api-contract.md). La demo de GitHub Pages permanece desconectada de la API
y basada en `localStorage`. No desplegar.

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

### BE-008 — Revisión futura de despliegue y operación

Esta etapa está diferida por ADR-BE-005. Si se solicita publicar la API, comparar de nuevo
las opciones y límites vigentes, decidir el modo de acceso antes de exponerla, y documentar
secretos, persistencia, CORS y operación. El despliegue requerirá requisitos y aprobación
propios.

## Opciones de alojamiento remoto investigadas

Consulta inicial del **24 de noviembre de 2026**. Se conserva como referencia; no se elige
ningún proveedor mientras la API permanezca local.

| Opción                                       | Condiciones relevantes                                                                                                                                                    | Resultado para IssueFlow                                                                                                                                                                                                                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fly.io Free + Managed PostgreSQL Development | Crédito mensual de $5; PostgreSQL cuesta $4 y requiere tarjeta. Al agotarse el crédito, pasa a pago por uso. La base se pausa tras inactividad.                           | Integrado, pero no garantiza coste cero para API y base juntas. [Precios](https://fly.io/pricing/), [plan Free](https://fly.io/changelog/introducing-the-free-plan/), [PostgreSQL Development](https://fly.io/changelog/highly-available-managed-postgres-for-4-a-month/).                      |
| Cloud Run + Neon Free                        | Cuotas recurrentes gratuitas, pero Cloud Run requiere facturación habilitada y puede cobrar excesos; Cloud Run es privado por defecto y Neon sería un proveedor separado. | Viable para pruebas si se resuelven acceso, billing, arranques en frío y conexión entre proveedores. [Cloud Run](https://cloud.google.com/run/pricing), [Neon](https://neon.com/docs/introduction/plans), [acceso a Cloud Run](https://docs.cloud.google.com/run/docs/authenticating/overview). |
| Render Free                                  | La API duerme por inactividad y PostgreSQL gratuito expira a los 30 días.                                                                                                 | Adecuado para demo temporal, no para conservar datos. [Límites Free](https://render.com/docs/free).                                                                                                                                                                                             |
| Supabase Free                                | 500 MB de PostgreSQL; los proyectos con poca actividad se pausan tras siete días.                                                                                         | Posible junto a un host de API distinto, con pausa y límites de transferencia. [Precios](https://supabase.com/pricing), [pausa](https://supabase.com/docs/guides/platform/free-project-pausing).                                                                                                |

Las asignaciones gratuitas y condiciones pueden cambiar. Antes de cualquier despliegue se
deben verificar de nuevo, especialmente los límites de coste y persistencia.
