# Evaluación de Especificaciones - Componente Controlador de Filtros para Mapa

## 1. Evaluación General

### ✅ Fortalezas (Arquitectura Sólida)

| Aspecto | Evaluación |
|---------|------------|
| **Patrón State + Action** | Excelente. Reduce props/emits, facilita debugging, serialización y testing. |
| **Desacoplamiento total** | Correcto. El componente no conoce SQL, APIs, ni mapa. |
| **Fuente única de verdad** | Bien definida. El `state` prop es la única entrada. |
| **Invalidación en cascada** | Lógica correcta: cambio en nivel N limpia N+1. |
| **Modos mutuamente excluyentes** | Concepto claro (Temático vs Geográfico). |
| **Simulación desacoplada** | Muy buena práctica para desarrollo paralelo. |
| **Sincronización externa** | Bien considerada (mapa, historial, sesiones). |

---

## 2. ⚠️ Conflictos y Problemas Críticos Identificados

### 2.1 Conflicto: Radar vs. Mutua Exclusividad de Modos

**El problema:**

Documento dice: *"Existen dos formas independientes... mutuamente excluyentes"* (Temático y Geográfico).

Pero luego muestra flujos como:
```
ENTIDAD → RADAR → RAMO → Resultados
ENTIDAD → RADAR → TEMÁTICA → Resultados
```

**La contradicción:**
Si los modos son mutuamente excluyentes, ¿cómo puede el modo Geográfico (vía Radar) activar filtros Temáticos (RAMO/TEMÁTICA)?

**Análisis:**
El Radar no es un modo. Es un **sub-modo o herramienta** dentro del filtrado geográfico que **precarga** entidades/municipios. Una vez precargados, el usuario puede (o no) aplicar filtros temáticos sobre esa selección geográfica.

**Resolución propuesta:**
- Los modos **Temático** y **Geográfico** siguen siendo mutuamente excluyivos como **punto de entrada**.
- El Radar es una **herramienta transversal** que puede operar en ambos modos, pero con comportamiento diferente:
  - En modo Geográfico: el Radar precarga entidades/municipios y los bloquea.
  - En modo Temático: el Radar no está disponible (o está disponible solo como visualización de resultados, no como filtro).
- Alternativa: eliminar la mutua exclusividad estricta y pensar en **capas de filtrado** que se combinan.

**Recomendación:**
Redefinir los modos no como excluyentes, sino como **vectores de entrada**. El estado real es un **conjunto de filtros activos**, donde:
- Vector Temático: RAMO, UR, TEMÁTICA
- Vector Geográfico: ENTIDAD, MUNICIPIO
- Radar: herramienta de precarga geográfica (afecta solo ENTIDAD/MUNICIPIO)

Los vectores pueden coexistir. Lo que no puede pasar es que el usuario **inicie** por ambos vectores simultáneamente. Pero una vez iniciado, puede enriquecer la búsqueda.

---

### 2.2 Problema Crítico: Emisión Inmediata en Inputs y Sliders

**El problema que identificaste:**

> *"El texto input o el slider mandaría un cambio inmediato y eso no es tan correcto"*

**Impacto:**
- **Input de búsqueda de Entidad:** Cada tecla genera una acción → cada acción genera una consulta → saturación de red y UI.
- **Slider de Radar:** Cada pixel de movimiento genera una acción → consultas masivas → colapso de performance.

**Análisis:**
Tu arquitectura `action` pura no tiene mecanismo para diferenciar entre:
1. "El usuario está escribiendo" (intermedio)
2. "El usuario terminó de escribir" (final)

**Resolución propuesta:**

#### A. Para el Input de Búsqueda (Entidad)

Separar en **dos acciones distintas**:

```ts
// Acción 1: Búsqueda parcial (solo actualiza UI local, NO dispara consulta)
emit("action", {
    type: "SEARCH_ENTIDAD",
    value: "jal"  // texto parcial
})

// Acción 2: Selección final (SÍ dispara consulta)
emit("action", {
    type: "SELECT_ENTIDAD",
    value: 14  // ID definitivo
})
```

**Comportamiento:**
- El componente mantiene un `searchQuery` local (no en el state global).
- Mientras escribe, filtra las `options` localmente (coincidencia parcial, sin acentos, case-insensitive).
- Solo emite `SELECT_ENTIDAD` cuando:
  - El usuario selecciona una opción de la lista.
  - El usuario presiona Enter y hay una única coincidencia.
  - El usuario deja de escribir por N ms (debounce) Y el texto coincide exactamente con una opción.

#### B. Para el Slider de Radar

