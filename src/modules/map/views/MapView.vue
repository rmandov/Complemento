<script setup>
import { ref, onMounted, shallowRef } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Components
import InformationClick from '../components/InformationClick.vue'

// Para cargar los GeoJson
import { useGeoJson } from '../composables/useGeoJson'
const { getGeoJson } = useGeoJson()

// Capas
import { useMap } from '@/modules/map/composables/mapControler'
import { createLayer } from '../composables/useCreateLayer'
import { useInfoLayer } from '../composables/useInfoLayer'

import { usePoligonoStore } from '@/stores/poligono'
const newEntidad = usePoligonoStore()

const mapContainer = ref(null)
const capaProyectos = shallowRef(null) // ← guardar capa de proyectos

const { map, initMap, resetView } = useMap(mapContainer)
/* const { infoLayer, updateDescription, updateTitle, resetDescription } = useInfoLayer(); */
const { infoLayer } = useInfoLayer()

async function goBack() {
  if (newEntidad.MPoligono || newEntidad.EPoligono) {
    map.value.removeLayer(newEntidad.municipiosLayer)
    newEntidad.EPoligono.addTo(map.value)
  }
  newEntidad.clear()

  resetView()
}

// Botón para mostrar TODOS los proyectos - coords
let datosProyectos = null   // guardar los datos JSON para no volver a pedirlos
const proyectosVisibles = ref(false)   // si usas Vue, o una variable normal let
// Función que solo crea la capa (sin añadir al mapa)
async function crearCapaProyectos() {
  if (!datosProyectos) {
    datosProyectos = await getGeoJson('PPIs/Base_ligera.json')
    console.log('Base ligera: ', datosProyectos)
  }
  if (!map.value || !datosProyectos) return

  // Si ya existe una capa, la removemos (por si acaso)
  if (capaProyectos.value) {
    map.value.removeLayer(capaProyectos.value)
  }

  const estiloBase = { radius: 4, weight: 1, fillOpacity: 0.7, color: 'rgb(255, 255, 255)', fillColor: '#3498db' }

  const proyectosLayer = L.geoJSON(datosProyectos, {
    pointToLayer: (feature, latlng) => {const marker = L.circleMarker(latlng, {
        ...estiloBase,
      })
      marker.options.pane = 'proyectosPane' // forzar pane
      return marker},
    onEachFeature: (feature, layer) => {
      const nombre = feature.properties.NOMBRE_CORTO || feature.properties.NOMBRE || 'Proyecto'
      layer.bindTooltip(nombre)
      layer.on('click', () => console.log('Proyecto seleccionado:', nombre, feature.properties))
    },
    pane: 'proyectosPane',
  })

  capaProyectos.value = proyectosLayer
  // No la añadimos todavía; eso lo hará toggleProyectos
}

// Función toggle definitiva
async function toggleProyectos() {
  if (proyectosVisibles.value) {
    // Ocultar
    if (capaProyectos.value) {
      map.value.removeLayer(capaProyectos.value)
    }
    proyectosVisibles.value = false
  } else {
    // Mostrar: asegurar que la capa está creada
    if (!capaProyectos.value) {
      await crearCapaProyectos()
    }
    // Añadir al mapa si no está ya
    if (capaProyectos.value && !map.value.hasLayer(capaProyectos.value)) {
      capaProyectos.value.addTo(map.value)
    }
    proyectosVisibles.value = true
  }
}
// Proximamente carga de proyectos por poligono
/*
  Va a necesitar conexión con el poligono de una entidad o un municpio porque el proyecto ya no es por coords ahora por área.
*/

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

  // ** INICIO - Carga de entidades y municipios **
  /*
    El objetivo es que el layer reciba el json, cree la capa y la retorne.
    Desde este .vue es donde se gestiona el aplicarse la capa al map.
  */
  // 1. Se descarga el json de las entidades
  const entidades = await getGeoJson('entidades.json')
  // 2. Se comprueba que la descarga fue exitosa, despues se usa un composable para crear el layer
  if (entidades) {
    // 3. El composable retorna el layer
    const EntidadesMuncipiosLayer = createLayer(entidades, {
      map: map.value,
      pane: 'entidadesPane',
      name: 'NOMGEO',
    })
    /// 4. El layer creado se aplica en el mapa
    EntidadesMuncipiosLayer.addTo(map.value)
  }
  // ** FIN - Carga de entidades y municipios **
})
</script>

<template>
  <div class="map-wraper">
    <div style="height: 100%; width: 300px; border: solid 1px purple">
      <InformationClick></InformationClick>
    </div>
    <div class="info">
      <div ref="mapContainer" class="map"></div>
      <InformationProjects></InformationProjects>
    </div>

    <button class="back-button" @click="goBack">Enfocar a todo el país</button>
    <button class="back-button" @click="toggleProyectos">Proyectos</button>
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

.btn-regresar {
  padding: 10px 20px;
  background: white;
  border: 2px solid #333;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}
.btn-regresar:hover {
  background: #f0f0f0;
}

:deep(.leaflet-interactive:focus) {
  outline: none;
}
</style>
