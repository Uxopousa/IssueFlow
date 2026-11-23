---
name: testing
description: 'Use when planning or writing frontend tests, Angular service tests, Signal tests, Reactive Forms tests, validation tests, edge-case tests, or Vitest tests compatible with an existing Angular configuration.'
---

# Testing

## Cuándo utilizar esta skill

Actívala al añadir o cambiar lógica, servicios, Signals, formularios, rutas con comportamiento, validaciones o estados de error. Inspecciona primero el runner y la configuración existentes; no instales una herramienta ni cambies el runner para una prueba aislada.

## Estrategia

1. Define el comportamiento observable y el riesgo que quieres cubrir.
2. Localiza la unidad más pequeña que pueda probarlo sin perder realismo.
3. Escribe una prueba que falle por la ausencia o regresión del comportamiento.
4. Implementa o ajusta el código.
5. Ejecuta primero el test focalizado y después la suite relevante.
6. Revisa que la prueba no dependa de detalles internos innecesarios.

Prioriza pruebas de reglas de negocio, transformaciones, persistencia, validaciones y flujos críticos. No persigas cobertura por sí misma: una prueba debe detectar un fallo útil.

## Pruebas unitarias

- Nombra cada prueba con condición y resultado esperado.
- Arrange, Act, Assert: prepara datos, ejecuta una acción y verifica el resultado.
- Usa datos mínimos pero representativos y agrega casos límite deliberadamente.
- Comprueba resultados y efectos observables, no la implementación privada.
- Aísla dependencias externas con dobles de prueba tipados y verifica sus contratos.
- Evita tests frágiles basados en orden incidental, clases CSS o snapshots extensos.

```ts
it('returns only high-priority open issues', () => {
  const result = filterIssues(issues, { status: 'open', priority: 'high' });

  expect(result).toEqual([highPriorityOpenIssue]);
});
```

## Servicios Angular

- Usa el mecanismo de testing de Angular ya configurado para crear el entorno de inyección cuando el servicio dependa de DI.
- Prueba creación, actualización, eliminación, cambio de estado y errores de cada servicio.
- Sustituye `localStorage`, reloj, router o APIs externas por dependencias controlables.
- Verifica que un fallo de persistencia no se presenta como éxito y que el estado permanece coherente.
- Comprueba que las reglas se ejecutan en el servicio y no solo a través de un componente.

## Signals

- Lee la Signal después de cada operación pública que deba cambiarla.
- Prueba valores derivados con colección vacía, un elemento y combinaciones que puedan confundirse.
- Comprueba recomputación tras altas, ediciones, eliminaciones y cambios de estado.
- Verifica que no se expone una vía pública para mutar directamente el estado.
- Prueba `effect()` solo mediante su efecto observable, aislando temporizadores o persistencia cuando sea necesario.

## Formularios

Prueba por separado:

- valores iniciales de alta y valores cargados en edición;
- campos obligatorios, espacios en blanco, límites mínimo y máximo;
- valores de enumeraciones inválidos;
- envío bloqueado cuando el formulario no es válido;
- envío válido con payload normalizado;
- visualización de errores tras intentar enviar;
- conservación de identificadores y fechas cuando se edita.

No pruebes únicamente que existe un `Validators.required`: prueba que el usuario no puede completar la operación inválida.

## Casos límite y errores

Incluye cuando aplique:

- colección vacía;
- búsqueda sin coincidencias;
- filtros combinados;
- títulos y descripciones en los límites exactos;
- texto con espacios exteriores o solo espacios;
- identificador inexistente;
- JSON inválido o datos persistidos con forma incorrecta;
- `localStorage` no disponible, bloqueado o lleno;
- doble acción rápida y resultado de una operación fallida.

## Vitest y Angular

Usa Vitest si ya está configurado por el proyecto. Respeta sus APIs y configuración; no mezcles sintaxis de otro runner ni añadas dependencias sin necesidad. Ejecuta el comando definido por el repositorio y, si falla por configuración o entorno, informa del fallo concreto en lugar de suavizarlo.

## Revisión final

Confirma que las pruebas cubren comportamiento real, estados de error y regresiones plausibles; que son deterministas, legibles y rápidas; y que no obligan a cambiar producción solo para hacerlas pasar.