```ts
// Acción: Solo al soltar el slider (onChangeCommitted)
emit("action", {
    type: "CHANGE_RADAR",
    value: 250
})
```

**Comportamiento:**
- El componente muestra el valor del slider en tiempo real (estado local).
- Solo emite la acción cuando el usuario **suelta** el slider (`onmouseup` / `touchend`).
- El `state` recibido actualiza el valor confirmado, no el valor intermedio.

**Nota:** Si se requiere actualización en tiempo real (preview visual), el padre puede manejar un `preview` separado, pero la acción oficial solo se emite al finalizar.

---

### 2.3 Falta de Acciones de Limpieza y Cambio de Modo

**El problema:**

El documento dice: *"Cuando el usuario cambia de modo: se limpian completamente los filtros del modo anterior"*.

Pero no define acciones para:
- Cambiar de modo (`CHANGE_MODE`).
- Limpiar un filtro específico (`CLEAR_RAMO`, `CLEAR_ENTIDAD`).
- Limpiar todos los filtros (`CLEAR_ALL`).
- Desactivar el Radar (`DISABLE_RADAR`).

**Resolución propuesta:**

```ts
// Cambio de modo
emit("action", { type: "CHANGE_MODE", value: "geografico" })

// Limpieza específica
emit("action", { type: "CLEAR_FILTER", filter: "ramo" })

// Limpieza total
emit("action", { type: "CLEAR_ALL" })

// Radar
emit("action", { type: "ACTIVATE_RADAR", value: true })
emit("action", { type: "SET_RADAR_RADIUS", value: 250 })
```

---

### 2.4 Falta de Estado de Error

**El problema:**

El `FilterState` solo tiene `loading: boolean`. No tiene mecanismo para comunicar errores.

**Escenario:**
- El usuario selecciona un RAMO.
- El padre consulta la API.
- La API falla (timeout, 500, etc.).
- ¿Qué muestra el componente?

**Resolución propuesta:**

Agregar al state:

```ts
interface FilterState {
    // ... existing fields
    error: {
        code: string | null      // "TIMEOUT", "NETWORK", "NOT_FOUND"
        message: string | null    // Mensaje legible
        filter?: string           // Filtro relacionado (opcional)
    } | null
}
```

El componente muestra el error de forma visual (banner, toast, mensaje en el filtro afectado) pero **no toma decisiones de negocio** sobre reintentos.

---

### 2.5 Conflicto: Estado de Carga por Filtro vs. Global

**El problema:**

El documento define `loading` como un booleano global en el state.

**Escenario conflictivo:**
- Usuario selecciona RAMO → loading = true.
- Mientras carga, el usuario quiere cambiar el modo.
- ¿El componente debe bloquear el cambio de modo? El documento dice que es decisión del padre, pero el componente no tiene forma de comunicar "estoy cargando el filtro X específicamente".

**Resolución propuesta:**

Mantener `loading` global para simplicidad, pero agregar `loadingByFilter` opcional:

```ts
interface FilterState {
    loading: boolean
    loadingByFilter?: {
        ramo: boolean
        ur: boolean
        tematica: boolean
        entidad: boolean
        municipio: boolean
        radar: boolean
    }
}
```

Esto permite:
- Mostrar skeleton solo en el filtro que está cargando.
- Permitir interacción con otros filtros no afectados.
- El padre decide si bloquear todo o solo parte.

---

### 2.6 Falta de Metadatos de Filtros

**El problema:**

El state define `options` y `selected`, pero no define:
- ¿El filtro es visible?
- ¿El filtro está deshabilitado?
- ¿El filtro permite búsqueda?
- ¿Cuántas opciones hay en total (para paginación)?

**Escenario:**
- El padre decide que, dado el contexto actual, el filtro UR no debe mostrarse (no porque esté vacío, sino porque no aplica).
- El componente no tiene forma de saberlo más que recibiendo `options: []`.
- Pero `options: []` también significa "no hay resultados", que es diferente de "no aplica".

**Resolución propuesta:**

```ts
interface FilterConfig {
    selected: number | null
    options: Option[]
    visible: boolean      // true: mostrar control, false: ocultar completamente
    disabled: boolean     // true: mostrar pero no editable
    searchable: boolean   // true: tiene input de búsqueda
    totalCount?: number   // Para paginación/virtualización
    emptyMessage?: string // Mensaje cuando options está vacío
}
```

---

### 2.7 Conflicto: Radar y Sincronización de Entidad/Municipio

**El problema:**

El documento dice:
- *"Cuando el radar está activo, las entidades y municipios dejan de ser editables"*.
- *"El único control editable será: distancia del radar"*.
- Pero también dice: *"Si la entidad cambia desde una fuente externa (clic en mapa), la interfaz deberá sincronizarse automáticamente"*.

