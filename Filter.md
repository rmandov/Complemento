````md
# Especificación Funcional - Componente Controlador de Filtros para Mapa

## Objetivo

Desarrollar un componente **Vue 3** utilizando **Composition API** (`<script setup>`) cuya única responsabilidad sea administrar la interfaz de filtrado de un mapa.

Este componente **no contiene lógica de negocio**, **no ejecuta consultas SQL**, **no modifica el mapa** y **no interpreta los datos**. Su función es exclusivamente:

- Mostrar controles de filtrado.
- Mantener sincronizado su estado visual.
- Emitir los cambios realizados por el usuario.
- Reflejar cambios recibidos desde componentes externos.

Toda la lógica de negocio se ejecuta en un componente padre.

---

# Arquitectura General

El componente trabaja bajo un flujo unidireccional.

```text
Usuario modifica un filtro
        │
        ▼
El componente emite el cambio
        │
        ▼
Componente padre
(SQL, consultas, mapa, animaciones, etc.)
        │
        ▼
Obtiene nuevos resultados
        │
        ▼
Actualiza las props del componente
        │
        ▼
El componente actualiza automáticamente la interfaz
```

El componente **nunca** calcula opciones de filtrado.

El componente **nunca** infiere relaciones entre filtros.

El componente **nunca** ejecuta consultas.

La única fuente de verdad siempre serán las **props** recibidas desde el exterior.

---

# Modos de filtrado

Existen dos formas independientes de navegar por la información.

- Filtrado Temático
- Filtrado Geográfico

Estos modos son mutuamente excluyentes.

Cuando el usuario cambia de modo:

- se limpian completamente los filtros del modo anterior;
- se emite el cambio correspondiente;
- comienza un nuevo flujo de filtrado.

No es posible combinar filtros de ambos modos.

---

# Filtrado Temático

Está compuesto por tres niveles:

- RAMO
- UR
- TEMÁTICA

La información disponible en cada nivel depende de los resultados devueltos por el componente padre.

El componente únicamente renderiza las opciones que recibe.

---

## Inicio del filtrado

El usuario puede comenzar desde:

- RAMO
- TEMÁTICA

No existe un único punto de entrada.

---

## Flujo iniciando por RAMO

```text
RAMO
    │
    ▼
Resultados

o

RAMO
    │
    ▼
UR
    │
    ▼
Resultados

o

RAMO
    │
    ▼
TEMÁTICA
    │
    ▼
Resultados

o

RAMO
    │
    ▼
UR
    │
    ▼
TEMÁTICA
    │
    ▼
Resultados
```

El componente padre decide cuáles opciones devuelve.

Por ejemplo:

Después de seleccionar un RAMO podría devolver:

- únicamente Resultados;
- únicamente UR;
- únicamente TEMÁTICAS;
- UR y TEMÁTICAS simultáneamente.

El componente no debe asumir ninguna estructura fija.

Simplemente debe mostrar las opciones recibidas.

---

## Flujo iniciando por TEMÁTICA

Se aplica exactamente la misma lógica.

```text
TEMÁTICA
    │
    ▼
Resultados

o

TEMÁTICA
    │
    ▼
RAMO
    │
    ▼
Resultados

o

TEMÁTICA
    │
    ▼
RAMO
    │
    ▼
UR
    │
    ▼
Resultados
```

---

## Restricciones de selección

Con excepción del **Radar**, todos los filtros del componente permiten seleccionar únicamente un elemento.

Las reglas son las siguientes:

| Filtro | Selección múltiple |
|---------|--------------------|
| RAMO | ❌ No |
| UR | ❌ No |
| TEMÁTICA | ❌ No |
| ENTIDAD | ❌ No |
| MUNICIPIO | ❌ No |
| RADAR | ✅ Sí (mediante los resultados que devuelve el componente padre) |

El componente nunca debe permitir seleccionar manualmente más de un elemento en ninguno de los filtros anteriores.

La única excepción es el modo **Radar**, ya que las entidades y municipios mostrados representan el conjunto de resultados obtenido por el cálculo del radar realizado externamente.

Es importante notar que esa selección múltiple **no es editable por el usuario**; únicamente es una representación visual de los datos recibidos desde el componente padre.

## Cambio de selección

Cada vez que cambia un filtro:

- se invalidan automáticamente todos los niveles posteriores;
- se limpian las selecciones dependientes;
- se emite el nuevo estado;
- comienza una nueva consulta externa.

