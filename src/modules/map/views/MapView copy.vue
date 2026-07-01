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

// INICIO - Movimiento de zoom con ctrl + wheel

const showWarning = ref(false)
let warningTimeout = null
const tooltipPos = ref({ x: 0, y: 0 })

// Actualiza las coordenadas X e Y relativas al contenedor del mapa
const updateMousePosition = (event) => {
  // Ajustamos un pequeño desfase (15px) para que el tooltip no tape la punta del cursor
  tooltipPos.value = {
    x: event.clientX + 15,
    y: event.clientY + 15,
  }
}

function handleWheel(event) {
  // Si la tecla Ctrl está presionada, permitimos el zoom manual
  if (event.ctrlKey) {
    event.preventDefault() // Evita que la página web haga scroll

    const currentZoom = map.value.getZoom()
    // event.deltaY < 0 significa scroll hacia arriba (Zoom In)
    if (event.deltaY < 0) {
      map.value.setZoom(currentZoom + 1)
    } else {
      map.value.setZoom(currentZoom - 1)
    }
    showWarning.value = false
  } else {
    // Si NO está presionada la tecla Ctrl, mostramos la advertencia
    showWarning.value = true

    // Ocultar el aviso después de 2 segundos de inactividad
    clearTimeout(warningTimeout)
    warningTimeout = setTimeout(() => {
      showWarning.value = false
    }, 1000)
  }
}
// FIN - Movimiento de zoom con ctrl + wheel

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

  /* infoLayer.addTo(map.value) */

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

  // INICIO - Movimiento de zoom con ctrl + wheel
  mapContainer.value.addEventListener('wheel', handleWheel, { passive: false })
  // FIN - Movimiento de zoom con ctrl + wheel
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
  <!-- Map-wrapper -->
  <div class="map-wraper" @mousemove="updateMousePosition">
    <div class="info" @mouseenter="active = true" @mouseleave="active = false">
      <div ref="mapContainer" class="map"></div>
      <!-- <InformationProjects></InformationProjects> -->

      <!-- Mensaje flotante de advertencia (Google Maps Style) -->
      <div
        v-if="showWarning"
        class="map-scroll-tooltip"
        :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px' }"
      >
        Usa Ctrl + rueda del ratón para hacer zoom
      </div>

      <RadiusControl v-model:radius="radius" :count="radioCantidad" />
      <InformationClick></InformationClick>
      <button class="focus-mexico shadow-lg" @click="goBack">
        <svg width="90" height="90" viewBox="150 -40 200 600" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="rgb(251, 126, 62)"
            d="M506.752,291.992h-28.989c-0.73,0-1.457,0.157-2.126,0.448l-25.459,11.32
		c-1.895,0.841-3.114,2.722-3.114,4.788v17.583c0,0.791-0.178,1.574-0.524,2.286l-11.805,24.394h-12.946
		c-0.68,0-1.353,0.135-1.98,0.392l-32.463,13.28c-1.706,0.698-3.65,0.449-5.126-0.662l-9.479-7.103
		c-0.844-0.635-1.863-0.998-2.918-1.048l-14.583-0.627c-1.693-0.079-3.249-0.97-4.168-2.387l-35.184-54.302
		c-0.74-1.148-1.004-2.536-0.74-3.876l13.522-67.596c0.495-2.486-0.855-4.966-3.213-5.899l-33.517-13.273
		c-1.204-0.47-2.187-1.374-2.76-2.528l-27.407-54.815c-0.802-1.603-2.369-2.686-4.15-2.864l-17.608-1.824
		c-2.048-0.214-4.032,0.798-5.069,2.572l-7.074,12.118c-0.713,1.232-1.895,2.116-3.277,2.45c-1.379,0.342-2.839,0.107-4.039-0.655
		l-15.695-9.882c-1.218-0.762-2.07-1.994-2.352-3.405l-3.33-16.657c-0.218-1.09-0.784-2.087-1.61-2.843l-25.171-22.954
		c-0.965-0.877-2.226-1.368-3.534-1.368h-22.317c-2.893,0-5.24,2.344-5.24,5.243v2.978h-34.87c-0.851,0-1.692-0.206-2.444-0.606
		L43.826,83.006C43.07,82.607,42.23,82.4,41.378,82.4H5.244c-1.646,0-3.199,0.769-4.185,2.087c-0.991,1.311-1.311,3.014-0.855,4.596
		l14.167,49.592c0.235,0.826,0.673,1.582,1.272,2.202l18.719,19.392c1.909,1.974,1.966,5.087,0.135,7.131l-7.042,7.872
		c-0.958,1.069-1.436,2.487-1.318,3.919c0.118,1.438,0.819,2.757,1.941,3.662l28.081,22.599c0.851,0.691,1.47,1.631,1.763,2.678
		l7.477,26.924c0.193,0.691,0.524,1.332,0.972,1.888l30.069,37.232c0.95,1.183,2.365,1.888,3.879,1.945
		c1.51,0.057,2.974-0.542,4.015-1.639l6.946-7.36c1.696-1.795,1.909-4.531,0.516-6.561l-18.887-27.607
		c-0.064-0.092-0.125-0.185-0.182-0.285L75.074,202.98c-0.228-0.384-0.406-0.798-0.531-1.226l-8.595-29.708
		c-0.172-0.577-0.442-1.126-0.798-1.624l-25.152-34.575c-0.399-0.555-0.692-1.183-0.855-1.845l-7.15-29.409l26.624,12.168
		c1.361,0.628,2.394,1.803,2.832,3.235l11.299,36.912c0.225,0.734,0.606,1.403,1.118,1.974l41.607,46.23
		c1.24,1.382,1.66,3.306,1.107,5.072l-2.322,7.438c-0.556,1.774-0.128,3.705,1.118,5.087l68.953,76.003
		c0.877,0.969,1.361,2.223,1.361,3.527v19.342l-4.909,1.511c-1.454,0.449-2.64,1.503-3.252,2.892
		c-0.613,1.39-0.595,2.978,0.05,4.353l9.775,20.768c0.517,1.104,1.408,1.994,2.518,2.515l152.764,71.608
		c1.999,0.94,4.371,0.526,5.935-1.04l17.234-17.226c0.98-0.984,2.316-1.54,3.705-1.54h12.582c1.094,0,2.166,0.342,3.057,0.984
		l30.969,22.214c1.315,0.948,2.993,1.226,4.538,0.77c1.553-0.449,2.804-1.604,3.398-3.106l6.957-17.668
		c0.766-1.938,2.604-3.242,4.688-3.32l13.714-0.506c2.818-0.106,5.051-2.422,5.051-5.236v-4.538c0-1.718-0.845-3.328-2.262-4.311
		l-6.166-4.267c-1.415-0.976-2.259-2.586-2.259-4.31v-12.048h28.326c1.81,0,3.488-0.933,4.446-2.465l34.653-55.442
		c0.52-0.827,0.798-1.796,0.798-2.779v-12.154C512,294.336,509.649,291.992,506.752,291.992z"
          />
        </svg>
      </button>
    </div>

    <button class="back-button" @click="toggleProyectos">Proyectos</button>
  </div>
  <!-- Informacion -->
  <!-- tabla -->
  <div>
    <TableMap></TableMap>
  </div>
