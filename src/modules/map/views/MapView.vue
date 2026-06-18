<script setup>
import { ref, onMounted} from 'vue'
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
import { useTodos } from '../composables/useTodos'

import { usePoligonoStore } from '@/stores/poligono'
const newEntidad = usePoligonoStore()

const mapContainer = ref(null)

const { map, initMap, resetView } = useMap(mapContainer)
/* const { infoLayer, updateDescription, updateTitle, resetDescription } = useInfoLayer(); */
const { infoLayer, nameLayer } = useInfoLayer()

const { cargarProyectos, cargarProyectosDesdeArchivo } = useTodos(map)

// Regresa a la vista inicial
async function goBack() {
  if (newEntidad.MPoligono || newEntidad.EPoligono) {
    map.value.removeLayer(newEntidad.municipiosLayer)
    newEntidad.EPoligono.addTo(map.value)
  }
  newEntidad.clear()

  resetView()
}

// Botón para mostrar TODOS los proyectos - coords
async function goProyectos() {
  await cargarProyectosDesdeArchivo('PPIs/Base_ligera.json')
}

// Proximamente carga de proyectos por poligono
/*
  Va a necesitar conexión con el poligono de una entidad o un municpio porque el proyecto ya no es por coords ahora por área.
*/

onMounted(async () => {
  initMap()

  // Capa de información dentro del mapa
  infoLayer.addTo(map.value)
  nameLayer.addTo(map.value)

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

  const entidades = await getGeoJson('entidades.json')
  if (entidades) {
    const EntidadesMuncipiosLayer = createLayer(entidades, {
      map: map.value,
      pane: 'entidadesPane',
      name: 'NOMGEO',
    })
    EntidadesMuncipiosLayer.addTo(map.value)
  }

// 2. Carga de 

})
</script>

<template>
  <div class="map-wraper">
    <div style="height: 100%; width: 300px; border: solid 1px purple">
      <InformationClick></InformationClick>
    </div>
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
