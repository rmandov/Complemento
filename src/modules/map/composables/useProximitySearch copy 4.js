import { ref, watch } from 'vue'
import KDBush from 'kdbush'
import * as geokdbush from 'geokdbush'

export function useProximitySearch(map, center, radius, pointsStore) {
  const filteredFeatures = ref([])

  let spatialIndex = null

  function buildIndex(geoJsonData) {
    if (!geoJsonData || !geoJsonData.features || geoJsonData.features.length === 0) {
      spatialIndex = null
      return
    }

    const points = geoJsonData.features
      .map((f, idx) => {
        const coords = f.geometry?.coordinates
        if (!coords || coords.length < 2) return null

        return {
          id: f.id || f.properties?.ID || f.properties?.NOMBRE_CORTO || `pt-${idx}`,
          lat: coords[1],
          lng: coords[0],
          feature: f,
        }
      })
      .filter(Boolean)

    spatialIndex = new KDBush(
      points,
      (p) => p.lng,
      (p) => p.lat,
    )
    console.log('✅ Índice espacial construido con', points.length, 'puntos')
  }

  function search() {
    if (!spatialIndex || !center.value) {
      filteredFeatures.value = []
      return
    }

    const found = geokdbush.around(
      spatialIndex,
      center.value.lng,
      center.value.lat,
      Infinity,
      radius.value / 1000,
    )

    filteredFeatures.value = found.map((p) => p.feature)
    console.log('🔍 Proyectos en radio:', filteredFeatures.value.length)
  }

  // WATCH CORREGIDO: pointsStore.points (no .features)
  watch(
    () => pointsStore.points,
    (rawData) => {
      buildIndex(rawData)
      if (center.value) search()
    },
    { immediate: true },
  )

  // Buscar cuando cambia el centro o el radio
  watch([center, radius], () => {
    if (spatialIndex) search()
  })

  return {
    filteredFeatures,
  }
}
