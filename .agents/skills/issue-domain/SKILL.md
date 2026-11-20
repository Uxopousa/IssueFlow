---
name: issue-domain
description: 'Use when implementing or reviewing IssueFlow issue models, validation, creation, editing, search, filters, status changes, statistics, local persistence, or related business rules.'
---

# Issue Domain

## Cuándo utilizar esta skill

Actívala cuando un cambio afecte a una incidencia, su formulario, sus filtros, el dashboard, el almacenamiento local o cualquier regla del MVP. Antes de actuar, consulta obligatoriamente [`docs/requirements.md`](../../../docs/requirements.md) y, si afecta a estructura o servicios, [`docs/architecture.md`](../../../docs/architecture.md).

## Contrato del dominio

Una incidencia contiene:

```ts
type IssueStatus = 'open' | 'in-progress' | 'resolved';
type IssuePriority = 'low' | 'medium' | 'high';

interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: IssuePriority;
  status: IssueStatus;
  createdAt: string;
  updatedAt: string;
}
```

No añadas campos, estados o prioridades por iniciativa propia. Si el requisito cambia, actualiza primero el alcance documentado.

## Reglas de creación y edición

1. Valida y normaliza los campos de texto antes de construir la entidad.
2. Al crear, genera un identificador único y establece `createdAt` y `updatedAt` con la misma fecha inicial.
3. Al editar, conserva `id` y `createdAt`; solo `updatedAt` debe reflejar la modificación.
4. No permitas que el formulario controle identificadores ni fechas de auditoría.
5. Cambiar el estado es una actualización normal y debe persistirse como cualquier otra modificación.
6. Si falla la persistencia, conserva el estado en memoria cuando sea posible, informa del error y no presentes la operación como guardada correctamente.

## Validación

- `title`: obligatorio, 3-100 caracteres tras quitar espacios exteriores.
- `description`: obligatoria, 10-1.000 caracteres tras quitar espacios exteriores.
- `category`: obligatoria, 2-50 caracteres tras quitar espacios exteriores.
- `priority` y `status`: obligatorios y limitados a sus uniones permitidas.
- Rechaza texto compuesto solo por espacios.
- Mantén los mensajes de validación cerca del campo y no dupliques reglas entre template y servicio.

La validación de UI mejora la experiencia, pero el servicio debe validar también las entradas de negocio. Los datos de `localStorage` deben pasar una validación de forma y valores antes de entrar al estado.

## Búsqueda, filtros y estadísticas

- Busca por coincidencias de texto en `title` y `description`.
- Normaliza la consulta de forma consistente, incluyendo espacios y mayúsculas según la decisión del proyecto.
- Aplica simultáneamente el filtro de estado, el filtro de prioridad y la búsqueda; no hagas que un filtro reemplace silenciosamente a otro.
- Representa “sin filtro” con un valor explícito y no con estados inválidos.
- Calcula estadísticas desde la colección fuente o estado derivado, nunca desde una copia mantenida manualmente.
- Como mínimo, el dashboard debe ofrecer total, abiertas, en progreso y resueltas; las cifras deben cambiar tras cualquier mutación.

```ts
const filteredIssues = computed(() =>
  issues().filter(
    (issue) =>
      matchesSearch(issue, query()) &&
      matchesStatus(issue, statusFilter()) &&
      matchesPriority(issue, priorityFilter()),
  ),
);
```

## Persistencia y errores

- Mantén el acceso a `localStorage` en un servicio de persistencia, no en componentes.
- Trata la ausencia de datos como una colección vacía.
- Considera no fiables tanto el JSON como su forma, tipos, estados, prioridades e identificadores.
- Gestiona por separado JSON inválido, datos con estructura inválida y errores de lectura/escritura.
- Si la persistencia falla, informa al usuario y conserva el estado en memoria solo si el flujo lo permite; nunca ocultes el fallo.
- Si la persistencia falla, conserva los cambios en memoria cuando sea posible y expón un estado de error que permita informar al usuario.
- Distingue entre datos actualizados en memoria y datos guardados correctamente en localStorage.
- No sobrescribas datos válidos con una colección vacía por una
  lectura fallida sin una decisión explícita.

## Estados de la interfaz

Preserva los estados definidos por el MVP:

- colección vacía: explica que aún no hay incidencias y ofrece crear una;
- búsqueda o filtros sin coincidencias: ofrece limpiar criterios;
- detalle inexistente: informa de que no existe o fue eliminada y permite volver;
- error de almacenamiento: muestra un mensaje comprensible y no simula éxito.

## Límites

No introduzcas backend, autenticación, permisos, notificaciones, sincronización entre dispositivos, comentarios, adjuntos ni otras funcionalidades fuera del MVP. Mantén las reglas en servicios o funciones de dominio y deja a los componentes la coordinación y presentación.

## Revisión final

Comprueba invariantes de identificadores y fechas, valores cerrados, combinación de filtros, coherencia del dashboard, persistencia después de recargar y comportamiento ante datos corruptos. Añade pruebas para cada regla nueva o modificada.
