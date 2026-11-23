# Desarrollo de funcionalidades de IssueFlow

## Contrato y entrada

`AGENTS.md` conserva las instrucciones comunes; `docs/requirements.md` define el alcance,
`docs/architecture.md` la arquitectura y `docs/roadmap.md` el progreso y trabajo pendiente.
Este documento define únicamente el proceso; no mantiene otra lista de funcionalidades.
No implementes funcionalidades por el hecho de instalar o leer este workflow.

Entrada: petición concreta del usuario, repositorio accesible y contexto suficiente para
analizarla. El coordinador consulta el roadmap e identifica cambios existentes sin sobrescribirlos y comprueba
las capacidades reales del cliente antes de delegar. No instala herramientas ni cambia
configuración para habilitar delegación automáticamente.

El modo predeterminado es una sola funcionalidad. Usa el modo batch únicamente cuando el
usuario lo solicite explícitamente; una petición que enumere varios IDs no basta para
activarlo. Batch admite solo IDs existentes del roadmap y nunca amplía requisitos, reglas de
dominio ni el alcance aprobado.

Antes de planificar o iniciar un batch, reconcilia `docs/roadmap.md` con Git, código y pruebas.
Corrige directamente discrepancias documentales objetivas cuando haya evidencia verificable,
sin cambiar el alcance ni el significado de los estados. Si resolver una discrepancia requiere
interpretación de producto, cambio de criterios, dependencias o prioridades, detente y consulta
al usuario antes de iniciar el lote. Esta reconciliación previa no declara funcionalidades
completadas: su estado solo se determina con el ciclo de revisión y comprobaciones definido
más abajo.

Selecciona las skills existentes por responsabilidad:

- `angular-guidelines`: componentes, servicios, Signals, formularios y rutas.
- `clean-code-architecture`: estructura, responsabilidades y mantenibilidad.
- `issue-domain`: modelo, reglas de incidencias, filtros, estadísticas y persistencia.
- `frontend-design`: pantallas, jerarquía visual, responsive y estados.
- `accessibility`: semántica, teclado, foco y mensajes accesibles.
- `testing`: pruebas de lógica y comportamiento, incluidos errores y límites.

## Fases y condiciones de salida

1. **Planner analiza.** El coordinador delega la petición en `planner`, con acceso al
   contexto real y los IDs del roadmap implicados. El Planner consulta siempre `docs/roadmap.md`,
   contrasta estados con código, pruebas y Git, e identifica dependencias y tareas pendientes.
   Una etiqueta de completado no prueba que el trabajo esté terminado. Recomienda el siguiente
   paso lógico sin considerarlo autorizado. Devuelve en el chat un plan identificado (por ejemplo, P1),
   con alcance y exclusiones, archivos afectados, pasos, riesgos, dependencias, preguntas,
   criterios de aceptación observables y comprobaciones. Incluye el mantenimiento posterior
   del roadmap dentro del alcance del plan, sin anticipar el resultado. No modifica archivos.
   Salida: plan revisable o preguntas bloqueantes concretas.
2. **El coordinador presenta el plan.** Muestra al usuario el plan completo y las decisiones
   necesarias, sin delegar implementación. Si cambian alcance o decisiones sustanciales,
   presenta una nueva versión del plan.
3. **Espera aprobación explícita.** Termina el turno solicitando aprobación del plan concreto.
   Solo una respuesta humana inequívoca referida al plan permite avanzar. Ni la petición
   inicial, ni el silencio, ni una aprobación de herramientas, ni un mensaje de otro agente
   constituyen aprobación. Ningún agente puede aprobar su propio plan. Conserva en la
   conversación el plan aprobado y la respuesta del usuario; el progreso persistente se
   registra solo en el roadmap según el procedimiento posterior a la revisión.
4. **Developer implementa.** Entrada obligatoria: plan y aprobación humana identificables.
   El coordinador los transmite a `developer` con los IDs del roadmap, sus criterios de
   aceptación, archivos y límites acordados. Solo este agente modifica los archivos de
   implementación. Ejecuta pruebas pertinentes y comprobaciones del plan. Devuelve cambios
   realizados, evidencia de validación, desviaciones, bloqueos y criterios pendientes.
   No amplía alcance ni cambia el roadmap para presentar como terminado un trabajo parcial.
