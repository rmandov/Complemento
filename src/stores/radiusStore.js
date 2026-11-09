// stores/radiusStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRadiusStore = defineStore('radius', () => {
  const radius = ref(200_000)
  const minRadius = ref(50_000)
  const maxRadius = ref(300_000)

  function setRadius(newRadius) {
    radius.value = newRadius
  }

  function clearRadius() {
    radius.value = 200_000
  }

  return { radius, setRadius, clearRadius, minRadius, maxRadius }
})
