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
import { reactive } from 'vue'
import MapFilters, { type FilterState, type FilterAction } from './MapFilters.vue'

// ─── Estado único, fuente de verdad ────────────────────────────

const filterState = reactive<FilterState>({
  mode: 'tematico',
  loading: false,
  radar: {
    active: false,
    min: 1,
    max: 200,
    value: 25
  },
  filters: {
    ramo: {
      selected: null,
      // MOCK: opciones iniciales de ejemplo
      options: [
        { value: 1, label: 'Educación' },
        { value: 2, label: 'Salud' },
        { value: 3, label: 'Infraestructura' }
      ]
    },
    ur: { selected: null, options: [] },
    tematica: {
      selected: null,
      options: [
        { value: 101, label: 'Cobertura escolar' },
        { value: 102, label: 'Infraestructura hospitalaria' }
      ]
    },
    entidad: {
      selected: null,
      options: [
        { value: 'CDMX', label: 'Ciudad de México' },
        { value: 'JAL', label: 'Jalisco' },
        { value: 'NL', label: 'Nuevo León' }
      ]
    },
    municipio: { selected: null, options: [] }
  }
})

// ─── MOCK: simulación de backend ────────────────────────────────
// Reemplazar esta función por la llamada real (SQL / API / Pinia).
// Su única tarea es: recibir una acción, "consultar", y construir
// un nuevo FilterState. El componente de filtros no sabe nada de
// esto; solo recibe el resultado a través de la prop `state`.

async function mockBackend(action: FilterAction): Promise<Partial<FilterState>> {
  // Simula latencia de red
  await new Promise((resolve) => setTimeout(resolve, 400))
  console.log('[MOCK BACKEND] acción recibida:', action) // eslint-disable-line no-console

  switch (action.type) {
    case 'SET_MODE':
      // Temática es un filtro compartido entre ambos modos: NO se limpia
      // al cambiar de modo. Solo se resetea el eje propio de cada modo
      // (Ramo/UR para temático; Entidad/Municipio/Radar para geográfico).
      return {
        mode: action.value,
        radar: { ...filterState.radar, active: false },
        filters: {
          ramo: { selected: null, options: filterState.filters.ramo.options },
          ur: { selected: null, options: [] },
          tematica: filterState.filters.tematica,
          entidad: { selected: null, options: filterState.filters.entidad.options },
          municipio: { selected: null, options: [] }
        }
      }

    case 'SELECT_RAMO':
      return {
        filters: {
          ...filterState.filters,
          ramo: { ...filterState.filters.ramo, selected: action.value },
          // MOCK: al elegir un ramo, "descubrimos" UR disponibles
          ur: {
            selected: null,
            options: [
              { value: 201, label: 'UR Centro' },
              { value: 202, label: 'UR Norte' }
            ]
          }
        }
      }

    case 'CLEAR_RAMO':
      return {
        filters: {
          ...filterState.filters,
          ramo: { ...filterState.filters.ramo, selected: null },
          ur: { selected: null, options: [] }
        }
      }

    case 'SELECT_UR':
      return {
        filters: {
          ...filterState.filters,
          ur: { ...filterState.filters.ur, selected: action.value }
        }
      }

    case 'CLEAR_UR':
      return {
        filters: {
          ...filterState.filters,
          ur: { ...filterState.filters.ur, selected: null }
        }
      }

    case 'SELECT_TEMATICA':
      return {
        filters: {
          ...filterState.filters,
          tematica: { ...filterState.filters.tematica, selected: action.value }
        }
      }

    case 'CLEAR_TEMATICA':
      return {
        filters: {
          ...filterState.filters,
          tematica: { ...filterState.filters.tematica, selected: null }
        }
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
              { value: 1002, label: 'Municipio B' }
            ]
          }
        }
      }

    case 'CLEAR_ENTIDAD':
      return {
        filters: {
          ...filterState.filters,
          entidad: { ...filterState.filters.entidad, selected: null },
          municipio: { selected: null, options: [] }
        }
      }

    case 'SELECT_MUNICIPIO':
      return {
        filters: {
          ...filterState.filters,
          municipio: { ...filterState.filters.municipio, selected: action.value }
        }
      }

    case 'CLEAR_MUNICIPIO':
      return {
        filters: { ...filterState.filters, municipio: { ...filterState.filters.municipio, selected: null } }
      }

    case 'ACTIVATE_RADAR':
      return {
        radar: {
          ...filterState.radar,
          active: true,
          // MOCK: resultado del cálculo externo del radio
          entidadesResultado: [
            { value: 'CDMX', label: 'Ciudad de México' },
            { value: 'EDOMEX', label: 'Estado de México' }
          ],
          municipiosResultado: [
            { value: 2001, label: 'Naucalpan' },
            { value: 2002, label: 'Tlalnepantla' }
          ]
        }
      }

    case 'DEACTIVATE_RADAR':
      return {
        radar: { ...filterState.radar, active: false, entidadesResultado: [], municipiosResultado: [] }
      }

    case 'CHANGE_RADAR':
      return { radar: { ...filterState.radar, value: action.value } }

    case 'CLEAR_ALL':
      return {
        radar: { ...filterState.radar, active: false, entidadesResultado: [], municipiosResultado: [] },
        filters: {
          ramo: { selected: null, options: filterState.filters.ramo.options },
          ur: { selected: null, options: [] },
          tematica: { selected: null, options: filterState.filters.tematica.options },
          entidad: { selected: null, options: filterState.filters.entidad.options },
          municipio: { selected: null, options: [] }
        }
      }

    default:
      return {}
  }
}

// ─── Manejador único de acciones ───────────────────────────────

async function handleAction(action: FilterAction) {
  filterState.loading = true
  try {
    // MOCK: aquí iría la llamada real (SQL / API / Pinia)
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
