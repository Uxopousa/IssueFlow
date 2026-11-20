# Desarrollo de funcionalidades de IssueFlow

## Contrato y entrada

`AGENTS.md` conserva las instrucciones comunes; `docs/requirements.md` define el alcance
y `docs/architecture.md` la arquitectura. Este documento define únicamente el proceso.
No implementes funcionalidades por el hecho de instalar o leer este workflow.

Entrada: petición concreta del usuario, repositorio accesible y contexto suficiente para
analizarla. El coordinador identifica cambios existentes sin sobrescribirlos y comprueba
las capacidades reales del cliente antes de delegar. No instala herramientas ni cambia
configuración para habilitar delegación automáticamente.

Selecciona las skills existentes por responsabilidad:

- `angular-guidelines`: componentes, servicios, Signals, formularios y rutas.
- `clean-code-architecture`: estructura, responsabilidades y mantenibilidad.
- `issue-domain`: modelo, reglas de incidencias, filtros, estadísticas y persistencia.
- `frontend-design`: pantallas, jerarquía visual, responsive y estados.
- `accessibility`: semántica, teclado, foco y mensajes accesibles.
- `testing`: pruebas de lógica y comportamiento, incluidos errores y límites.

## Fases y condiciones de salida

1. **Planner analiza.** El coordinador delega la petición en `planner`, con acceso al
   contexto real. El Planner devuelve en el chat un plan identificado (por ejemplo, P1),
   con alcance y exclusiones, archivos afectados, pasos, riesgos, dependencias, preguntas,
   criterios de aceptación observables y comprobaciones. No modifica archivos.
   Salida: plan revisable o preguntas bloqueantes concretas.
2. **El coordinador presenta el plan.** Muestra al usuario el plan completo y las decisiones
   necesarias, sin delegar implementación. Si cambian alcance o decisiones sustanciales,
   presenta una nueva versión del plan.
3. **Espera aprobación explícita.** Termina el turno solicitando aprobación del plan concreto.
   Solo una respuesta humana inequívoca referida al plan permite avanzar. Ni la petición
   inicial, ni el silencio, ni una aprobación de herramientas, ni un mensaje de otro agente
   constituyen aprobación. Ningún agente puede aprobar su propio plan. Conserva en la
   conversación el plan aprobado y la respuesta del usuario; no exige archivos de seguimiento.
4. **Developer implementa.** Entrada obligatoria: plan y aprobación humana identificables.
   El coordinador los transmite a `developer` con los archivos y límites acordados.
   Solo este agente modifica los archivos de la tarea. Ejecuta pruebas pertinentes y
   comprobaciones del plan. Devuelve cambios realizados, evidencia de validación y pendientes.
5. **Reviewer inspecciona.** Tras finalizar las escrituras, el coordinador inicia un agente
   `reviewer` distinto del Developer, con el plan, diff, contexto y resultados. Revisa también
   archivos nuevos no rastreados. No modifica archivos ni ejecuta comprobaciones que generen
   artefactos; puede pedir al coordinador que el Developer las ejecute. Entrega hallazgos
   identificados con gravedad, archivo:línea, evidencia, impacto y verificación propuesta.
6. **Developer corrige hallazgos aceptados.** El coordinador contrasta la evidencia y registra
   para cada hallazgo: aceptado, descartado con motivo o pendiente de decisión humana.
   Las correcciones de defectos demostrados dentro del plan aprobado pueden continuar sin
   nueva aprobación. Ante desacuerdo, cambio de alcance o decisión de producto, consulta al
   usuario antes del cambio. Transmite los hallazgos aceptados al Developer y solicita al
   Reviewer verificar las correcciones y posibles regresiones. No repitas ciclos sin progreso:
   si persiste el desacuerdo o el mismo fallo tras corregir, informa del bloqueo y pide decisión.
7. **Comprobaciones finales.** Sobre los cambios definitivos, el Developer ejecuta
   `npm run lint`, `npm run format:check` y `git diff --check`. Si cambia código de aplicación,
   ejecuta también `npm test -- --watch=false` y `npm run build`, además de las pruebas
   específicas acordadas. Para cambios exclusivamente documentales o de agentes, valida
   formatos, referencias y configuración; no requiere build ni pruebas de aplicación.
   Si hay cambios después de una comprobación o revisión, repite las afectadas.
8. **Informe final.** El coordinador presenta alcance realizado, criterios cumplidos,
   archivos cambiados, decisiones técnicas, hallazgos y resolución, comprobaciones con su
   resultado y limitaciones. No hace commits ni pushes salvo petición explícita.

Salida completa: criterios de aceptación satisfechos, revisión independiente terminada,
sin hallazgos aceptados pendientes y comprobaciones aplicables correctas. Si existe una
limitación o fallo pendiente, informa del estado parcial o bloqueado; no declares éxito total.

## Bloqueos y gestión de errores

