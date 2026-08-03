<script setup lang="ts">
/**
 * MapFiltersDemo
 * ─────────────────────────────────────────────────────────────
 * Ejemplo de componente PADRE. Aquí es donde SÍ vive la lógica
 * de negocio: SQL/API real, Pinia, Leaflet, etc.
 *
 * Todo lo marcado como "MOCK" es una simulación temporal y debe
 * eliminarse (o sustituirse) al conectar el backend real. El
 * componente `MapFilters.vue` permanece intacto en ese proceso.
 */
import { reactive, onMounted, ref, computed } from 'vue'
import MapFilters, { type FilterState, type FilterAction } from './MapFilters.vue'

import Papa from 'papaparse'
import { useGeoJson } from '../composables/useGeoJson'
const { getGeoJson } = useGeoJson()

interface RamoUrRow {
  Llave_RamoUnidad: string
  RamoUr_Ramo: string
  RamoUr_NombreRamo: string
  RamoUr_NombreRamoCompleto: string
  RamoUr_Unidad: string
  RamoUr_NombreUnidad: string
  RamoUr_NombreUnidadCompleto: string
}

// ─── Datos e índices (accesibles globalmente en el script) ───

const ramoUrData = ref<RamoUrRow[]>([])

// Índice: RamoUr_Ramo -> lista de filas (para obtener UR de un ramo)
const indiceRamos = new Map<string, RamoUrRow[]>()

// Índice: `${RamoUr_Ramo}-${RamoUr_Unidad}` -> fila completa
const indiceLlaves = new Map<string, RamoUrRow>()

// Opciones de ramo (se construyen al cargar el CSV)
const opcionesRamo = ref<{ value: string; label: string }[]>([])

// ─── Estado único, fuente de verdad ────────────────────────────

const filterState = reactive<FilterState>({
  mode: 'tematico',
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
      options: [], // se llenará con los datos del CSV
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
      options: [
        { value: 'CDMX', label: 'Ciudad de México' },
        { value: 'JAL', label: 'Jalisco' },
        { value: 'NL', label: 'Nuevo León' },
      ],
    },
    municipio: { selected: null, options: [] },
  },
})

// ─── Computado para obtener la fila seleccionada (opcional) ──

const selectedRamoUrRow = computed(() => {
  const ramo = filterState.filters.ramo.selected
  const ur = filterState.filters.ur.selected
  if (ramo && ur) {
    return indiceLlaves.get(`${ramo}-${ur}`) || null
  }
  return null
})

// ─── Construcción de índices y opciones desde CSV ─────────────

function construirIndices() {
  // Limpiar índices previos (por si se recarga)
  indiceRamos.clear()
  indiceLlaves.clear()

  // Set para obtener ramos únicos
  const ramosSet = new Set<string>()

  for (const row of ramoUrData.value) {
    const ramo = row.RamoUr_Ramo
    const unidad = row.RamoUr_Unidad
    const llave = `${ramo}${unidad}`
    /* console.log("ESta es la llave: ", llave); */

    // Índice por ramo
    if (!indiceRamos.has(ramo)) {
      indiceRamos.set(ramo, [])
    }
    indiceRamos.get(ramo)!.push(row)

    // Índice por llave compuesta
    indiceLlaves.set(llave, row)

    // Guardar ramo único
    ramosSet.add(ramo)
  }

  // Construir opciones de ramo: value = RamoUr_Ramo, label = RamoUr_NombreRamo
  // Tomamos el primer registro de cada ramo para obtener el nombre
  opcionesRamo.value = Array.from(ramosSet).map((ramo) => {
    const primeraFila = indiceRamos.get(ramo)![0]
    return {
      value: ramo,
      label: primeraFila.RamoUr_NombreRamoCompleto,
    }
  })

  // Actualizar las opciones en el estado
  filterState.filters.ramo.options = opcionesRamo.value
}

// ─── Carga del CSV ─────────────────────────────────────────────

