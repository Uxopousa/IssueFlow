# Contrato de la API de IssueFlow

## Estado

Contrato inicial aprobado el **24 de noviembre de 2026**. Está diseñado para la integración
local futura entre Angular y ASP.NET Core. No hay API implementada todavía.

## Convenciones

- Transporte HTTP con JSON y rutas bajo `/api/v1`.
- Propiedades JSON en `camelCase`.
- Identificadores UUID generados por el servidor.
- Fechas en UTC con formato ISO 8601.
- Las solicitudes usan DTO de entrada y no exponen entidades de PostgreSQL.
- Los métodos HTTP conservan su semántica; `PUT` es idempotente.
- No hay autenticación ni cuentas en esta versión local. No desplegar públicamente sin una
  decisión de acceso y seguridad.

## Recurso `Issue`

Representación de respuesta:

```json
{
  "id": "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  "title": "No carga el panel",
  "description": "El panel queda vacío después de iniciar sesión.",
  "category": "Interfaz",
  "priority": "high",
  "status": "open",
  "createdAt": "2026-11-24T10:30:00Z",
  "updatedAt": "2026-11-24T10:30:00Z"
}
```

El valor UUID del ejemplo es ilustrativo. La API genera los identificadores al crear una
incidencia. No se aceptan `id`, `createdAt` ni `updatedAt` en cuerpos de escritura.

## Endpoints

### `GET /api/v1/issues`

Devuelve la colección completa en una lista JSON. Si no hay incidencias, devuelve `200 OK`
con `[]`.

Parámetros de consulta opcionales:

| Parámetro  | Comportamiento                                                                            |
| ---------- | ----------------------------------------------------------------------------------------- |
| `q`        | Recorta espacios exteriores y busca sin distinguir mayúsculas en `title` y `description`. |
| `status`   | Filtra por `open`, `in-progress` o `resolved`.                                            |
| `priority` | Filtra por `low`, `medium` o `high`.                                                      |

Los filtros se combinan con AND. Un parámetro de estado o prioridad con valor no permitido
devuelve `400 Bad Request` con errores de validación. La versión inicial no pagina la lista,
en consonancia con el alcance del MVP; se revisará si el volumen de datos lo requiere.

### `GET /api/v1/issues/{id}`

Devuelve una incidencia con `200 OK`. Un UUID válido que no exista devuelve `404 Not Found`
con Problem Details. El dashboard calcula sus estadísticas desde la lista completa, sin
aplicar filtros de búsqueda.

### `POST /api/v1/issues`

Crea una incidencia. El cuerpo contiene los campos editables:

```json
{
  "title": "No carga el panel",
  "description": "El panel queda vacío después de iniciar sesión.",
  "category": "Interfaz",
  "priority": "high",
  "status": "open"
}
```

Devuelve `201 Created`, el recurso creado y una cabecera `Location` con su URI. El servidor
recorta espacios exteriores, genera `id`, `createdAt` y `updatedAt`.

### `PUT /api/v1/issues/{id}`

Reemplaza todos los campos editables de la incidencia. El cuerpo usa la misma forma que
`POST`. El servidor conserva `id` y `createdAt`, valida la solicitud y establece `updatedAt`
cuando cambian los datos. Repetir una solicitud equivalente no crea efectos duplicados.

Devuelve `200 OK` y la representación actualizada. Devuelve `400 Bad Request` si los campos
no son válidos y `404 Not Found` si el UUID válido no corresponde a una incidencia.

### `DELETE /api/v1/issues/{id}`

Elimina la incidencia y devuelve `204 No Content`. Si no existe, devuelve `404 Not Found`.

## Validación

Las cadenas se recortan en los extremos antes de medir su longitud. Cadenas vacías o formadas
solo por espacios son inválidas. Los límites son:

| Campo         | Mínimo | Máximo |
| ------------- | -----: | -----: |
| `title`       |      3 |    100 |
| `description` |     10 |  1.000 |
| `category`    |      2 |     50 |

`priority` solo acepta `low`, `medium` o `high`; `status` solo acepta `open`, `in-progress`
o `resolved`. La API vuelve a validar todas las entradas independientemente del cliente.

## Errores HTTP

Los errores usan `application/problem+json` según Problem Details:

| Estado                      | Uso                                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| `400 Bad Request`           | JSON mal formado, filtros inválidos o error de validación; errores por campo en el objeto `errors`. |
| `404 Not Found`             | Incidencia inexistente.                                                                             |
| `500 Internal Server Error` | Fallo inesperado con mensaje genérico; nunca incluir stack trace, SQL ni secretos.                  |

## OpenAPI y pruebas

El documento OpenAPI debe describir cada ruta, parámetros, DTO, ejemplos y respuestas de
éxito y error. Las pruebas del contrato cubrirán validación, filtros combinados, generación
de metadatos, códigos HTTP, incidencias inexistentes y persistencia PostgreSQL.

## Referencias de diseño

- [Diseño de APIs REST](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design)
- [Semántica e idempotencia de métodos HTTP](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-implementation)
- [Validación y OpenAPI en ASP.NET Core 10](https://learn.microsoft.com/en-us/aspnet/core/release-notes/aspnetcore-10.0)
- [Problem Details en ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/web-api/handle-errors?view=aspnetcore-10.0)
