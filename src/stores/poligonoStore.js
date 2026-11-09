// stores/handleLayers.js
import { ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'

export const usePoligonoStore = defineStore('poligono', () => {
  const entidad = shallowRef(null)
  const municipiosLayer = shallowRef(null)
  const isMunicipiosLayer = ref(false)
  const municipio = shallowRef(null)

  // ── NUEVO: Registro de layers ──
  const entidadLayers = shallowRef(new Map()) // CVE_ENT -> L.Layer
  const municipioLayers = shallowRef(new Map()) // CVEGEO -> L.Layer

  function registerEntidadLayer(cveEnt, layer) {
    entidadLayers.value.set(cveEnt, layer)
  }
  function getEntidadLayer(cveEnt) {
    return entidadLayers.value.get(cveEnt)
  }
  function clearEntidadLayers() {
    entidadLayers.value.clear()
  }

  function registerMunicipioLayer(cvegeo, layer) {
    municipioLayers.value.set(cvegeo, layer)
  }
  function getMunicipioLayer(cvegeo) {
    return municipioLayers.value.get(cvegeo)
  }
  function clearMunicipioLayers() {
    municipioLayers.value.clear()
    municipioLayers.value = new Map()
  }

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
    if (municipiosLayer.value) {
      municipiosLayer.value = null
      isMunicipiosLayer.value = false
      clearMunicipioLayers()
    }
  }

  function clear() {
    entidad.value = null
    municipio.value = null
    municipiosLayer.value = null
    isMunicipiosLayer.value = false
    clearMunicipioLayers()
  }

  return {
    entidad,
    municipio,
    municipiosLayer,
    isMunicipiosLayer,
    entidadLayers,
    municipioLayers,
    registerEntidadLayer,
    getEntidadLayer,
    clearEntidadLayers,
    registerMunicipioLayer,
    getMunicipioLayer,
    clearMunicipioLayers,
    setEntidad,
    setMunicipio,
    setMunicipiosLayer,
    clearMunicipiosLayer,
    clear,
  }
})
