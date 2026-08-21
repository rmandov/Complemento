<template>
  <div class="tabs-wrapper">
    <nav class="tabs-nav" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        role="tab"
        type="button"
        :aria-selected="modelValue === tab.id"
        :class="{ 'tab-btn--active': modelValue === tab.id }"
        @click="selectTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div class="tabs-content">
      <!--
        Cada panel se renderiza SIEMPRE (v-for), y se oculta con v-show
        (display: none) en vez de destruirse con v-if.

        ¿Por qué v-show y no v-if?
        - v-if destruye y vuelve a crear el componente del slot cada vez
          que cambias de tab. Para un mapa de Leaflet eso sería muy caro
          (reinicializar el mapa, capas, listeners...) y perderías el
          estado (zoom, centro, capas activas, etc).
        - v-show solo cambia el CSS `display`, así que el mapa se crea
          UNA sola vez (en el primer render) y simplemente se
          muestra/oculta. Su estado interno se conserva.

        Si en el futuro algún tab es muy pesado y NO quieres que se
        monte hasta que el usuario lo abra por primera vez, usa la prop
        `lazy` del tab (ver más abajo, sección "Escalabilidad").
      -->
      <div
        v-for="tab in tabs"
        :key="tab.id"
        v-show="modelValue === tab.id"
        class="tab-panel"
        role="tabpanel"
      >
        <!--
          Renderizado perezoso opcional:
          Si tab.lazy === true, no se monta el slot hasta que ese tab
          haya sido visitado al menos una vez (mounted.has(tab.id)).
          Para el resto de los tabs (o si no defines `lazy`), el
          comportamiento es el de siempre: se monta desde el inicio.
        -->
        <slot v-if="!tab.lazy || visited.has(tab.id)" :name="tab.id" />
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Tabs.vue
 * ─────────────────────────────────────────────────────────────────
 * Componente de pestañas genérico y agnóstico del contenido.
 *
 * Responsabilidad ÚNICA de este componente: mostrar una barra de
 * botones y, debajo, el panel correspondiente al tab activo. NO sabe
 * nada de lo que hay dentro de cada panel (mapa, tabla, texto...).
 * Todo el contenido se pasa por slots con nombre = `tab.id`.
 *
 * ── Props ─────────────────────────────────────────────────────────
 * modelValue: string
 *    id del tab actualmente activo. Se usa con v-model:
 *      <Tabs v-model="activeTab" :tabs="tabList"> ... </Tabs>
 *
 * tabs: Array<{ id: string, label: string, lazy?: boolean }>
 *    Lista de tabs a renderizar, en el orden en que se muestran.
 *    - id:    identificador único, también usado como nombre del slot.
 *    - label: texto visible en el botón.
 *    - lazy:  (opcional) si es true, el contenido de ese slot no se
 *             monta hasta que el usuario abre ese tab por primera vez.
 *
 * ── Eventos ───────────────────────────────────────────────────────
 * update:modelValue (tabId: string)
 *    Estándar de v-model, se emite al hacer click en un botón.
 *
 * change (tabId: string)
 *    Se emite SIEMPRE que el tab activo cambia (incluso si el padre
 *    no usa v-model). Útil para efectos secundarios del padre, por
 *    ejemplo: cuando vuelves al tab del mapa, Leaflet a veces necesita
 *    `map.invalidateSize()` si el contenedor cambió de tamaño mientras
 *    estaba oculto (display:none). Ejemplo en MapView.vue:
 *
 *      <Tabs v-model="activeTab" :tabs="tabList" @change="onTabChange">
 *
 *      function onTabChange(id) {
 *        if (id === 'mapa') {
 *          nextTick(() => map.value?.invalidateSize())
 *        }
 *      }
 *
 * ── Cómo agregar un tab nuevo (escalabilidad) ───────────────────────
 * 1. Agrega un objeto a tu `tabList` en el componente padre:
 *      { id: 'reportes', label: 'Reportes' }
 * 2. Agrega el <template #reportes> correspondiente dentro de <Tabs>.
 *    Nada más. Este componente no requiere ningún otro cambio.
 *
 * ── Por qué el layout es "flex: 1" en la raíz ───────────────────────
 * Este componente puede vivir dentro de CUALQUIER contenedor (flex,
 * grid, block). Para que su contenido (ej. un mapa de Leaflet) tenga
 * un tamaño real y no colapse a 0px, `.tabs-wrapper` se estira para
 * ocupar TODO el espacio disponible del padre:
 *   - `flex: 1 1 auto` funciona si el padre es `display:flex`.
 *   - `min-width:0` / `min-height:0` evitan que, dentro de un flex
 *     container, el contenido "empuje" el tamaño hacia arriba en vez
 *     de encogerse (bug clásico de flexbox + contenido con ancho
 *     intrínseco, como mapas/canvas/tablas).
 *   - `height:100%; width:100%` cubren el caso en que el padre NO es
 *     flex (ej. display:block con altura fija).
 * Sin esto, un mapa de Leaflet dentro de <Tabs> puede inicializarse
 * sobre un contenedor de 0px y quedar en blanco, aunque el mapa "SÍ
 * exista" internamente.
 */

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  tabs: {
    type: Array,
    required: true,
    // Validación simple para detectar configuraciones inválidas pronto,
    // en vez de fallar en silencio con un slot que nunca aparece.
    validator: (tabs) =>
      Array.isArray(tabs) &&
      tabs.every((t) => typeof t?.id === 'string' && typeof t?.label === 'string'),
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

// Registro de qué tabs ya fueron visitados al menos una vez, para
// soportar la carga perezosa (`lazy: true`) descrita arriba.
import { ref, watch } from 'vue'
const visited = ref(new Set([props.modelValue]))

function selectTab(id) {
  if (id === props.modelValue) return
  emit('update:modelValue', id)
}

// Se dispara con v-model (cambios externos) y con clicks (internos),
// así 'change' siempre refleja el valor real ya aplicado.
watch(
  () => props.modelValue,
  (id) => {
    visited.value.add(id)
    emit('change', id)
  },
)
</script>

<style scoped>
.tabs-wrapper {
  display: flex;
  flex-direction: column;

  /* Ocupa todo el espacio del padre sea flex o no. Ver docstring
     arriba ("Por qué el layout es flex:1 en la raíz") */
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  width: 100%;
  height: 100%;
}

.tabs-nav {
  display: flex;
  gap: 4px;
  border-bottom: 2px solid #e5e7eb;
  padding: 0 16px;
  background: #fff;
  flex-shrink: 0;
  /* La barra de tabs nunca se encoge */
}

.tab-btn {
  padding: 12px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-weight: 500;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #111827;
}

.tab-btn--active {
  color: #2563eb;
  /*  border-bottom-color: #2563eb; */
  text-decoration: underline #2563eb 2px;
  text-underline-offset: 16px;
}

.tabs-content {
  /* flex:1 + min-height:0 es lo que le permite a este contenedor
     encogerse correctamente dentro de .tabs-wrapper (que es
     flex-direction: column) y darle una altura REAL a los paneles,
     en vez de crecer según su contenido. */
  flex: 1 1 auto;
  min-height: 0;
  position: relative;
  /*
    IMPORTANTE: sin overflow:auto aquí.
    Si algún tab necesita scroll, ponlo en el componente interno
    de ese tab, no en este contenedor general.
  */
}

.tab-panel {
  height: 100%;
  width: 100%;
  min-height: 0;
}
</style>
