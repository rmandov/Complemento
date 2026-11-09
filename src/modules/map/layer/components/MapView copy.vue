<template>
  <div class="map-wrapper">
    <div ref="mapContainer" class="map-container"></div>

    <!-- Panel de información: vive fuera del mapa, solo lee Pinia -->
    <aside class="info-panel" v-if="mapStore.hasSelection">
      <h3>{{ mapStore.selectedName }}</h3>
      <p class="info-panel__layer">Capa: {{ mapStore.selectedFeature.layerName }}</p>
      <button @click="mapStore.clearSelection()">Limpiar selección</button>
    </aside>

    <!-- Aviso de cluster: aparece al hacer clic en un grupo de puntos -->
    <div class="cluster-toast" v-if="mapStore.lastClusterClick">
      {{ mapStore.lastClusterClick.count }} elementos agrupados en "{{
        mapStore.lastClusterClick.layerName
      }}"
    </div>

    <!-- Control de capas -->
    <div class="layer-controls">
      <button
        v-for="layer in availableLayers"
        :key="layer.id"
        @click="layerManager.toggle(layer.id)"
        :class="{ active: layer.visible }"
      >
        {{ layer.name }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Necesario para que ClusterLayer funcione: registra L.markerClusterGroup.
// Sin este import, ClusterLayer lanza un error explícito al crearse.
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'

import { LayerManager } from '../core/LayerManager.js'
import { PolygonLayer } from '../core/PolygonLayer.js'
import { ClusterLayer } from '../core/ClusterLayer.js'
import { useMapStore } from '../store/useMapStore.js'
import { zonasGeoJSON, hospitalesGeoJSON } from '../data/ejemplo-geojson.js'

const mapContainer = ref(null)
const mapInstance = shallowRef(null)
const layerManager = shallowRef(null)
const availableLayers = shallowRef([])

const mapStore = useMapStore()

onMounted(() => {
  // 1. Inicializar Leaflet: único lugar del componente que toca L directamente
  mapInstance.value = L.map(mapContainer.value).setView([19.43, -99.13], 5)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
  }).addTo(mapInstance.value)

  // 2. Crear el LayerManager
  layerManager.value = new LayerManager(mapInstance.value)

  // 3. Conectar eventos del LayerManager -> Pinia. Ninguna capa conoce
  //    a Pinia; solo el manager escucha y delega.
  layerManager.value.on('feature-click', (payload) => mapStore.selectFeature(payload))
  layerManager.value.on('feature-hover', (payload) => mapStore.setHovered(payload))
  layerManager.value.on('feature-out', () => mapStore.setHovered(null))
  layerManager.value.on('cluster-click', (payload) => mapStore.registerClusterClick(payload))
  layerManager.value.on('layer-added', updateLayerList)
  layerManager.value.on('layer-removed', updateLayerList)
  layerManager.value.on('manager-layer-registered', updateLayerList)

  // 4. Crear capas (en un proyecto real, el geojson vendría de una API)
  const zonasLayer = new PolygonLayer({
    name: 'Zonas',
    geojson: zonasGeoJSON,
    style: { color: '#3388ff', weight: 2, fillOpacity: 0.15 },
    hoverStyle: { color: '#ff7800', weight: 3, fillOpacity: 0.35 },
    tooltipTemplate: (props) => `<strong>${props.name}</strong>`,
  })

  const hospitalesLayer = new ClusterLayer({
    name: 'Hospitales',
    geojson: hospitalesGeoJSON,
    popupTemplate: (props) => `<b>${props.name}</b><br>${props.address}`,
  })

  // 5. Registrar en el manager: desde aquí todo fluye por eventos
  layerManager.value.register(zonasLayer)
  layerManager.value.register(hospitalesLayer)

  updateLayerList()
})

// Zoom pedido desde OTRO componente (ej. FeatureDetail.vue) a través de
// Pinia, sin que ese componente conozca a Leaflet ni al mapa.
watch(
  () => mapStore.zoomRequestId,
  () => {
    const feature = mapStore.selectedFeature
    if (!feature?.geometry || !mapInstance.value) return
    const bounds = L.geoJSON(feature.geometry).getBounds()
    mapInstance.value.flyToBounds(bounds, { maxZoom: 15, duration: 0.8 })
  },
)

onUnmounted(() => {
  layerManager.value?.destroyAll()
  mapInstance.value?.remove()
})

function updateLayerList() {
  availableLayers.value =
    layerManager.value?.getAll().map((l) => ({
      id: l.id,
      name: l.name,
      visible: l.isVisible(),
    })) ?? []
}
</script>

<style scoped>
.map-wrapper {
  position: relative;
  height: 100vh;
  width: 100%;
}
.map-container {
  height: 100%;
  width: 100%;
}

.info-panel {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  max-width: 280px;
  z-index: 1000;
}
.info-panel__layer {
  color: #666;
  font-size: 0.85rem;
}

.cluster-toast {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: #2a2a2a;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  z-index: 1000;
}

.layer-controls {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  display: flex;
  gap: 0.5rem;
  z-index: 1000;
}
.layer-controls button {
  padding: 0.5rem 1rem;
  border: none;
  background: #eee;
  cursor: pointer;
  border-radius: 4px;
}
.layer-controls button.active {
  background: #3388ff;
  color: white;
}
</style>
