<script setup lang="ts">
import { computed, watch, ref } from 'vue'

/** Tipos internos */
interface Municipio {
  entidad: string
  nombre: string
}

interface Ubicacion {
  entidades: string[]
  municipios: string[]
}

/** Props */
const props = defineProps<{
  entidades: string[]
  municipios: Municipio[]
  showRadar: boolean
  radarMin: number
  radarMax: number
}>()

// ─── Models ──────────────────────────────────────────────────
const cartera = defineModel<string>('cartera', { default: '' })
const ubicacion = defineModel<Ubicacion>('ubicacion', {
  default: () => ({ entidades: [], municipios: [] })
})
const radar = defineModel<number>('radar', { default: 0 })

// ─── Estado Local ───────────────────────────────────────────
const busquedaUbicacion = ref('')
const estadosExpandidos = ref<Record<string, boolean>>({})

// Presets recomendados para el Radar
const presetsRadar = [5, 10, 25, 50].filter(
  (p) => p >= props.radarMin && p <= props.radarMax
)

// ─── Lógica de Búsqueda y Filtrado Unificado ─────────────────

/**
 * Procesa todos los estados y municipios relacionándolos con la búsqueda unificada.
 * Devuelve un árbol estructurado de Estados -> Municipios filtrados.
 */
const estructuraFiltrada = computed(() => {
  const query = busquedaUbicacion.value.trim().toLowerCase()

  return props.entidades.map((entidadNombre) => {
    // Municipios pertenecientes a este estado
    const munsDelEstado = props.municipios.filter((m) => m.entidad === entidadNombre)

    if (!query) {
      return {
        entidad: entidadNombre,
        coincideEntidad: true,
        municipiosCoincidentes: munsDelEstado,
        totalMunicipios: munsDelEstado.length
      }
    }

    const coincideEntidad = entidadNombre.toLowerCase().includes(query)
    const municipiosCoincidentes = munsDelEstado.filter((m) =>
      m.nombre.toLowerCase().includes(query)
    )

    return {
      entidad: entidadNombre,
      coincideEntidad,
      municipiosCoincidentes: coincideEntidad ? munsDelEstado : municipiosCoincidentes,
      totalMunicipios: munsDelEstado.length
    }
  }).filter((item) => item.coincideEntidad || item.municipiosCoincidentes.length > 0)
})

/** Total de municipios visibles/encontrados según la búsqueda actual */
const totalMunicipiosEncontrados = computed(() => {
  return estructuraFiltrada.value.reduce(
    (acc, curr) => acc + curr.municipiosCoincidentes.length,
    0
  )
})

/** Auto-expande los acordeones cuando el usuario escribe una búsqueda */
watch(busquedaUbicacion, (nuevaBusqueda) => {
  if (nuevaBusqueda.trim().length > 0) {
    const expandidos: Record<string, boolean> = {}
    estructuraFiltrada.value.forEach((item) => {
      expandidos[item.entidad] = true
    })
    estadosExpandidos.value = expandidos
  }
})

// ─── Selección Masiva e Individual ───────────────────────────

const todosLosResultadosSeleccionados = computed(() => {
  if (estructuraFiltrada.value.length === 0) return false
  const entidadesSel = ubicacion.value?.entidades ?? []
  return estructuraFiltrada.value.every((item) => entidadesSel.includes(item.entidad))
})

function toggleTodosResultados() {
  const visibles = estructuraFiltrada.value.map((item) => item.entidad)
  const actualesEntidades = ubicacion.value?.entidades ?? []

  if (todosLosResultadosSeleccionados.value) {
    // Deseleccionar todas las entidades visibles y sus municipios
    const nuevasEntidades = actualesEntidades.filter((e) => !visibles.includes(e))
    actualizarUbicacion(nuevasEntidades, ubicacion.value?.municipios ?? [])
  } else {
    // Agregar todas las entidades visibles
    const nuevasEntidades = [...new Set([...actualesEntidades, ...visibles])]
    actualizarUbicacion(nuevasEntidades, ubicacion.value?.municipios ?? [])
  }
}

function toggleExpandir(entidad: string) {
  estadosExpandidos.value[entidad] = !estadosExpandidos.value[entidad]
}

function toggleEntidad(entidadNombre: string) {
  const actualesEntidades = ubicacion.value?.entidades ?? []
  const existe = actualesEntidades.includes(entidadNombre)

  let nuevasEntidades: string[]
  if (existe) {
    nuevasEntidades = actualesEntidades.filter((e) => e !== entidadNombre)
  } else {
    nuevasEntidades = [...actualesEntidades, entidadNombre]
  }

  actualizarUbicacion(nuevasEntidades, ubicacion.value?.municipios ?? [])
}