Ejemplo:

```text
RAMO A
↓

UR 1

↓

TEMÁTICA X
```

Si el usuario cambia el RAMO:

```text
RAMO B
```

automáticamente desaparecen:

- UR
- TEMÁTICA

y comienza una nueva solicitud.

---

# Filtrado Geográfico

Está compuesto por:

- ENTIDAD
- MUNICIPIO
- RADAR

---

## Selección de Entidad

El usuario únicamente puede seleccionar **una entidad**.

La selección puede realizarse mediante:

- búsqueda por texto;
- lista navegable.

Cada modificación:

- se emite al componente padre;
- inicia una nueva consulta;
- actualiza las opciones disponibles.

Si posteriormente la entidad cambia desde una fuente externa (por ejemplo, un clic sobre el mapa), la interfaz deberá sincronizarse automáticamente.

## Selección de Municipio

Los municipios únicamente aparecen cuando el componente padre los devuelve.

Mientras no existan municipios disponibles:

- el selector no debe mostrarse.

El usuario únicamente puede seleccionar **un municipio**.

Cada modificación:

- se emite al componente padre;
- inicia una nueva consulta;
- actualiza los resultados.

Si la entidad cambia, el municipio seleccionado debe limpiarse automáticamente.

## Flujo geográfico

```text
ENTIDAD
    │
    ▼
Resultados
```

```text
ENTIDAD
    │
    ▼
MUNICIPIO
    │
    ▼
Resultados
```

```text
ENTIDAD
    │
    ▼
RADAR
    │
    ▼
Resultados
```

```text
ENTIDAD
    │
    ▼
RADAR
    │
    ▼
RAMO
    │
    ▼
Resultados
```

```text
ENTIDAD
    │
    ▼
RADAR
    │
    ▼
TEMÁTICA
    │
    ▼
Resultados
```

```text
ENTIDAD
    │
    ▼
MUNICIPIO
    │
    ▼
RADAR
    │
    ▼
Resultados
```

---

# Comportamiento del Radar

El Radar representa un modo especial del filtro geográfico.

Cuando el componente recibe:

- bandera de radar activo;
- radio;
- entidades;
- municipios;

automáticamente cambia a modo Radar.

---

## Mientras el Radar está activo

Las entidades y municipios dejan de ser editables.

Únicamente representan información proveniente del cálculo realizado externamente.

El usuario no puede:

- agregar entidades;
- eliminar entidades;
- agregar municipios;
- eliminar municipios;
- modificar la selección manualmente.

El único control editable será:

- distancia del radar.

Cada modificación del radio vuelve a disparar una nueva consulta externa.

El Radar se convierte en el único origen válido para las entidades y municipios mostrados.

---

# Estado de carga

El componente debe exponer un mecanismo para indicar al exterior cuándo inicia y cuándo finaliza una operación que requiere consultar información.

Este estado **no tiene como objetivo controlar el comportamiento de la aplicación desde el propio componente**, sino informar al componente padre para que este decida qué acciones ejecutar.

Por ejemplo, el componente podrá emitir eventos como:

```text
loading = true
```

cuando un filtro cambie y sea necesario solicitar nueva información.

Y posteriormente:

```text
loading = false
```

cuando el componente padre haya finalizado el proceso y actualizado las propiedades correspondientes.

Este estado podrá utilizarse externamente para realizar acciones como:

- bloquear la interacción con el mapa;
- bloquear otros filtros;
- mostrar overlays globales;
- mostrar indicadores de carga;
- impedir acciones simultáneas;
- cancelar o ignorar solicitudes anteriores;
- deshabilitar botones o herramientas;
- cualquier otra lógica de negocio que dependa del ciclo de carga.

El componente únicamente comunica el estado de carga; la decisión sobre qué hacer con él pertenece completamente al componente padre.

No obstante, el propio componente podrá utilizar este estado para mostrar indicadores visuales locales, como:

- Skeleton Loading.
- Placeholder.
- Shimmer Effect.
- Spinner.
- Mensajes de "Cargando...".

Estos indicadores son únicamente de carácter visual y no contienen lógica de negocio.

# Cancelación de solicitudes

Si el usuario modifica un filtro mientras una solicitud anterior sigue pendiente:

- la selección anterior deja de ser válida;
- comienza una nueva solicitud;
- el componente únicamente deberá mostrar la información correspondiente a la última selección.

La gestión de cancelación o descarte de respuestas pertenece al componente padre.

---

