# TopoJSON

# InfomationClick.vue

# Componente Controlador de Mapa

## Objetivo

Desarrollar un componente **Vue 3** utilizando **Composition API** y **`<script setup>`** cuya responsabilidad sea actuar como un **controlador de filtros y navegación para un mapa**.

Este componente **no contiene lógica del mapa**. Su única responsabilidad es administrar los controles de entrada del usuario y sincronizar su estado con componentes externos.

Debe funcionar en ambos sentidos:

- Recibir valores desde un componente padre para mostrarlos en la interfaz.
- Emitir los cambios realizados por el usuario para que un componente externo ejecute la lógica correspondiente.

En otras palabras, el componente actúa únicamente como una capa de presentación y captura de datos.

---

# Requisitos

## 1. Control CARTERA

Debe existir un campo de texto.

### Características

- Tipo: `string`.
- Puede recibir un valor inicial desde el exterior.
- Cada cambio realizado por el usuario debe emitirse al componente padre.
- Si el valor cambia desde el componente padre, el input debe actualizarse automáticamente.

---

## 2. Control UBICACIÓN

Está compuesto por dos controles dependientes entre sí.

### ENTIDAD

- Tipo: Checkbox múltiple.
- Muestra las 32 entidades federativas de México.
- Las entidades **no están definidas dentro del componente**, sino que se reciben mediante una propiedad.
- Permite seleccionar una o varias entidades.

Cada cambio debe:

- Actualizar el estado interno.
- Emitir la selección.
- Actualizar automáticamente el listado de municipios disponibles.

---

### MUNICIPIOS

- Tipo: Checkbox múltiple.
- Solo aparece cuando existe al menos una entidad seleccionada.
- Los municipios se reciben desde el exterior.
- Deben filtrarse automáticamente para mostrar únicamente los municipios pertenecientes a las entidades seleccionadas.

El componente debe conservar únicamente municipios válidos.


## Comportamiento de la selección geográfica

La selección geográfica debe permitir trabajar tanto a nivel **Entidad** como a nivel **Municipio**, dependiendo de la información disponible y de la selección realizada por el usuario.

### Selección de Entidades

- El usuario puede seleccionar una o varias entidades federativas.
- Cada vez que cambie la selección, el componente debe emitir el listado de entidades seleccionadas.
- Al seleccionar una entidad, el componente solicitará (mediante el componente padre) los municipios correspondientes.
- El componente **no conoce** los municipios de forma interna; únicamente los muestra cuando son recibidos mediante `props`.

### Carga de Municipios

El listado de municipios **no debe existir inicialmente**.

Solo debe mostrarse cuando el componente reciba los municipios correspondientes a las entidades seleccionadas.

Mientras no existan municipios disponibles:

- No debe mostrarse el selector de municipios.
- La selección se considera únicamente a nivel entidad.

### Selección de Municipios

Una vez recibidos los municipios:

- El usuario puede seleccionar uno, varios o ninguno.
- Cada modificación debe emitirse al componente padre.
- Los municipios siempre pertenecen a las entidades actualmente seleccionadas.

Si una entidad deja de estar seleccionada:

- Deben eliminarse automáticamente todos los municipios pertenecientes a dicha entidad.
- Debe emitirse nuevamente la selección actualizada.

### Niveles de granularidad

El componente debe permitir representar información con diferentes niveles de detalle.

Puede existir información:

- únicamente a nivel **Entidad**;
- a nivel **Entidad incluyendo todos sus municipios**;
- únicamente para **Municipios específicos**.

Por ello, el componente no debe asumir que siempre existirán municipios seleccionados.

Ejemplos:

- **Jalisco** → representa toda la entidad.
- **Jalisco + Guadalajara + Zapopan** → representa únicamente esos municipios dentro de Jalisco.
- **Nuevo León + Sonora** → información únicamente a nivel estatal.
- **Puebla + Tehuacán** → mezcla de selección estatal y municipal.

El componente únicamente administra estas selecciones y las comunica al exterior; la interpretación de su significado corresponde a la lógica del mapa.

### Valores emitidos

El componente debe emitir siempre ambos conjuntos de datos:

```ts
{
    entidades: string[],
    municipios: string[]
}
```

Esto permite que el componente padre determine cómo interpretar la selección y ejecute la lógica correspondiente.

El componente **no debe asumir** que la existencia de municipios implica que la entidad deja de estar seleccionada. Ambos niveles de selección son independientes y pueden coexistir.

