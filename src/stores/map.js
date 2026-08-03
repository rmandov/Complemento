// stores/map.js
import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useMapStore = defineStore('map', () => {
  // ============================================================
  // State
  // ============================================================

  // Vista del mapa
  const view = ref({
    center: { lat: 23.6345, lng: -102.5528 },
    zoom: 5,
    bounds: null,
  })

  // Filtros geográficos
  const entidad = ref(null)        // valor seleccionado (ej. 'CDMX')
  const municipio = ref(null)      // valor seleccionado (ej. '09001')

  // Lista de municipios disponibles (se actualiza al cambiar entidad)
  const municipios = ref([])

  // CVE_ENT (para otros usos)
  const CVE_ENT = ref('00')

  // NUEVO: Lista de todas las entidades (para las opciones del filtro)
  const entidades = ref([])        // array de { cvegeo, nombre }

  // ============================================================
  // Actions
  // ============================================================

  // --- Vista ---
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

  // --- Entidades ---
  function setEntidades(lista) {
    entidades.value = lista
  }

  function setEntidad(valor) {
    entidad.value = valor
    // Al cambiar entidad, se suele limpiar municipio y la lista de municipios
    // (esto lo maneja quien llame a esta acción, o puedes hacerlo aquí)
    // Por ejemplo:
    // municipio.value = null
    // municipios.value = []
  }

  function clearEntidad() {
    entidad.value = null
    // Opcional: limpiar también municipio y municipios
    // municipio.value = null
    // municipios.value = []
  }

  // --- Municipios ---
  function setMunicipio(valor) {
    municipio.value = valor
  }

  function clearMunicipio() {
    municipio.value = null
  }

  function setMunicipios(listaMunicipios) {
    municipios.value = listaMunicipios
  }

  function clearMunicipios() {
    municipios.value = []
  }

  // --- Reset combinado ---
  function resetGeoFilters() {
    entidad.value = null
    municipio.value = null
    municipios.value = []
    // No limpiamos entidades (la lista de opciones se mantiene)
  }

  // --- CVE_ENT ---
  function setCVE_ENT(newCVE_ENT) {
    CVE_ENT.value = newCVE_ENT
    municipio.value = null   // o 'municipio' según tu lógica
  }

  // ============================================================
  // Exposición
  // ============================================================

  return {
    // state
    view,
    entidad,
    municipio,
    municipios,
    CVE_ENT,
    entidades,          // <-- NUEVO

    // actions
    setCenter,
    setZoom,
    setBounds,
    setView,
    setEntidades,       // <-- NUEVO
    setEntidad,
    clearEntidad,       // <-- NUEVO
    setMunicipio,
    clearMunicipio,     // <-- NUEVO
    setMunicipios,
    clearMunicipios,
    resetGeoFilters,    // <-- NUEVO (opcional)
    setCVE_ENT,
  }
})
