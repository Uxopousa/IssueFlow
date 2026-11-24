# Instrucciones para asistentes de IA

## Contexto del proyecto

IssueFlow es un monorepo con una aplicación Angular 21 en `frontend/` y un espacio reservado para una futura API ASP.NET Core en `backend/`. El alcance cerrado del MVP está definido en [`docs/requirements.md`](docs/requirements.md); la arquitectura actual y objetivo está en [`docs/architecture.md`](docs/architecture.md).

## Reglas de trabajo

- Antes de modificar código, inspecciona el contexto existente y las convenciones del repositorio.
- No inventes APIs ni utilices características incompatibles con Angular 21.
- Prioriza las APIs modernas de Angular y los componentes standalone.
- Mantén TypeScript estricto y evita `any`.
- Utiliza Signals para el estado cuando corresponda.
- Separa la lógica de negocio de la presentación.
- No dupliques código; reutiliza las soluciones existentes cuando sean adecuadas.
- No instales dependencias sin justificar claramente su necesidad.
- No modifiques archivos de configuración sin una razón concreta y verificable.
- Mantén los componentes pequeños y con responsabilidades claras.
- Prioriza la accesibilidad y el diseño responsive.
- Añade pruebas para la lógica relevante y conserva las pruebas existentes.
- No implementes funcionalidades fuera del alcance definido para el MVP.
- Explica brevemente las decisiones técnicas importantes y cualquier desviación de la arquitectura documentada.

## Límites del MVP

El MVP de [`docs/requirements.md`](docs/requirements.md) permanece cerrado y no incluye backend, autenticación, roles, permisos, notificaciones ni otras funcionalidades excluidas. La implementación del backend se realizará en un editor independiente; la asistencia se centrará en planificación, documentación y revisión, y no añadirá código backend salvo petición explícita. El trabajo post-MVP sigue [`docs/backend-roadmap.md`](docs/backend-roadmap.md): el roadmap orienta pero no autoriza implementación; cada etapa requiere requisitos y un plan aprobados previamente.

## Seguimiento del desarrollo

- Consulta el roadmap correspondiente antes de planificar y al reanudar: [`docs/roadmap.md`](docs/roadmap.md) registra el MVP Angular cerrado y [`docs/backend-roadmap.md`](docs/backend-roadmap.md) el trabajo post-MVP de API. Cada uno es la fuente de progreso, dependencias y siguiente paso de su ámbito; no copies sus listas en instrucciones o skills.
- Contrasta sus estados con código, pruebas y Git. Una marca de completado no sustituye la evidencia; informa de discrepancias y dependencias pendientes.
- Vincula cada plan a los IDs estables del roadmap correspondiente, su alcance y criterios de finalización. El roadmap no autoriza implementar ni ampliar alcance: el plan requiere aprobación explícita.
- Sigue [`ai/workflows/feature-development.md`](ai/workflows/feature-development.md) para proponer y aplicar actualizaciones de seguimiento solo después de conocer el resultado de la revisión. No marques completado con criterios, hallazgos aceptados o comprobaciones pertinentes pendientes.

## Calidad y herramientas de desarrollo

- Respeta la configuración de ESLint y Prettier definida en el proyecto.
- Ejecuta `npm run lint` desde `frontend/` después de implementar o modificar código Angular.
- El código debe superar ESLint sin errores antes de considerar terminada una tarea.
- Ejecuta `npm run format:check` desde `frontend/` para comprobar el formato de la aplicación.
- No formatees automáticamente archivos que no estén relacionados con la tarea.
- No desactives, debilites ni suprimas reglas de ESLint para ocultar problemas sin una justificación técnica.
- Si una regla parece inadecuada para un caso concreto, explica el motivo antes de modificar la configuración.
- Incluye los resultados de las comprobaciones en el resumen final de cada tarea.
