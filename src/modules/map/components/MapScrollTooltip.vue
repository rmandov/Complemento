<script setup>
defineProps({
  show: Boolean,
  tooltipPos: Object,
})
</script>

<template>
  <div
    v-if="show"
    class="map-scroll-tooltip"
    :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px' }"
  >
    Usa Ctrl + rueda del ratón para hacer zoom
  </div>
</template>

<style scoped>
/* Tooltip flotante */
.map-scroll-tooltip {
  position: fixed; /* Usamos fixed para que dependa directamente de clientX/clientY */
  transform: translate(0, -50%); /* Centra el diseño verticalmente respecto al cursor */
  background-color: rgba(236, 7, 7, 0.9);
  color: #ffffff;
  padding: 8px 12px;
  border-radius: 4px;
  font-family: sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
  z-index: 9999; /* Máxima prioridad sobre controles e iconos de Leaflet */
  pointer-events: none; /* Crucial para no bloquear los clics en el mapa */
  white-space: nowrap;
  transition: opacity 0.15s ease;
}
</style>
