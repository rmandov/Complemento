// composables/useProximitySearch.js
import { ref, watch, onUnmounted, shallowRef } from 'vue'
import KDBush from 'kdbush'
import * as geokdbush from 'geokdbush'
import L from 'leaflet'

export function useProximitySearch(mapRef, centerRef, radiusRef, allPointsRef) {
  const filteredPoints = shallowRef([])
  let circle = null
  let index = null

  // Construir el índice KDBush cuando los puntos estén cargados
  watch(
    allPointsRef,
    (points) => {
      if (!points || points.length === 0) {
        index = null
        return
      }
      // KDBush espera los puntos con propiedades 'lng' y 'lat' (o 'lon'/'lat')
      // Internamente usa 'lng' y 'lat' para coord geográficas si existe la función geokdbush.
      // Aseguramos que los objetos tengan lng y lat.
      index = new KDBush(
        points,
        (p) => p.lng, // getX
        (p) => p.lat, // getY
      )
    },
    { immediate: true },
  )

  // Actualización reactiva
  watch(
    [centerRef, radiusRef],
    ([center, radius]) => {
      if (!mapRef.value || !center || radius == null || !index) {
        filteredPoints.value = []
        if (circle) {
          mapRef.value.removeLayer(circle)
          circle = null
        }
        return
      }

      // Convertir radio de metros a kilómetros (geokdbush trabaja en km)
      const radiusKm = radius / 1000

      // Búsqueda eficiente: todos los puntos dentro del radio
      const nearby = geokdbush.around(
        index,
        center.lng,
        center.lat,
        Infinity, // máximo número de resultados (todos)
        radiusKm, // distancia máxima en km
      )

      // 'nearby' es un array de objetos con la propiedad 'point' (el original) y 'distance' en km
      filteredPoints.value = nearby.map((item) => item.point)

      // Actualizar círculo en el mapa (igual que antes)
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
    },
    { immediate: true },
  )

  onUnmounted(() => {
    if (circle && mapRef.value) {
      mapRef.value.removeLayer(circle)
    }
  })

  return { filteredPoints }
}
