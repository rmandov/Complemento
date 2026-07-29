<template>
  <div class="feature-detail">
    <h2>Detalle de selección</h2>
    <div v-if="mapStore.hasSelection">
      <p><strong>Capa:</strong> {{ mapStore.selectedFeature.layerName }}</p>
      <p><strong>Entidad:</strong> {{ mapStore.selectedName }}</p>
      <button @click="mapStore.requestZoom()">Hacer zoom</button>
      <button @click="exportData">Exportar datos</button>
    </div>
    <p v-else>Nada seleccionado</p>
  </div>
</template>

<script setup>
/**
 * Este componente puede vivir en cualquier parte de la app (un
 * sidebar, un modal, otra ruta...). No importa Leaflet ni el
 * LayerManager: solo lee y escribe en Pinia.
 *
 * "Hacer zoom" es el mejor ejemplo de cero acoplamiento: este
 * componente no sabe qué es un mapa ni dónde está. Solo levanta la
 * mano (mapStore.requestZoom()) y MapView.vue -que sí tiene el
 * mapa- escucha ese cambio y actúa. En la versión original esto
 * quedaba como un console.log pendiente; aquí ya funciona de punta
 * a punta.
 */
import { useMapStore } from '@/stores/useMapStore.js'

const mapStore = useMapStore()

function exportData() {
  const data = JSON.stringify(mapStore.selectedFeature, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'feature.json'
  a.click()
  URL.revokeObjectURL(url) // libera memoria del blob
}
</script>
