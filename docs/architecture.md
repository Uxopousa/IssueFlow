# Arquitectura de IssueFlow

## 1. Objetivo

IssueFlow utilizará una arquitectura Angular sencilla, orientada a funcionalidades y fácil de ampliar sin introducir capas innecesarias. La aplicación será un cliente local: la fuente de persistencia del MVP será `localStorage`.

La configuración existente confirma Angular 21, TypeScript estricto y Tailwind CSS 4 integrado con PostCSS. La arquitectura debe conservar estas decisiones y aprovechar las APIs modernas de Angular.

## 2. Principios

- Componentes standalone; no se crearán módulos NgModule para organizar la aplicación.
- Signals para el estado reactivo de la aplicación.
- Angular Router para separar dashboard, listado, creación, edición y detalle.
- Reactive Forms para formularios y validaciones.
- Servicios para encapsular el estado, las reglas de negocio y el acceso a `localStorage`.
- TypeScript estricto, tipos explícitos y sin `any`.
- Tailwind CSS 4 para los estilos de interfaz, usando la integración global ya existente.
- Componentes pequeños, con una única responsabilidad y una relación clara entre presentación y lógica.

## 3. Estructura de carpetas

Se respeta la estructura existente:

```text
src/app/
├── core/
│   ├── models/
│   └── services/
├── features/
│   ├── dashboard/
│   └── issues/
│       ├── components/
│       └── pages/
└── shared/
    ├── components/
    └── pipes/
```

### `core/models`

Contendrá los tipos y modelos del dominio, especialmente la incidencia y sus valores permitidos (`status` y `priority`). Estos tipos no deben depender de componentes, páginas ni detalles visuales.

### `core/services`

Contendrá servicios singleton y reutilizables para:

- Gestionar la colección de incidencias y su estado mediante Signals.
- Aplicar operaciones de negocio: crear, actualizar, eliminar, cambiar estado, buscar y filtrar.
- Leer y escribir la representación persistida en `localStorage`.

El servicio de persistencia conocerá el formato de almacenamiento, la serialización y los errores de acceso. El servicio de incidencias coordinará ese acceso con el estado de la aplicación. Las páginas y componentes no accederán directamente a `localStorage`.

### `features/dashboard`

Contendrá la página del dashboard y los componentes específicos de sus estadísticas. Consumirá el estado derivado del servicio de incidencias y no duplicará la lógica de conteo.

### `features/issues/pages`

Contendrá las páginas asociadas a rutas:

- listado de incidencias;
- creación;
- edición;
- detalle.

Las páginas coordinarán navegación, carga de datos, formularios y acciones de usuario. No deben contener la implementación del almacenamiento ni reglas de dominio que puedan reutilizarse.

### `features/issues/components`

Contendrá componentes específicos de incidencias, por ejemplo una tarjeta o fila de incidencia, filtros y el formulario reutilizable de creación/edición. Recibirán datos y emitirán eventos mediante las APIs de Angular adecuadas, dejando las decisiones de flujo a las páginas.

### `shared/components`

Contendrá componentes visuales genéricos y reutilizables, como estados vacíos, mensajes de error, confirmaciones o elementos de presentación que no conozcan el dominio de incidencias.

### `shared/pipes`

Contendrá pipes de presentación reutilizables, únicamente cuando la transformación no deba vivir en un servicio o en la lógica de dominio.

## 4. Estado y flujo de datos

El servicio de incidencias mantendrá una Signal privada con la colección y expondrá Signals de solo lectura para el consumo de la interfaz. Las búsquedas, filtros y estadísticas se expresarán como estado derivado, evitando copias manuales y suscripciones innecesarias.

El flujo esperado será:

1. La aplicación inicializa el servicio.
2. El servicio de persistencia lee `localStorage` y valida la estructura cargada.
3. El servicio de incidencias actualiza su Signal con los datos válidos o con una colección vacía.
4. Páginas y componentes leen Signals y renderizan el estado actual.
5. Una acción de usuario llama a una operación del servicio.
6. El servicio aplica la regla de negocio, actualiza el Signal y persiste el nuevo estado.
7. Las vistas derivadas se actualizan automáticamente.

Los componentes no modificarán directamente las Signals del servicio ni mantendrán una segunda fuente de verdad.

## 5. Rutas

El router definirá rutas standalone para:

- dashboard;
- listado de incidencias;
- creación;
- detalle con identificador;
- edición con identificador.

Las rutas de detalle y edición deben tratar identificadores inexistentes de forma explícita, mostrando el estado de error definido en los requisitos. La carga diferida podrá utilizarse cuando simplifique la separación de funcionalidades, pero no se añadirá complejidad por anticipado.

## 6. Formularios

El formulario de incidencia se implementará con Reactive Forms y tipos estrictos. La página de creación lo inicializará con valores por defecto adecuados; la página de edición lo rellenará con la incidencia existente.

Las validaciones de formulario serán la primera barrera de entrada. El servicio también deberá proteger las operaciones de negocio frente a datos inválidos, de modo que la validez no dependa únicamente de la interfaz.

## 7. Persistencia y errores

`localStorage` se tratará como una dependencia limitada y falible:

- se utilizará una clave estable y documentada dentro del servicio;
- se serializarán y deserializarán datos de forma controlada;
- se validará la forma de los datos antes de exponerlos a la interfaz;
- los errores de lectura y escritura se comunicarán mediante un estado de error visible;
- no se usarán valores de éxito silenciosos para ocultar fallos.

No se introducirá una abstracción de repositorio, librería de estado o sistema de eventos mientras el MVP no lo necesite.

## 8. Presentación y accesibilidad

Tailwind CSS 4 se utilizará mediante las clases utilitarias y la hoja global ya configurada en `src/styles.css`. Los componentes deben priorizar HTML semántico, etiquetas asociadas a controles, foco visible, navegación por teclado, mensajes de error accesibles y contraste suficiente.

El diseño será responsive desde pantallas pequeñas. La presentación no debe contener reglas de negocio; los textos y estados visuales deben reflejar el estado real proporcionado por la capa de aplicación.

## 9. Pruebas

Se añadirán pruebas unitarias para la lógica relevante, especialmente:

- validación y normalización de datos;
- operaciones del servicio de incidencias;
- búsqueda, filtros y estadísticas;
- serialización, lectura y errores de persistencia.

Los componentes podrán probarse según el riesgo y la complejidad de su comportamiento. Las pruebas deben respetar la configuración existente de Angular y Vitest, sin introducir herramientas adicionales sin justificación.
