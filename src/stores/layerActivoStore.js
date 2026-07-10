// stores/layerActivoStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useActivateClickLayer = defineStore('ActivateClickLayer', () => {
  const clickEnLayerActivo = ref(true)

  const toggleClick = () => {
    clickEnLayerActivo.value = !clickEnLayerActivo.value
    console.log('Se cambia valor a: ', clickEnLayerActivo)
  }

  return { clickEnLayerActivo, toggleClick }
})
