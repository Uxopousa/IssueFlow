---
name: clean-code-architecture
description: 'Use when designing, implementing, reviewing, or refactoring software to improve readability, maintainability, cohesion, coupling, complexity, responsibilities, and architecture without adding unnecessary abstractions.'
---

# Clean Code and Architecture

## Cuándo utilizar esta skill

Actívala al diseñar una solución, revisar código, refactorizar una unidad existente o decidir si una abstracción está justificada. Antes de cambiar, entiende el comportamiento actual y consulta las pruebas, contratos y dependencias que puedan verse afectados.

## Procedimiento

1. Define qué comportamiento debe conservarse y qué problema concreto se quiere resolver.
2. Lee el contexto suficiente para identificar responsabilidades, duplicaciones y dependencias reales.
3. Haz el cambio más pequeño que mejore la estructura sin alterar el comportamiento.
4. Verifica tipos y pruebas antes y después; añade pruebas si el comportamiento carece de protección.
5. Revisa el diff para eliminar abstracciones, comentarios o cambios no relacionados.

## Legibilidad y nombres

- Usa nombres que expresen intención, dominio y unidad; evita abreviaturas ambiguas.
- Prefiere código que pueda leerse de arriba abajo sin explicar cada línea.
- Haz que las funciones y tipos revelen sus precondiciones y resultados.
- Mantén una estructura consistente con las convenciones del proyecto.
- Comenta solo decisiones no obvias, restricciones externas o motivos que el código no pueda expresar.
- Si un comentario explica un bloque difícil, intenta primero mejorar nombres, estructura y flujo.

## Funciones y complejidad

- Mantén las funciones pequeñas y con una responsabilidad clara.
- Cuando una función concentre validaciones independientes, extrae grupos coherentes a helpers pequeños con una responsabilidad y un nombre claros, siempre que permitan entender mejor el flujo.
- Usa guard clauses y early returns para evitar anidamiento innecesario.
- Separa validación, transformación y ejecución cuando tengan motivos de cambio distintos.
- Evita demasiados parámetros; agrúpalos en un tipo solo cuando representen un concepto real.
- No uses booleanos que cambien significativamente el comportamiento si dos operaciones explícitas son más claras.
- Extrae la lógica compleja de los bucles a funciones descriptivas.
- No crees un helper por cada condición ni extraigas código solo para reducir líneas. Conserva las comprobaciones en línea cuando resulten más claras y evita obligar al lector a saltar entre funciones para comprender una regla sencilla.

```ts
const urgentIssues = issues.filter(isUrgentIssue);
urgentIssues.forEach(processUrgentIssue);

function isUrgentIssue(issue: Issue): boolean {
  return issue.status === 'open' && issue.priority === 'high' && issue.title.length > 10;
}
```

## Validación de objetos y reglas del modelo

- Al validar objetos JavaScript o TypeScript, distingue propiedades propias de heredadas. Cuando el contrato exija propiedades propias, prefiere `Object.hasOwn(objeto, campo)` frente a `'campo' in objeto`, después de comprobar que el valor es un objeto no nulo. Comprueba también el tipo y el valor de cada propiedad; su existencia no basta para validar el objeto.
- Mantén explícitas y fáciles de localizar las reglas del modelo: campos obligatorios y permitidos, valores válidos y relaciones entre campos. Organízalas en tipos, constantes o validadores con nombres claros según lo que mejore la lectura, sin imponer una abstracción nueva.
- No confundas exigir propiedades propias con rechazar campos adicionales: aplica cada restricción solo cuando forme parte del contrato. No introduzcas reglas de dominio nuevas durante una refactorización de legibilidad.

## Principios de diseño

- **SRP:** una unidad debe tener un motivo principal para cambiar.
- **OCP:** extiende mediante composición o contratos estables cuando haya variación real; no diseñes para hipótesis.
- **LSP:** las implementaciones deben respetar el contrato que sus consumidores esperan.
- **ISP:** ofrece interfaces pequeñas y centradas en las necesidades reales del consumidor.
- **DIP:** separa reglas de negocio de detalles externos mediante dependencias explícitas y sustituibles cuando aporte valor.
- Aplica KISS, DRY y YAGNI con criterio: eliminar duplicación accidental no justifica una abstracción prematura.
- Prefiere alta cohesión, bajo acoplamiento, encapsulación y composición frente a herencia cuando sean adecuados.

## Arquitectura

- Separa presentación, aplicación, dominio e infraestructura cuando sus responsabilidades o ciclos de cambio lo requieran.
- Mantén las reglas de negocio fuera de componentes visuales.
- Evita servicios gigantes que coordinen UI, dominio, persistencia y transporte a la vez.
- Haz visibles las dependencias y limita las direcciones de importación.
- No introduzcas capas, interfaces o repositorios por anticipación; exige un problema concreto, una variación real o una prueba clara de beneficio.
- Reutiliza una solución existente antes de crear otra equivalente.

## Patrones

Considera Strategy, Factory, Adapter, Observer, Facade, Repository o Dependency Injection solo cuando resuelvan un problema verificable. Documenta brevemente la decisión cuando el patrón no sea evidente. No uses patrones para demostrar conocimientos ni conviertas una función sencilla en un sistema de abstracciones.

## Refactorización segura

- No mezcles una refactorización amplia con un cambio funcional no relacionado.
- Divide cambios grandes en pasos comprobables.
- Conserva contratos públicos salvo que el cambio sea parte explícita del objetivo.
- Elimina duplicación real, complejidad accidental y dependencias innecesarias; no reestructures código que ya sea claro.
- Mantén las pruebas existentes y mejora su foco si dependen demasiado de detalles internos.
- Si no puedes demostrar que el comportamiento se conserva, detén la refactorización y reduce el alcance.
- Antes de introducir una abstracción, identifica qué complejidad concreta elimina y qué coste de mantenimiento añade.
- Prefiere soluciones explícitas y fáciles de seguir frente a
  cadenas de funciones o capas que dificulten localizar el flujo.
- Evita tanto las funciones excesivamente extensas como la
  fragmentación artificial en demasiadas funciones triviales.

## Análisis estático y linting

- Utiliza ESLint como parte del proceso habitual de desarrollo y revisión del código.
- Respeta las reglas configuradas para TypeScript y Angular.
- Resuelve los errores y advertencias relevantes en lugar de ocultarlos mediante supresiones.
- Utiliza excepciones de ESLint únicamente cuando exista una justificación técnica concreta.
- No introduzcas complejidad innecesaria únicamente para satisfacer una regla mecánica.
- No modifiques la configuración de ESLint para hacer desaparecer errores sin analizar antes su causa.
- Antes de finalizar una tarea, comprueba que los cambios cumplen las reglas de análisis estático del proyecto.

## Revisión final

Pregunta: ¿se entiende el código sin contexto oculto?, ¿cada unidad tiene una responsabilidad clara?, ¿hay una fuente de verdad?, ¿la solución es proporcional al problema?, ¿las dependencias son explícitas?, ¿se conserva el comportamiento y están cubiertas las regresiones? Si una abstracción no responde afirmativamente a una necesidad concreta, elimínala.
