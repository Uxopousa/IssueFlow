# Roadmap de IssueFlow

IssueFlow permite crear, consultar y mantener incidencias en el navegador, sin servidor
ni cuentas. El objetivo del MVP es completar ese flujo con persistencia local, una
interfaz responsive y controles accesibles.

Los [requisitos](requirements.md) definen el producto y la [arquitectura](architecture.md)
su organización técnica. Este registro es la fuente de progreso, dependencias y trabajo
pendiente; el [workflow](../ai/workflows/feature-development.md) gobierna su desarrollo
y actualización. La inclusión de una funcionalidad no aprueba su implementación.

## Estado actual

Corte revisado el **23 de noviembre de 2026**. El lote B1 se inició sobre `5e14005`; IF-008
está incluido en `42bf9a3`. IF-006 e IF-011 se implementaron y verificaron dentro del lote,
con evidencia en este registro. El dominio, la persistencia, el filtrado, el shell, el listado,
las estadísticas y el dashboard tienen evidencia; **el MVP aún no completa el flujo de gestión
de incidencias**. Crear y editar y el detalle siguen pendientes.

El arranque inicializa `IssueService`. El listado comunica el resultado de las operaciones y
el dashboard presenta estadísticas y estado de almacenamiento. Creación, edición y detalle
siguen pendientes.

Los IDs `IF-001` a `IF-012` identifican entregables estables, incluidos los bloques técnicos
necesarios para el MVP. No son prioridades ni números de plan. No se renumeran ni reutilizan;
un nuevo entregable recibe otro ID. Los planes P1/P2/P3 del historial no sustituyen estos IDs
ni aprueban las funcionalidades pendientes.

## Registro del MVP

Las dependencias son prerrequisitos de finalización y una guía de orden, no una autorización.
La descomposición pendiente es una propuesta técnica derivada de los requisitos: puede
revisarse al aprobar cada plan sin ampliar el producto.

| ID     | Funcionalidad                                      | Estado     | Dependencias                   |
| ------ | -------------------------------------------------- | ---------- | ------------------------------ |
| IF-001 | Modelo de incidencia                               | completada | —                              |
| IF-002 | Validación y normalización del dominio             | completada | IF-001                         |
| IF-003 | Persistencia local y errores de almacenamiento     | completada | IF-001, IF-002                 |
| IF-004 | Estado de incidencias y operaciones de negocio     | completada | IF-002, IF-003                 |
| IF-005 | Búsqueda y filtros combinados                      | completada | IF-004                         |
| IF-006 | Estadísticas derivadas                             | completada | IF-004                         |
| IF-007 | Estructura de navegación y arranque de la interfaz | completada | IF-004                         |
| IF-008 | Listado y acciones de incidencias                  | completada | IF-005, IF-007                 |
| IF-009 | Creación y edición mediante formulario             | pendiente  | IF-002, IF-004, IF-007         |
| IF-010 | Detalle y recurso inexistente                      | pendiente  | IF-004, IF-007                 |
| IF-011 | Dashboard                                          | completada | IF-006, IF-007                 |
| IF-012 | Verificación integrada y cierre del MVP            | pendiente  | IF-008, IF-009, IF-010, IF-011 |

### IF-001 — Modelo de incidencia

Alcance: contrato tipado de la incidencia, campos editables y valores cerrados del MVP.
Finalización: campos y tipos conformes a requisitos §3; identificadores y fechas quedan
fuera de la entrada editable. Evidencia: [issue.model.ts](../src/app/core/models/issue.model.ts),
incluido en la comprobación TypeScript sin emisión.

### IF-002 — Validación y normalización del dominio

Alcance: reglas reutilizables para entradas y colecciones persistidas.
Finalización: límites tras `trim()`, campos propios, valores permitidos, fechas serializadas
e identificadores válidos y únicos en la colección; errores por campo y normalización sin
mutar entradas. Evidencia: [validación](../src/app/core/models/issue-validation.ts) y
[pruebas](../src/app/core/models/issue-validation.spec.ts). Las decisiones técnicas vigentes
de ISO UTC y propiedades propias no añaden funcionalidades al MVP.