# Estados vacíos

Puede ocurrir que una selección no tenga filtros posteriores disponibles.

Ejemplos:

```text
RAMO
↓

(no existen UR)
```

```text
TEMÁTICA
↓

(no existen RAMOS relacionados)
```

```text
ENTIDAD
↓

(no existen municipios)
```

En estos casos:

- no deben mostrarse controles vacíos;
- únicamente deben mostrarse los filtros disponibles.

La UX/UI podrá incluir mensajes informativos cuando sea conveniente.

---

# Sincronización externa

Todos los controles deben actualizarse automáticamente cuando cambien las props.

Ejemplos:

- selección realizada desde el mapa;
- restaurar filtros;
- cargar una sesión;
- navegación por historial;
- activación del Radar.

El componente nunca debe asumir que el usuario es el origen del cambio.

---

# UX/UI

La prioridad del componente es ofrecer una experiencia fluida y escalable.

Debe evitarse el uso de grandes listas de checkboxes que obliguen al usuario a realizar desplazamientos extensos.

Se espera una solución moderna basada en componentes como:

- Combobox.
- MultiSelect.
- Autocomplete.
- Command Palette.
- Selector con búsqueda integrada.
- Chips para representar filtros activos.
- Popover o Modal para selección.
- Virtualización de listas cuando sea necesario.

Los controles de búsqueda deben:

- permitir coincidencias parciales;
- ignorar mayúsculas y minúsculas;
- preferentemente ignorar acentos.

Los resúmenes de selección deben ser compactos y expandibles únicamente cuando el usuario lo solicite.

---

# Simulación de Backend

Mientras no exista integración con la lógica real:

- deberá existir una capa de simulación fácilmente deshabilitable;
- podrá utilizar datos mock, funciones simuladas o `console.log`;
- todo el código de simulación deberá permanecer claramente comentado para facilitar posteriormente su sustitución por la implementación real.

---

# Principios de diseño

Este componente debe diseñarse siguiendo las siguientes reglas:

- No contiene lógica de negocio.
- No ejecuta consultas SQL.
- No modifica el mapa.
- No conoce la estructura de los datos.
- No calcula relaciones entre filtros.
- No infiere opciones disponibles.
- No decide el flujo del filtrado.

Su única responsabilidad consiste en:

1. Mostrar controles.
2. Administrar el estado visual.
3. Emitir cambios.
4. Reflejar cambios recibidos.
5. Mantener sincronizada la interfaz.

Toda la lógica del sistema debe permanecer fuera del componente.
````
# Arquitectura de Comunicación del Componente

## Objetivo

Definir un contrato de comunicación claro entre el componente de filtros y el componente padre, de forma que el componente sea completamente desacoplado de la lógica de negocio.

El componente **no conoce**:

- SQL.
- APIs.
- Pinia.
- Leaflet.
- Base de datos.
- Relaciones entre filtros.
- Cómo se obtienen los datos.

Su única responsabilidad consiste en:

- Mostrar la información recibida.
- Emitir las acciones del usuario.
- Reflejar cambios externos.
- Mantener sincronizada la interfaz.

---

# Filosofía

El componente debe comportarse como una **Máquina de Estados (State Machine)**.

Nunca toma decisiones sobre el negocio.

Siempre trabaja bajo el siguiente ciclo:

```text
Usuario
    │
    ▼
Componente
(emite una acción)
    │
    ▼
Componente Padre
(SQL / API / Pinia / Mapa / etc.)
    │
    ▼
Genera un nuevo estado
    │
    ▼
Componente
(renderiza nuevamente)
```

Toda modificación del estado proviene del componente padre.

El componente únicamente solicita cambios mediante acciones.

---

# Contrato de Comunicación

La comunicación debe reducirse únicamente a:

```vue
<MapFilters
    :state="filterState"
    @action="handleAction"
/>
```

Es decir:

- **Una única entrada (`state`)**
- **Una única salida (`action`)**

Esto evita tener decenas de `props` y `emits`, simplificando el mantenimiento y escalabilidad del componente.

---

# Entrada del componente (`state`)

Toda la información necesaria para renderizar el componente debe llegar agrupada en un único objeto.

Ejemplo de estructura:

```ts
interface FilterState {

    mode: "tematico" | "geografico"

    loading: boolean

    radar: {

        active: boolean

        min: number

        max: number

        value: number
    }

    filters: {

        ramo: {

            selected: number | null

            options: []
        }

        ur: {

            selected: number | null

            options: []
        }

        tematica: {

            selected: number | null

            options: []
        }

        entidad: {

            selected: number | null

            options: []
        }

        municipio: {

            selected: number | null

            options: []
        }

    }

}
```

