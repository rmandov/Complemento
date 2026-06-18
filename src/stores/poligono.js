// stores/handleLayers.js
import { ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'

export const usePoligonoStore = defineStore('poligono', () => {
  const EPoligono = shallowRef(null)

  const MPoligono = shallowRef(null)

  const municipiosLayer = shallowRef(null)
  const is_MLayer = ref(false)

  function setEPoligono(newPoligono) {
    EPoligono.value = newPoligono
  }

  function setMPoligono(newPoligono) {
    MPoligono.value = newPoligono
  }

  function setMLayer(newPoligono) {
    municipiosLayer.value = newPoligono
    is_MLayer.value = true
  }

  function clearMLayer() {
    MPoligono.value = null
    municipiosLayer.value = null
    is_MLayer.value = false
  }

  function clear() {
    EPoligono.value = null
    MPoligono.value = null
    municipiosLayer.value = null
    is_MLayer.value = false
  }

  return {
    EPoligono,
    setEPoligono,
    MPoligono,
    setMPoligono,
    municipiosLayer,
    is_MLayer,
    setMLayer,
    clearMLayer,
    clear,
  }
})
