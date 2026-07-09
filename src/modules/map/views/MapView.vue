<script setup>
// src/modules/map/views/MapView.vue
import { ref, onMounted, shallowRef, watch, onUnmounted, toRaw } from 'vue'
import L from 'leaflet'

import KDBush from 'kdbush'
import * as geokdbush from 'geokdbush'

// img
import { MEXICO_ICON } from '@/assets/img/mexicoIcon.js'

// Magnetic button effect
import { handleMouseMove, handleMouseLeave } from '../composables/gsap/magenticButton.js'

// Components
import InformationClick from '../components/InformationClick.vue'
import InformationProjects from '../components/InformationProjects.vue'
import TableMap from './TableMap.vue'
import RadiusControl from '../components/RadiusControl.vue'

// Para cargar los GeoJson
import { useGeoJson } from '../composables/useGeoJson'
const { getGeoJson } = useGeoJson()

// Composables
import { useMap as createMap } from '@/modules/map/composables/mapControler'
import { createLayer } from '../composables/useCreateLayer'
import { useMapInteractions } from '../composables/useMapInteractions.js'
// NUEVO: composable que calcula qué municipios toca el radar
import { useMunicipiosRadar } from '../composables/useMunicipiosRadar'

// Stores
import { usePoligonoStore } from '@/stores/poligonoStore.js'
import { usePointsStore } from '@/stores/pointsStore.js'

// Se inicializan valores de pinia
const pointsProyectos = usePointsStore()
const poligonoStore = usePoligonoStore()

// INICIO useMap()

// 1. Se inicializa el mapa mandando mapContainer que es un ref de un div
/*
initMap - crea el mapa tomando el mapContainer.
map - es el mapa en donde podemos aplicar los layers
resetView- retorna la vista al encuadre de todo México
*/
const mapContainer = ref(null)
const { initMap, resetView, map } = createMap(mapContainer)

function goBack() {
  // Si existe una entidad almacenada en pinia, significa que fue clickeada esa entidad
  // Elmina la capa de municipios que se addTo al mapa y coloca el poligono de la entidad que se guardó.
  if (poligonoStore.entidad) {
    map.value.removeLayer(poligonoStore.municipiosLayer)
    poligonoStore.entidad.addTo(map.value)
  }
  // Limpia cualquier poligono que fuera almacenado en clicks realizados
  poligonoStore.clear()
  // Cambia el setView enfocando a Mexico
  resetView()
}

// FIN useMap()

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

const capaProyectos = shallowRef(null)

const radius = ref(50000) // metros

// --- RADAR: Interacciones y búsqueda ---
const { center, register: registerClick, unregister: unregisterClick } = useMapInteractions(map)

// --- RADAR: Municipios tocados por el área del radar (NUEVO) ---
// municipiosEnRadar: array reactivo de features de municipios que
//   intersectan el círculo (total, parcial o por el borde).
// cargandoMunicipios: true mientras se están descargando archivos de
//   municipios de entidades candidatas que aún no estaban en cache.
const {
  municipiosEnRadar,
  municipiosRecortadosEnRadar,        // NUEVO
  cargandoMunicipios,
  inicializarConEntidades,
  actualizarMunicipiosEnRadar,
  actualizarMunicipiosRecortadosEnRadar, // NUEVO
} = useMunicipiosRadar()

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
  radioCantidad.value = filteredFeatures.value.length

  console.log(filteredFeatures.value)
}

// Reaccionar a cambios de centro o radio
watch([center, radius], () => {
  if (spatialIndex) searchPoints()

  // Lista de municipios (para el panel HTML)
  actualizarMunicipiosEnRadar(center.value, radius.value)

  // NUEVO: geometría recortada para pintar en el mapa
  actualizarMunicipiosRecortadosEnRadar(center.value, radius.value)
})

watch(
  () => pointsProyectos.features,
  (val) => {
    console.log('Features cargadas:', val?.length)
  },
)

// --- Círculo del radar + Marker draggable ---
const radarCircle = shallowRef(null)
const dragMarker = shallowRef(null)
const municipiosRecortadosLayer = shallowRef(null) // NUEVO: capa de intersección

// Icono invisible/pequeño para el centro del radar (arrastrable)
/* const radarCenterIcon = L.icon({
  iconUrl:"src/assets/img/cabeza.png",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
}) */

const radarCenterIcon = L.divIcon({
  className: 'radar-center-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 10],

})

