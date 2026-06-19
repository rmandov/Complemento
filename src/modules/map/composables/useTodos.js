// composables/useTodos.js
import { shallowRef } from 'vue'
import L from 'leaflet'

// Para cargar los GeoJson
import { useGeoJson } from './useGeoJson'

const { getGeoJson } = useGeoJson()
const estiloBase = {
  radius: 5,
  weight: 1,
  fillOpacity: 0.7,
  color: '#333',
  fillColor: '#3498db',
}

export function useTodos(map) {
  const capaProyectos = shallowRef(null)

  async function cargarProyectos(proyectosData) {
    if (!map.value || !proyectosData) return

    // Si ya existe una capa de proyectos, la removemos para evitar duplicados
    if (capaProyectos.value) {
      map.value.removeLayer(capaProyectos.value)
    }

    // Crear capa GeoJSON de proyectos
    const proyectosLayer = L.geoJSON(proyectosData, {
      pointToLayer: (feature, latlng) => {
        const marker = L.circleMarker(latlng, {
          ...estiloBase,
        })
        marker.options.pane = 'proyectosPane'
        return marker
      },
      onEachFeature: (feature, layer) => {
        const nombre = feature.properties.NOMBRE_CORTO || feature.properties.NOMBRE || 'Proyecto'
        layer.bindTooltip(nombre)

        layer.on('click', () => {
          console.log('Proyecto seleccionado:', nombre, feature.properties)
        })
      },
      pane: 'proyectosPane',
    })

    proyectosLayer.addTo(map.value)
    capaProyectos.value = proyectosLayer
  }

  async function cargarProyectosDesdeArchivo(archivo = 'PPIs/Base_ligera.json') {
    const proyectosData = await getGeoJson(archivo)
    await cargarProyectos(proyectosData)
    console.log('esta es la base ligera: ', proyectosData)
  }

  function eliminarProyectos() {
    if (capaProyectos.value && map.value) {
      map.value.removeLayer(capaProyectos.value)
      capaProyectos.value = null
    }
  }

  return {
    capaProyectos,
    cargarProyectos,
    cargarProyectosDesdeArchivo,
    eliminarProyectos,
  }
}
