<script setup>
// src/modules/map/views/MapView.vue
import { ref, onMounted, shallowRef, watch, onUnmounted, toRaw, computed, provide } from 'vue'
import L from 'leaflet'

// Plugin de clusters: agrupa los circleMarker de "Proyectos" cuando hay
// muchos cerca entre sí. Los dos CSS son necesarios para que el círculo
// del cluster se vea bien (sin ellos funciona, pero sin estilos).
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'

import KDBush from 'kdbush'
import * as geokdbush from 'geokdbush'

// Components
import InformationClick from '../components/InformationClick.vue'
import TableMap from './TableMap.vue'
import RadiusControl from '../components/RadiusControl.vue'
import MapButtons from '../components/MapButtons.vue'
import MapScrollTooltip from '../components/MapScrollTooltip.vue'
import Tabs from '../components/Tabs.vue'
// Para cargar los GeoJson
import { useGeoJson } from '../composables/useGeoJson'
const { getGeoJson } = useGeoJson()

// Composables
import { useMap as createMap } from '@/modules/map/composables/mapControler'
import { createLayer } from '../composables/useCreateLayer'
import { useMapInteractions } from '../composables/useMapInteractions.js'
import { useMunicipiosRadar } from '../composables/useMunicipiosRadar'

// Stores
// radius
import { storeToRefs } from 'pinia'
import { useRadiusStore } from '@/stores/radiusStore.js'
const radiusStore = useRadiusStore()
const { radius, minRadius, maxRadius } = storeToRefs(radiusStore)
console.log('Este es el radius:', radius.value)

import { usePointsStore } from '@/stores/pointsStore.js'
// NUEVO: constante con las coordenadas (posición del radar)
import { useMapStore } from '@/stores/map.js'
import { useMapNavigation } from '@/modules/map/composables/useMapNavigation'
import { usePoligonoStore } from '@/stores/poligonoStore'

const poligonoStore = usePoligonoStore()
// NUEVO: store centralizado de selección (ID_PPI_ESPACIAL, CVEGEO)
import { useSeleccionStore } from '@/stores/seleccionStore'

/**
 * Variable para reconocer cuando el size del windows del buscador cambie.
 */
let resizeObserver = null
const handleResize = () => map.value?.invalidateSize()

//Constantes para Tabs
const activeTab = ref('mapa')

const tabList = [
  { id: 'mapa', label: 'Mapa' },
  { id: 'proyectos', label: 'Proyectos' },
  { id: 'estadisticas', label: 'Estadísticas' },
]

const zoomActual = ref(5) //  zoom inicial por defecto de tu mapa (ej: 5)

// El truco matemático: a menor zoom, la onda necesita escalar MENOS píxeles en pantalla
const escalaOndaCss = computed(() => {
  // Ajustamos el factor usando una potencia basada en el zoom actual
  const factorZoom = Math.pow(2, zoomActual.value - 5)
  return (radius.value / 30000) * factorZoom
})

const pointsProyectos = usePointsStore()
const seleccionStore = useSeleccionStore()
const mapStore = useMapStore()

const mapContainer = ref(null)
const { initMap, map, goBack, handleWheel, updateMousePosition, showWarning, tooltipPos } =
  createMap(mapContainer)

const { flyToEntidad, flyToMunicipio } = useMapNavigation(map)
// Proveer goBack al resto de la aplicación
provide('mapGoBack', goBack)

const capaProyectos = shallowRef(null)
const clusterProyectos = shallowRef(null)

// --- RADAR: Interacciones y búsqueda ---
const { center, register: registerClick, unregister: unregisterClick } = useMapInteractions(map)

// Fuente de verdad ÚNICA de si el radar está encendido o apagado.
const radarActivo = ref(false)

// --- RADAR: Municipios tocados por el área del radar ---
const {
  municipiosEnRadar,
  municipiosRecortadosEnRadar,
  cargandoMunicipios,
  inicializarConEntidades,
  actualizarMunicipiosEnRadar,
  actualizarMunicipiosRecortadosEnRadar,
  resetRadar,
} = useMunicipiosRadar()

const filteredFeatures = shallowRef([])
let rawFeatures = []
let spatialIndex = null
const radioCantidad = ref(0)

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

    if (radarActivo.value && center.value && radius.value != null) {
      searchPoints()
    }
  },
  { immediate: true },
)