onMounted(async () => {
  try {
    const response = await fetch('ramos_ur/DIM_RAMOUR.csv')
    /* datosProyectos = await getGeoJson('ramos_ur/ramo_ur.csv') */
    const text = await response.text()

    const result = Papa.parse<RamoUrRow>(text, {
      header: true,
      skipEmptyLines: true,
    })

    ramoUrData.value = result.data

    console.log('Aqui está el resutl.data: ', result)

    // Construir índices y opciones
    construirIndices()
  } catch (error) {
    console.error('Error al cargar el CSV:', error)
  }
})

// ─── MOCK: simulación de backend ────────────────────────────────
// Reemplazar esta función por la llamada real (SQL / API / Pinia).

async function mockBackend(action: FilterAction): Promise<Partial<FilterState>> {
  await new Promise((resolve) => setTimeout(resolve, 400))
  console.log('[MOCK BACKEND] acción recibida:', action)

  switch (action.type) {
    case 'SET_MODE':
      return {
        mode: action.value,
        radar: { ...filterState.radar, active: false },
        filters: {
          ramo: { selected: null, options: filterState.filters.ramo.options },
          ur: { selected: null, options: [] },
          tematica: filterState.filters.tematica,
          entidad: { selected: null, options: filterState.filters.entidad.options },
          municipio: { selected: null, options: [] },
        },
      }

    case 'SELECT_RAMO': {
      const ramoSeleccionado = action.value
      // Obtener las filas de ese ramo
      const filas = indiceRamos.get(ramoSeleccionado) ?? []

      // Generar opciones de UR: value = RamoUr_Unidad, label = RamoUr_NombreUnidad
      const opcionesUr = filas.map((row) => ({
        value: row.RamoUr_Unidad,
        label: row.RamoUr_NombreUnidadCompleto,
      }))

      // Eliminar duplicados (por si hay varias filas con misma UR pero distinto nombre)
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
            selected: null, // limpiar UR al cambiar ramo
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

    // ... resto de casos (TEMATICA, ENTIDAD, MUNICIPIO, RADAR, CLEAR_ALL) se mantienen igual
    // (los omito por brevedad, pero deben estar completos)

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

    case 'SELECT_ENTIDAD':
      return {
        filters: {
          ...filterState.filters,
          entidad: { ...filterState.filters.entidad, selected: action.value },
          // MOCK: municipios dependientes de la entidad elegida
          municipio: {
            selected: null,
            options: [
              { value: 1001, label: 'Municipio A' },
              { value: 1002, label: 'Municipio B' },
            ],
          },
        },
      }

    case 'CLEAR_ENTIDAD':
      return {
        filters: {
          ...filterState.filters,
          entidad: { ...filterState.filters.entidad, selected: null },
          municipio: { selected: null, options: [] },
        },
      }

    case 'SELECT_MUNICIPIO':
      return {
        filters: {
          ...filterState.filters,
          municipio: { ...filterState.filters.municipio, selected: action.value },
        },
      }

    case 'CLEAR_MUNICIPIO':
      return {
        filters: {
          ...filterState.filters,
          municipio: { ...filterState.filters.municipio, selected: null },
        },
      }

    case 'ACTIVATE_RADAR':
      return {
        radar: {
          ...filterState.radar,
          active: true,
          // MOCK: resultado del cálculo externo del radio
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
          entidad: { selected: null, options: filterState.filters.entidad.options },
          municipio: { selected: null, options: [] },
        },
      }

    default:
      return {}
  }
}

// ─── Manejador único de acciones ───────────────────────────────

async function handleAction(action: FilterAction) {
  filterState.loading = true
  try {
    const parcial = await mockBackend(action)
    Object.assign(filterState, parcial)
  } finally {
    filterState.loading = false
  }
}

// (Opcional) Exponer el computed para depuración o uso en template
// Si quieres mostrar la fila seleccionada en algún lado, puedes agregarla al estado
// o simplemente dejarla como computed.
</script>

<template>
  <MapFilters :state="filterState" @action="handleAction" />
  <!-- Puedes agregar un div para depurar la fila seleccionada -->
  <!-- <pre>{{ selectedRamoUrRow }}</pre> -->
</template>