**La contradicción:**
Si el Radar está activo y el usuario hace clic en el mapa (externo), ¿se debe sincronizar la entidad? El documento dice que en modo Radar, las entidades/municipios representan el resultado del cálculo externo y no son editables. Pero la sincronización externa debería funcionar siempre.

**Resolución propuesta:**

Clarificar las reglas de prioridad:

1. **Radar Activo + Clic externo en mapa:** El clic externo **desactiva el radar** y selecciona la nueva entidad. El padre debe emitir:
   - `radar.active = false`
   - `entidad.selected = nuevoValor`

2. **Radar Activo + Cambio de entidad por búsqueda:** Bloqueado. La búsqueda de entidad está deshabilitada (`disabled: true`).

3. **Radar Activo + Cambio de entidad por prop externa (no mapa):** Depende del origen. Si es restauración de sesión, el radar se desactiva. Si es actualización del cálculo de radar, se sincroniza.

**Regla de oro:** El Radar es volátil. Cualquier interacción del usuario que no sea el slider del radar, desactiva el radar.

---

### 2.8 Falta de Acciones de UI

**El problema:**

El documento asume que toda acción del usuario debe emitirse al padre. Pero hay acciones que son puramente de UI y no deberían salir del componente:

- Abrir/cerrar un dropdown.
- Expandir/colapsar una sección de filtros.
- Cambiar el orden de visualización.
- Mostrar/ocultar el panel de filtros.

**Resolución propuesta:**

Separar estado en dos capas:

```ts
// Estado global (props) - controlado por el padre
interface FilterState {
    mode: "tematico" | "geografico"
    loading: boolean
    radar: { ... }
    filters: { ... }
}

// Estado local (reactive interno) - controlado por el componente
const uiState = reactive({
    expandedSections: ["ramo", "ur"],
    openDropdown: "ramo",      // null si ninguno
    searchQueries: {
        entidad: "",
        ramo: ""
    },
    radarSliderValue: 0        // valor intermedio del slider
})
```

Las acciones emitidas al padre solo son las que afectan la lógica de negocio. Las de UI se quedan locales.

---

### 2.9 Problema: Búsqueda con Coincidencias Parciales

**El problema:**

El documento dice: *"Los controles de búsqueda deben permitir coincidencias parciales, ignorar mayúsculas y minúsculas, preferentemente ignorar acentos"*.

Pero si el componente no conoce la estructura de datos ni ejecuta lógica de negocio, ¿quién filtra las opciones?

**Opción A (Componente filtra localmente):**
- El componente recibe todas las opciones en `options`.
- El componente filtra localmente según el texto ingresado.
- Problema: si hay 10,000 municipios, no es viable recibirlos todos.

**Opción B (Padre filtra remotamente):**
- El componente emite `SEARCH_ENTIDAD` con el texto.
- El padre consulta la API y devuelve `options` filtrados.
- Problema: cada tecla genera una consulta (volvemos al problema 2.2).

**Resolución propuesta (Híbrida):**

```ts
// Estrategia por tamaño de dataset

// Si options.length < umbral (ej. 500):
//    - El componente filtra localmente.
//    - No se emite acción de búsqueda.
//    - El padre indica esto con: filters.entidad.searchable = "local"

// Si options.length >= umbral o searchable = "remote":
//    - El componente emite SEARCH_ENTIDAD con debounce.
//    - El padre actualiza options.
//    - El componente muestra loading en el dropdown.
```

El padre controla la estrategia mediante metadatos.

---

### 2.10 Problema: Flujo Temático Iniciado por TEMÁTICA

**El problema:**

El documento permite iniciar por TEMÁTICA → RAMO → UR. Pero también dice que los filtros son mutuamente excluyentes y que el componente no infiere relaciones.

**Escenario conflictivo:**
- Usuario selecciona TEMÁTICA "Educación".
- El padre devuelve RAMOS relacionados: ["SEP", "Salud"].
- Usuario selecciona RAMO "Salud".
- El padre devuelve URs de Salud.
- Pero la TEMÁTICA "Educación" no tiene relación con RAMO "Salud".

**La pregunta:** ¿El componente debe mostrar un indicador de inconsistencia? ¿O es responsabilidad del padre no devolver RAMOS incompatibles?

**Resolución propuesta:**

El componente **nunca** valida consistencia. Si el padre devuelve opciones inconsistentes, el componente las renderiza. Sin embargo, el componente **sí** puede mostrar un estado visual de "inconsistencia detectada" si el padre lo indica en los metadatos:

