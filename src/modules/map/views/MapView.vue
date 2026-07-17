<script setup>
// src/modules/map/views/MapView.vue
import { ref, onMounted, shallowRef, watch, onUnmounted, toRaw, computed } from 'vue'
import L from 'leaflet'

import KDBush from 'kdbush'
import * as geokdbush from 'geokdbush'

// Components
import InformationClick from '../components/InformationClick.vue'
import TableMap from './TableMap.vue'
import RadiusControl from '../components/RadiusControl.vue'
import MapButtons from '../components/MapButtons.vue'
import MapScrollTooltip from '../components/MapScrollTooltip.vue'
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
// NUEVO: store centralizado de selección (ID_PPI_ESPACIAL, CVEGEO)
import { useSeleccionStore } from '@/stores/seleccionStore'

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

const capaProyectos = shallowRef(null)

/* const radius = ref(200_000) */ // metros

// --- RADAR: Interacciones y búsqueda ---
const { center, register: registerClick, unregister: unregisterClick } = useMapInteractions(map)

// --- RADAR: activar/desactivar completamente (NUEVO) ---
// Fuente de verdad ÚNICA de si el radar está encendido o apagado.
// Todo lo demás (listener de click, watchers de cálculo, UI) se
// deriva de este flag.
const radarActivo = ref(false)

// --- RADAR: Municipios tocados por el área del radar ---
const {
  municipiosEnRadar,
  municipiosRecortadosEnRadar,
  cargandoMunicipios,
  inicializarConEntidades,
  actualizarMunicipiosEnRadar,
  actualizarMunicipiosRecortadosEnRadar,
  resetRadar, // NUEVO: cancela cálculos en curso y limpia resultados
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

    if (radarActivo.value && center.value && radius.value != null) {
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
  const radiusKm = radius.value

  const results = geokdbush.around(
    spatialIndex,
    center.value.lng,
    center.value.lat,
    Infinity,
    radiusKm,
  )

  filteredFeatures.value = results.map((idx) => rawFeatures[idx]).filter(Boolean)

  console.log('🔍 Resultados en radio:', filteredFeatures.value.length)

  radioCantidad.value = filteredFeatures.value.length

  console.log(filteredFeatures.value)
}

// Reaccionar a cambios de centro o radio
watch([center, radius], () => {
  // ── NUEVO: Task 1 ────────────────────────────────────────────
  // Si el radar está desactivado, no se ejecuta absolutamente
  // ninguna lógica asociada (ni búsqueda de proyectos por KDBush,
  // ni cálculo/descarga de municipios por Turf).
  if (!radarActivo.value) return
  // ─────────────────────────────────────────────────────────────

  if (spatialIndex) searchPoints()

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
    // Forzamos la actualización del zoom actual en Vue antes de animar
    zoomActual.value = map.value.getZoom()

    if (marker._icon.classList.contains('marcador-onda-activa')) {
      marker._icon.classList.remove('marcador-onda-activa')
    }
    void marker._icon.offsetWidth // Truco de reflow para reiniciar CSS
    marker._icon.classList.add('marcador-onda-activa')
  }
}

let radarInterval = null

function iniciarOndaRadar(marker) {
  // Evita crear varios intervalos
  if (radarInterval) return

  dispararOndaRadar(marker)

  radarInterval = setInterval(() => {
    dispararOndaRadar(marker)
  }, 800) // Debe coincidir con la duración de la animación CSS
}

function detenerOndaRadar() {
  clearInterval(radarInterval)
  radarInterval = null
}

watch(center, (c) => {
  // Limpiar capa anterior de municipios recortados
  if (municipiosRecortadosLayer.value) {
    map.value.removeLayer(municipiosRecortadosLayer.value)
    municipiosRecortadosLayer.value = null
  }

  // Cuando `center` se vuelve null (radar apagado, o mapa no listo),
  // se eliminan del mapa todos los elementos visuales del radar.
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

    /* dispararOndaRadar(dragMarker.value); */
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

  /*   setTimeout(() => {
        dispararOndaRadar(dragMarker.value)
      }, 100) // 50ms son suficientes para que el DOM esté listo */

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
    }, 50) // 50ms son suficientes para que el DOM esté listo
  })

  /* dispararOndaRadar(dragMarker.value); */
})

/* ═══════════════════════════════════════════════════════════════
   NUEVO — Task 1: Activar / Desactivar el radar por completo
   ═══════════════════════════════════════════════════════════════ */

/**
 * Enciende el radar:
 * - Empieza a escuchar clicks del mapa (para poder mover el centro).
 * - Coloca el centro por defecto en la Ciudad de México.
 *   Esto dispara automáticamente los watchers de `center`/`radius` que
 *   dibujan el círculo, el marker y calculan proyectos/municipios.
 */
function activarRadar() {
  if (radarActivo.value) return

  radarActivo.value = true
  registerClick()
  center.value = mapStore.view.center
}

/**
 * Apaga el radar por completo:
 * - Deja de escuchar clicks del mapa (unregisterClick real, no solo un
 *   flag ignorado: el listener se desengancha de Leaflet).
 * - Pone `center` en null, lo que dispara la limpieza ya existente del
 *   círculo, el marker draggable y la capa de municipios recortados.
 * - Cancela cualquier cálculo de municipios en curso (debounce +
 *   promesas en vuelo) mediante resetRadar(), para que ninguna
 *   respuesta tardía de red pueda "revivir" resultados después de
 *   apagado.
 * - Limpia el conteo/resaltado de proyectos en el radio.
 */
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

