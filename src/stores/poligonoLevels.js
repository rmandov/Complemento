// stores/poligono.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePoligonoStore = defineStore('poligono', () => {
  // PILA de capas: cada nivel guarda { layer, geojson, options, nivel }
  const stack = ref([])

  const nivelActual = computed(() => stack.value.length)
  const capaActual = computed(() =>
    stack.value.length > 0 ? stack.value[stack.value.length - 1] : null,
  )
  const puedeRegresar = computed(() => stack.value.length > 0)

  function pushCapa(layer, geojson, options, metadata = {}) {
    // Si hay capa actual, la "ocultamos" (la sacamos del mapa pero guardamos referencia)
    const capaAnterior = capaActual.value
    if (capaAnterior && capaAnterior.layer) {
      // La capa anterior ya fue removida del mapa por el click,
      // solo actualizamos su estado
      capaAnterior.visible = false
    }

    stack.value.push({
      layer, // Referencia al layer de Leaflet
      geojson, // GeoJSON original
      options, // Opciones usadas
      metadata, // Datos extra (nombre, id, etc.)
      visible: true,
      nivel: stack.value.length,
    })
  }

  function popCapa() {
    if (stack.value.length === 0) return null

    const capa = stack.value.pop()

    // Restaurar la capa anterior si existe
    const anterior = capaActual.value
    if (anterior) {
      anterior.visible = true
    }

    return capa
  }

  function reset() {
    stack.value = []
  }

  // Obtener el geojson para el siguiente nivel basado en el polígono clickeado
  function getGeojsonParaNivel(featureProperties, nivelDestino) {
    // Esto lo implementas según tu lógica de datos
    // Ejemplo: si clickeo un estado, cargo municipios de ese estado
    return null
  }

  return {
    stack,
    nivelActual,
    capaActual,
    puedeRegresar,
    pushCapa,
    popCapa,
    reset,
    getGeojsonParaNivel,
  }
})
