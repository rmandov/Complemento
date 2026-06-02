<script setup>
import { ref, onMounted } from 'vue'
import { useMap } from '@/composables/useMap'
import { useStatesLayer } from '@/composables/useStatesLayer'
import { useMunicipiosLayer } from '@/composables/useMunicipiosLayer'

const mapContainer = ref(null)
const showBackButton = ref(false)

// Inicializar mapa
const { map, init, flyToBounds, resetView } = useMap(mapContainer)

// Capas
const { load: loadStates, remove: removeStates } = useStatesLayer(map, handleStateClick)
const { load: loadMunicipios, remove: removeMunicipios, currentState } = useMunicipiosLayer(map)

async function handleStateClick({ cvegeo, nombre, bounds }) {
  // 1. Quitar capa de estados
  removeStates()

  // 2. Cargar municipios del estado
  await loadMunicipios(cvegeo, nombre)

  // 3. Zoom al estado
  flyToBounds(bounds)

  // 4. Mostrar botón de regreso
  showBackButton.value = true
}

async function goBack() {
  // 1. Quitar municipios
  removeMunicipios()

  // 2. Recargar estados
  await loadStates('/estados.geojson')

  // 3. Zoom out
  resetView()

  // 4. Ocultar botón
  showBackButton.value = false
}

onMounted(async () => {
  init()
  await loadStates('/estados.geojson')
})
</script>

<template>
  <div class="map-wrapper">
    <div ref="mapContainer" class="map"></div>

    <button v-if="showBackButton" class="back-button" @click="goBack">
      ← Ver todos los estados
      <span v-if="currentState" class="state-name"> ({{ currentState.nombre }}) </span>
    </button>
  </div>
</template>

<style scoped>
.map-wrapper {
  position: relative;
  width: 100%;
  height: 500px;
}

.map {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

.back-button {
  position: absolute;
  top: 12px;
  left: 50px;
  z-index: 1000;
  background: white;
  border: 2px solid #1565c0;
  color: #1565c0;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
}

.back-button:hover {
  background: #1565c0;
  color: white;
}

.state-name {
  font-weight: 400;
  opacity: 0.8;
}
</style>
