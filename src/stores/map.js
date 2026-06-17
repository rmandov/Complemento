// stores/map.js
import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useMapStore = defineStore('map', () => {
  // State
  const view = ref({
    center: [23.6345, -102.5528],
    zoom: 5,
    bounds: null,
  })

  // Actions
  function setCenter(center) {
    view.value.center = center
  }

  function setZoom(zoom) {
    view.value.zoom = zoom
  }

  function setBounds(bounds) {
    view.value.bounds = bounds
  }

  function setView({ center, zoom, bounds }) {
    if (center) view.value.center = center
    if (zoom !== undefined) view.value.zoom = zoom
    if (bounds) view.value.bounds = bounds
  }

  return {
    view,
    setCenter,
    setZoom,
    setBounds,
    setView,
  }
})