### IF-003 — Persistencia local y errores de almacenamiento

Alcance: lectura y escritura de colecciones en `localStorage`, sin presentación ni estado
de negocio. Finalización: ausencia como colección vacía, datos inválidos rechazados,
errores explícitos y ninguna reparación o sobrescritura durante la lectura; una escritura
fallida no comunica éxito. Evidencia: [servicio](../src/app/core/services/issue-storage.service.ts)
y [pruebas](../src/app/core/services/issue-storage.service.spec.ts).
El flujo visible de persistencia sigue pendiente en las pantallas y en IF-012.

### IF-004 — Estado de incidencias y operaciones de negocio

Alcance: colección con Signals, consulta, creación, edición, eliminación, cambio de estado
y coordinación del guardado. Finalización: estado protegido frente a mutación externa,
validación en el servicio, fechas e identificadores correctos y resultados distintos para
guardado, solo memoria y rechazo. Si falla la carga no se sobrescribe almacenamiento sin
autorización explícita; los fallos conservan cambios pendientes.
Evidencia: [IssueService](../src/app/core/services/issue.service.ts) y
[pruebas](../src/app/core/services/issue.service.spec.ts). No incluye confirmaciones ni UI.

### IF-005 — Búsqueda y filtros combinados

Alcance: selección derivada de la colección fuente para título/descripción, estado y prioridad
(requisitos §2.2, aceptación 8–9). Finalización: búsqueda y filtros funcionan solos y combinados,
se puede representar la ausencia de filtro y los resultados se actualizan tras las operaciones
sin mantener otra colección fuente. La búsqueda ignora mayúsculas, recorta los espacios
exteriores y conserva los internos; `null` representa un filtro inactivo. Pruebas de vacío,
coincidencias, combinaciones y actualización reactiva. Evidencia: [filtro](../src/app/core/models/issue-filter.ts),
[pruebas del filtro](../src/app/core/models/issue-filter.spec.ts) y
[servicio de incidencias](../src/app/core/services/issue.service.ts) con sus pruebas.
La lógica está integrada en el dominio y se presenta en la interfaz del listado implementada
en IF-008.

### IF-006 — Estadísticas derivadas

Alcance: total, abiertas, en progreso y resueltas desde la colección completa, no desde los
resultados filtrados (requisitos §2.1). Finalización: ceros sin incidencias y recomputación
correcta tras cualquier operación, con pruebas. La distribución por prioridad es condicional
al valor que aporte, como indican los requisitos; no se convierte en analítica avanzada.
Evidencia: estadística derivada e inmutable en [IssueService](../src/app/core/services/issue.service.ts)
y cobertura en [sus pruebas](../src/app/core/services/issue.service.spec.ts).

### IF-007 — Estructura de navegación y arranque de la interfaz

Alcance: shell standalone, navegación base y estructura para los destinos de arquitectura §5.
Finalización: shell responsive y utilizable con teclado, skip link, landmarks y traslado de
foco al contenido tras navegar sin robarlo en la carga inicial; `IssueService` se inicializa
una vez. En IF-007 las rutas de dashboard, listado, creación, detalle y edición quedaron
inicialmente conectadas a placeholders; IF-008 sustituyó el placeholder del listado por su
página funcional. La raíz lleva al dashboard. Evidencia: [shell](../src/app/app.html),
[rutas](../src/app/app.routes.ts), [placeholder](../src/app/shared/components/route-placeholder.component.ts)
y [pruebas](../src/app/app.spec.ts). El contenido funcional se cierra en IF-008 a IF-011;
ninguna ruta placeholder completa esas páginas.

### IF-008 — Listado y acciones de incidencias

