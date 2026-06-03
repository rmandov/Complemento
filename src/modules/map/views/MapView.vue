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
  /* console.log("Este es el mapa antes: ", map.value); */
  initMap()
  /* console.log("Este es el mapa despues: ", map.value); */

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
            console.log('Entidad clickeada: \n', nombre_entidad)

            // Esta carga de municipios le pertenecera a controlesMunicipio
            //    1. Eliminar capa de estados
            /* console.log('Layer: \n', layer) */
            map.value.removeLayer(layer);
            /* remove_entidades() */
            //    2. Carga de municipios del estado seleecinado
            const encuadre_entidad = layer.getBounds();
            console.log("Este es el rectangulo que compone la entidad seleccionada: ", encuadre_entidad);
            flyToBounds(encuadre_entidad);
            console.log("Encuadre entidad: ", currentBounds);



            /* const layer = ref(null); */
          }

          gestionEntidadClick(entidad_clickeada)
        })
      },
    })

    console.log('estadosCapa: ', estadosCapa)

    estadosCapa.addTo(map.value)

    // Esta función puede incluirse en la carga de un estado seleccionado
    const remove_entidades = () => {
      if (estadosCapa) {
        /* console.log("Este es el rectangulo que compone mexico: ", estadosCapa.getBounds()); */
        map.value.removeLayer(estadosCapa)
        estadosCapa.value = null
      }
    }

    /* console.log('Esta es la capa de estados: ', estadosCapa)
    console.log('Este es el encuadre actual: ', currentBounds.value) */

    requestAnimationFrame(() => {
      estadosCapa.setStyle({
        fillOpacity: 0.5,
        opacity: 1,
      })
    })
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

.fade-in-states .leaflet-interactive {
  transition:
    fill-opacity 0.8s cubic-bezier(0.2, 0.9, 0.4, 1.1),
    opacity 0.6s ease-out;
}
</style>
