<script setup lang="ts">
/**
 * MapFilters
 * ─────────────────────────────────────────────────────────────
 * Componente controlador de filtros para mapa.
 *
 * Responsabilidad ÚNICA de este componente:
 *   1. Mostrar controles según el `state` recibido.
 *   2. Administrar estado puramente visual (qué combobox está
 *      abierto, qué texto de búsqueda tiene el usuario, etc.).
 *   3. Emitir `action` cuando el usuario interactúa.
 *   4. Reflejar automáticamente cualquier cambio de `state`.
 *
 * Este componente NUNCA:
 *   - ejecuta SQL o llama APIs directamente;
 *   - decide qué opciones mostrar (eso llega ya resuelto en `state`);
 *   - infiere relaciones entre RAMO / UR / TEMÁTICA / ENTIDAD / MUNICIPIO;
 *   - combina el modo Temático con el modo Geográfico.
 *
 * Contrato de comunicación:
 *
 *   <MapFilters :state="filterState" @action="handleAction" />
 *
 * Una única entrada (state) y una única salida (action).
 */
import { computed, reactive } from 'vue'
import SingleSelectCombobox, { type ComboboxOption } from './SingleSelectCombobox.vue'

// ─── Contrato de datos (state / action) ───────────────────────

export type FilterMode = 'tematico' | 'geografico'

export interface FilterOption {
  value: number | string
  label: string
}

export interface FilterLevel {
  selected: number | string | null
  options: FilterOption[]
}

export interface FilterState {
  mode: FilterMode
  loading: boolean

  radar: {
    active: boolean
    min: number
    max: number
    value: number
    /**
     * Extensión respecto al ejemplo base del contrato:
     * mientras el radar está activo, entidades y municipios dejan
     * de ser editables y pasan a representar únicamente el
     * resultado del cálculo hecho por el padre. Se listan aquí,
     * separados de `filters.entidad` / `filters.municipio`, para no
     * confundir "seleccionado manualmente" con "resultado del radar".
     */
    entidadesResultado?: FilterOption[]
    municipiosResultado?: FilterOption[]
  }

  filters: {
    ramo: FilterLevel
    ur: FilterLevel
    tematica: FilterLevel
    entidad: FilterLevel
    municipio: FilterLevel
  }
}

export type FilterAction =
  | { type: 'SET_MODE'; value: FilterMode }
  | { type: 'SELECT_RAMO'; value: number | string }
  | { type: 'CLEAR_RAMO' }
  | { type: 'SELECT_UR'; value: number | string }
  | { type: 'CLEAR_UR' }
  | { type: 'SELECT_TEMATICA'; value: number | string }
  | { type: 'CLEAR_TEMATICA' }
  | { type: 'SELECT_ENTIDAD'; value: number | string }
  | { type: 'CLEAR_ENTIDAD' }
  | { type: 'SELECT_MUNICIPIO'; value: number | string }
  | { type: 'CLEAR_MUNICIPIO' }
  | { type: 'CHANGE_RADAR'; value: number }
  | { type: 'ACTIVATE_RADAR' }
  | { type: 'DEACTIVATE_RADAR' }
  | { type: 'CLEAR_ALL' }

// ─── Props / Emits ─────────────────────────────────────────────

const props = defineProps<{
  state: FilterState
}>()

const emit = defineEmits<{
  (e: 'action', action: FilterAction): void
}>()

function emitAction(action: FilterAction) {
  emit('action', action)
}

// ─── Estado puramente visual (no de negocio) ──────────────────

const uiState = reactive({
  radarInputValue: props.state.radar.value
})

// ─── Helpers de presentación ───────────────────────────────────

/** Un nivel de filtro solo se muestra si el padre entregó opciones o ya hay una selección */
function nivelVisible(nivel: FilterLevel): boolean {
  return nivel.options.length > 0 || nivel.selected !== null
}

const mostrarRamo = computed(() => nivelVisible(props.state.filters.ramo))
const mostrarUr = computed(() => nivelVisible(props.state.filters.ur))
const mostrarTematica = computed(() => nivelVisible(props.state.filters.tematica))
const mostrarMunicipio = computed(() => nivelVisible(props.state.filters.municipio))

const hayAlgunaSeleccionTematica = computed(
  () =>
    props.state.filters.ramo.selected !== null ||
    props.state.filters.ur.selected !== null ||
    props.state.filters.tematica.selected !== null
)

const hayAlgunaSeleccionGeografica = computed(
  () =>
    props.state.filters.entidad.selected !== null ||
    props.state.filters.municipio.selected !== null ||
    props.state.radar.active
)

/** Presets recomendados para el radio del Radar, acotados al rango permitido */
const presetsRadar = computed(() =>
  [5, 10, 25, 50, 100].filter(
    (p) => p >= props.state.radar.min && p <= props.state.radar.max
  )
)

function optionsFor(nivel: FilterLevel): ComboboxOption[] {
  return nivel.options
}