</template>

<style scoped>
/* Tooltip flotante */
.map-scroll-tooltip {
  position: fixed; /* Usamos fixed para que dependa directamente de clientX/clientY */
  transform: translate(0, -50%); /* Centra el diseño verticalmente respecto al cursor */
  background-color: rgba(33, 33, 33, 0.9);
  color: #ffffff;
  padding: 8px 12px;
  border-radius: 4px;
  font-family: sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
  z-index: 9999; /* Máxima prioridad sobre controles e iconos de Leaflet */
  pointer-events: none; /* Crucial para no bloquear los clics en el mapa */
  white-space: nowrap;
  transition: opacity 0.15s ease;
}

.map-wraper {
  display: flex;
  border: solid 1px blue;
  width: calc(100dvw - (100dvw - 100%));
  height: calc(100dvh - var(--nav-height));
  padding: 1rem;
}

.map {
  /* border: solid 1px red; */
  width: 100%;
  height: 100%;
}

.back-button {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  background: white;
  border: 1px solid #e41616;
  cursor: pointer;
}

.focus-mexico {
  position: absolute;
  top: -10px;
  right: -10px;
  z-index: 1000;
  background: rgb(255, 255, 255);
  /* border: 1px solid blue; */
  cursor: pointer;
  border-radius: 100px;

  overflow: hidden;

  justify-items: center;
  align-content: center;
  /* padding: 1rem; */

  height: 100px;
  aspect-ratio: 1/1;

  transform: scale(0.4);
}

.info {
  position: relative;
  /* border: solid 1px red; */
  width: 100%;
  height: 100%;
  border-radius: 10px;
  overflow: hidden;
}

:deep(.leaflet-interactive:focus) {
  outline: none;
}
</style>