/* ═══════════════════════════════════════════════════════════════ */

// --- Carga de proyectos ---
let datosProyectos = null
const proyectosVisibles = ref(false)

async function crearCapaProyectos() {
  if (!datosProyectos) {
    datosProyectos = await getGeoJson('PPIs/Base_ligera.json')
    console.log('Base ligera cargada:', datosProyectos.features.length, 'features')

    // ── NUEVO: Task 2 ──────────────────────────────────────────
    // Se imprime el listado completo de ID_PPI_ESPACIAL disponibles
    // al cargar el archivo, para confirmar que el campo existe y ver
    // su ubicación real dentro de "properties".
    console.log(
      '🆔 IDs PPI espacial cargados:',
      datosProyectos.features.map((f) => f.properties?.ID_PPI_ESPACIAL),
    )
    // ────────────────────────────────────────────────────────────

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

        // ── NUEVO: Task 2 + Task 4 ────────────────────────────
        // Se obtiene el ID_PPI_ESPACIAL de ESTE proyecto en
        // particular y se centraliza en Pinia.
        const idPpiEspacial = feature.properties?.ID_PPI_ESPACIAL ?? null
        console.log('🆔 ID_PPI_ESPACIAL del proyecto seleccionado:', idPpiEspacial)
        seleccionStore.setIdPpiEspacial(idPpiEspacial)
        // ────────────────────────────────────────────────────
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
  map.value.on('zoomend', () => {
    zoomActual.value = map.value.getZoom()
  })
  // NOTA: ya NO se llama registerClick() aquí. El radar arranca
  // DESACTIVADO por defecto; el listener de click del mapa solo se
  // engancha cuando el usuario activa el radar (ver activarRadar()).

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
})

onUnmounted(() => {
  unregisterClick()
  resetRadar() // NUEVO: cancela timers/promesas pendientes al desmontar

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
})
</script>

<template>
  <div class="map-wraper" @mousemove="updateMousePosition">
    <div class="info" @mouseenter="active = true" @mouseleave="active = false">
      <div ref="mapContainer" class="map" @wheel="handleWheel"></div>

      <!-- Tooltip de advertencia para zoom -->
      <MapScrollTooltip :show="showWarning" :tooltip-pos="tooltipPos" />

      <!-- NUEVO: botón para activar/desactivar el radar por completo.
           Si prefieres que viva dentro de MapButtons.vue, comparte ese
           archivo y lo integro ahí como un emit más. -->
      <!-- <button
        class="radar-toggle-btn"
        :class="{ 'radar-toggle-btn--activo': radarActivo }"
        @click="toggleRadar"
      >
        {{ radarActivo ? '🛑 Desactivar radar' : '📡 Activar radar' }}
      </button> -->

      <!-- Control de radio: solo visible/interactuable con el radar activo -->
      <RadiusControl
        v-if="radarActivo"
        v-model:radius="radius"
        :count="radioCantidad"
        :min="minRadius"
        :max="maxRadius"
      />

      <!-- Panel con el listado de municipios tocados por el radar:
           solo tiene sentido mostrarlo con el radar activo -->
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

      <!-- Panel de información al hacer clic -->
      <InformationClick />

      <!-- Buttons para controlar el setView y carga de layer Proyectos -->
      <MapButtons
        @go-back="goBack"
        @toggle-proyectos="toggleProyectos"
        @toggle-radar="toggleRadar"
      />
    </div>
  </div>

  <!-- Tabla de información -->
  <div>
    <TableMap />
  </div>
</template>

<style scoped>
:global(.radar-center-marker) {
  background: transparent;
  border: none;
  position: relative;
}

/* :global(.radar-center-marker::after) {
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
} */

/* NUEVO: botón de activar/desactivar radar */
.radar-toggle-btn {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000;
  background: white;
  border: 1px solid #999;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 0.85rem;
}

.radar-toggle-btn--activo {
  border-color: orange;
  color: #b35c00;
  font-weight: 600;
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

.map-wraper {
  display: flex;
  border: solid 1px blue;
  width: calc(100dvw - (100dvw - 100%));
  height: calc(100dvh - var(--nav-height));
  padding: 1rem;
}

.map {
  width: 100%;
  height: 100%;
}

.info {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  overflow: hidden;
}

:deep(.leaflet-interactive:focus) {
  outline: none;
}

:global(.dot-test) {
  filter: hue-rotate(140deg) brightness(1.2) !important;
}

/* 1. Estilos base de tu marcador (Tu diseño original) */
:global(.radar-center-marker) {
  background: transparent;
  border: none;
  position: relative; /* Asegura que los pseudoelementos se alineen aquí */
}

/* El punto naranja estático se mantiene intacto usando ::after */
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
  z-index: 2; /* Se coloca por encima de la onda para que no lo tape */
}

/* 2. La animación de la onda utilizando ::before para no romper el ::after */
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

  /*  background: radial-gradient(
    circle,
    rgba(255, 65, 54, 0.8) 55%,
    rgba(255, 65, 54, 0.35) 75%,
    rgba(255, 65, 54, 0) 100%
  ); */

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
    background-position: 0% 50%;
    opacity: 1;
  }
  100% {
    transform: scale(v-bind(escalaOndaCss));
    background-position: 300% 50%;
    opacity: 0;
  }
}
</style>
