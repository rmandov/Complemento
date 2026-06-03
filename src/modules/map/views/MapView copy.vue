<script setup>
import { ref, onMounted } from 'vue'
import L from 'leaflet'

import { useMap } from '@/composables/controlesMap'

import 'leaflet/dist/leaflet.css'

const mapContainer = ref(null)

const { map, initMap, resetView } = useMap(mapContainer)

const geoJsonPromise = fetch('/entidades.json')
  .then((res) => res.json())
  .catch((err) => {
    console.error('Error cargando estados:', err)
    return null
  })

async function goBack() {
  resetView()
}

onMounted(async () => {
  // Carga del mapa centrado en Mexico
  initMap()

  // Cargamos las entidades
  const entidades = await geoJsonPromise

  if (entidades && map.value) {
    // Añadir la capa GeoJSON al mapa existente
    L.geoJSON(entidades, {
      style: { color: '#1565C0', weight: 1.2, fillColor: '#90CAF9', fillOpacity: 0.5 },
      onEachFeature: (feature, layer) => {
        const nombre = feature.properties.NOMGEO || 'Estado'
        layer.bindTooltip(nombre)
        layer.on('mouseover', () => layer.setStyle({ fillOpacity: 0.8, weight: 2 }))
        layer.on('mouseout', () => layer.setStyle({ fillOpacity: 0.5, weight: 1.2 }))
      },
    }).addTo(map.value)
  }
})
</script>

<template>
  <div class="map-wraper">
    <div ref="mapContainer" class="map"></div>
    <button class="back-button" @click="goBack">Esto es un boton</button>
  </div>
</template>

<style scoped>
.map {
  width: 100%;
  height: 500px;
}
</style>
