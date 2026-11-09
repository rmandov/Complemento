/**
 * useMapStore.js
 * ----------------------------------------------------------------
 * Toda la lógica de negocio relacionada al mapa vive aquí, NUNCA en
 * core/. Este store no sabe qué es Leaflet: solo recibe payloads de
 * eventos (feature, layer, properties...) y decide qué hacer con
 * ellos.
 * ----------------------------------------------------------------
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMapStore = defineStore('map', () => {
  // ---------- Estado ----------
  const selectedFeature = ref(null)
  const hoveredFeature = ref(null)
  const activeLayers = ref([]) // ids de capas visibles
  const lastClusterClick = ref(null) // último cluster clickeado
  const zoomRequestId = ref(0) // "señal" para pedirle al mapa que haga zoom

  // ---------- Getters ----------
  const hasSelection = computed(() => selectedFeature.value !== null)
  const selectedName = computed(() => selectedFeature.value?.properties?.name ?? '')

  // ---------- Acciones ----------
  function selectFeature(payload) {
    selectedFeature.value = {
      id: payload.feature.id,
      properties: payload.feature.properties,
      geometry: payload.feature.geometry, // se guarda para poder hacer zoom después
      layerName: payload.layer.name,
      timestamp: Date.now(),
    }
  }

  function clearSelection() {
    selectedFeature.value = null
  }

  function setHovered(payload) {
    hoveredFeature.value = payload?.feature?.properties ?? null
  }

  function registerLayer(layerId) {
    if (!activeLayers.value.includes(layerId)) activeLayers.value.push(layerId)
  }

  function unregisterLayer(layerId) {
    activeLayers.value = activeLayers.value.filter((id) => id !== layerId)
  }

  function registerClusterClick(payload) {
    lastClusterClick.value = {
      count: payload.count,
      layerName: payload.layer.name,
      timestamp: Date.now(),
    }
  }

  /**
   * Pide "hacer zoom a la selección actual" sin conocer a Leaflet.
   * Se incrementa un contador (en vez de guardar un booleano) para que
   * el watcher en MapView.vue se dispare aunque se pida zoom dos veces
   * seguidas sobre el mismo feature.
   */
  function requestZoom() {
    zoomRequestId.value++
  }

  return {
    selectedFeature,
    hoveredFeature,
    activeLayers,
    lastClusterClick,
    zoomRequestId,
    hasSelection,
    selectedName,
    selectFeature,
    clearSelection,
    setHovered,
    registerLayer,
    unregisterLayer,
    registerClusterClick,
    requestZoom,
  }
})
