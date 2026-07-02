// stores/handleLayers.js
import { ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'

export const usePoligonoStore = defineStore('poligono', () => {
  const entidad = shallowRef(null)
  const municipiosLayer = shallowRef(null)
  const isMunicipiosLayer = ref(false)
  const municipio = shallowRef(null)

  function setEntidad(newPoligono) {
    entidad.value = newPoligono
  }

  function setMunicipio(newPoligono) {
    municipio.value = newPoligono
  }

  function setMunicipiosLayer(newPoligono) {
    municipiosLayer.value = newPoligono
    isMunicipiosLayer.value = true
  }

  function clearMunicipiosLayer() {
    municipio.value = null
    municipiosLayer.value = null
    isMunicipiosLayer.value = false
  }

  function clear() {
    entidad.value = null
    municipio.value = null
    municipiosLayer.value = null
    isMunicipiosLayer.value = false
  }

  return {
    entidad,
    setEntidad,
    municipio,
    setMunicipio,
    municipiosLayer,
    isMunicipiosLayer,
    setMunicipiosLayer,
    clearMunicipiosLayer,
    clear,
  }
})