Alcance: listado con campos requeridos, búsqueda, filtros y acceso a creación, edición y
detalle; eliminación confirmada y cambio de estado (requisitos §2.2 y aceptación 6–9).
Finalización: muestra título, categoría, prioridad, estado y fechas; usa los filtros derivados
de `IssueService`; cancelar `window.confirm` no cambia datos y confirmar elimina; un rechazo
de cambio de estado restaura el valor vigente. Estado vacío ofrece crear y la ausencia de
coincidencias permite limpiar criterios. El feedback distingue guardado, memoria únicamente
y rechazo. Tras eliminar, el foco va a un elemento lógico. Evidencia: [página](../src/app/features/issues/pages/issue-list-page/issue-list-page.component.ts),
[template](../src/app/features/issues/pages/issue-list-page/issue-list-page.component.html)
y [pruebas](../src/app/features/issues/pages/issue-list-page/issue-list-page.component.spec.ts).
Los enlaces a creación, edición y detalle todavía llevan a placeholders; este entregable no
completa IF-009 ni IF-010. Teclado y responsive se verifican en este flujo.

### IF-009 — Creación y edición mediante formulario

Alcance: Reactive Forms tipado y formulario compartido para los campos editables
(requisitos §2.3 y §4). Finalización: precarga al editar, validación visible junto al campo,
envío inválido bloqueado, metadatos protegidos y resultado reflejado en las vistas que ya
existan. Edición de recurso inexistente con salida al listado. No se anuncia guardado
cuando el cambio solo permanece en memoria; controles etiquetados y utilizables con teclado.

### IF-010 — Detalle y recurso inexistente

Alcance: información completa, edición, eliminación confirmada y vuelta al listado
(requisitos §2.4). Finalización: identificadores inexistentes o eliminados muestran error
y salida útil; acciones coherentes con el servicio y feedback de errores, con teclado y
responsive. La eliminación actualiza el estado compartido y abandona el recurso eliminado.

### IF-011 — Dashboard

Alcance: presentación de las estadísticas de IF-006 (requisitos §2.1).
Finalización: cifras coherentes con el estado actual, actualización tras operaciones y
estadísticas a cero con invitación a crear cuando no hay datos. Presentación legible y
responsive; no duplica conteos en componentes. Ante un fallo de carga no presenta los ceros
como confirmación de almacenamiento vacío; comunica cuando los cambios solo están en memoria.
Evidencia: [página](../src/app/features/dashboard/dashboard-page/dashboard-page.component.ts),
[template](../src/app/features/dashboard/dashboard-page/dashboard-page.component.html),
[pruebas](../src/app/features/dashboard/dashboard-page/dashboard-page.component.spec.ts) y
[ruta](../src/app/app.routes.ts).

### IF-012 — Verificación integrada y cierre del MVP

Alcance: comprobar conjuntamente los doce criterios de aceptación de requisitos §6 y
los estados de §5. Finalización: flujo crear → consultar → editar → resolver → eliminar,
recarga conservando datos, vistas coherentes, errores visibles sin falsos éxitos y recuperación
segura. Verificación de teclado, foco, contraste y tamaños móviles/escritorio con evidencia
manual o automatizada según las herramientas disponibles. Registrar cualquier escenario no
verificado; no exige instalar un runner E2E nuevo. Las comprobaciones de calidad requeridas
deben pasar antes del cierre global; ninguna pantalla incompleta se considera producto terminado.

## Evidencia y discrepancias del corte actual