### Ejemplo

Si el usuario tiene seleccionados:

- Guadalajara
- Zapopan

y posteriormente desmarca **Jalisco**, dichos municipios deben eliminarse automáticamente de la selección.

Cada modificación debe emitirse al exterior.

---

### Resumen de ubicación

Una vez realizada la selección, el componente debe mostrar un resumen con:

- Entidades seleccionadas.
- Municipios seleccionados.

Este resumen es únicamente visual.

---

## 3. Control RADAR

Debe existir un control tipo **Slider**.

Este control solamente será visible cuando una propiedad externa (`showRadar`) sea verdadera.

### Características

- Valor mínimo configurable.
- Valor máximo configurable.
- Unidad en kilómetros.
- Recibe un valor inicial.
- Emite cambios al exterior.
- Si el valor cambia desde fuera, el slider debe actualizarse automáticamente.

---

# Comunicación con el exterior

Todos los controles deben trabajar mediante comunicación bidireccional.

Cada uno debe poder:

- Recibir un valor externo.
- Reflejar dicho valor en la interfaz.
- Emitir los cambios realizados por el usuario.

La lógica del mapa **nunca** debe ejecutarse dentro de este componente.

Su única responsabilidad es emitir eventos como:

- Cambio de cartera.
- Cambio de entidades.
- Cambio de municipios.
- Cambio del radar.

Será responsabilidad del componente padre decidir qué hacer con dichos cambios.

---

# Datos recibidos

El componente debe recibir mediante **props** toda la información necesaria.

Por ejemplo:

- Listado de entidades.
- Listado de municipios.
- Cartera seleccionada.
- Entidades seleccionadas.
- Municipios seleccionados.
- Valor del radar.
- Visibilidad del radar.
- Valor mínimo y máximo del slider.

No debe contener información hardcodeada.

---

# Sincronización

El componente debe mantenerse sincronizado cuando los valores cambien desde el exterior.

### Ejemplos

- Un clic sobre el mapa selecciona un municipio → el componente debe marcar automáticamente dicho municipio.
- Un botón externo limpia los filtros → el componente debe limpiar todos los controles.
- Una búsqueda externa modifica la cartera → el input debe actualizarse.

En ningún momento el componente debe asumir que el usuario es el único origen de los cambios.

---

# Responsabilidades

## El componente **sí debe**

- Mostrar controles.
- Administrar el estado visual.
- Validar dependencias entre controles.
- Emitir eventos.
- Mostrar el estado actual.
- Mantener sincronizados los valores recibidos mediante `props`.

## El componente **no debe**

- Consultar APIs.
- Acceder directamente a Pinia (salvo que se indique explícitamente).
- Modificar el mapa.
- Ejecutar búsquedas.
- Contener lógica de negocio.

Debe ser completamente reutilizable.

---

# Consideraciones técnicas

- Utilizar `v-model` (o `defineModel`) para cada control cuando sea apropiado.
- Mantener una única fuente de verdad para evitar desincronizaciones.
- Nunca mutar directamente las `props`; utilizar estado local sincronizado cuando sea necesario.
- Preservar la reactividad cuando cambien las listas de entidades o municipios.
- El filtrado de municipios debe ser eficiente, ya que el número de registros puede ser grande.
- Cuando desaparezca una entidad seleccionada (porque cambió la lista recibida), eliminar automáticamente los municipios asociados.
- Permitir estados vacíos (sin cartera, sin entidades o sin municipios) sin producir errores.
- El componente debe ser completamente desacoplado del mapa y reutilizable en cualquier aplicación.

---

# Arquitectura esperada

El componente debe seguir una arquitectura basada en responsabilidades claras:

- **Props**: Reciben toda la información necesaria para renderizar la interfaz.
- **Estado interno**: Administra únicamente el estado visual necesario para el funcionamiento del componente.
- **Computed**: Calculan información derivada, como el listado filtrado de municipios.
- **Watchers**: Mantienen sincronizados los valores internos con los recibidos desde el exterior.
- **Emits**: Notifican todos los cambios realizados por el usuario.

La lógica del mapa deberá implementarse completamente fuera de este componente.

---

# CAMBIOS A LA INFORMACIÓN ANTERIOR

El fitro CARTERA se elimina y en su lugar se agrega una nueva sección de filtrado: RAMO, UR y TEMATICA.