```ts
interface FilterConfig {
    // ...
    inconsistent?: boolean  // El padre indica que esta selección no es coherente
    warning?: string        // Mensaje explicativo
}
```

---

## 3. 🔧 Mejoras Propuestas

### 3.1 Nuevo Contrato de Comunicación

```vue
<MapFilters
    :state="filterState"
    @action="handleAction"
/>
```

Se mantiene la firma, pero se expanden los tipos.

### 3.2 Estado Ampliado (`FilterState`)

```ts
interface Option {
    id: number
    label: string
    disabled?: boolean
    metadata?: Record<string, unknown>
}

interface FilterConfig {
    selected: number | null
    options: Option[]
    visible: boolean
    disabled: boolean
    searchable: "none" | "local" | "remote"
    loading: boolean
    totalCount?: number
    emptyMessage?: string
    warning?: string | null
}

interface RadarState {
    active: boolean
    min: number
    max: number
    value: number        // Valor confirmado (del padre)
    editable: boolean    // true: usuario puede modificar radio
}

interface FilterState {
    mode: "tematico" | "geografico"
    loading: boolean                    // Estado global
    error: {
        code: string
        message: string
        filter?: string
    } | null

    radar: RadarState

    filters: {
        ramo: FilterConfig
        ur: FilterConfig
        tematica: FilterConfig
        entidad: FilterConfig
        municipio: FilterConfig
    }
}
```

### 3.3 Acciones Definidas

```ts
type FilterAction =
    // Cambio de modo
    | { type: "CHANGE_MODE"; value: "tematico" | "geografico" }

    // Selección de filtros
    | { type: "SELECT_RAMO"; value: number }
    | { type: "SELECT_UR"; value: number }
    | { type: "SELECT_TEMATICA"; value: number }
    | { type: "SELECT_ENTIDAD"; value: number }
    | { type: "SELECT_MUNICIPIO"; value: number }

    // Búsqueda (no dispara consulta, solo actualiza options locales o solicita al padre)
    | { type: "SEARCH_ENTIDAD"; value: string }
    | { type: "SEARCH_RAMO"; value: string }
    | { type: "SEARCH_UR"; value: string }
    | { type: "SEARCH_TEMATICA"; value: string }
    | { type: "SEARCH_MUNICIPIO"; value: string }

    // Limpieza
    | { type: "CLEAR_FILTER"; filter: "ramo" | "ur" | "tematica" | "entidad" | "municipio" }
    | { type: "CLEAR_ALL" }

    // Radar
    | { type: "ACTIVATE_RADAR"; value: boolean }
    | { type: "SET_RADAR_RADIUS"; value: number }    // Solo al soltar slider
    | { type: "DEACTIVATE_RADAR" }

    // Errores (el componente puede solicitar al padre que limpie un error)
    | { type: "DISMISS_ERROR" }
```

### 3.4 Reglas de Emisión de Acciones

| Interacción | Acción Emitida | Momento | Notas |
|-------------|----------------|---------|-------|
| Seleccionar opción de lista | `SELECT_*` | Inmediato | El usuario eligió un valor definitivo |
| Escribir en búsqueda local | Ninguna | - | El componente filtra `options` localmente |
| Escribir en búsqueda remota | `SEARCH_*` | Después de debounce (300ms) | Solo si `searchable === "remote"` |
| Mover slider de radar | Ninguna | - | El componente actualiza `uiState.radarSliderValue` localmente |
| Soltar slider de radar | `SET_RADAR_RADIUS` | `onChangeCommitted` | Valor final confirmado |
| Cambiar modo | `CHANGE_MODE` | Inmediato | El padre limpia filtros del modo anterior |
| Presionar "X" en filtro | `CLEAR_FILTER` | Inmediato | - |
| Presionar "Limpiar todo" | `CLEAR_ALL` | Inmediato | - |
| Clic en mapa (externo) | N/A | - | El padre actualiza `state` directamente |

### 3.5 Estrategia de Debounce y Throttle

```ts
// En el componente (composable interno)

import { ref, watch } from "vue"
import { debounce } from "lodash-es" // o implementación propia

function useRemoteSearch(emit: Function) {
    const searchQuery = ref("")

    const debouncedSearch = debounce((filter: string, value: string) => {
        emit("action", {
            type: `SEARCH_${filter.toUpperCase()}`,
            value
        })
    }, 300)

    watch(searchQuery, (newVal) => {
        if (newVal.length >= 2) {  // Mínimo 2 caracteres
            debouncedSearch("entidad", newVal)
        }
    })

    return { searchQuery }
}
```

