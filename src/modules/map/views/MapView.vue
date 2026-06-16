<script setup>
import { ref, onMounted, shallowRef } from 'vue'
import L from 'leaflet'

import { useMap } from '@/modules/map/composables/mapControler'
import { useGeoJson } from '../composables/useGeoJson'
import { useInfoLayer } from '../composables/useInfoLayer'

// Entidades
import { useEntidadesLayer } from '../composables/useEntidadesLayer'

import 'leaflet/dist/leaflet.css'

const mapContainer = ref(null)

// Alamcena la capa que fue clickeada
const layer_entidad_click = shallowRef(null)


const layer_municipios_seleccionado = shallowRef(null)
const capaProyectos = shallowRef(null) // ← guardar capa de proyectos

// Controles del mapa
const { map, initMap, resetView, flyToBounds } = useMap(mapContainer)
// Para cargar los GeoJson
const { getGeoJson } = useGeoJson()
// Información desplegada dentro del container map
/* const { infoLayer, updateDescription, updateTitle, resetDescription } = useInfoLayer(); */
const { infoLayer } = useInfoLayer()
// Capa entidades

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

  if (layer_entidad_click.value) {
    layer_entidad_click.value.addTo(map.value)
    layer_entidad_click.value = null
  }

  // Volver a mostrar los proyectos si estaban ocultos (opcional)
  if (capaProyectos.value && !map.value.hasLayer(capaProyectos.value)) {
    capaProyectos.value.addTo(map.value)
  }
}

// Botón para regresar a vista México
async function goProyectos() {
  const proyectosData = await getGeoJson('PPIs/Azul.json')
  await cargarProyectos(proyectosData)
}

// Función para cargar municipios (declarada antes de usarse)
const carga_municipios = async (entidad_seleccionada) => {
  try {
    // `/work/models/PTP/NPTP/PTP_Complementario/municipios/${estado}.json`
    const geojson = await getGeoJson(`municipios/${entidad_seleccionada}.json`)
    /* console.log('Municipios cargados:', geojson) */

    const municipiosCapa = L.geoJSON(geojson, {
      pane: 'poligonosPane',
      style: {
        color: '#D32F2F',
        weight: 1,
        fillColor: '#FFCDD2',
        fillOpacity: 0.2,
        dashArray: '3',
      },
      onEachFeature: (feature, layer) => {
        const municipio_nombre = feature.properties.NOMGEO || 'Municipio'
        layer.bindTooltip(municipio_nombre)

        layer.on('mouseover', () => {
          layer.setStyle({ fillOpacity: 0, weight: 1.5 })
        })
        layer.on('mouseout', () => {
          layer.setStyle({ fillOpacity: 0.2, weight: 1 })
        })

        layer.on('click', async (e) => {
          // Encuadrar la vista al municipio
          L.DomEvent.stopPropagation(e)

          // Si ya hay un municipio seleccionado, limpiar antes
          if (layer_municipios_seleccionado.value) {
            layer_municipios_seleccionado.value.setStyle({ color: '#D32F2F' })
          }

          layer.setStyle({ color: '#0000ff' })
          const bounds = layer.getBounds()
          console.log('Encuadre municipio', bounds)

          flyToBounds(bounds)
        })
      },
    })

    municipiosCapa.addTo(map.value)
    layer_municipios_seleccionado.value = municipiosCapa

    // Cargar proyectos (directamente sin composable)
    // '/work/models/PTP/NPTP/PTP_Complementario/PPIs/Azul.json'

    // Este de llamado de proyectos debe funcionar filtrado por municipio
    // Y en alguna otra parte un boton que habilite la muestra de todos

    /* const proyectosData = await getGeoJson('PPIs/Azul.json')
    await cargarProyectos(proyectosData) */
  } catch (err) {
    console.error('Error cargando municipios:', err)
  }
}

