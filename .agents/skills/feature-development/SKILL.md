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

Actúa como coordinador: delega secuencialmente en `planner`, `developer` y `reviewer`
cuando el cliente permita cargar esos agentes. Aplica la alternativa manual documentada
si no están disponibles. Reutiliza las seis skills existentes según el trabajo afectado.

Al reanudar, recupera el plan concreto, su aprobación humana y los cambios pendientes.
Si no puedes identificar la aprobación, vuelve a la fase de presentación del plan.
Invocar esta skill no aprueba ningún plan ni autoriza a saltar la espera del usuario.
