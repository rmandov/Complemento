<script setup lang="ts">
/**
 * MapFiltersDemo
 * ─────────────────────────────────────────────────────────────
 * Ahora solo los filtros de Ramo/UR/Temática/Radar se manejan
 * localmente (o vía mock). Los filtros geográficos (Entidad/Municipio)
 * son fuente de verdad en Pinia, y se reflejan en filterState
 * mediante watchers.
 */
import { inject } from 'vue'
const goBack = inject<() => void>('mapGoBack', () => {
  console.warn('goBack no disponible en el contexto')
})

import { storeToRefs } from 'pinia'
import { reactive, onMounted, ref, computed, watch } from 'vue'
import MapFilters, { type FilterState, type FilterAction } from './MapFilters.vue'

import { useMapStore } from '@/stores/map'
const mapStore = useMapStore()
const {
  entidad,
  municipio,
  municipios,
  entidades, // asumo que existe un ref con todas las entidades
} = storeToRefs(mapStore)

import Papa from 'papaparse'

interface RamoUrRow {
  Llave_RamoUnidad: string
  RamoUr_Ramo: string
  RamoUr_NombreRamo: string
  RamoUr_NombreRamoCompleto: string
  RamoUr_Unidad: string
  RamoUr_NombreUnidad: string
  RamoUr_NombreUnidadCompleto: string
}

// ─── Datos e índices ──────────────────────────────────────────

const ramoUrData = ref<RamoUrRow[]>([])
const indiceRamos = new Map<string, RamoUrRow[]>()
const indiceLlaves = new Map<string, RamoUrRow>()
const opcionesRamo = ref<{ value: string; label: string }[]>([])

// ─── Estado único (filterState) ──────────────────────────────

const filterState = reactive<FilterState>({
  mode: 'geografico',
  loading: false,
  radar: {
    active: false,
    min: 1,
    max: 200,
    value: 25,
  },
  filters: {
    ramo: {
      selected: null,
      options: [],
    },
    ur: { selected: null, options: [] },
    tematica: {
      selected: null,
      options: [
        { value: 101, label: 'Cobertura escolar' },
        { value: 102, label: 'Infraestructura hospitalaria' },
      ],
    },
    entidad: {
      selected: null,
      options: [], // se llenará desde Pinia en onMounted o watch
    },
    municipio: { selected: null, options: [] },
  },
})

// ─── Sincronización con Pinia (watchers) ─────────────────────

// 1. Opciones de entidad: se cargan al montar y cada vez que cambien en el store
watch(
  entidades,
  (lista) => {
    filterState.filters.entidad.options = lista.map((e) => ({
      value: e.cvegeo,
      label: e.nombre,
    }))
  },
  { immediate: true, deep: true },
)

// 2. Entidad seleccionada
watch(
  entidad,
  (value) => {
    filterState.filters.entidad.selected = value
  },
  { immediate: true },
)

// 3. Opciones de municipio (dependen de la entidad seleccionada)
watch(
  municipios,
  (lista) => {
    filterState.filters.municipio.options = lista.map((m) => ({
      value: m.cvegeo,
      label: m.nombre,
    }))
    // Al cambiar la lista, se limpia la selección de municipio (el store ya lo hace, pero por si acaso)
    // filterState.filters.municipio.selected = null // ya lo hace el watch de municipio
  },
  { deep: true, immediate: true },
)

// 4. Municipio seleccionado
watch(
  municipio,
  (value) => {
    filterState.filters.municipio.selected = value
  },
  { immediate: true },
)

// ─── Computado para obtener la fila completa (Ramo+UR) ──────

const selectedRamoUrRow = computed(() => {
  const ramo = filterState.filters.ramo.selected
  const ur = filterState.filters.ur.selected
  if (ramo && ur) {
    return indiceLlaves.get(`${ramo}${ur}`) || null
  }
  return null
})

// ─── Construcción de índices desde CSV ──────────────────────

function construirIndices() {
  indiceRamos.clear()
  indiceLlaves.clear()
  const ramosSet = new Set<string>()

  for (const row of ramoUrData.value) {
    const ramo = row.RamoUr_Ramo
    const unidad = row.RamoUr_Unidad
    const llave = `${ramo}${unidad}`

    if (!indiceRamos.has(ramo)) {
      indiceRamos.set(ramo, [])
    }
    indiceRamos.get(ramo)!.push(row)
    indiceLlaves.set(llave, row)
    ramosSet.add(ramo)
  }

  opcionesRamo.value = Array.from(ramosSet).map((ramo) => {
    const primeraFila = indiceRamos.get(ramo)![0]
    return {
      value: ramo,
      label: primeraFila.RamoUr_NombreRamoCompleto,
    }
  })
  filterState.filters.ramo.options = opcionesRamo.value
}

// ─── Carga del CSV ────────────────────────────────────────────

onMounted(async () => {
  try {
    const response = await fetch('ramos_ur/DIM_RAMOUR.csv')
    const text = await response.text()
    const result = Papa.parse<RamoUrRow>(text, {
      header: true,
      skipEmptyLines: true,
    })
    ramoUrData.value = result.data
    construirIndices()
  } catch (error) {
    console.error('Error al cargar el CSV:', error)
  }
})

// ─── MOCK backend (solo para Ramo/UR/Temática/Radar) ────────
// Los filtros geográficos ya están en Pinia y se sincronizan vía watchers.