// Función de búsqueda pura (solo proyectos)
function searchPoints() {
  if (!spatialIndex || !center.value || radius.value == null) {
    filteredFeatures.value = []
    radioCantidad.value = 0
    return
  }
  const radiusKm = radius.value / 1_000

  const results = geokdbush.around(
    spatialIndex,
    center.value.lng,
    center.value.lat,
    Infinity,
    radiusKm,
  )

  filteredFeatures.value = results.map((idx) => rawFeatures[idx]).filter(Boolean)
  radioCantidad.value = filteredFeatures.value.length

  console.log('🔍 Resultados en radio:', filteredFeatures.value.length)
  console.log(filteredFeatures.value)
}

// Reaccionar a cambios de centro o radio
watch([center, radius], () => {
  // Si el radar está desactivado, no se ejecuta nada
  if (!radarActivo.value) return

  // 1. Buscar proyectos SOLO si están visibles
  if (proyectosVisibles.value && spatialIndex) {
    searchPoints()
  }

  // 2. Calcular municipios SIEMPRE (independiente de proyectos)
  actualizarMunicipiosEnRadar(center.value, radius.value)
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
const municipiosRecortadosLayer = shallowRef(null)

const radarCenterIcon = L.divIcon({
  className: 'radar-center-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

const dispararOndaRadar = (marker) => {
  if (marker && marker._icon) {
    zoomActual.value = map.value.getZoom()

    if (marker._icon.classList.contains('marcador-onda-activa')) {
      marker._icon.classList.remove('marcador-onda-activa')
    }
    void marker._icon.offsetWidth
    marker._icon.classList.add('marcador-onda-activa')
  }
}

let radarInterval = null

function iniciarOndaRadar(marker) {
  if (radarInterval) return

  dispararOndaRadar(marker)

  radarInterval = setInterval(() => {
    dispararOndaRadar(marker)
  }, 800)
}

function detenerOndaRadar() {
  clearInterval(radarInterval)
  radarInterval = null
}

watch(center, (c) => {
  if (municipiosRecortadosLayer.value) {
    map.value.removeLayer(municipiosRecortadosLayer.value)
    municipiosRecortadosLayer.value = null
  }

  if (!map.value || !c) {
    if (radarCircle.value) {
      map.value?.removeLayer(radarCircle.value)
      radarCircle.value = null
    }
    if (dragMarker.value) {
      map.value?.removeLayer(dragMarker.value)
      dragMarker.value = null
    }
    return
  }

  // Crear o actualizar círculo
  if (!radarCircle.value) {
    radarCircle.value = L.circle([c.lat, c.lng], {
      radius: radius.value,
      color: 'red',
      fillColor: 'red',
      fillOpacity: 0.1,
      weight: 5,
      opacity: 1,
      pane: 'radarPaneMain',
    })

    radarCircle.value.addTo(map.value)
  } else {
    radarCircle.value.setLatLng([c.lat, c.lng])
  }

  // Crear o actualizar marker draggable en el centro
  if (!dragMarker.value) {
    dragMarker.value = L.marker([c.lat, c.lng], {
      icon: radarCenterIcon,
      draggable: true,
      zIndexOffset: 1000,
      pane: 'radarPaneMain',
    })
      .on('drag', (e) => {
        const latLng = e.target.getLatLng()
        radarCircle.value?.setLatLng(latLng)

        if (municipiosRecortadosLayer.value) {
          map.value.removeLayer(municipiosRecortadosLayer.value)
          municipiosRecortadosLayer.value = null
        }

        iniciarOndaRadar(e.target)
      })
      .on('dragend', (e) => {
        const latLng = e.target.getLatLng()
        center.value = { lat: latLng.lat, lng: latLng.lng }

        detenerOndaRadar()
      })
      .addTo(map.value)
  } else {
    dragMarker.value.setLatLng([c.lat, c.lng])
  }
})

watch(radius, (r) => {
  if (municipiosRecortadosLayer.value) {
    map.value.removeLayer(municipiosRecortadosLayer.value)
    municipiosRecortadosLayer.value = null
  }

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

// Cuando cambia el FeatureCollection recortado, lo pinta en el mapa
watch(municipiosRecortadosEnRadar, (fc) => {
  if (!map.value) return

  if (municipiosRecortadosLayer.value) {
    map.value.removeLayer(municipiosRecortadosLayer.value)
    municipiosRecortadosLayer.value = null
  }

  if (!fc || !fc.features?.length) return

  municipiosRecortadosLayer.value = L.geoJSON(fc, {
    pane: 'radarPane',
    style: {
      color: 'red',
      fillColor: 'red',
      fillOpacity: 0,
      weight: 1.2,
    },
  }).addTo(map.value)

  map.value.whenReady(() => {
    setTimeout(() => {
      dispararOndaRadar(dragMarker.value)
    }, 50)
  })
})

// ═══════════════════════════════════════════════════════════════
// Task 1: Activar / Desactivar el radar por completo
// ═══════════════════════════════════════════════════════════════

function activarRadar() {
  if (radarActivo.value) return

  radarActivo.value = true
  registerClick()
  center.value = mapStore.view.center
}

function desactivarRadar() {
  if (!radarActivo.value) return

  radarActivo.value = false
  unregisterClick()
  center.value = null

  resetRadar()

  filteredFeatures.value = []
  radioCantidad.value = 0
}

function toggleRadar() {
  if (radarActivo.value) {
    desactivarRadar()
  } else {
    activarRadar()
  }
}

// --- Carga de proyectos ---
let datosProyectos = null
const proyectosVisibles = ref(false)

async function crearCapaProyectos() {
  if (!datosProyectos) {
    datosProyectos = await getGeoJson('PPIs/Base_ligera.json')
    console.log('Base ligera cargada:', datosProyectos.features.length, 'features')

    console.log(
      '🆔 IDs PPI espacial cargados:',
      datosProyectos.features.map((f) => f.properties?.ID_PPI_ESPACIAL),
    )

    pointsProyectos.loadPoints(datosProyectos)
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

        const idPpiEspacial = feature.properties?.ID_PPI_ESPACIAL ?? null
        console.log('🆔 ID_PPI_ESPACIAL del proyecto seleccionado:', idPpiEspacial)
        seleccionStore.setIdPpiEspacial(idPpiEspacial)
      })
    },
    pane: 'proyectosPane',
  })

  capaProyectos.value = proyectosLayer

  clusterProyectos.value = L.markerClusterGroup({
    clusterPane: 'proyectosPane',
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
  })
  proyectosLayer.eachLayer((marker) => clusterProyectos.value.addLayer(marker))
}

async function toggleProyectos() {
  if (proyectosVisibles.value) {
    if (clusterProyectos.value) {
      map.value.removeLayer(clusterProyectos.value)
    }
    proyectosVisibles.value = false
  } else {
    if (!capaProyectos.value) {
      await crearCapaProyectos()
    }
    if (clusterProyectos.value && !map.value.hasLayer(clusterProyectos.value)) {
      clusterProyectos.value.addTo(map.value)
    }
    proyectosVisibles.value = true
    searchPoints()
  }
}

// ── Navegación desde filtros (o cualquier cambio en el store) ──
watch(
  () => mapStore.entidad,
  async (newCve, oldCve) => {
    if (!newCve || newCve === oldCve) return

    // Si el poligonoStore YA tiene esta entidad seleccionada, el cambio vino del click.
    // No hacemos nada para no duplicar la lógica.
    const currentCve = poligonoStore.entidad?.feature?.properties?.CVE_ENT
    if (currentCve === newCve) return

    await flyToEntidad(newCve)
  },
)

watch(
  () => mapStore.municipio,
  async (newCve, oldCve) => {
    if (!newCve || newCve === oldCve) return

    // Si el poligonoStore YA tiene este municipio seleccionado, el cambio vino del click.
    const currentCve = poligonoStore.municipio?.feature?.properties?.CVEGEO
    if (currentCve === newCve) return

    await flyToMunicipio(newCve)
  },
)

// --- MAIN ---
onMounted(async () => {
  initMap()
  map.value.on('zoomend', () => {
    zoomActual.value = map.value.getZoom()
  })

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

    inicializarConEntidades(entidades)
  }

  // NUEVO: Observa el contenedor del mapa y fuerza el recálculo de Leaflet
  if (mapContainer.value && window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      map.value?.invalidateSize()
    })
    resizeObserver.observe(mapContainer.value)
  }

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // NUEVO: Limpia el observer
  resizeObserver?.disconnect()
  window.removeEventListener('resize', handleResize)

  unregisterClick()
  resetRadar()

  if (radarCircle.value && map.value) {
    map.value.removeLayer(radarCircle.value)
    radarCircle.value = null
  }
  if (dragMarker.value && map.value) {
    map.value.removeLayer(dragMarker.value)
    dragMarker.value = null
  }
  if (municipiosRecortadosLayer.value && map.value) {
    map.value.removeLayer(municipiosRecortadosLayer.value)
    municipiosRecortadosLayer.value = null
  }
  if (clusterProyectos.value && map.value) {
    map.value.removeLayer(clusterProyectos.value)
    clusterProyectos.value = null
  }
})
</script>

