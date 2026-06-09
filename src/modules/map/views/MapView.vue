<script setup>
import { ref, onMounted, shallowRef } from 'vue'
import L from 'leaflet'

import { useMap } from '@/composables/controlesMap'
// Eliminamos import de useProyectosLayer

import 'leaflet/dist/leaflet.css'

const mapContainer = ref(null)

const layer_estado_seleccionado = shallowRef(null)
const layer_municipios_seleccionado = shallowRef(null)
const capaProyectos = shallowRef(null) // ← guardar capa de proyectos

const { map, initMap, resetView, flyToBounds, currentBounds } = useMap(mapContainer)

// Promesas de datos
const geoJsonPromise = fetch('/entidades.json')
  .then((res) => res.json())
  .catch((err) => {
    console.error('Error cargando estados:', err)
    return null
  })

const geoJsonProyectos = fetch('/PPIs/PRUEBA_PPI_geojson.json')
  .then((res) => res.json())
  .catch((err) => {
    console.error('Error cargando proyectos:', err)
    return null
  })

// Función para cargar y mostrar proyectos (se ejecutará después de tener datos)
async function cargarProyectos(proyectosData) {
  if (!map.value || !proyectosData) return

  // Si ya existe una capa de proyectos, la removemos para evitar duplicados
  if (capaProyectos.value) {
    map.value.removeLayer(capaProyectos.value)
  }

  const estiloBase = { radius: 5, weight: 1, fillOpacity: 0.7, color: '#333', fillColor: '#3498db' }

  // Crear capa GeoJSON de proyectos
  const proyectosLayer = L.geoJSON(proyectosData, {
    pointToLayer: (feature, latlng) => {
      // Determinar estilo según categoría
      const marker = L.circleMarker(latlng, {
        ...estiloBase,
      })
      marker.options.pane = 'proyectosPane' // forzar pane
      return marker
    },
    onEachFeature: (feature, layer) => {
      // Tooltip con nombre corto o fallback
      const nombre = feature.properties.NOMBRE_CORTO || feature.properties.NOMBRE || 'Proyecto'
      layer.bindTooltip(nombre)

      // Evento click opcional
      layer.on('click', () => {
        console.log('Proyecto seleccionado:', nombre, feature.properties)
      })
    },
    pane: 'proyectosPane',
  })

  proyectosLayer.addTo(map.value)
  capaProyectos.value = proyectosLayer
}

// Botón para regresar a vista México
async function goBack() {
  resetView()

  if (layer_municipios_seleccionado.value) {
    map.value.removeLayer(layer_municipios_seleccionado.value)
    layer_municipios_seleccionado.value = null
  }

  if (layer_estado_seleccionado.value) {
    layer_estado_seleccionado.value.addTo(map.value)
    layer_estado_seleccionado.value = null
  }

  // Volver a mostrar los proyectos si estaban ocultos (opcional)
  if (capaProyectos.value && !map.value.hasLayer(capaProyectos.value)) {
    capaProyectos.value.addTo(map.value)
  }
}

// Función para cargar municipios (declarada antes de usarse)
const carga_municipios = async (estado) => {
  try {
    const response = await fetch(`/municipios/${estado}.json`)
    const geojson = await response.json()
    console.log('Municipios cargados:', geojson)

    const municipiosCapa = L.geoJSON(geojson, {
      pane: 'poligonosPane',
      style: {
        color: '#D32F2F',
        weight: 1,
        fillColor: '#FFCDD2',
        fillOpacity: 0.6,
      },
      onEachFeature: (feature, layer) => {
        const municipio_nombre = feature.properties.NOMGEO || 'Municipio'
        layer.bindTooltip(municipio_nombre)

        layer.on('mouseover', () => {
          layer.setStyle({ fillOpacity: 0.9, weight: 1.5, color: '#B71C1C' })
        })
        layer.on('mouseout', () => {
          layer.setStyle({ fillOpacity: 0.6, weight: 1, color: '#D32F2F' })
        })
      },
    })

    municipiosCapa.addTo(map.value)
    layer_municipios_seleccionado.value = municipiosCapa
  } catch (err) {
    console.error('Error cargando municipios:', err)
  }
}

onMounted(async () => {
  initMap()

  // Crear pane para polígonos (estados y municipios) con z-index bajo
  map.value.createPane('poligonosPane')
  map.value.getPane('poligonosPane').style.zIndex = 400

  // Crear pane para proyectos (puntos) con z-index alto
  map.value.createPane('proyectosPane')
  map.value.getPane('proyectosPane').style.zIndex = 700

  // 1. Cargar estados
  const entidades = await geoJsonPromise
  if (entidades && map.value) {
    const estadosCapa = L.geoJSON(entidades, {
      pane: 'poligonosPane',
      style: {
        color: '#1565C0',
        weight: 1.2,
        fillColor: '#90CAF9',
        fillOpacity: 0.5,
      },
      onEachFeature: (feature, layer) => {
        const nombre = feature.properties.NOMGEO || 'Estado'
        layer.bindTooltip(nombre)

        layer.on('mouseover', () => layer.setStyle({ fillOpacity: 0.8, weight: 2 }))
        layer.on('mouseout', () => layer.setStyle({ fillOpacity: 0.5, weight: 1.2 }))

        layer.on('click', async (e) => {
          L.DomEvent.stopPropagation(e)
          layer.setStyle({ fillOpacity: 0.5, weight: 1.2 })

          const entidad_clickeada = layer.feature.properties.NOMGEO
          console.log('Estado clickeado:', entidad_clickeada)

          // Si ya hay un estado seleccionado, limpiar antes
          if (layer_estado_seleccionado.value) {
            if (layer_municipios_seleccionado.value) {
              map.value.removeLayer(layer_municipios_seleccionado.value)
              layer_municipios_seleccionado.value = null
            }
            layer_estado_seleccionado.value.addTo(map.value)
            layer_estado_seleccionado.value = null
          }

          // Guardar la capa del estado actual para poder regresar después
          layer_estado_seleccionado.value = layer
          map.value.removeLayer(layer)

          // Cargar municipios
          const entidad_json = entidad_clickeada
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replaceAll(' ', '_')
          await carga_municipios(entidad_json)

          // Opcional: ocultar proyectos mientras se ven municipios
          /* if (capaProyectos.value && map.value.hasLayer(capaProyectos.value)) {
            map.value.removeLayer(capaProyectos.value)
          } */

          // Encuadrar la vista al estado
          const bounds = layer.getBounds()
          flyToBounds(bounds)
        })
      },
    })
    estadosCapa.addTo(map.value)
  }

  // 2. Cargar proyectos (directamente sin composable)
  const proyectosData = await geoJsonProyectos
  if (proyectosData) {
    await cargarProyectos(proyectosData)
  }
})
</script>

<template>
  <div class="map-wraper">
    <div ref="mapContainer" class="map"></div>
    <button class="back-button" @click="goBack">Enfocar a todo el país</button>
  </div>
</template>

<style scoped>
.map {
  width: 100%;
  height: 500px;
}
.back-button {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  background: white;
  border: 1px solid #ccc;
  padding: 5px 10px;
  cursor: pointer;
}
</style>