### 3.6 Comportamiento del Radar Revisado

```ts
// Reglas claras:

// 1. Cuando radar.active = true:
//    - entidad.disabled = true (el padre debe establecer esto)
//    - municipio.disabled = true
//    - entidad.options = resultado del cálculo de radar
//    - municipio.options = resultado del cálculo de radar
//    - radar.editable = true (el usuario puede mover el radio)

// 2. Cualquier acción del usuario que NO sea SET_RADAR_RADIUS:
//    - El componente NO desactiva el radar automáticamente.
//    - El padre decide si desactivar el radar al recibir otra acción.
//    - Ejemplo: si llega SELECT_ENTIDAD, el padre puede decidir:
//        a) Rechazarla (mantener radar) -> no actualiza state
//        b) Aceptarla y desactivar radar -> radar.active = false

// 3. Clic externo en mapa:
//    - El padre decide: o mantiene radar + nueva entidad (imposible lógicamente),
//      o desactiva radar y actualiza entidad.
//    - El componente solo refleja el nuevo state.
```

### 3.7 Manejo de Estados Vacíos Mejorado

```ts
// En lugar de ocultar controles vacíos sin información,
// el componente usa los metadatos del state:

// Caso 1: No hay opciones porque aún no se ha seleccionado un filtro previo
//    - visible: false
//    - El componente NO muestra nada

// Caso 2: No hay opciones porque la consulta devolvió cero resultados
//    - visible: true
//    - options: []
//    - emptyMessage: "No hay UR disponibles para este RAMO"
//    - El componente muestra el control vacío con el mensaje

// Caso 3: El filtro no aplica en el contexto actual
//    - visible: false
//    - El componente NO muestra nada
```

### 3.8 Estado de Carga Local vs. Global

```vue
<!-- Ejemplo de UI con carga por filtro -->
<template>
  <div class="filter-group">
    <!-- RAMO: cargando -->
    <FilterSelect
      v-if="state.filters.ramo.visible"
      :config="state.filters.ramo"
      :loading="state.filters.ramo.loading || state.loading"
      @select="emit('action', { type: 'SELECT_RAMO', value: $event })"
    />

    <!-- UR: visible pero no cargando -->
    <FilterSelect
      v-if="state.filters.ur.visible"
      :config="state.filters.ur"
      :loading="state.filters.ur.loading || state.loading"
      @select="emit('action', { type: 'SELECT_UR', value: $event })"
    />
  </div>
</template>
```

El componente usa `state.filters.*.loading` para skeletons locales, y `state.loading` para overlays globales. El padre controla ambos.

---

## 4. 📋 Especificación Revisada Completa

A continuación, la especificación completa revisada lista para implementar:

---

```markdown
# Especificación Funcional Revisada - Componente Controlador de Filtros para Mapa

## 1. Objetivo

Desarrollar un componente **Vue 3** utilizando **Composition API** (`<script setup>`) cuya única responsabilidad sea administrar la interfaz de filtrado de un mapa.

Este componente **no contiene lógica de negocio**, **no ejecuta consultas SQL**, **no modifica el mapa** y **no interpreta los datos**.

---

## 2. Arquitectura General

### 2.1 Filosofía: Máquina de Estados

El componente es una máquina de estados pura:

```text
Usuario
    │
    ▼
Componente (emite una acción)
    │
    ▼
Componente Padre (SQL / API / Pinia / Mapa)
    │
    ▼
Genera un nuevo estado
    │
    ▼
Componente (renderiza nuevamente)
```

### 2.2 Contrato de Comunicación

```vue
<MapFilters
    :state="filterState"
    @action="handleAction"
/>
```

- **Entrada única:** `state` (objeto `FilterState`)
- **Salida única:** `action` (objeto `FilterAction`)

### 2.3 Estado de Entrada (`FilterState`)

```ts
interface Option {
    id: number
    label: string
    disabled?: boolean
    metadata?: Record<string, unknown>
}

interface FilterConfig {
    selected: number | null
    options: Option[]
    visible: boolean           // Mostrar u ocultar el control
    disabled: boolean          // Editable o solo lectura
    searchable: "none" | "local" | "remote"
    loading: boolean           // Carga específica de este filtro
    totalCount?: number        // Total de opciones (para paginación)
    emptyMessage?: string      // Mensaje cuando options = []
    warning?: string | null    // Advertencia de inconsistencia
}

interface RadarState {
    active: boolean
    min: number
    max: number
    value: number              // Valor confirmado por el padre
    editable: boolean          // El usuario puede modificar el radio
}

