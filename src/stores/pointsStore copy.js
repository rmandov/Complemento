import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

export const usePointsStore = defineStore('points', () => {
  const points = shallowRef([])

  // Carga (puede ser asíncrono)
  function loadPoints(rawData) {
    points.value = rawData
  }

  return { points, loadPoints }
})