Se sigue manteniendo la misma logica, los valores ingresado por en este componente se emiten hacia afuera para hacer la logica de negocio (sql, filtros, animaciones, etc) y se recien valores por fuera que actualizan valores internos (eg. se da click a una entindad en un mapa y esa entidad se coloca en el filtro).

## FILTRADO Y REACCIONES EN CADENA

Se tienen agrupado dos formas de realizar filtrado: por RAMO/TEMATICA y por FILTRO GEOGRAFICO. Es decir, son dos pestañas que se pueden intercalar o switchear dependiendo del primer valor ingresado. Si es un ramo o tematica, esta accion muestra los filtros solo aplicables en esa seccion. Si se selecciona una ENTIDAD solo se muestran los filtrados disponibles de su apartado.

### RAMO / TEMAITCA


Al seleccionar un valor de RAMO se muestra información filtrada y despliega la información de UR despues de seleccionar un RAMO. Que son las UR disponibles de ese RAMO.

Esto tambien es una cadena para despues de eligir una UR se muestren las TEMATICAS disponibles. Importante que solo se puede elegir uno a la vez no importa el nivel del filtro. Es decir las opciones de filtro son las siguientes:

RAMO -> UR -> Resultados
RAMO -> UR -> TEMATICA -> Resultados
RAMO -> TEMATICA -> Resultados

La logica anterior se aplica para el filtraje empezando por tematica. Es decir se elije solo uno, se depliega informacion disponible... siguiendo la misma logica

TEMATICA -> Resultados
TEMATICA -> RAMO -> Resultados
TEMATICA -> RAMO -> UR -> Resultados

Para esto, el valor seleccionado es disparado para que un componente exterio que gestiones los queires haga el filtro, obtenga el siguiente nivel de filtro y este componente reciba las siguientes opciones. Por el momento usaremos algun tipo de filtro falso o test para simular esas peticiones una opciones que podemos deshabilitar para poder hacer el cabmoi con la gestoin real (Esto puede ser un console log o un input solo para fingir el recibir informacion o emitirla), pero comentando esta parte de codigo esté disponible la implementacoin real.

### ENTIDAD

Lo mismo ocurre para el filtro ENTIDAD. Lo mismo, se emitle valor seleccionado, se espera lista para el siguiente filtro posible.

El RADAR es una opciones que se acutaliza recibiuendo parametros de entidad o entidades seleccionada y sus respectivos municipios que caen en el radar. Cuando el RADAR se aplica despues de 

ENTIDAD -> Resultado
ENTIDAD -> MUNCIPIO -> Resultado.
ENTIDAD -> RADAR





# Flujo esperado

```text
Usuario modifica un control
            │
            ▼
    Estado interno cambia
            │
            ▼
       Se emite un evento
            │
            ▼
 Componente padre recibe el cambio
            │
            ▼
 Ejecuta la lógica del mapa
            │
            ▼
 (Opcional) Actualiza nuevamente las props
            │
            ▼
 El componente sincroniza su interfaz
```

  

## CARTERA

- Columna que forma parte de la BBDD
- Ingresar un valor te dirigue al proyecto:
  - Enfoca en el mapa.
  - Muestra información de la base sobre ese proyecto (SQL).
  - Muestra la dirección del proyecto.
  - Enfoca con el radar ese punto (con ícono distintivo).

  Acciones:

  - Al elegir el proyecto se cambia la pestaña donde se muestra la información
  - Al mismo tiempo, genera graficas de este punto y cercanos si es que se modifica el radar.
    - El radar crece sobre ese punto y no puede moverse de ahí
    - Se puede cambiar a modo libre

## Modo libre

El mapa funciona por si solo, click y radar se mueven libremente. Movimiento actual.


https://mapshaper.org/

Verifica que esté en WGS84
Antes de exportar en mapshaper.

Asegúrate de hacer esto:
Carga tu .shp
En la consola de mapshaper (abajo), escribe:
plain

$ proj wgs84

Luego exporta como GeoJSON
Si no haces proj wgs84, el archivo seguirá con coordenadas proyectadas (en metros) y Leaflet no lo mostrará.

/*
const response = await fetch('/entidades.json')
const topology = await response.json()

topology.objects['00ent'].geometries[0].properties
*/


# Complemento

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Compile and Minify for Production

```sh
pnpm build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
pnpm test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm lint
```
