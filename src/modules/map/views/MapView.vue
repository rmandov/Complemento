<script setup>
import { ref, onMounted, shallowRef, watch, onUnmounted, toRaw } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import KDBush from 'kdbush'
import * as geokdbush from 'geokdbush'

// Components
import InformationClick from '../components/InformationClick.vue'
import InformationProjects from '../components/InformationProjects.vue'
import TableMap from './TableMap.vue'
import RadiusControl from '../components/RadiusControl.vue'

// Para cargar los GeoJson
import { useGeoJson } from '../composables/useGeoJson'
const { getGeoJson } = useGeoJson()

// Capas
import { useMap } from '@/modules/map/composables/mapControler'
import { createLayer } from '../composables/useCreateLayer'
import { useInfoLayer } from '../composables/useInfoLayer'

// Búsqueda por proximidad
import { useMapInteractions } from '../composables/useMapInteractions.js'
/* import { useProximitySearch } from '../composables/useProximitySearch.js' */

// Stores
import { usePoligonoStore } from '@/stores/poligono'
import { usePointsStore } from '@/stores/pointsStore.js'

const pointsProyectos = usePointsStore()

const newEntidad = usePoligonoStore()

const mapContainer = ref(null)
const capaProyectos = shallowRef(null)

const { map, initMap, resetView } = useMap(mapContainer)
const { infoLayer } = useInfoLayer()

const radius = ref(5000) // metros

// --- RADAR: Interacciones y búsqueda ---
const { center, register: registerClick, unregister: unregisterClick } = useMapInteractions(map)

const filteredFeatures = shallowRef([])
let rawFeatures = []
let spatialIndex = null
let radioCantidad = ref(0)

// Construir el índice cuando las features estén listas
watch(
  () => pointsProyectos.features,
  (features) => {
    if (!features?.length) {
      spatialIndex = null
      rawFeatures = []
      filteredFeatures.value = []
      return
    }

    rawFeatures = JSON.parse(JSON.stringify(toRaw(features)))

    const index = new KDBush(rawFeatures.length)

    for (const feature of rawFeatures) {
      const [lng, lat] = feature.geometry.coordinates

      index.add(lng, lat)
    }

    index.finish()

    spatialIndex = index

    console.log('✅ Índice espacial actualizado con', rawFeatures.length, 'puntos')

    if (center.value && radius.value != null) {
      searchPoints()
    }
  },
  { immediate: true },
)

// Función de búsqueda pura
function searchPoints() {
  if (!spatialIndex || !center.value || radius.value == null) {
    filteredFeatures.value = []
    return
  }
  const radiusKm = radius.value / 1000

  /* rawFeatures = JSON.parse(
  JSON.stringify(toRaw(features))
)
 */
  const results = geokdbush.around(
    spatialIndex,
    center.value.lng,
    center.value.lat,
    Infinity,
    radiusKm,
  )

  // ✅ results son índices numéricos; usamos rawFeatures global
  filteredFeatures.value = results.map((idx) => rawFeatures[idx]).filter(Boolean) // defensa: elimina undefined por si acaso

  console.log('🔍 Resultados en radio:', filteredFeatures.value.length)

  // Se resta de la cantidad el proyecto mismo
  radioCantidad.value = filteredFeatures.value.length - 1

  console.log(filteredFeatures.value)
}

// Reaccionar a cambios de centro o radio
watch([center, radius], () => {
  if (spatialIndex) searchPoints()
})

watch(
  () => pointsProyectos.features,
  (val) => {
    console.log('Features cargadas:', val?.length)
  },
)

// --- Círculo del radar ---
const radarCircle = shallowRef(null)

watch(center, (c) => {
  if (!map.value || !c) {
    if (radarCircle.value) {
      map.value?.removeLayer(radarCircle.value)
      radarCircle.value = null
    }
    return
  }

  if (!radarCircle.value) {
    radarCircle.value = L.circle([c.lat, c.lng], {
      radius: radius.value,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.15,
      weight: 2,
      dashArray: '5, 10',
    }).addTo(map.value)
  } else {
    radarCircle.value.setLatLng([c.lat, c.lng])
  }
})

watch(radius, (r) => {
  if (radarCircle.value) {
    radarCircle.value.setRadius(r)
  }
})

