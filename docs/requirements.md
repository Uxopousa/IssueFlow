# Requisitos del MVP de IssueFlow

## 1. Objetivo y alcance

IssueFlow es una aplicación web cliente para gestionar incidencias de forma sencilla. El MVP está orientado a una experiencia clara y responsive para crear, consultar y mantener incidencias almacenadas localmente en el navegador.

El MVP no requiere servidor ni cuentas de usuario: los datos pertenecen al navegador en el que se utiliza la aplicación.

## 2. Funcionalidades incluidas

### 2.1 Dashboard

El dashboard mostrará estadísticas generales calculadas a partir de las incidencias almacenadas:

- Número total de incidencias.
- Número de incidencias abiertas.
- Número de incidencias en progreso.
- Número de incidencias resueltas.
- Distribución por prioridad cuando aporte valor a la lectura general.

Las estadísticas deben actualizarse después de crear, editar, eliminar o cambiar el estado de una incidencia.

### 2.2 Listado de incidencias

El usuario podrá consultar todas las incidencias en una vista de listado. Cada elemento mostrará, como mínimo, el título, la categoría, la prioridad, el estado y las fechas relevantes.

El listado permitirá:

- Buscar por texto en el título y la descripción.
- Filtrar por estado.
- Filtrar por prioridad.
- Combinar búsqueda y filtros.
- Acceder a la vista de detalle.
- Iniciar la edición.
- Eliminar una incidencia.
- Cambiar el estado de una incidencia.

No se exige paginación para el MVP. Si no existen incidencias que mostrar, se presentará un estado vacío explicativo y una acción para crear la primera.

### 2.3 Creación y edición

El usuario podrá crear una incidencia y editar una incidencia existente mediante un formulario reactivo.

Los campos editables son:

- `title`
- `description`
- `category`
- `priority`
- `status`

Al crear una incidencia, la aplicación generará el `id`, establecerá `createdAt` y establecerá `updatedAt`. Al editarla, conservará el `id` y `createdAt`, y actualizará `updatedAt`.

### 2.4 Detalle

La vista de detalle mostrará toda la información de una incidencia, incluyendo descripción, categoría, prioridad, estado y fechas de creación y actualización. Incluirá acciones para editarla, eliminarla y volver al listado.

Si el identificador de la ruta no corresponde con una incidencia existente, se mostrará un estado de error y una forma clara de volver al listado.

### 2.5 Persistencia local

Las incidencias se guardarán en `localStorage`. La aplicación cargará los datos al iniciar y persistirá cada alta, modificación, cambio de estado y eliminación.

La ausencia de datos se tratará como un listado vacío. Un fallo de lectura o escritura no debe provocar una pantalla rota: se mostrará un mensaje comprensible y se conservará la información en memoria mientras sea posible.

## 3. Modelo de datos

Cada incidencia tendrá la siguiente forma conceptual:

| Campo | Tipo conceptual | Reglas |
|---|---|---|
| `id` | `string` | Obligatorio y único. Lo genera la aplicación. |
| `title` | `string` | Obligatorio. |
| `description` | `string` | Obligatoria. |
| `category` | `string` | Obligatoria. |
| `priority` | `low \| medium \| high` | Obligatoria. |
| `status` | `open \| in-progress \| resolved` | Obligatoria. |
| `createdAt` | fecha serializada | Obligatoria y no modificable por el usuario. |
| `updatedAt` | fecha serializada | Obligatoria; se actualiza al modificar. |

### Valores permitidos

Estados:

- `open`
- `in-progress`
- `resolved`

Prioridades:

- `low`
- `medium`
- `high`

## 4. Validaciones

- `title` es obligatorio y debe contener entre 3 y 100 caracteres después de eliminar espacios exteriores.
- `description` es obligatoria y debe contener entre 10 y 1.000 caracteres después de eliminar espacios exteriores.
- `category` es obligatoria y debe contener entre 2 y 50 caracteres después de eliminar espacios exteriores.
- `priority` debe ser uno de los valores permitidos.
- `status` debe ser uno de los valores permitidos.
- Los campos de texto no deben aceptar únicamente espacios en blanco.
- Los mensajes de validación aparecerán junto al campo y serán comprensibles para el usuario.
- El formulario no se enviará mientras existan errores; los errores se harán visibles al intentar enviar o al interactuar con el campo según corresponda.

## 5. Estados vacíos y casos de error

### Estados vacíos

- **Listado sin incidencias:** indicar que todavía no hay incidencias y ofrecer crear una.
- **Búsqueda o filtros sin resultados:** indicar que no hay coincidencias y permitir limpiar la búsqueda y los filtros.
- **Dashboard sin datos:** mostrar estadísticas a cero y un mensaje que invite a crear la primera incidencia.
- **Detalle inexistente:** indicar que la incidencia no existe o fue eliminada y ofrecer volver al listado.

### Casos de error

- `localStorage` no disponible, bloqueado o lleno: informar del problema sin ocultarlo.
- Datos almacenados con formato inválido: ignorarlos de forma segura, informar del problema y evitar que la aplicación se bloquee.
- Error al crear, editar o eliminar: mantener el estado coherente, informar del resultado y no mostrar una operación como exitosa si no se completó.
- Ruta de detalle inválida o incidencia inexistente: mostrar la pantalla de error correspondiente.

## 6. Criterios de aceptación

1. El usuario puede crear una incidencia válida y verla inmediatamente en el listado.
2. No se puede crear ni guardar una incidencia si falta un campo obligatorio o se incumple una validación.
3. Una incidencia creada conserva sus datos después de recargar la página cuando `localStorage` está disponible.
4. El usuario puede editar los campos permitidos y los cambios se reflejan en el listado, el detalle y el dashboard.
5. `createdAt` permanece intacto al editar y `updatedAt` refleja la modificación.
6. El usuario puede eliminar una incidencia y, tras confirmarlo, deja de aparecer en listado, detalle y estadísticas.
7. El usuario puede cambiar el estado entre `open`, `in-progress` y `resolved`.
8. La búsqueda encuentra incidencias por coincidencias de texto en título o descripción.
9. Los filtros de estado y prioridad funcionan individualmente y combinados con la búsqueda.
10. El dashboard muestra estadísticas coherentes con las incidencias actuales.
11. Los estados vacíos y errores descritos se muestran de forma clara y ofrecen una salida útil.
12. La interfaz básica funciona en tamaños de pantalla móviles y de escritorio y sus controles son utilizables con teclado.

## 7. Fuera del MVP

Quedan expresamente fuera de esta primera versión:

- Backend, API y base de datos remota.
- Autenticación y gestión de cuentas.
- Roles, permisos y colaboración entre usuarios.
- Notificaciones por correo, push o dentro de la aplicación.
- Adjuntos, comentarios, historial de cambios y etiquetas avanzadas.
- Sincronización entre dispositivos.
- Paginación, exportación, importación y analítica avanzada.
- Cualquier otra funcionalidad que no sea necesaria para el flujo principal de crear, consultar, modificar, resolver y eliminar incidencias.