Los nueve bloques de dominio, persistencia, filtrado, shell, listado, estadísticas y dashboard
marcados como completados tienen código contrastado y revisión independiente sin hallazgos
pendientes. En IF-006, la prueba focalizada obtuvo 38 tests y la suite completa, antes de IF-011,
143 tests en seis archivos; lint y build pasaron. En IF-011, la suite completa pasó con **148 tests
en siete archivos**, lint y build pasaron. Prettier pasó en todos los archivos modificados y
nuevos. `npm run format:check` global sigue fallando en los ocho archivos ajenos enumerados abajo;
se registra como limitación preexistente, no como control superado. Esta excepción no permite
cerrar IF-012 con el fallo global pendiente. El shell y el listado vacío se inspeccionaron en
Chrome a 1440×900 y 390×844; el dashboard vacío también se comprobó visualmente a ambos tamaños.
Las pruebas de IF-008 verifican filtros, acciones, errores y gestión de foco; la prueba del shell
verifica el foco al navegar. Estas evidencias no acreditan todavía la creación, edición ni detalle.

Al inicio de IF-007, `npm run format:check` fallaba en 12 archivos. Al formatear los dos
archivos afectados por esa tarea, el fallo global se redujo a ocho archivos ajenos; el control
ejecutado el 23 de noviembre reprodujo esos mismos fallos:
`.agents/skills/accessibility/SKILL.md`, `.agents/skills/testing/SKILL.md`, `.postcssrc.json`,
`angular.json`, `docs/requirements.md`, `src/main.ts`, `tsconfig.app.json` y `tsconfig.spec.json`.
No se modificaron. Esta limitación debe resolverse antes de IF-012 con alcance autorizado; no
implica que las funcionalidades pendientes estén bloqueadas.

La arquitectura define `features/` y `shared/` como estructura del MVP. Ya existen las páginas
de listado y dashboard en `features/`; el placeholder compartido sigue utilizándose para creación,
edición y detalle. El estado actual no acredita todavía todos los flujos de navegación funcional
ni la persistencia completa desde la interfaz.

## Siguiente paso recomendado

Planificar **IF-009, creación y edición mediante formulario**: IF-007 aporta el shell e IF-008
ya ofrece los accesos y refleja los resultados de esas operaciones. IF-009, IF-010 e IF-012
siguen pendientes y requieren su propio plan y aprobación explícita.

El lote B1 terminó con IF-006 e IF-011 verificadas. No hay otra implementación autorizada en
curso; la recomendación de IF-009 no constituye aprobación para iniciarla.

## Estados y mantenimiento

| Estado        | Significado                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| pendiente     | Alcance identificado, sin un plan aprobado para ejecutarlo.                                              |
| planificada   | Plan concreto aprobado; todavía sin implementación iniciada.                                             |
| en desarrollo | Implementación iniciada, con criterios aún pendientes.                                                   |
| en revisión   | Implementación entregada con revisión, correcciones o controles pendientes.                              |
| completada    | Criterios del alcance satisfechos, revisión superada y comprobaciones pertinentes acreditadas.           |
| bloqueada     | Impedimento concreto que requiere decisión o acceso externo; debe indicarse causa y condición de salida. |

Los estados reflejan el último corte revisado, no telemetría automática del editor. Las fases
en curso se comunican en la conversación; no se escribe una actualización del roadmap antes
de conocer el resultado de la revisión. El mecanismo y la autorización para aplicar la
propuesta posterior se definen exclusivamente en el workflow.

Cada actualización mantiene el ID, estado, dependencias, evidencia, pendientes o bloqueo
y siguiente paso. Si una revisión detecta que un cierre anterior no se sostiene, se propone
reabrir el mismo ID, conservando el motivo y la evidencia; no se borra la discrepancia ni se
redefine la aceptación para justificar un estado. Una fecha o etiqueta no sustituye al código.

## Fuera del MVP

Backend, cuentas/colaboración y sincronización son ejemplos de posibles ampliaciones,
expresamente excluidas en [requisitos §7](requirements.md#7-fuera-del-mvp). No están aprobadas,
no tienen prioridad ni forman parte del grafo ejecutable anterior. Solo se incorporarán a
la planificación tras una petición explícita y actualización previa del alcance; no se
crean tareas futuras adicionales por iniciativa del agente.
