// stores/handleLayers.js
import { shallowRef } from 'vue'
import { defineStore } from 'pinia'

export const usePoligonoStore = defineStore('poligono', () => {
  const EPoligono = shallowRef(null)

  function setEPoligono(newPoligono) {
    EPoligono.value = newPoligono
  }

  return { EPoligono, setEPoligono }
})