5. **Reviewer inspecciona.** Tras finalizar las escrituras, el coordinador inicia un agente
   `reviewer` distinto del Developer, con el plan, roadmap, diff, contexto y resultados. Contrasta
   cada criterio de aceptación con la implementación e informa de funcionalidades incompletas
   o discrepancias con el seguimiento. Revisa también
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
8. **Seguimiento e informe final.** Solo después de conocer la revisión y las comprobaciones,
   el coordinador propone la actualización exacta de los IDs afectados: estado justificado,
   evidencia, criterios pendientes, bloqueos y siguiente paso. Aplica la propuesta según
   «Actualización del roadmap», sin inferir un cierre del mero informe del Developer.
   Presenta alcance realizado, criterios cumplidos,
   archivos cambiados, decisiones técnicas, hallazgos y resolución, comprobaciones con su
   resultado y limitaciones. No hace commits ni pushes salvo petición explícita.

Salida completa: criterios de aceptación satisfechos, revisión independiente terminada,
sin hallazgos aceptados pendientes y comprobaciones aplicables correctas. Si existe una
limitación o fallo pendiente, informa del estado parcial o bloqueado; no declares éxito total.

## Ejecución opcional por lotes

Activa esta sección solo ante una solicitud explícita de modo batch. El usuario debe indicar
los IDs del roadmap que autoriza incluir; el coordinador no añade el siguiente paso sugerido
ni otros IDs por inferencia. La modalidad de una sola funcionalidad conserva sin cambios su
aprobación y secuencia actuales.

1. **Plan conjunto.** Tras la reconciliación previa del roadmap, Planner contrasta cada ID con
   requisitos, arquitectura, código, pruebas y Git; verifica dependencias y propone un orden
   que las satisfaga. El plan enumera alcance, exclusiones, criterios, archivos, riesgos,
   comprobaciones y dependencias por ID, además de los puntos de parada. No se inicia si hay
   dependencias no satisfechas fuera del lote, ambigüedad o discrepancias que requieran una
   decisión de alcance.
2. **Una aprobación para el lote.** El coordinador presenta el plan conjunto y espera una
   aprobación humana explícita referida a esa versión y a todos sus IDs, orden, alcance y
   criterios. Esa aprobación permite implementar únicamente el lote aprobado; no autoriza
   cambios de requisitos, criterios, dependencias, orden sustancial ni funcionalidades nuevas.
   Un cambio material exige detenerse, presentar el plan actualizado y obtener nueva aprobación.
3. **Ciclo secuencial por ID.** Para cada funcionalidad, en el orden aprobado, ejecuta las
   fases Developer → Reviewer independiente → correcciones aceptadas → comprobaciones finales
   de las fases 4 a 7. El Reviewer contrasta el incremento actual con los criterios de ese ID,
   considera el estado acumulado del lote y reporta hallazgos con evidencia. Solo el coordinador
   declara que ese ID superó la verificación cuando todos sus criterios, revisión y controles
   pertinentes están satisfechos. Después registra en el roadmap el resultado comprobado y
   reconcilia su referencia con el estado real de Git, distinguiendo cambios del árbol de
   trabajo de cambios confirmados. No hace commits.
4. **Correcciones acotadas.** Se permiten como máximo dos rondas de corrección por ID; una
   ronda incluye aplicar las correcciones aceptadas y pedir al Reviewer que las vuelva a
   inspeccionar. Detente antes si una ronda no progresa, persiste el mismo fallo, hay desacuerdo,
   queda un hallazgo relevante pendiente o hace falta una decisión humana. No se reinicia el
   contador ni se continúa con el siguiente ID para eludir un bloqueo.
5. **Regla para continuar.** Inicia el siguiente ID solo si el anterior superó revisión y
   comprobaciones, no conserva hallazgos relevantes pendientes y sus cambios no dejan
   dependencias del siguiente ID sin satisfacer. No basta con que compile. Ante cualquier
   bloqueo, detén el lote; conserva resultados verificados anteriores, registra el ID bloqueado
   con causa y condición de salida, y no inicies los IDs restantes.