Esta estructura podrá ampliarse conforme crezca el proyecto sin modificar la API del componente.

---

# Salida del componente (`action`)

El componente nunca envía estados completos.

Únicamente comunica **qué hizo el usuario**.

Ejemplo:

```ts
emit("action", {

    type: "SELECT_RAMO",

    value: 12

})
```

Otro ejemplo:

```ts
emit("action", {

    type: "SELECT_ENTIDAD",

    value: 14

})
```

O:

```ts
emit("action", {

    type: "CHANGE_RADAR",

    value: 250

})
```

El componente padre interpreta estas acciones y decide cómo responder.

---

# Flujo completo

```text
Usuario selecciona RAMO
        │
        ▼
emit("action")
        │
        ▼
Componente Padre
        │
        ▼
Consulta SQL / API
        │
        ▼
Obtiene nuevos datos
        │
        ▼
Construye nuevo FilterState
        │
        ▼
Actualiza la prop state
        │
        ▼
El componente vuelve a renderizar
```

Este patrón debe repetirse para cualquier acción del usuario.

---

# Fuente única de verdad

La única fuente de verdad será siempre el objeto `state`.

El componente nunca debe:

- modificar directamente el estado recibido;
- calcular nuevas opciones;
- inferir relaciones entre filtros;
- asumir reglas de negocio.

Toda la información proviene del componente padre.

---

# Estado de carga

El estado de carga forma parte del objeto `state`.

```ts
loading: true
```

Cuando este valor cambia, el componente únicamente actualiza su interfaz.

Ejemplos de comportamiento visual:

- mostrar Skeleton Loading;
- mostrar Placeholder;
- mostrar Spinner;
- deshabilitar controles internos;
- indicar que se está esperando información.

Sin embargo, este estado también debe estar disponible para que el componente padre pueda ejecutar lógica adicional.

Por ejemplo:

- bloquear interacción con el mapa;
- bloquear otros filtros;
- mostrar overlays globales;
- impedir acciones simultáneas;
- cancelar solicitudes anteriores;
- mostrar indicadores globales de carga;
- ejecutar cualquier otra acción necesaria durante el proceso de consulta.

El componente no conoce esa lógica; únicamente refleja el estado recibido.

---

# Beneficios del objeto `state`

Utilizar un único objeto presenta varias ventajas:

- Reduce drásticamente la cantidad de `props`.
- Reduce la cantidad de eventos emitidos.
- Facilita la depuración (`console.log(state)`).
- Permite serializar fácilmente el estado.
- Facilita guardar y restaurar sesiones.
- Facilita integrar Pinia.
- Facilita integrar APIs.
- Hace que el componente sea completamente reutilizable.
- Permite agregar nuevos filtros sin modificar la API pública del componente.

---

# Simulación de Backend

Esta arquitectura facilita enormemente la creación de una capa de simulación.

Durante el desarrollo podrá existir un módulo que escuche las acciones emitidas por el componente y genere un nuevo objeto `state`.

Ejemplo:

```text
Componente

↓

emit("action")

↓

Mock Backend

↓

Genera nuevo state

↓

Componente
```

Posteriormente, cuando exista la implementación real, únicamente será necesario sustituir el módulo de simulación por el servicio que consulte la base de datos.

El componente permanecerá completamente intacto.

---

# Principios de diseño

El componente debe cumplir las siguientes reglas:

- Tener una única entrada (`state`).
- Tener una única salida (`action`).
- No ejecutar lógica de negocio.
- No consultar APIs.
- No ejecutar SQL.
- No conocer la estructura de la base de datos.
- No calcular relaciones entre filtros.
- No modificar el mapa.
- No depender de Pinia.
- No depender de Leaflet.
- No depender del origen de los datos.

Su única responsabilidad consiste en representar el estado recibido y comunicar las acciones realizadas por el usuario.

---

# Escalabilidad

Este contrato de comunicación debe mantenerse incluso si en el futuro se agregan nuevos filtros, como por ejemplo:

- Programa.
- Proyecto.
- Año.
- Dependencia.
- Fuente de financiamiento.
- Tipo de gasto.

Bastará con extender el objeto `state` y definir nuevas acciones, sin modificar la arquitectura del componente.