interface FilterState {
    mode: "tematico" | "geografico"
    loading: boolean           // Estado de carga global
    error: {
        code: string
        message: string
        filter?: string
    } | null

    radar: RadarState

    filters: {
        ramo: FilterConfig
        ur: FilterConfig
        tematica: FilterConfig
        entidad: FilterConfig
        municipio: FilterConfig
    }
}
```

### 2.4 Acciones de Salida (`FilterAction`)

```ts
type FilterAction =
    | { type: "CHANGE_MODE"; value: "tematico" | "geografico" }
    | { type: "SELECT_RAMO"; value: number }
    | { type: "SELECT_UR"; value: number }
    | { type: "SELECT_TEMATICA"; value: number }
    | { type: "SELECT_ENTIDAD"; value: number }
    | { type: "SELECT_MUNICIPIO"; value: number }
    | { type: "SEARCH_ENTIDAD"; value: string }
    | { type: "SEARCH_RAMO"; value: string }
    | { type: "SEARCH_UR"; value: string }
    | { type: "SEARCH_TEMATICA"; value: string }
    | { type: "SEARCH_MUNICIPIO"; value: string }
    | { type: "CLEAR_FILTER"; filter: "ramo" | "ur" | "tematica" | "entidad" | "municipio" }
    | { type: "CLEAR_ALL" }
    | { type: "ACTIVATE_RADAR"; value: boolean }
    | { type: "SET_RADAR_RADIUS"; value: number }
    | { type: "DEACTIVATE_RADAR" }
    | { type: "DISMISS_ERROR" }
```

---

## 3. Modos de Filtrado

### 3.1 Vectores de Entrada

Existen dos vectores de entrada para iniciar el filtrado:

- **Vector Temático:** RAMO → UR → TEMÁTICA
- **Vector Geográfico:** ENTIDAD → MUNICIPIO

Estos vectores definen el **punto de entrada** del usuario. No son estrictamente mutuamente excluyentes en el estado final, pero el usuario solo puede **iniciar** por uno de ellos en un momento dado.

### 3.2 Cambio de Vector

Cuando el usuario cambia de vector de entrada:

1. Se emite `CHANGE_MODE`.
2. El padre limpia los filtros del vector anterior.
3. El padre construye un nuevo `FilterState`.
4. El componente renderiza el nuevo estado.

---

## 4. Filtrado Temático

### 4.1 Estructura de Niveles

- **RAMO**
- **UR**
- **TEMÁTICA**

### 4.2 Puntos de Entrada

El usuario puede iniciar desde:
- RAMO
- TEMÁTICA

### 4.3 Flujos Válidos

```text
RAMO → Resultados
RAMO → UR → Resultados
RAMO → TEMÁTICA → Resultados
RAMO → UR → TEMÁTICA → Resultados

TEMÁTICA → Resultados
TEMÁTICA → RAMO → Resultados
TEMÁTICA → RAMO → UR → Resultados
```

### 4.4 Reglas de Selección

| Filtro | Selección Múltiple | Editable |
|--------|-------------------|----------|
| RAMO | ❌ No | ✅ Sí |
| UR | ❌ No | ✅ Sí |
| TEMÁTICA | ❌ No | ✅ Sí |
| ENTIDAD | ❌ No | ✅ Sí (excepto en Radar) |
| MUNICIPIO | ❌ No | ✅ Sí (excepto en Radar) |
| RADAR | ✅ Sí (visual) | ❌ No (solo el radio) |

### 4.5 Invalidación en Cascada

Cuando cambia cualquier filtro:
- Se limpian automáticamente todos los filtros dependientes posteriores.
- Se emite la acción correspondiente.
- El padre genera un nuevo estado.

**Ejemplo:**
```text
RAMO A → UR 1 → TEMÁTICA X

Si el usuario cambia a RAMO B:
→ Se emiten automáticamente (por el padre, no por el componente):
   CLEAR_FILTER "ur"
   CLEAR_FILTER "tematica"
→ El nuevo state tiene:
   ramo.selected = B
   ur.selected = null, ur.options = [...nuevas]
   tematica.selected = null, tematica.options = [...nuevas]