// ─── Handlers: cambio de modo ──────────────────────────────────

function cambiarModo(nuevoModo: FilterMode) {
  if (nuevoModo === props.state.mode) return
  emitAction({ type: 'SET_MODE', value: nuevoModo })
}

// ─── Handlers: filtrado temático ───────────────────────────────

function onRamoChange(value: number | string | null) {
  if (value === null) emitAction({ type: 'CLEAR_RAMO' })
  else emitAction({ type: 'SELECT_RAMO', value })
}

function onUrChange(value: number | string | null) {
  if (value === null) emitAction({ type: 'CLEAR_UR' })
  else emitAction({ type: 'SELECT_UR', value })
}

function onTematicaChange(value: number | string | null) {
  if (value === null) emitAction({ type: 'CLEAR_TEMATICA' })
  else emitAction({ type: 'SELECT_TEMATICA', value })
}

// ─── Handlers: filtrado geográfico ─────────────────────────────

function onEntidadChange(value: number | string | null) {
  if (value === null) emitAction({ type: 'CLEAR_ENTIDAD' })
  else emitAction({ type: 'SELECT_ENTIDAD', value })
}

function onMunicipioChange(value: number | string | null) {
  if (value === null) emitAction({ type: 'CLEAR_MUNICIPIO' })
  else emitAction({ type: 'SELECT_MUNICIPIO', value })
}

// ─── Handlers: Radar ────────────────────────────────────────────
// El componente NUNCA activa el radar por sí mismo: solo solicita
// al padre iniciar ese modo. Es el padre quien decide, calcula
// los resultados y actualiza `state.radar.active` junto con las
// entidades/municipios resultantes.

function solicitarActivarRadar() {
  emitAction({ type: 'ACTIVATE_RADAR' })
}

function solicitarDesactivarRadar() {
  emitAction({ type: 'DEACTIVATE_RADAR' })
}

function onRadarInput(evt: Event) {
  const value = Number((evt.target as HTMLInputElement).value)
  uiState.radarInputValue = value
  emitAction({ type: 'CHANGE_RADAR', value })
}

function aplicarPresetRadar(preset: number) {
  uiState.radarInputValue = preset
  emitAction({ type: 'CHANGE_RADAR', value: preset })
}

// ─── Limpiar todo ───────────────────────────────────────────────

function limpiarTodo() {
  emitAction({ type: 'CLEAR_ALL' })
}
</script>

