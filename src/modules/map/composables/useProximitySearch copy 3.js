// composables/useProximitySearch.js
import { shallowRef, watch, onUnmounted } from 'vue'
import KDBush from 'kdbush'
import * as geokdbush from 'geokdbush'
import L from 'leaflet'

export function useProximitySearch(mapRef, centerRef, radiusRef, featuresRef, layerRef) {
  const filteredFeatures = shallowRef([]) // features dentro del radio
  let circle = null
  let index = null

  // Construir índice cuando las features estén disponibles
  watch(
    featuresRef,
    (features) => {
      if (!features || features.length === 0) {
        index = null
        console.log(features)

        console.log('AQUI!!!!')
        return
      }
      index = new KDBush(
        features,
        (f) => f.geometry.coordinates[0], // lng
        (f) => f.geometry.coordinates[1], // lat
      )
      /* console.log("AQUI!!!!"); */
    },
    { immediate: true },
  )

  // Consulta reactiva al cambiar centro o radio
  watch(
    [centerRef, radiusRef],
    ([center, radius]) => {
      // Limpiar si falta algo
      if (!mapRef.value || !center || radius == null || !index) {
        filteredFeatures.value = []
        if (circle) {
          mapRef.value.removeLayer(circle)
          circle = null
        }
        resetStyles(layerRef?.value)
        return
      }

      const radiusKm = radius / 1000
      const results = geokdbush.around(index, center.lng, center.lat, Infinity, radiusKm)
      filteredFeatures.value = results.map((item) => item.point)

      // Círculo
      if (!circle) {
        circle = L.circle([center.lat, center.lng], {
          radius: radius,
          color: '#3388ff',
          fillOpacity: 0.1,
        }).addTo(mapRef.value)
      } else {
        circle.setLatLng([center.lat, center.lng])
        circle.setRadius(radius)
      }

      // Resaltado de marcadores
      applyHighlight(layerRef?.value, filteredFeatures.value)
    },
    { immediate: true },
  )

  // Limpieza
  onUnmounted(() => {
    if (circle && mapRef.value) {
      mapRef.value.removeLayer(circle)
    }
    resetStyles(layerRef?.value)
  })

  return { filteredFeatures }
}

// --- Estilos y funciones auxiliares ---
const estiloBase = {
  radius: 4,
  weight: 1,
  fillOpacity: 0.7,
  color: 'rgb(255,255,255)',
  fillColor: '#3498db',
}
const estiloResaltado = {
  ...estiloBase,
  fillColor: '#e74c3c',
  radius: 7,
  weight: 2,
  color: '#c0392b',
}

function resetStyles(layer) {
  if (!layer) return
  layer.eachLayer((marker) => {
    if (marker instanceof L.CircleMarker) {
      marker.setStyle(estiloBase)
    }
  })
}

function applyHighlight(layer, featuresDentro) {
  if (!layer) return
  const idsDentro = new Set(featuresDentro.map((f) => f.properties.ID || f.properties.NOMBRE_CORTO))
  layer.eachLayer((marker) => {
    if (!(marker instanceof L.CircleMarker)) return
    const props = marker.feature?.properties
    const id = props?.ID || props?.NOMBRE_CORTO
    if (id && idsDentro.has(id)) {
      marker.setStyle(estiloResaltado)
    } else {
      marker.setStyle(estiloBase)
    }
  })
}