watch(center, (c) => {
  if (!map.value || !c) {
    if (radarCircle.value) {
      map.value?.removeLayer(radarCircle.value)
      radarCircle.value = null
    }
    if (dragMarker.value) {
      map.value?.removeLayer(dragMarker.value)
      dragMarker.value = null
    }
    // NUEVO: limpiar municipios recortados cuando se desactiva el radar
    if (municipiosRecortadosLayer.value) {
      map.value?.removeLayer(municipiosRecortadosLayer.value)
      municipiosRecortadosLayer.value = null
    }
    return
  }

  // Crear o actualizar círculo
  if (!radarCircle.value) {
    radarCircle.value = L.circle([c.lat, c.lng], {
      radius: radius.value,
      color: 'orange', //  #3b82f6
      fillColor: 'orange',
      fillOpacity: 0.1,
      weight: 5,
      opacity: 1,
      /* dashArray: '5, 10', */pane: 'radarPaneMain'
    }).addTo(map.value)
  } else {
    radarCircle.value.setLatLng([c.lat, c.lng])
  }

  // Crear o actualizar marker draggable en el centro
  if (!dragMarker.value) {
    dragMarker.value = L.marker([c.lat, c.lng], {
      icon: radarCenterIcon,
      draggable: true,
      zIndexOffset: 1000, // Siempre encima
      pane: 'radarPaneMain'
    })
      .addTo(map.value)
      .on('drag', (e) => {
        const latLng = e.target.getLatLng()
        // Actualizar círculo en tiempo real mientras arrastra
        radarCircle.value?.setLatLng(latLng)

        // Limpiar capa anterior
  if (municipiosRecortadosLayer.value) {
    map.value.removeLayer(municipiosRecortadosLayer.value)
    municipiosRecortadosLayer.value = null
  }
      })
      .on('dragend', (e) => {
        const latLng = e.target.getLatLng()
        // Actualizar el centro de búsqueda (dispara watch y searchPoints)
        center.value = { lat: latLng.lat, lng: latLng.lng }
      })
  } else {
    dragMarker.value.setLatLng([c.lat, c.lng])
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
      radius: isHighlighted ? 2 : 4,
      fillColor: isHighlighted ? '#3b82f6' : '#3498db',
      color: isHighlighted ? '#1d4ed8' : 'rgb(255,255,255)',
      fillOpacity: isHighlighted ? 1 : 0.7,
      weight: isHighlighted ? 2 : 1,
    })
  })
})