// --- Highlight de proyectos cuando cambian filteredFeatures ---
watch(filteredFeatures, (features) => {
  if (!capaProyectos.value) return

  const idsEnRadio = new Set(
    features.map((f) => f.id || f.properties?.ID || f.properties?.NOMBRE_CORTO),
  )

  capaProyectos.value.eachLayer((layer) => {
    const feature = layer.feature
    const id = feature?.id || feature?.properties?.ID || feature?.properties?.NOMBRE_CORTO
    const isHighlighted = idsEnRadio.has(id)

    layer.setStyle({
      radius: isHighlighted ? 8 : 4,
      fillColor: isHighlighted ? '#3b82f6' : '#3498db',
      color: isHighlighted ? '#1d4ed8' : 'rgb(255,255,255)',
      fillOpacity: isHighlighted ? 1 : 0.7,
      weight: isHighlighted ? 2 : 1,
    })
  })
})

// --- Carga de proyectos ---
let datosProyectos = null
const proyectosVisibles = ref(false)

async function crearCapaProyectos() {
  if (!datosProyectos) {
    datosProyectos = await getGeoJson('PPIs/Base_ligera.json')
    console.log('Base ligera cargada:', datosProyectos.features.length, 'features')
    pointsProyectos.loadPoints(datosProyectos) // ← Esto activa el índice espacial
    // ... dentro de la función donde ya tienes datosProyectos
  }
  if (!map.value || !datosProyectos) return

  const estiloBase = {
    radius: 4,
    weight: 1,
    fillOpacity: 0.7,
    color: 'rgb(255, 255, 255)',
    fillColor: '#3498db',
  }

  const proyectosLayer = L.geoJSON(datosProyectos, {
    pointToLayer: (feature, latlng) => {
      const marker = L.circleMarker(latlng, { ...estiloBase })
      marker.options.pane = 'proyectosPane'
      return marker
    },
    onEachFeature: (feature, layer) => {
      const nombre = feature.properties.NOMBRE_CORTO || feature.properties.NOMBRE || 'Proyecto'
      layer.bindTooltip(nombre)
      layer.on('click', () => {
        console.log('Proyecto seleccionado:', nombre)
      })
    },
    pane: 'proyectosPane',
  })

  capaProyectos.value = proyectosLayer
}

async function toggleProyectos() {
  if (proyectosVisibles.value) {
    if (capaProyectos.value) {
      map.value.removeLayer(capaProyectos.value)
    }
    proyectosVisibles.value = false
  } else {
    if (!capaProyectos.value) {
      await crearCapaProyectos()
    }
    if (capaProyectos.value && !map.value.hasLayer(capaProyectos.value)) {
      capaProyectos.value.addTo(map.value)
    }
    proyectosVisibles.value = true
  }
}

function goBack() {
  if (newEntidad.MPoligono || newEntidad.EPoligono) {
    map.value.removeLayer(newEntidad.municipiosLayer)
    newEntidad.EPoligono.addTo(map.value)
  }
  newEntidad.clear()
  resetView()
}

// --- Montaje ---
onMounted(async () => {
  initMap()
  registerClick()

  infoLayer.addTo(map.value)

  map.value.createPane('poligonosPane').style.zIndex = 400
  map.value.createPane('entidadesPane').style.zIndex = 500
  map.value.createPane('proyectosPane').style.zIndex = 700

  const entidades = await getGeoJson('entidades.json')
  if (entidades) {
    const EntidadesMuncipiosLayer = createLayer(entidades, {
      map: map.value,
      pane: 'entidadesPane',
      name: 'NOMGEO',
    })
    EntidadesMuncipiosLayer.addTo(map.value)
  }

  /* await crearCapaProyectos()
  capaProyectos.value.addTo(map.value) */
})

onUnmounted(() => {
  unregisterClick()
  if (radarCircle.value && map.value) {
    map.value.removeLayer(radarCircle.value)
    radarCircle.value = null
  }
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

      <RadiusControl
        v-model:radius="radius"
        :count="radioCantidad"
        style="
          position: absolute;
          bottom: 20px;
          left: 20px;
          z-index: 1000;
          background: white;
          padding: 8px;
          border-radius: 6px;
        "
      />
    </div>

    <button class="back-button" @click="goBack">Enfocar a todo el país</button>
    <button class="back-button" @click="toggleProyectos">Proyectos</button>
  </div>
  <div>
    <TableMap></TableMap>
  </div>
</template>

<style scoped>
.map-wraper {
  display: flex;
  border: solid 1px blue;
  width: calc(100dvw - (100dvw - 100%));
  height: calc(100dvh - var(--nav-height));
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

.info {
  position: relative;
  border: solid 1px red;
  width: 100%;
  height: 100%;
}

:deep(.leaflet-interactive:focus) {
  outline: none;
}
</style>