const carga_entidades = async () => {
  // '/work/models/PTP/NPTP/PTP_Complementario/entidades.json'
  const entidades = await getGeoJson('/entidades.json')

  if (entidades && map.value) {
    const estadosCapa = L.geoJSON(entidades, {
      pane: 'poligonosPane',
      style: {
        weight: 1.2,
        fillColor: '#9295e4',
        fillOpacity: 0.5,
        color: 'white',
        dashArray: '3',
      },
      onEachFeature: (feature, layer) => {
        const nombre = feature.properties.NOMGEO || 'Estado'
        layer.bindTooltip(nombre)

        layer.on('mouseover', () => layer.setStyle({ fillOpacity: 0.8, weight: 2 }))
        layer.on('mouseout', () => layer.setStyle({ fillOpacity: 0.5, weight: 1.2 }))

        layer.on('click', async (e) => {
          L.DomEvent.stopPropagation(e)

          // Encuadrar la vista a la entidad clickeada
          const bounds = layer.getBounds()
          flyToBounds(bounds)

          const nombre_entidad = layer.feature.properties.NOMGEO

          // Si ya hay un estado seleccionado, limpiar antes
          if (layer_entidad_click.value) {
            if (layer_municipios_seleccionado.value) {
              // Borro los muncipios del mapa
              map.value.removeLayer(layer_municipios_seleccionado.value)

              // Y tambien borro la capa de la variable donde la guardé
              layer_municipios_seleccionado.value = null
            }
            layer_entidad_click.value.addTo(map.value)
            layer_entidad_click.value = null
          }

          /*
          1. Elimino la capa de la entidad a la que le dí click. Esto para dejar espacio y poner la capa de los municipios
          2. Guardo la capa de la entidad para en futuro volverla a colocar en su lugar, cuando otra entidad sea clickeada.
          */
          layer_entidad_click.value = layer
          console.log("Despues de dar click: ",layer_entidad_click);

          map.value.removeLayer(layer)

          // Cargar municipios
          const entidad_json = nombre_entidad
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replaceAll(' ', '_')

          //Aqui sería mejor retornar la capa de municipios y desde carga_etnidades gestionar el addTo(map.value)
          await carga_municipios(entidad_json)


          // Opcional: ocultar proyectos mientras se ven municipios
          /* if (capaProyectos.value && map.value.hasLayer(capaProyectos.value)) {
            map.value.removeLayer(capaProyectos.value)
          } */


        })
      },
    })
    estadosCapa.addTo(map.value)
  }
}

onMounted(async () => {
  initMap()

  // Capa de información dentro del mapa
  infoLayer.addTo(map.value)

  // Crear pane para polígonos (estados y municipios) con z-index bajo
  map.value.createPane('poligonosPane')
  map.value.getPane('poligonosPane').style.zIndex = 400

  // Pane para estados
  map.value.createPane('entidadesPane')
  map.value.getPane('entidadesPane').style.zIndex = 500

  // Crear pane para proyectos (puntos) con z-index alto
  map.value.createPane('proyectosPane')
  map.value.getPane('proyectosPane').style.zIndex = 700

  // 1. Cargar estados
  /* await useEntidadesLayer(map); */
  /* const entidades = await getGeoJson("/entidades.json"); */
  carga_entidades()
})
</script>

<template>
  <div class="map-wraper">
    <div style="height: 100%; width: 300px; border: solid 1px purple"></div>
    <div ref="mapContainer" class="map"></div>
    <button class="back-button" @click="goBack">Enfocar a todo el país</button>
    <button class="back-button" @click="goProyectos">Proyectos</button>
  </div>
</template>

<style scoped>
.map-wraper {
  display: flex;
  border: solid 1px blue;
  width: calc(100dvw - (100dvw - 100%));
  /*  height: 100dvh; */
  height: calc(100dvh - var(--nav-height));
  /* height: 100dvh; */
  padding: 1rem;
}

.map {
  border: solid 1px red;
  width: 100%;
  height: 100%;
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
