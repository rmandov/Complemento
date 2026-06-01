<script setup>
import { ref, onMounted} from 'vue'
import L from 'leaflet'

import 'leaflet/dist/leaflet.css'

const mapContainer = ref(null)

onMounted(() => {
  const map = L.map(mapContainer.value).setView(
    [23.6345, -102.5528],
    5
  )

  L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution: '&copy; OpenStreetMap | SHCP'
    }
  ).addTo(map)
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
