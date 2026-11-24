---
name: feature-development
description: Coordina una tarea de IssueFlow mediante planificación, aprobación explícita, implementación y revisión independiente. Úsala cuando el usuario invoque $feature-development o solicite expresamente este workflow.
when_to_use: Inicia o reanuda el proceso completo; para consultas aisladas utiliza las skills especializadas pertinentes.
metadata:
  version: 0.1.0
---

# Feature Development

Lee `AGENTS.md` y `ai/workflows/feature-development.md` desde la raíz del repositorio.
El workflow es la fuente única del proceso; síguelo sin sustituirlo por un resumen.
Si falta o no puede leerse, informa del bloqueo y no implementes.

Actúa como coordinador: el modo predeterminado cubre una funcionalidad. Activa el modo batch
solo ante una solicitud explícita del usuario; enumerar varios IDs no lo activa. Para batch,
aplica el plan conjunto, la aprobación única y los límites de ejecución definidos en el
workflow. Delega secuencialmente en `planner`, `developer` y `reviewer` cuando el cliente
permita cargar esos agentes. Aplica la alternativa manual documentada si no están disponibles.
Reutiliza las seis skills existentes según el trabajo afectado.

Consulta siempre el roadmap del ámbito al iniciar o reanudar: `docs/roadmap.md` para el MVP
y `docs/backend-roadmap.md` para backend. Contrástalo con código, pruebas y Git antes de
recomendar una funcionalidad. Vincula el plan a sus IDs y criterios; no copies sus listas
de pendientes en esta skill. Si falta el roadmap o discrepa del código,
informa y aplica las reglas del workflow para reconciliarlo antes de depender de un cierre
dudoso; en batch, esa reconciliación es previa a planificar el lote.

Deja al coordinador la propuesta y actualización posterior a la revisión, según el workflow.
No adelantes estados ni consideres la recomendación del roadmap una aprobación del usuario.

Al reanudar, recupera el plan concreto, su aprobación humana y los cambios pendientes; en batch,
recupera además los IDs autorizados y el último resultado verificado. Si no puedes identificar
la aprobación o el punto de continuación, vuelve a presentar el plan. Invocar esta skill no
aprueba ningún plan ni autoriza a saltar la espera del usuario.
