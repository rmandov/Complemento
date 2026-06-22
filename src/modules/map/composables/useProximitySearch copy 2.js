// composables/useProximitySearch.js
import { ref, watch, onUnmounted, shallowRef } from 'vue'
import KDBush from 'kdbush'
import * as geokdbush from 'geokdbush'
import L from 'leaflet'

export function useProximitySearch(
  mapRef,
  centerRef,
  radiusRef,
  featuresRef, // shallowRef con array de features del GeoJSON
  capaProyectosRef, // opcional: para actualizar estilos directamente
) {
  const filteredFeatures = shallowRef([])
  let circle = null
  let index = null

  // Construir el índice cuando las features estén listas
  watch(
    featuresRef,
    (features) => {
      if (!features || features.length === 0) {
        index = null
        return
      }
      // Extraemos coordenadas [lng, lat] de cada feature
      index = new KDBush(
        features,
        (f) => f.geometry.coordinates[0], // lng
        (f) => f.geometry.coordinates[1], // lat
      )
    },
    { immediate: true },
  )

  // Actualizar filtro y círculo
  watch(
    [centerRef, radiusRef],
    ([center, radius]) => {
      if (!mapRef.value || !center || radius == null || !index) {
        filteredFeatures.value = []
        if (circle) {
          mapRef.value.removeLayer(circle)
          circle = null
        }
        // Restauramos estilos de toda la capa (sin resaltar)
        if (capaProyectosRef?.value) {
          resetStyles(capaProyectosRef.value)
        }
        return
      }

      const radiusKm = radius / 1000
      const nearby = geokdbush.around(index, center.lng, center.lat, Infinity, radiusKm)

      // 'nearby' es un array de objetos con { point: feature, distance: km }
      filteredFeatures.value = nearby.map((item) => item.point)

      // Actualizar círculo (sin cambios)
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

      // Aplicar resaltado sobre la capa GeoJSON original
      if (capaProyectosRef?.value) {
        applyHighlight(capaProyectosRef.value, filteredFeatures.value)
      }
    },
    { immediate: true },
  )

  // --- Funciones de ayuda para estilos de capa ---
  const estiloBase = {
    radius: 5,
    weight: 1,
    fillOpacity: 0.7,
    color: '#333',
    fillColor: '#3498db',
  }
  const estiloResaltado = {
    ...estiloBase,
    fillColor: '#e74c3c', // rojo para resaltar
    radius: 7,
    weight: 2,
    color: '#c0392b',
  }

  function resetStyles(layer) {
    layer.eachLayer((circleMarker) => {
      if (circleMarker instanceof L.CircleMarker) {
        circleMarker.setStyle(estiloBase)
      }
    })
  }

  function applyHighlight(layer, featuresDentro) {
    // Crear un Set de IDs de features resaltadas para búsqueda rápida
    const idsDentro = new Set(
      featuresDentro.map((f) => f.properties.ID || f.properties.NOMBRE_CORTO),
    )
    // Recorrer todas las capas
    layer.eachLayer((circleMarker) => {
      if (!(circleMarker instanceof L.CircleMarker)) return
      const props = circleMarker.feature?.properties
      const id = props?.ID || props?.NOMBRE_CORTO
      if (id && idsDentro.has(id)) {
        circleMarker.setStyle(estiloResaltado)
      } else {
        circleMarker.setStyle(estiloBase)
      }
    })
  }

  onUnmounted(() => {
    if (circle && mapRef.value) {
      mapRef.value.removeLayer(circle)
    }
    if (capaProyectosRef?.value) {
      resetStyles(capaProyectosRef.value)
    }
  })

  return { filteredFeatures }
}
