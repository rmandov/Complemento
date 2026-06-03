<script setup>
import { ref, onMounted } from 'vue'
import L from 'leaflet'

import { useMap } from '@/composables/controlesMap'

import 'leaflet/dist/leaflet.css'

const mapContainer = ref(null)

const { map, initMap, resetView, flyToBounds, currentBounds } = useMap(mapContainer)

const geoJsonPromise = fetch('/entidades.json')
  .then((res) => res.json())
  .catch((err) => {
    console.error('Error cargando estados:', err)
    return null
  })

async function goBack() {
  resetView()
}

onMounted(async () => {
  // Carga del mapa centrado en Mexico
  initMap()

  // Cargamos las entidades
  const entidades = await geoJsonPromise

  if (entidades && map.value) {
    // Añadir la capa GeoJSON al mapa existente
    const estadosCapa = L.geoJSON(entidades, {
      style: {
        color: '#1565C0',
        weight: 1.2,
        fillColor: '#90CAF9',
        fillOpacity: 0.5,
      },

      onEachFeature: (feature, layer) => {
        // Tooltip
        const nombre = feature.properties.NOMGEO || 'Estado'
        layer.bindTooltip(nombre)

        // Mouse sobre el estado
        layer.on('mouseover', () =>
          layer.setStyle({
            fillOpacity: 0.8,
            weight: 2,
          }),
        )

        // Acciones al dejar de posicionarse en el estado
        layer.on('mouseout', () => layer.setStyle({ fillOpacity: 0.5, weight: 1.2 }))

        // Acciones al clickear un estado
        layer.on('click', (e) => {
          L.DomEvent.stopPropagation(e) // Evitar que el click llegue al mapa

          // Estado seleccionado
          const entidad_clickeada = layer.feature.properties.NOMGEO

          async function gestionEntidadClick(nombre_entidad) {
            const entidad_json = nombre_entidad
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replaceAll(' ', '_')
            console.log(entidad_json)

            // Esta carga de municipios le pertenecera a controlesMunicipio
            //    1. Eliminar de la capa de estados el polígono del estado que fue seleccionado, para poder aplicar sus municipios como nueva capa
            map.value.removeLayer(layer)
            /* remove_entidades() */

            //    2. Carga de municipios del estado
            await carga_municipios(entidad_json)

            //    3. Carga de municipios del estado seleecinado
            const encuadre_entidad = layer.getBounds()
            console.log(
              'Este es el rectangulo que compone la entidad seleccionada: ',
              encuadre_entidad,
            )
            flyToBounds(encuadre_entidad)
            console.log('Encuadre entidad: ', currentBounds)
          }

          gestionEntidadClick(entidad_clickeada)
        })
      },
    })
    estadosCapa.addTo(map.value)

    // Esta función puede incluirse en la carga de un estado seleccionado
    const remove_entidades = () => {
      if (estadosCapa) {
        map.value.removeLayer(estadosCapa)
        estadosCapa.value = null
      }
    }

    // Esta funcion se puede intregar en un composable para carga de municipios
    const carga_municipios = async (estado) => {
      try {
        // 1. Carga de los poligonos del los municipios del estado seleccionado
        const response = await fetch(`/municipios/${estado}.json`)
        const geojson = await response.json()
        console.log('Municipios: \n', geojson)

        // 2. Crear layer
        const municipiosCapa = L.geoJSON(geojson, {
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
              layer.setStyle({
                fillOpacity: 0.9,
                weight: 1.5,
                color: '#B71C1C',
              })
            })
            layer.on('mouseout', () => {
              layer.setStyle({ fillOpacity: 0.6, weight: 1, color: '#D32F2F' })
            })
          },
        })

        municipiosCapa.addTo(map.value)
      } catch (err) {
        console.error('Error cargando municipios:', err)
      }
    }
  }
})
</script>

<template>
  <div class="map-wraper">
    <div ref="mapContainer" class="map"></div>
    <button class="back-button" @click="goBack">Esto es un boton</button>
  </div>
</template>

<style scoped>
.map {
  width: 100%;
  height: 500px;
}
</style>
