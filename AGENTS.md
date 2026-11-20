# Instrucciones para asistentes de IA

## Contexto del proyecto

IssueFlow es una aplicación Angular 21 con TypeScript estricto y Tailwind CSS 4. El alcance funcional del MVP está definido en [`docs/requirements.md`](docs/requirements.md) y la arquitectura prevista en [`docs/architecture.md`](docs/architecture.md).

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

No añadas backend, autenticación, roles, permisos, notificaciones ni otras funcionalidades excluidas en [`docs/requirements.md`](docs/requirements.md) sin una petición explícita y una actualización previa del alcance.