function toggleMunicipio(municipio: Municipio) {
  const actualesMunicipios = ubicacion.value?.municipios ?? []
  const actualesEntidades = ubicacion.value?.entidades ?? []
  const existe = actualesMunicipios.includes(municipio.nombre)

  let nuevosMunicipios: string[]
  let nuevasEntidades = [...actualesEntidades]

  if (existe) {
    nuevosMunicipios = actualesMunicipios.filter((m) => m !== municipio.nombre)
  } else {
    nuevosMunicipios = [...actualesMunicipios, municipio.nombre]
    // Asegurar que su estado padre esté en la lista de entidades
    if (!nuevasEntidades.includes(municipio.entidad)) {
      nuevasEntidades.push(municipio.entidad)
    }
  }

  actualizarUbicacion(nuevasEntidades, nuevosMunicipios)
}

function actualizarUbicacion(nuevasEntidades: string[], nuevosMunicipios: string[]) {
  // Purga de municipios que ya no pertenezcan a ninguna entidad seleccionada
  const municipiosValidos = nuevosMunicipios.filter((munNombre) =>
    nuevasEntidades.some((entNombre) =>
      props.municipios.some(
        (m) => m.nombre === munNombre && m.entidad === entNombre
      )
    )
  )

  ubicacion.value = {
    entidades: nuevasEntidades,
    municipios: municipiosValidos
  }
}

function limpiarUbicacion() {
  ubicacion.value = { entidades: [], municipios: [] }
}

const tieneSeleccionGeografica = computed(() => {
  return (
    (ubicacion.value?.entidades?.length ?? 0) > 0 ||
    (ubicacion.value?.municipios?.length ?? 0) > 0
  )
})
</script>