<template>
  <div class="map-wraper" @mousemove="updateMousePosition">
    <!-- Añadida la clase "info" para que el CSS responsivo funcione -->
    <InformationClick class="info" />

    <!-- Nuevo contenedor flexible para las pestañas -->
    <div class="tabs-wrapper">
      <Tabs v-model="activeTab" :tabs="tabList" @change="onTabChange">
        <!-- MAPA -->
        <template #mapa>
          <div class="display-mapa">
            <div ref="mapContainer" class="map" @wheel="handleWheel"></div>

            <MapScrollTooltip :show="showWarning" :tooltip-pos="tooltipPos" />

            <RadiusControl
              v-if="radarActivo"
              v-model:radius="radius"
              :count="radioCantidad"
              :min="minRadius"
              :max="maxRadius"
            />

            <div v-if="radarActivo && cargandoMunicipios" class="municipios-radar-panel">
              Cargando municipios del área...
            </div>
            <div v-else-if="radarActivo && municipiosEnRadar.length" class="municipios-radar-panel">
              <strong>Municipios en el radio ({{ municipiosEnRadar.length }}):</strong>
              <ul>
                <li v-for="m in municipiosEnRadar" :key="m.properties.CVEGEO">
                  {{ m.properties.NOMGEO }}
                </li>
              </ul>
            </div>

            <MapButtons
              @go-back="goBack"
              @toggle-proyectos="toggleProyectos"
              @toggle-radar="toggleRadar"
            />
          </div>
        </template>

        <!-- Tabla de informacion -->
        <template #proyectos>
          <div>
            <TableMap />
          </div>
        </template>

        <!-- Tercer pestaña -->
        <template #estadisticas>
          <div>
            <p>lorem ipsum dolor sit amet...</p>
          </div>
        </template>
      </Tabs>
    </div>
  </div>
