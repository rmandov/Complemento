// src/stores/seleccionStore.js
import { ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * Store centralizado para los datos que se obtienen DURANTE LA
 * INTERACCIÓN del usuario con el mapa (clicks sobre municipios y sobre
 * proyectos puntuales).
 *
 * Objetivo: cualquier componente de la app (tablas, paneles, modales,
 * etc.) puede leer estos valores de forma reactiva importando este
 * store, sin necesidad de recibirlos por props ni escuchar eventos
 * emitidos manualmente desde el mapa.
 */
export const useSeleccionStore = defineStore('seleccion', () => {
  // CVEGEO del último municipio clickeado en el mapa (ej. "01001")
  const cveGeo = ref(null)

  // ID_PPI_ESPACIAL del último proyecto (punto) clickeado en el mapa
  const idPpiEspacial = ref(null)

  // Guarda el CVEGEO del municipio seleccionado
  function setCVEGEO(valor) {
    cveGeo.value = valor
  }

  // Guarda el ID_PPI_ESPACIAL del proyecto seleccionado
  function setIdPpiEspacial(valor) {
    idPpiEspacial.value = valor
  }

  // Limpia toda la selección (útil, por ejemplo, al presionar "goBack"
  // o al desactivar el radar, si en el futuro se quiere resetear todo)
  function clear() {
    cveGeo.value = null
    idPpiEspacial.value = null
  }

  return {
    cveGeo,
    idPpiEspacial,
    setCVEGEO,
    setIdPpiEspacial,
    clear,
  }
})