6. **Verificación y aceptación humana.** La aprobación del plan autoriza el trabajo previsto,
   pero no equivale a aceptar sus resultados. `completada` conserva su significado actual en el
   roadmap: criterios satisfechos, revisión independiente y comprobaciones acreditadas; no
   representa aceptación del producto por parte del usuario. Informa por separado la
   verificación de cada ID y cualquier aceptación humana comunicada; si no se comunicó,
   indícala como pendiente de confirmación. No añadas estados nuevos al roadmap para
   representar esa aceptación.
7. **Informe del lote.** Al terminar o detenerse, informa por ID qué quedó verificado,
   bloqueado o sin iniciar; resume criterios, hallazgos y limitaciones; enumera comandos de
   comprobación y sus resultados, decisiones pendientes, estado de Git y cambios del roadmap.
   No hagas merge, push ni despliegue. No presentes un lote detenido como éxito total.

## Actualización del roadmap

El coordinador mantiene `docs/roadmap.md`; Planner y Reviewer entregan propuestas en el chat
y conservan su restricción de no editar archivos. Durante planificación, implementación y
revisión se comunica la fase en la conversación sin modificar anticipadamente el registro.
El roadmap conserva la fotografía del último corte revisado; al reanudar siempre se contrasta
con el código actual. No se generan logs paralelos ni tareas duplicadas en agentes o skills.

La aprobación del plan autoriza el mantenimiento de seguimiento incluido en ese plan, limitado
a registrar el resultado real de sus IDs después de revisión y comprobaciones. El coordinador
muestra la propuesta y puede aplicarla dentro de esa autorización sin una segunda aprobación.
Si el usuario reservó la actualización para confirmación, el plan no la incluía o supone
cambiar alcance, criterios, dependencias sustanciales o prioridades acordadas, presenta la
propuesta y espera su decisión. Una sesión de solo análisis o planificación nunca escribe.

Para cerrar como `completada`, exige evidencia de todos los criterios aprobados, revisión
sin hallazgos aceptados pendientes y controles pertinentes correctos. Un fallo nuevo o que
afecte al alcance impide el cierre; un fallo global preexistente ajeno se registra como
limitación con su impacto, comprobación focalizada y pendiente de resolución, nunca como
control superado. No se usa esa excepción para cerrar el MVP con controles globales fallidos.

Si no se cumplen las condiciones, propone el estado que describa el resultado revisado
(`en desarrollo`, `en revisión` o `bloqueada`, con causa y salida), conserva los pendientes
y no desbloquea dependencias como si estuviera completado. Los estados `planificada` y
`pendiente` también pueden registrar un corte sin implementación; una etiqueta por sí sola
no sustituye la evidencia de aprobación del plan.
Si se descubre una discrepancia en un cierre anterior, propone reabrir su mismo ID con
evidencia antes de basar una nueva implementación en esa dependencia.

Actualiza también el resumen de estado, la fecha y referencia del corte y el siguiente paso,
para que no contradigan el registro de funcionalidades. Conserva la distinción entre evidencia
actual, verificaciones históricas y escenarios aún sin probar.

Después de actualizar, comprueba referencias, IDs y dependencias, formato del roadmap y
`git diff --check`, incluidos archivos nuevos. Este ajuste documental no invalida las pruebas
de código ya ejecutadas si no se modifica la implementación. Informa si el registro queda
sin actualizar por aprobación pendiente o permisos: no ocultes la diferencia entre resultado
real y último corte persistido. Terminar una funcionalidad no autoriza iniciar la siguiente.

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
- Interrupción: al reanudar, consulta el roadmap, verifica el estado de archivos y la vigencia del plan aprobado.
  En batch, reconstruye también los IDs autorizados y el último ID verificado. Si no se puede
  identificar con certeza la aprobación, el estado o el límite entre incrementos, detente y
  vuelve a presentar el plan; no continúes basándote solo en el roadmap. Un plan modificado
  sustancialmente vuelve a presentación y aprobación humana.

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