```

> **Nota:** El componente no emite las limpiezas en cascada. El componente emite solo `SELECT_RAMO`. El padre es responsable de construir el nuevo estado con las limpiezas necesarias.

---

## 5. Filtrado Geográfico

### 5.1 Estructura de Niveles

- **ENTIDAD**
- **MUNICIPIO**
- **RADAR** (herramienta transversal)

### 5.2 Selección de Entidad

- El usuario selecciona **una sola entidad**.
- Métodos: búsqueda por texto o lista navegable.
- Búsqueda por texto:
  - **Local:** Si `searchable === "local"`, el componente filtra `options` internamente sin emitir acciones.
  - **Remota:** Si `searchable === "remote"`, el componente emite `SEARCH_ENTIDAD` con debounce de 300ms después de que el usuario deje de escribir.
- Emite `SELECT_ENTIDAD` solo cuando el usuario selecciona una opción definitiva.

### 5.3 Selección de Municipio

- Aparece solo cuando `filters.municipio.visible = true`.
- El usuario selecciona **un solo municipio**.
- Emite `SELECT_MUNICIPIO` al seleccionar.

### 5.4 Flujos Válidos

```text
ENTIDAD → Resultados
ENTIDAD → MUNICIPIO → Resultados
ENTIDAD → RADAR → Resultados
ENTIDAD → MUNICIPIO → RADAR → Resultados
ENTIDAD → RADAR → RAMO → Resultados
ENTIDAD → RADAR → TEMÁTICA → Resultados
```

---

## 6. Comportamiento del Radar

### 6.1 Activación

El Radar se activa cuando el padre establece `radar.active = true`. El componente no decide activar el Radar; solo refleja el estado.

### 6.2 Estado del Radar

Cuando `radar.active = true`:

```ts
state = {
    radar: {
        active: true,
        min: 0,
        max: 1000,
        value: 250,        // Radio actual confirmado
        editable: true     // El usuario puede mover el slider
    },
    filters: {
        entidad: {
            selected: null,    // o el centro del radar
            options: [...],    // Entidades dentro del radio
            disabled: true,    // NO editable por el usuario
            visible: true
        },
        municipio: {
            selected: null,    // o los municipios dentro del radio
            options: [...],    // Municipios dentro del radio
            disabled: true,    // NO editable por el usuario
            visible: true
        }
    }
}
```

### 6.3 Interacción del Slider

- El componente muestra un slider con el rango `[radar.min, radar.max]`.
- El usuario puede arrastrar el slider.
- **Mientras arrastra:** El componente actualiza el valor visualmente (estado local `uiState.radarPreviewValue`), pero **NO emite ninguna acción**.
- **Al soltar el slider (`onChangeCommitted`):** El componente emite:
  ```ts
  emit("action", { type: "SET_RADAR_RADIUS", value: valorFinal })
  ```
- El padre recalcula y devuelve un nuevo `state` con `radar.value` actualizado.

### 6.4 Sincronización Externa en Radar

- **Clic en mapa (externo):** El padre decide si desactivar el Radar. El componente refleja lo que reciba.
- **Cambio de entidad por prop externa:** Si `radar.active = true`, el componente muestra la entidad como solo lectura.
- **Restauración de sesión:** El padre puede establecer `radar.active = false` si la sesión no incluía radar.

### 6.5 Desactivación

El usuario puede tener un control para desactivar el Radar. Al interactuar:

```ts
emit("action", { type: "DEACTIVATE_RADAR" })
```

El padre limpia el radar y restaura los controles geográficos normales.

---

## 7. Estado de Carga

### 7.1 Carga Global

`state.loading` indica que existe una operación global en curso.

Uso visual del componente:
- Overlay semitransparente sobre todo el panel.
- Spinner global.
- Deshabilitar todos los controles internos.

### 7.2 Carga por Filtro

`state.filters.*.loading` indica que un filtro específico está cargando opciones.

Uso visual:
- Skeleton loading en el dropdown específico.
- Spinner dentro del campo.
- Los demás filtros permanecen interactuables (a menos que `state.loading = true`).

### 7.3 Emisión de Estado de Carga

El componente **no** emite eventos de `loading`. El padre controla cuándo `loading` es `true` o `false`.

---

## 8. Cancelación y Desfase de Solicitudes

### 8.1 Regla

Si el usuario modifica un filtro mientras una solicitud anterior está pendiente:

1. La selección anterior deja de ser válida visualmente (el componente muestra el nuevo valor inmediatamente).
2. El componente emite la nueva acción.
3. El padre es responsable de cancelar/descartar solicitudes anteriores.
4. El componente muestra únicamente la información del último `state` recibido.

### 8.2 Indicador de Desfase

Opcionalmente, el componente puede mostrar un indicador visual si detecta que el `state` recibido no corresponde con la última acción emitida (por ejemplo, si el usuario emitió `SELECT_RAMO: 5` pero el `state` aún tiene `ramo.selected = 3`). Esto es responsabilidad del componente, no del padre.

---

## 9. Estados Vacíos

### 9.1 Reglas

- Si `visible = false`: No mostrar el control.
- Si `visible = true` y `options = []`: Mostrar el control con mensaje `emptyMessage`.
- Si `visible = true` y `options = []` y no hay `emptyMessage`: Mostrar mensaje genérico *"No hay opciones disponibles"*.

### 9.2 Ejemplos

```text
RAMO seleccionado
↓
ur.visible = true, ur.options = []
↓
Mostrar: "No hay UR disponibles para este RAMO"