<template>
  <div class="relative flex flex-col gap-5 p-6 bg-slate-50 border border-slate-200 rounded-2xl max-w-xl mx-auto shadow-sm text-slate-800 text-sm">

    <!-- Overlay de carga: puramente visual, la decisión de qué bloquear es del padre -->
    <div
      v-if="state.loading"
      class="absolute inset-0 z-30 bg-white/60 backdrop-blur-[1px] rounded-2xl flex items-center justify-center gap-2 text-slate-500"
    >
      <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <span class="text-xs font-medium">Cargando resultados...</span>
    </div>

    <!-- Encabezado: selector de modo -->
    <div class="flex items-center justify-between gap-2">
      <div class="inline-flex bg-slate-200/60 rounded-xl p-1 gap-1">
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          :class="state.mode === 'tematico'
            ? 'bg-white text-indigo-700 shadow-2xs'
            : 'text-slate-500 hover:text-slate-700'"
          :disabled="state.loading"
          @click="cambiarModo('tematico')"
        >
          Temático
        </button>
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          :class="state.mode === 'geografico'
            ? 'bg-white text-emerald-700 shadow-2xs'
            : 'text-slate-500 hover:text-slate-700'"
          :disabled="state.loading"
          @click="cambiarModo('geografico')"
        >
          Geográfico
        </button>
      </div>

      <button
        v-if="hayAlgunaSeleccionTematica || hayAlgunaSeleccionGeografica"
        type="button"
        class="text-xs text-slate-400 hover:text-slate-600 font-medium transition"
        :disabled="state.loading"
        @click="limpiarTodo"
      >
        Limpiar filtros
      </button>
    </div>

    <!-- ═══════════════ MODO TEMÁTICO ═══════════════ -->
    <div v-if="state.mode === 'tematico'" class="flex flex-col gap-4">
      <p v-if="!mostrarRamo && !mostrarUr && !mostrarTematica" class="text-xs text-slate-400 italic text-center py-4">
        Aún no hay opciones disponibles para el filtrado temático.
      </p>

      <SingleSelectCombobox
        v-if="mostrarRamo"
        label="Ramo"
        placeholder="Buscar ramo..."
        accent-color="indigo"
        :options="optionsFor(state.filters.ramo)"
        :model-value="state.filters.ramo.selected"
        :disabled="state.loading"
        @update:model-value="onRamoChange"
      />

      <SingleSelectCombobox
        v-if="mostrarUr"
        label="UR"
        placeholder="Buscar UR..."
        accent-color="indigo"
        :options="optionsFor(state.filters.ur)"
        :model-value="state.filters.ur.selected"
        :disabled="state.loading"
        @update:model-value="onUrChange"
      />

      <SingleSelectCombobox
        v-if="mostrarTematica"
        label="Temática"
        placeholder="Buscar temática..."
        accent-color="indigo"
        :options="optionsFor(state.filters.tematica)"
        :model-value="state.filters.tematica.selected"
        :disabled="state.loading"
        @update:model-value="onTematicaChange"
      />
    </div>

    <!-- ═══════════════ MODO GEOGRÁFICO ═══════════════ -->
    <div v-else class="flex flex-col gap-4">

      <!-- ─── Radar activo: entidad/municipio son solo lectura ─── -->
      <div v-if="state.radar.active" class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-full">
            Modo Radar activo
          </span>
          <button
            type="button"
            class="text-xs text-slate-400 hover:text-slate-600 font-medium transition"
            :disabled="state.loading"
            @click="solicitarDesactivarRadar"
          >
            Salir del Radar
          </button>
        </div>

        <!-- Resultados de solo lectura: representan el cálculo externo, no son editables -->
        <div class="flex flex-col gap-2">
          <div v-if="(state.radar.entidadesResultado ?? []).length > 0" class="flex flex-col gap-1">
            <span class="text-[11px] text-slate-500 font-medium">
              Entidades encontradas ({{ state.radar.entidadesResultado!.length }}):
            </span>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="ent in state.radar.entidadesResultado"
                :key="`radar-ent-${ent.value}`"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60"
              >
                {{ ent.label }}
              </span>
            </div>
          </div>

          <div v-if="(state.radar.municipiosResultado ?? []).length > 0" class="flex flex-col gap-1">
            <span class="text-[11px] text-slate-500 font-medium">
              Municipios encontrados ({{ state.radar.municipiosResultado!.length }}):
            </span>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="mun in state.radar.municipiosResultado"
                :key="`radar-mun-${mun.value}`"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50/60 text-amber-700 border border-amber-200/40"
              >
                {{ mun.label }}
              </span>
            </div>
          </div>

          <p
            v-if="(state.radar.entidadesResultado ?? []).length === 0 && (state.radar.municipiosResultado ?? []).length === 0"
            class="text-xs text-slate-400 italic"
          >
            El radar aún no ha devuelto resultados.
          </p>
        </div>
      </div>

      <!-- ─── Selección manual (sin radar) ─── -->
      <template v-else>
        <SingleSelectCombobox
          label="Entidad"
          placeholder="Buscar entidad..."
          accent-color="emerald"
          :options="optionsFor(state.filters.entidad)"
          :model-value="state.filters.entidad.selected"
          :disabled="state.loading"
          @update:model-value="onEntidadChange"
        />

        <SingleSelectCombobox
          v-if="mostrarMunicipio"
          label="Municipio"
          placeholder="Buscar municipio..."
          accent-color="emerald"
          :options="optionsFor(state.filters.municipio)"
          :model-value="state.filters.municipio.selected"
          :disabled="state.loading"
          @update:model-value="onMunicipioChange"
        />

        <button
          v-if="state.filters.entidad.selected !== null"
          type="button"
          class="self-start text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200/60 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition"
          :disabled="state.loading"
          @click="solicitarActivarRadar"
        >
          Buscar por radio (Radar)
        </button>
      </template>

      <!-- ─── Radar: control de distancia (único control editable en modo Radar) ─── -->
      <div v-if="state.radar.active" class="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
        <div class="flex justify-between items-center">
          <label for="radar-slider" class="font-semibold text-slate-700 text-xs uppercase tracking-wider">
            Radio de búsqueda
          </label>
          <span class="px-2.5 py-0.5 bg-amber-100 text-amber-700 font-semibold rounded-full text-xs font-mono">
            {{ state.radar.value }} km
          </span>
        </div>

        <div v-if="presetsRadar.length > 0" class="flex items-center gap-1.5 flex-wrap">
          <span class="text-[11px] text-slate-400 mr-1">Rápido:</span>
          <button
            v-for="preset in presetsRadar"
            :key="`preset-${preset}`"
            type="button"
            class="px-2.5 py-1 text-xs rounded-lg font-medium border transition"
            :class="state.radar.value === preset
              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'"
            :disabled="state.loading"
            @click="aplicarPresetRadar(preset)"
          >
            {{ preset }} km
          </button>
        </div>

        <input
          id="radar-slider"
          type="range"
          class="w-full accent-amber-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none mt-1"
          :min="state.radar.min"
          :max="state.radar.max"
          :value="state.radar.value"
          :disabled="state.loading"
          step="1"
          @input="onRadarInput"
        />

        <div class="flex justify-between text-[11px] text-slate-400 font-mono">
          <span>{{ state.radar.min }} km</span>
          <span>{{ state.radar.max }} km</span>
        </div>
      </div>
    </div>
  </div>
</template>