async function mockBackend(action: FilterAction): Promise<Partial<FilterState>> {
  await new Promise((resolve) => setTimeout(resolve, 400))
  console.log('[MOCK BACKEND] acción recibida:', action)

  switch (action.type) {
    case 'SET_MODE':
      goBack()
      return {
        mode: action.value,
        radar: { ...filterState.radar, active: false },
        filters: {
          ramo: { selected: null, options: filterState.filters.ramo.options },
          ur: { selected: null, options: [] },
          /* tematica: filterState.filters.tematica, */
          tematica: { selected: null, options: filterState.filters.tematica.options },
          // No tocamos entidad/municipio aquí (se mantienen como están)
          entidad: filterState.filters.entidad,
          municipio: filterState.filters.municipio,
        },
      }

    case 'SELECT_RAMO': {
      const ramoSeleccionado = action.value
      const filas = indiceRamos.get(ramoSeleccionado) ?? []
      const opcionesUr = filas.map((row) => ({
        value: row.RamoUr_Unidad,
        label: row.RamoUr_NombreUnidadCompleto,
      }))
      const uniqueUr = new Map<string, string>()
      opcionesUr.forEach((opt) => {
        if (!uniqueUr.has(opt.value)) {
          uniqueUr.set(opt.value, opt.label)
        }
      })
      const opcionesUrUnicas = Array.from(uniqueUr.entries()).map(([value, label]) => ({
        value,
        label,
      }))

      return {
        filters: {
          ...filterState.filters,
          ramo: {
            ...filterState.filters.ramo,
            selected: ramoSeleccionado,
          },
          ur: {
            selected: null,
            options: opcionesUrUnicas,
          },
        },
      }
    }

    case 'CLEAR_RAMO':
      return {
        filters: {
          ...filterState.filters,
          ramo: { ...filterState.filters.ramo, selected: null },
          ur: { selected: null, options: [] },
        },
      }

    case 'SELECT_UR':
      return {
        filters: {
          ...filterState.filters,
          ur: { ...filterState.filters.ur, selected: action.value },
        },
      }

    case 'CLEAR_UR':
      return {
        filters: {
          ...filterState.filters,
          ur: { ...filterState.filters.ur, selected: null },
        },
      }

    case 'SELECT_TEMATICA':
      return {
        filters: {
          ...filterState.filters,
          tematica: { ...filterState.filters.tematica, selected: action.value },
        },
      }

    case 'CLEAR_TEMATICA':
      return {
        filters: {
          ...filterState.filters,
          tematica: { ...filterState.filters.tematica, selected: null },
        },
      }

    case 'ACTIVATE_RADAR':
      return {
        radar: {
          ...filterState.radar,
          active: true,
          entidadesResultado: [
            { value: 'CDMX', label: 'Ciudad de México' },
            { value: 'EDOMEX', label: 'Estado de México' },
          ],
          municipiosResultado: [
            { value: 2001, label: 'Naucalpan' },
            { value: 2002, label: 'Tlalnepantla' },
          ],
        },
      }

    case 'DEACTIVATE_RADAR':
      return {
        radar: {
          ...filterState.radar,
          active: false,
          entidadesResultado: [],
          municipiosResultado: [],
        },
      }

    case 'CHANGE_RADAR':
      return { radar: { ...filterState.radar, value: action.value } }

    case 'CLEAR_ALL':
      // Limpiar también el store geográfico
      /*  mapStore.clearEntidad?.()
      mapStore.clearMunicipio?.() */
      mapStore.resetGeoFilters?.()

      return {
        radar: {
          ...filterState.radar,
          active: false,
          entidadesResultado: [],
          municipiosResultado: [],
        },
        filters: {
          ramo: { selected: null, options: filterState.filters.ramo.options },
          ur: { selected: null, options: [] },
          tematica: { selected: null, options: filterState.filters.tematica.options },
          // entidad y municipio se actualizarán vía watchers tras limpiar el store
          entidad: filterState.filters.entidad,
          municipio: filterState.filters.municipio,
        },
      }

    default:
      return {}
  }
}

// ─── Manejador de acciones ─────────────────────────────────────

async function handleAction(action: FilterAction) {
  // Para acciones geográficas, redirigir al store
  if (action.type === 'SELECT_ENTIDAD') {
    mapStore.setEntidad?.(action.value)
    return // no actualizamos filterState directamente, el watch lo hará
  }
  if (action.type === 'CLEAR_ENTIDAD') {
    mapStore.clearEntidad?.()
    return
  }
  if (action.type === 'SELECT_MUNICIPIO') {
    mapStore.setMunicipio?.(action.value)
    return
  }
  if (action.type === 'CLEAR_MUNICIPIO') {
    mapStore.clearMunicipio?.()
    return
  }

  // 🆕 CLEAR_ALL: ejecutar goBack + limpiar stores + actualizar filterState
  if (action.type === 'CLEAR_ALL') {
    // 1. Ejecutar la misma lógica que el botón "Volver"
    goBack() // elimina capas, restaura entidad, resetea vista

    // 2. Limpiar stores geográficos (esto disparará los watchers que sincronizan filterState)
    mapStore.resetGeoFilters?.()
    // Si tienes seleccionStore, límpialo también
    // seleccionStore?.setCVEGEO(null)

    // 3. Actualizar filterState (lo que no se sincroniza automáticamente)
    filterState.radar.active = false
    filterState.radar.entidadesResultado = []
    filterState.radar.municipiosResultado = []
    filterState.filters.ramo.selected = null
    filterState.filters.ur.selected = null
    filterState.filters.tematica.selected = null

    // Las opciones de ramo ya están en filterState, no las toques.
    // entidad y municipio se actualizarán vía watchers después de resetGeoFilters.

    return
  }

  // Para el resto, usar mockBackend
  filterState.loading = true
  try {
    const parcial = await mockBackend(action)
    Object.assign(filterState, parcial)
  } finally {
    filterState.loading = false
  }
}
</script>

<template>
  <MapFilters :state="filterState" @action="handleAction" />
</template>
