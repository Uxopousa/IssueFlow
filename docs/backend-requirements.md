# Requisitos iniciales del backend de IssueFlow

## Estado y alcance

Este documento define el primer backend post-MVP. Se mantiene separado de
[`requirements.md`](requirements.md), que describe el MVP Angular ya cerrado. Las decisiones
de alcance de este documento fueron confirmadas el **24 de noviembre de 2026**. La
implementación todavía no ha comenzado.

El backend ofrecerá una API HTTP para consultar y mantener incidencias, con PostgreSQL como
persistencia. Se ejecutará localmente con Docker. GitHub Pages seguirá sirviendo la demo
estática del frontend, que continuará usando `localStorage`; no se desplegará la API en esta
etapa.

## Alcance incluido

- Listar, consultar, crear, editar y eliminar incidencias.
- Buscar por texto en título y descripción.
- Filtrar por estado y prioridad, de forma combinable con la búsqueda.
- Proporcionar los datos necesarios para que el frontend calcule las estadísticas del
  dashboard a partir de la lista completa.
- Validar las reglas de incidencias en el servidor, aunque el frontend también valide.
- Ejecutar API y PostgreSQL en el entorno local Docker documentado.
- Describir el contrato de forma legible por máquina mediante OpenAPI.

## Fuera de esta etapa

- Cuentas, autenticación, roles, permisos o propiedad de incidencias por usuario.
- Acceso público a una API desplegada. Antes de publicar un servicio habrá que decidir y
  documentar cómo se restringe el acceso; CORS por sí solo no es autenticación.
- Despliegue remoto del backend o una base de datos gestionada.
- Migración automática de datos de `localStorage` a PostgreSQL.
- Paginación, ordenación avanzada, exportación, importación, notificaciones o colaboración.
- Cambios en el diseño o en las reglas funcionales del MVP sin una aprobación de alcance.

La demo de GitHub Pages y la aplicación local conectada a la API son modos distintos. El
`localhost` de un visitante de GitHub Pages sería su propio equipo, no el equipo que ejecuta
el backend del desarrollador.

## Modelo de incidencia

La representación de respuesta conserva los campos del MVP:

| Campo         | Tipo JSON         | Regla                                                                    |
| ------------- | ----------------- | ------------------------------------------------------------------------ |
| `id`          | string UUID       | Lo genera el servidor y no se puede modificar.                           |
| `title`       | string            | Obligatorio; de 3 a 100 caracteres tras recortar espacios exteriores.    |
| `description` | string            | Obligatoria; de 10 a 1.000 caracteres tras recortar espacios exteriores. |
| `category`    | string            | Obligatoria; de 2 a 50 caracteres tras recortar espacios exteriores.     |
| `priority`    | string            | `low`, `medium` o `high`.                                                |
| `status`      | string            | `open`, `in-progress` o `resolved`.                                      |
| `createdAt`   | string fecha-hora | UTC; lo establece el servidor y permanece inmutable.                     |
| `updatedAt`   | string fecha-hora | UTC; lo establece el servidor cuando cambia la incidencia.               |

Los campos de fecha se representarán como fecha-hora ISO 8601 en UTC. El cliente no podrá
establecer `id`, `createdAt` ni `updatedAt` en las solicitudes de creación o actualización.

## Requisitos de implementación

- ASP.NET Core sobre .NET 10 LTS.
- Minimal APIs con grupos de rutas y resultados tipados para mantener visible el contrato.
- Un proyecto de API organizado como monolito modular sencillo; no introducir microservicios
  ni capas de proyecto adicionales sin una necesidad demostrada.
- PostgreSQL como base de datos y Docker para el desarrollo local.
- Validación del servidor para cada entrada y regla de dominio; no confiar en la validación
  del navegador.
- Respuestas de error coherentes con Problem Details y sin exponer trazas ni detalles
  internos al cliente.
- OpenAPI actualizado junto con las rutas, modelos y respuestas.
- Secretos y credenciales fuera del control de versiones.
- Pruebas unitarias para reglas del dominio y pruebas de integración para HTTP y PostgreSQL.

## Criterios de aceptación

1. Las cinco operaciones CRUD respetan el contrato de [`api-contract.md`](api-contract.md).
2. Todas las restricciones de longitud y valores de estado/prioridad se validan en el
   servidor.
3. Los identificadores y fechas son generados y controlados por el servidor.
4. Búsqueda y filtros funcionan individualmente y en combinación; el dashboard usa los datos
   no filtrados.
5. Errores de validación, recurso inexistente y fallo interno tienen respuestas HTTP
   documentadas y coherentes.
6. API y PostgreSQL se pueden iniciar localmente con Docker, sin depender de un proveedor de
   alojamiento.
7. La demo publicada de GitHub Pages permanece estática y no intenta llamar al backend local.
8. Build y pruebas se pueden ejecutar localmente y en CI; GitHub Actions no despliega el
   backend.

## Decisiones pendientes

- Confirmar el acceso a PostgreSQL desde .NET, incluida la recomendación EF Core con Npgsql.
- Elegir versiones concretas del SDK, imágenes de Docker y proveedor .NET para PostgreSQL.
- Decidir qué ocurre con incidencias ya guardadas en `localStorage` durante una futura
  integración del frontend.
- Establecer límites y política de ordenación si el tamaño de la colección requiere
  paginación.
- Reevaluar acceso y alojamiento remoto solo si se solicita desplegar el backend.

## Referencias técnicas

- [Arquitecturas comunes para aplicaciones web .NET](https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/common-web-application-architectures)
- [Validación de Minimal APIs en ASP.NET Core 10](https://learn.microsoft.com/en-us/aspnet/core/release-notes/aspnetcore-10.0)
- [Generación de OpenAPI en ASP.NET Core 10](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/overview?view=aspnetcore-10.0)
- [Problem Details en APIs ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/web-api/handle-errors?view=aspnetcore-10.0)
- [Almacenamiento de secretos en desarrollo](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets?view=aspnetcore-10.0)
- [Configuración de CORS en ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/security/cors?view=aspnetcore-10.0)
