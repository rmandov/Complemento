<script setup>

/*
const response = await fetch('/entidades.json')
const topology = await response.json()

topology.objects['00ent'].geometries[0].properties
*/

import { ref, onMounted } from 'vue'
import L from 'leaflet'

import 'leaflet/dist/leaflet.css'

const mapContainer = ref(null)

onMounted(async () => {
  const map = L.map(mapContainer.value).setView([23.6345, -102.5528], 5)

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors | SHCP',
  }).addTo(map)

  try {
    const response = await fetch('/entidades.json')
    const entidades = await response.json()

    L.geoJSON(entidades, {
      style: {
        color: '#1565C0',
        weight: 1.2,
        fillColor: '#90CAF9',
        fillOpacity: 0.5,
      },
      onEachFeature: (feature, layer) => {
        const nombre = feature.properties.NOMGEO || 'Estado'
        layer.bindTooltip(nombre)

        layer.on('mouseover', () => {
          layer.setStyle({ fillOpacity: 0.8, weight: 2 })
        })
        layer.on('mouseout', () => {
          layer.setStyle({ fillOpacity: 0.5, weight: 1.2 })
        })
      },
    }).addTo(map)
  } catch (err) {
    console.error('Error:', err)
  }
})
</script>

<template>
  <div ref="mapContainer" class="map"></div>
</template>

<style scoped>
.map {
  width: 100%;
  height: 500px;
}
</style>