</template>

<style scoped>
/* Layout principal: fila en escritorio, columna en móvil */
.map-wraper {
  display: flex;
  width: calc(100dvw - (100dvw - 100%));
  height: calc(100dvh - var(--nav-height));
  padding: 1rem;
  flex-direction: row;
  gap: 10px;
}

/* Panel de información (izquierda en escritorio) */
.info {
  order: 1;
  /* Ajusta un ancho base si lo deseas, por ejemplo: */
  /* flex: 0 0 320px; */
}

/* Contenedor del mapa y pestañas (derecha en escritorio, ocupa el resto) */
.tabs-wrapper {
  flex: 1;
  order: 2;
  min-width: 0; /* Evita desbordamiento */
  display: flex;
  flex-direction: column;
}

/* El área del mapa ocupa todo el espacio de su pestaña */
.display-mapa {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  overflow: hidden;
}

.map {
  width: 100%;
  height: 100%;
}

/* ========== Responsive ========== */
@media (max-width: 1000px) {
  .map-wraper {
    flex-direction: column;
  }

  .info {
    order: 2; /* Se va abajo */
    width: 100%;
    height: 300px; /* O 100% si prefieres que ocupe toda la altura disponible */
  }

  .tabs-wrapper {
    order: 1; /* Mapa y pestañas arriba */
    height: 400px; /* O un valor fijo, según necesites */
  }
}

/* ========== Estilos del radar y otros ========== */
:global(.radar-center-marker) {
  background: transparent;
  border: none;
  position: relative;
}

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

:deep(.leaflet-interactive:focus) {
  outline: none;
}

:global(.dot-test) {
  filter: hue-rotate(140deg) brightness(1.2) !important;
}

:global(.radar-center-marker) {
  background: transparent;
  border: none;
  position: relative;
}

:global(.radar-center-marker::after) {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  background: red;
  border: 2px solid white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
  cursor: move;
  z-index: 2;
}

:global(.marcador-onda-activa::before) {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin-top: -10px;
  margin-left: -10px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 65, 54, 0.8) 55%,
    rgba(255, 65, 54, 0.35) 75%,
    rgba(255, 65, 54, 0) 100%
  );
  animation: pulsoOndaRadarVue 0.8s cubic-bezier(0.25, 0, 0, 1) forwards;
  pointer-events: none;
}

@keyframes pulsoOndaRadarVue {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(v-bind(escalaOndaCss));
    opacity: 0;
  }
}
</style>