<template>
  <div class="flex flex-col gap-5 p-8 bg-slate-50 border border-slate-200 rounded-2xl max-w-xl mx-auto shadow-sm text-slate-800 text-sm">

    <!-- 1. Cartera con Limpieza e Ícono -->
    <div class="flex flex-col gap-1.5">
      <label for="cartera-input" class="font-semibold text-slate-700 text-xs uppercase tracking-wider">
        Cartera
      </label>
      <div class="relative flex items-center">
        <svg class="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 8-2 2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8z" />
          <path d="M3 13h18" />
        </svg>
        <input
          id="cartera-input"
          v-model="cartera"
          type="text"
          class="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          placeholder="Escribe el nombre o ID de cartera..."
        />
        <button
          v-if="cartera"
          type="button"
          aria-label="Limpiar cartera"
          class="absolute right-3 w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          @click="cartera = ''"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- 2. Ubicación: Búsqueda Unificada + Acordeón -->
    <section class="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col gap-3.5 shadow-sm">
      <!-- Encabezado -->
      <div class="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span class="font-semibold text-slate-700 text-xs uppercase tracking-wider">Filtro Geográfico</span>
        </div>
        <button
          v-if="tieneSeleccionGeografica"
          type="button"
          class="text-xs text-rose-600 hover:text-rose-700 font-medium transition hover:underline"
          @click="limpiarUbicacion"
        >
          Limpiar todo
        </button>
      </div>

      <!-- Búsqueda Unificada -->
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          v-model="busquedaUbicacion"
          type="text"
          placeholder="Buscar estado o municipio..."
          class="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs transition focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
        <button
          v-if="busquedaUbicacion"
          type="button"
          aria-label="Limpiar búsqueda"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition text-xs"
          @click="busquedaUbicacion = ''"
        >
          ✕
        </button>
      </div>

      <!-- Barra de Estado y Selección Masiva -->
      <div class="flex items-center justify-between text-xs px-1 pt-1">
        <span class="text-slate-500">
          <strong class="font-semibold text-slate-700">{{ estructuraFiltrada.length }}</strong> estados y
          <strong class="font-semibold text-slate-700">{{ totalMunicipiosEncontrados }}</strong> municipios encontrados
        </span>

        <button
          v-if="estructuraFiltrada.length > 0"
          type="button"
          class="text-indigo-600 hover:text-indigo-800 font-medium transition"
          @click="toggleTodosResultados"
        >
          {{ todosLosResultadosSeleccionados ? 'Quitar encontrados' : 'Seleccionar encontrados' }}
        </button>
      </div>

      <!-- Lista Única con Acordeón (Scroll Único) -->
      <div class="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1 border border-slate-100 rounded-lg p-1.5 bg-slate-50/50">
        <div
          v-for="item in estructuraFiltrada"
          :key="item.entidad"
          class="bg-white border border-slate-200/70 rounded-lg overflow-hidden transition-all shadow-2xs"
        >
          <!-- Fila del Estado (Cabecera de Acordeón) -->
          <div class="flex items-center justify-between px-3 py-2 bg-slate-50/80 hover:bg-slate-100/80 transition cursor-pointer select-none">
            <label class="flex items-center gap-2.5 cursor-pointer flex-1 py-0.5" @click.stop>
              <input
                type="checkbox"
                class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4 cursor-pointer"
                :checked="(ubicacion?.entidades ?? []).includes(item.entidad)"
                @change="toggleEntidad(item.entidad)"
              />
              <span
                class="font-medium text-xs text-slate-800"
                :class="{ 'text-indigo-900 font-semibold': (ubicacion?.entidades ?? []).includes(item.entidad) }"
              >
                {{ item.entidad }}
              </span>
            </label>

            <div class="flex items-center gap-2" @click="toggleExpandir(item.entidad)">
              <span class="text-[10px] font-mono px-2 py-0.5 bg-slate-200/60 text-slate-600 rounded-full font-medium">
                {{ item.municipiosCoincidentes.length }} / {{ item.totalMunicipios }}
              </span>
              <button
                type="button"
                aria-label="Expandir municipios"
                class="text-slate-400 hover:text-slate-600 transition-transform duration-200 p-0.5"
                :class="{ 'rotate-180': estadosExpandidos[item.entidad] }"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Municipios Desplegables -->
          <div
            v-if="estadosExpandidos[item.entidad] && item.municipiosCoincidentes.length > 0"
            class="pl-8 pr-3 py-2 bg-white border-t border-slate-100 flex flex-col gap-1"
          >
            <label
              v-for="mun in item.municipiosCoincidentes"
              :key="mun.nombre"
              class="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 cursor-pointer transition text-xs select-none"
              :class="{ 'bg-emerald-50/60 text-emerald-900 font-medium': (ubicacion?.municipios ?? []).includes(mun.nombre) }"
            >
              <input
                type="checkbox"
                class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 w-3.5 h-3.5 cursor-pointer"
                :checked="(ubicacion?.municipios ?? []).includes(mun.nombre)"
                @change="toggleMunicipio(mun)"
              />
              <span class="truncate">{{ mun.nombre }}</span>
            </label>
          </div>
        </div>

        <div v-if="estructuraFiltrada.length === 0" class="text-xs text-slate-400 italic py-6 text-center">
          No se encontraron estados ni municipios con "{{ busquedaUbicacion }}"
        </div>
      </div>

      <!-- Resumen de Chips Agrupados por Categoría -->
      <div class="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
        <span class="text-xs font-semibold text-slate-700">Resumen de Selección</span>

        <div v-if="tieneSeleccionGeografica" class="flex flex-col gap-2">
          <!-- Grupo: Estados -->
          <div v-if="(ubicacion?.entidades ?? []).length > 0" class="flex flex-col gap-1">
            <span class="text-[11px] text-slate-500 font-medium">Estados ({{ ubicacion.entidades.length }}):</span>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="ent in ubicacion.entidades"
                :key="`chip-ent-${ent}`"
                class="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60"
              >
                <span>{{ ent }}</span>
                <button
                  type="button"
                  aria-label="Eliminar estado"
                  class="hover:bg-indigo-200/50 rounded-full w-4 h-4 inline-flex items-center justify-center text-xs transition"
                  @click="toggleEntidad(ent)"
                >
                  ✕
                </button>
              </span>
            </div>
          </div>

          <!-- Grupo: Municipios -->
          <div v-if="(ubicacion?.municipios ?? []).length > 0" class="flex flex-col gap-1">
            <span class="text-[11px] text-slate-500 font-medium">Municipios ({{ ubicacion.municipios.length }}):</span>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="mun in ubicacion.municipios"
                :key="`chip-mun-${mun}`"
                class="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60"
              >
                <span>{{ mun }}</span>
                <button
                  type="button"
                  aria-label="Eliminar municipio"
                  class="hover:bg-emerald-200/50 rounded-full w-4 h-4 inline-flex items-center justify-center text-xs transition"
                  @click="toggleMunicipio({ nombre: mun, entidad: '' })"
                >
                  ✕
                </button>
              </span>
            </div>
          </div>
        </div>

        <span v-else class="text-xs text-slate-400 italic">
          Sin filtros geográficos seleccionados.
        </span>
      </div>
    </section>

    <!-- 3. Radar con Slider y Presets Rápidos -->
    <div v-if="showRadar" class="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
      <div class="flex justify-between items-center">
        <label for="radar-slider" class="font-semibold text-slate-700 text-xs uppercase tracking-wider">
          Radio de Búsqueda
        </label>
        <span class="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 font-semibold rounded-full text-xs font-mono">
          {{ radar }} km
        </span>
      </div>

      <!-- Presets Rápidos -->
      <div v-if="presetsRadar.length > 0" class="flex items-center gap-1.5">
        <span class="text-[11px] text-slate-400 mr-1">Rápido:</span>
        <button
          v-for="preset in presetsRadar"
          :key="`preset-${preset}`"
          type="button"
          class="px-2.5 py-1 text-xs rounded-lg font-medium border transition"
          :class="radar === preset
            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'"
          @click="radar = preset"
        >
          {{ preset }} km
        </button>
      </div>

      <!-- Slider de Ajuste Fino -->
      <input
        id="radar-slider"
        v-model.number="radar"
        type="range"
        class="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none mt-1"
        :min="radarMin"
        :max="radarMax"
        step="1"
      />

      <div class="flex justify-between text-[11px] text-slate-400 font-mono">
        <span>{{ radarMin }} km</span>
        <span>{{ radarMax }} km</span>
      </div>
    </div>

  </div>
</template>
