<script setup>
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
    // Carga GeoJSON directamente (debe estar en WGS84)
    const response = await fetch('/entidades.json')
    const geojson = await response.json()

    const capa = L.geoJSON(geojson, {
      style: {
        color: '#1565C0',
        weight: 1.5,
        fillColor: '#90CAF9',
        fillOpacity: 0.5,
      },
      onEachFeature: (feature, layer) => {
        const nombre =
          feature.properties.NOMGEO ||
          feature.properties.name ||
          feature.properties.estado ||
          'Estado'
        layer.bindTooltip(nombre)

        layer.on('mouseover', () => {
          layer.setStyle({ fillOpacity: 0.8, weight: 2.5, color: '#0D47A1' })
        })
        layer.on('mouseout', () => {
          layer.setStyle({ fillOpacity: 0.5, weight: 1.5, color: '#1565C0' })
        })
      },
    }).addTo(map)

    // Centra el mapa en los estados
    map.fitBounds(capa.getBounds())
  } catch (err) {
    console.error('Error cargando GeoJSON:', err)
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