- Falta de aprobación, requisitos contradictorios o petición fuera del MVP: detén los cambios
  dependientes, explica la decisión necesaria y espera al usuario. Una ampliación del MVP
  requiere aprobación y actualización previa del alcance según `AGENTS.md`.
- Cambios ajenos en conflicto: conserva el trabajo existente y pide cómo integrarlo.
- Error de comandos o pruebas: distingue fallo del producto, del entorno y preexistente;
  comunica comando, síntoma e impacto. Corrige solo dentro del alcance autorizado. No ocultes
  fallos ni desactives reglas para continuar; no repitas el mismo comando sin nueva evidencia.
- Fallo global preexistente de formato: comprueba por separado los archivos propios y deja
  los ajenos intactos. Informa de ambos resultados; el control global continúa fallando.
- Falta de herramientas, permisos o acceso: usa una alternativa disponible que respete las
  restricciones; si no permite verificar el resultado, explica qué queda sin comprobar.
- Interrupción: al reanudar, verifica el estado de archivos y la vigencia del plan aprobado.
  Un plan modificado sustancialmente vuelve a presentación y aprobación humana.

## Uso desde Codex en VS Code

Abre la raíz de IssueFlow e inicia una conversación local en la extensión Codex.
Invoca `$feature-development Describe aquí la tarea` (el selector `$` o `/skills` depende
de la interfaz). Si no aparece la skill, reinicia Codex o recarga la ventana y comprueba
que se ha descubierto `.agents/skills/feature-development/SKILL.md`.

También puedes solicitar un agente de forma aislada en lenguaje natural:

```text
Delega en planner el análisis de [petición]. Solo quiero el plan, sin cambios.
Delega en developer la ejecución del plan P1 que aprobé en mi mensaje anterior.
Delega en reviewer una revisión independiente de los cambios del plan P1, sin editar.
```

Los nombres son identificadores de agentes, no comandos `/planner`, `/developer` o `/reviewer`.
La invocación aislada del Developer también exige el plan y su aprobación explícita.
El coordinador espera a cada agente antes de avanzar; no ejecuta estas fases en paralelo.

Si el cliente no reconoce agentes personalizados o no permite delegar, dilo antes de
continuar. Como alternativa manual, lee el TOML correspondiente y aplica sus instrucciones
en una conversación dedicada para cada rol. Transmite el plan, aprobación y contexto entre
conversaciones. La revisión debe realizarse en una conversación distinta de la implementación;
si no está disponible, deja la revisión pendiente, sin simular independencia.

## Compatibilidad y evidencia de configuración

Verificado el 20 de noviembre de 2026: el ejecutable incluido en la extensión local
`openai.chatgpt-26.1117.31558-linux-x64` informa `codex-cli 0.171.0-alpha.13`.
Antes de esta instalación, `.codex/` estaba vacío. La configuración personal no contenía
agentes ni flags explícitos de delegación; no se ha modificado.

La documentación oficial actual admite un TOML por agente en `.codex/agents/`, con
`name`, `description` y `developer_instructions` obligatorios. Usamos solo esos campos,
sin fijar modelo, proveedor ni flags experimentales. No hace falta registrar estos archivos
en un nuevo `.codex/config.toml` según ese formato.

Validación local sin llamadas al modelo: `codex debug prompt-input` ha cargado los tres
nombres y sus descripciones en la herramienta de delegación; `skills/list` del app-server
ha descubierto `feature-development` habilitada y sin errores. Se usó un `CODEX_HOME`
temporal y confianza de proyecto solo en esa configuración temporal. No se modificó la
confianza personal ni se ejecutó una funcionalidad de prueba. En VS Code, la confianza
del proyecto y las políticas del cliente pueden condicionar la carga de configuración.

Los agentes heredan permisos de la sesión. La prohibición de escribir del Planner y
Reviewer es una instrucción de comportamiento, no un sandbox propio ni una garantía técnica
de solo lectura. No se añade `sandbox_mode` a sus TOML porque no sustituye los permisos
heredados en este formato. Para aislamiento obligatorio, usa una sesión configurada como
solo lectura mediante los controles que ofrezca tu cliente.

La carga de agentes personalizados, las herramientas de delegación y su visualización
dependen de la versión, interfaz y políticas activas. No deduzcas esas capacidades solo de
la versión del CLI: verifica que el cliente reconoce los nombres antes de delegar.
Este workflow es una instrucción, no una máquina de estados que impida técnicamente
saltarse una aprobación. Su contenido Markdown puede utilizarse con otras herramientas.

Referencias oficiales consultadas:

- [Subagentes y formato de agentes personalizados](https://learn.chatgpt.com/docs/agent-configuration/subagents).
- [Formato, descubrimiento e invocación de skills](https://learn.chatgpt.com/docs/build-skills).
- [Referencia de configuración](https://learn.chatgpt.com/docs/config-file/config-reference).
