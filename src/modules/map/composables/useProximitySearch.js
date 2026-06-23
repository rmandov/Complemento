// composables/useProximitySearch.js
import { shallowRef, watch, onUnmounted } from 'vue'
import KDBush from 'kdbush'
import * as geokdbush from 'geokdbush'
import L from 'leaflet'

export function useProximitySearch(mapRef, centerRef, radiusRef, featuresRef, layerRef) {
  console.log('⚙️ useProximitySearch inicializado', {
    mapRef,
    centerRef,
    radiusRef,
    featuresRef,
    layerRef,
  })
  const filteredFeatures = shallowRef([])
  let circle = null
  let index = null
  let pointMapping = [] // guarda la feature original correspondiente a cada índice

  // Construir índice espacial
  watch(
    featuresRef,
    (rawFeatures) => {
      console.log('🔄 Construyendo índice. Datos recibidos:', rawFeatures?.length, 'elementos')
      if (!rawFeatures || rawFeatures.length === 0) {
        index = null
        pointMapping = []
        return
      }

      // Determinar el formato y extraer coordenadas
      const first = rawFeatures[0]
      let getLng, getLat
      let features = rawFeatures

      if (first.geometry && first.geometry.coordinates) {
        // Formato GeoJSON estándar
        console.log('✅ Formato GeoJSON detectado (geometry.coordinates)')
        getLng = (f) => f.geometry.coordinates[0]
        getLat = (f) => f.geometry.coordinates[1]
      } else if (first.lng !== undefined && first.lat !== undefined) {
        // Objetos planos con lng/lat (caso de tu buildIndex anterior)
        console.log('✅ Formato plano detectado (objetos con lng/lat)')
        // Asumimos que cada objeto tiene una propiedad 'feature' que apunta al feature original
        getLng = (p) => p.lng
        getLat = (p) => p.lat
        // pointMapping se usará para devolver las features originales
        pointMapping = rawFeatures.map((p) => p.feature || p)
      } else {
        console.error('❌ Formato de puntos desconocido. Primer elemento:', first)
        index = null
        return
      }

      try {
        index = new KDBush(features, getLng, getLat)
        console.log('✅ Índice KDBush creado con', features.length, 'puntos')
      } catch (err) {
        console.error('❌ Error al crear KDBush:', err)
        index = null
      }
    },
    { immediate: true },
  )

  // Consulta reactiva
  watch(
    [centerRef, radiusRef],
    ([center, radius]) => {
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
      console.log(
        `🔍 Buscando en radio ${radius}m (${radiusKm}km) alrededor de [${center.lng}, ${center.lat}]`,
      )
      const results = geokdbush.around(index, center.lng, center.lat, Infinity, radiusKm)
      console.log(
        `📍 ${results.length} puntos encontrados (primeros 3 distancias):`,
        results.slice(0, 3).map((r) => r.distance),
      )

      // Recuperar features originales
      if (pointMapping.length) {
        // Formato plano: results[i].point es el objeto plano, su feature está en pointMapping
        filteredFeatures.value = results.map((r) => {
          // r.point es el objeto plano original (con lng, lat, feature)
          return r.point.feature || r.point
        })
      } else {
        // Formato GeoJSON: results[i].point ya es la feature
        filteredFeatures.value = results.map((r) => r.point)
      }

      // Círculo y resaltado
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

      applyHighlight(layerRef?.value, filteredFeatures.value)
    },
    { immediate: true },
  )

  onUnmounted(() => {
    if (circle && mapRef.value) mapRef.value.removeLayer(circle)
    resetStyles(layerRef?.value)
  })

  return { filteredFeatures }
}

// Funciones de estilos auxiliares (sin cambios)
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
  layer.eachLayer((m) => {
    if (m instanceof L.CircleMarker) m.setStyle(estiloBase)
  })
}

function applyHighlight(layer, featuresDentro) {
  if (!layer) return
  const ids = new Set(featuresDentro.map((f) => f.properties?.ID || f.properties?.NOMBRE_CORTO))
  layer.eachLayer((m) => {
    if (!(m instanceof L.CircleMarker)) return
    const id = m.feature?.properties?.ID || m.feature?.properties?.NOMBRE_CORTO
    m.setStyle(id && ids.has(id) ? estiloResaltado : estiloBase)
  })
}