// NUEVO: cuando cambia el FeatureCollection recortado, lo pinta en el mapa
watch(municipiosRecortadosEnRadar, (fc) => {
  if (!map.value) return

  // Limpiar capa anterior
  if (municipiosRecortadosLayer.value) {
    map.value.removeLayer(municipiosRecortadosLayer.value)
    municipiosRecortadosLayer.value = null
  }

  if (!fc || !fc.features?.length) return

  municipiosRecortadosLayer.value = L.geoJSON(fc, {
    pane: 'radarPane', // zIndex 900, encima de entidades y proyectos
    style: {
      color: 'orange',      // borde azul color: '#2563eb',
      fillColor: 'orange',  // relleno azul claro #60a5fa'
      fillOpacity: 0,
      weight: 1.5,
    },
   /*  onEachFeature: (feature, layer) => {
      layer.bindPopup(`
        <b>${feature.properties.NOMGEO}</b><br>
        <small>${feature.properties.NOM_ENT || ''}</small>
      `)
    }, */
  }).addTo(map.value)
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

// --- MAIN ---
onMounted(async () => {
  initMap()
  /* registerClick() */

  /* infoLayer.addTo(map.value) */
  map.value.createPane('radarPane').style.zIndex = 800
  map.value.createPane('radarPaneMain').style.zIndex = 900
  map.value.createPane('poligonosPane').style.zIndex = 400
  map.value.createPane('entidadesPane').style.zIndex = 500

  map.value.createPane('proyectosPane').style.zIndex = 550


  const entidades = await getGeoJson('entidades.json')
  if (entidades) {
    const EntidadesMuncipiosLayer = createLayer(entidades, {
      map: map.value,
      pane: 'entidadesPane',
      name: 'NOMGEO',
    })
    EntidadesMuncipiosLayer.addTo(map.value)

    // NUEVO: reutiliza el mismo entidades.json ya cargado para construir
    // el índice de bbox que usa el radar (Fase A) — no se vuelve a pedir
    // este archivo por red.
    inicializarConEntidades(entidades)
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
  if (dragMarker.value && map.value) {
    map.value.removeLayer(dragMarker.value)
    dragMarker.value = null
  }
  // NUEVO
  if (municipiosRecortadosLayer.value && map.value) {
    map.value.removeLayer(municipiosRecortadosLayer.value)
    municipiosRecortadosLayer.value = null
  }
})
</script>

<template>
  <div class="map-wraper" @mousemove="updateMousePosition">
    <div class="info" @mouseenter="active = true" @mouseleave="active = false">
      <div ref="mapContainer" class="map"></div>

      <!-- Tooltip de advertencia para zoom -->
      <div
        v-if="showWarning"
        class="map-scroll-tooltip"
        :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px' }"
      >
        Usa Ctrl + rueda del ratón para hacer zoom
      </div>

      <!-- Control de radio -->
      <RadiusControl v-model:radius="radius" :count="radioCantidad" />

      <!-- NUEVO: panel con el listado de municipios tocados por el radar.
           Reemplázalo por TableMap.vue si prefieres mostrarlo ahí; el
           dato ya está disponible en `municipiosEnRadar`. -->
      <div v-if="cargandoMunicipios" class="municipios-radar-panel">
        Cargando municipios del área...
      </div>
      <div v-else-if="municipiosEnRadar.length" class="municipios-radar-panel">
        <strong>Municipios en el radio ({{ municipiosEnRadar.length }}):</strong>
        <ul>
          <li v-for="m in municipiosEnRadar" :key="m.properties.CVEGEO">
            {{ m.properties.NOMGEO }}
          </li>
        </ul>
      </div>

      <!-- Panel de información al hacer clic -->
      <InformationClick />

      <div class="buttons">
        <!-- Botón para regresar a vista México -->
        <button
          class="focus-mexico shadow-lg"
          @click="goBack"
          @mousemove="handleMouseMove"
          @mouseleave="handleMouseLeave"
        >
          <div class="magnetic">
            <svg
              width="90"
              height="90"
              viewBox="150 -40 200 600"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path fill="#afafaf" :d="MEXICO_ICON" />
            </svg>
          </div>
        </button>

        <!-- Botón magnético -->
        <button
          class="back-button shadow-lg"
          @click="toggleProyectos"
          @mousemove="handleMouseMove"
          @mouseleave="handleMouseLeave"
        >
          <div class="magnetic">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="#005cc8"
              viewBox="0 0 16 16"
            >
              <path
                fill-rule="evenodd"
                d="M3.1 11.2a.5.5 0 0 1 .4-.2H6a.5.5 0 0 1 0 1H3.75L1.5 15h13l-2.25-3H10a.5.5 0 0 1 0-1h2.5a.5.5 0 0 1 .4.2l3 4a.5.5 0 0 1-.4.8H.5a.5.5 0 0 1-.4-.8z"
              />
              <path
                fill-rule="evenodd"
                d="M4 4a4 4 0 1 1 4.5 3.969V13.5a.5.5 0 0 1-1 0V7.97A4 4 0 0 1 4 3.999z"
              />
            </svg>
          </div>
        </button>
      </div>
    </div>
  </div>

  <!-- Tabla de información -->
  <div>
    <TableMap />
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

/* Marker del centro del radar - invisible pero captura eventos de drag */
:global(.radar-center-marker) {
  background: transparent;
  border: none;
}

:global(.radar-center-marker::after) {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  background: orange; /* #3b82f6; */
  border: 2px solid white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
  cursor: move;
}

/* :global(.radar-center-marker::after) {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 32px;
  height: 32px;

  background-image: url('@/assets/img/cabeza.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  transform: translate(-50%, -50%);
  cursor: move;
} */

/* NUEVO: panel del listado de municipios tocados por el radar */
.municipios-radar-panel {
  position: absolute;
  top: 50%;
  right: 10px;
  z-index: 1000;
  background: white;
  padding: 8px 12px;
  border-radius: 6px;
  max-height: 220px;
  overflow-y: auto;
  font-size: 0.85rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.municipios-radar-panel ul {
  margin: 4px 0 0;
  padding-left: 18px;
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

  display: flex;
  align-items: center;
  justify-content: center;

  will-change: transform;
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

.back-button {
  position: absolute;
  top: 80px;
  right: 20px;
  z-index: 1000;
  background: #fff;
  cursor: pointer;
  border-radius: 100px;
  overflow: hidden;
  border: none;

  height: 38px;
  aspect-ratio: 1 / 1;

  display: flex;
  align-items: center;
  justify-content: center;

  will-change: transform;
}

.magnetic {
  display: flex;
  align-items: center;
  justify-content: center;
  will-change: transform;
  pointer-events: none; /* importante para que el mouse siga "perteneciendo" al botón */
}
</style>
