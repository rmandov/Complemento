// stores/pointsStore.js
import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

export const usePointsStore = defineStore('points', () => {
  const features = shallowRef([])

  function loadPoints(geoJsonData) {
    // Recibe el objeto GeoJSON completo y guarda solo las features
    features.value = geoJsonData?.features || []
    console.log('Store cargado con', features.value.length, 'features')
  }

  function getRawFeatures() {
    return features.value
  }
  return { features, loadPoints, getRawFeatures }
})