RAMO seleccionado
↓
ur.visible = false
↓
No mostrar control de UR
```

---

## 10. Sincronización Externa

### 10.1 Fuentes de Cambio Externo

- Clic en mapa.
- Restaurar filtros.
- Cargar sesión.
- Navegación por historial.
- Activación/desactivación de Radar.

### 10.2 Comportamiento

El componente nunca asume que el usuario es el origen del cambio. Siempre refleja el `state` recibido.

---

## 11. UX/UI

### 11.1 Controles Recomendados

- **Combobox / Autocomplete:** Para filtros con muchas opciones (entidad, municipio).
- **Select con búsqueda:** Para filtros medianos (ramo, ur, temática).
- **Slider:** Para el radio del radar (con debounce visual y commit al soltar).
- **Chips:** Para mostrar filtros activos de forma compacta.
- **Popover / Modal:** Para selección en espacios reducidos.
- **Virtualización:** Para listas con más de 500 elementos.

### 11.2 Búsqueda

- Coincidencias parciales.
- Case-insensitive.
- Ignorar acentos (normalización Unicode).
- Mínimo 2 caracteres para búsqueda remota.
- Debounce de 300ms para búsqueda remota.

### 11.3 Resumen de Filtros Activos

- Mostrar chips compactos con los filtros activos.
- Permitir eliminar filtros individuales desde el resumen.
- Cada eliminación emite `CLEAR_FILTER`.

---

## 12. Simulación de Backend

### 12.1 Requisitos

- Capa de simulación fácilmente deshabilitable.
- Datos mock, funciones simuladas o `console.log`.
- Todo el código de simulación claramente comentado.

### 12.2 Arquitectura de Simulación

```text
Componente
    │
    ▼
emit("action")
    │
    ▼
[Mock Backend / Real Backend]
    │
    ▼
Genera nuevo FilterState
    │
    ▼
Componente
```

El Mock Backend intercepta las acciones, aplica lógica simple y devuelve un nuevo `FilterState`.

---

## 13. Principios de Diseño (Inmutables)

1. **Una única entrada:** `state`.
2. **Una única salida:** `action`.
3. **No lógica de negocio:** El componente no calcula relaciones ni opciones.
4. **No consultas:** El componente no ejecuta SQL ni llama APIs.
5. **No modifica el mapa:** El componente no conoce Leaflet.
6. **No dependencias externas:** El componente no depende de Pinia, Vuex, ni librerías de mapas.
7. **Fuente única de verdad:** El `state` prop es la única verdad.
8. **Acciones puras:** Las acciones describen qué hizo el usuario, no qué debe pasar.
9. **UI local separada:** El estado visual interno (dropdowns abiertos, textos de búsqueda, previews) no se emite al padre.
10. **Debounce en inputs:** Los inputs de búsqueda y sliders no emiten en tiempo real.

---

## 14. Escalabilidad

El contrato `state + action` permite agregar nuevos filtros sin modificar la API del componente:

```ts
// Futuro: agregar "Programa"
interface FilterState {
    // ... campos existentes
    filters: {
        // ... filtros existentes
        programa: FilterConfig
    }
}

type FilterAction =
    // ... acciones existentes
    | { type: "SELECT_PROGRAMA"; value: number }
    | { type: "SEARCH_PROGRAMA"; value: string }
```

El componente renderiza dinámicamente según las claves presentes en `state.filters`.

---

## 15. Checklist de Implementación

- [ ] Definir tipos `FilterState` y `FilterAction`.
- [ ] Implementar estado local `uiState` para controles de UI.
- [ ] Implementar debounce para búsquedas remotas.
- [ ] Implementar "commit on release" para slider de radar.
- [ ] Implementar lógica de búsqueda local (filtrado de options).
- [ ] Implementar visualización de estados de carga (global y por filtro).
- [ ] Implementar visualización de errores.
- [ ] Implementar visualización de estados vacíos.
- [ ] Implementar chips de filtros activos.
- [ ] Implementar modo Radar con controles deshabilitados.
- [ ] Implementar sincronización reactiva de props.
- [ ] Crear capa de simulación (Mock Backend).
- [ ] Documentar cada acción y su comportamiento esperado.
- [ ] Tests unitarios para cada acción y transición de estado.
```

