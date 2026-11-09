<script setup lang="ts">
/**
 * SingleSelectCombobox
 * ─────────────────────────────────────────────────────────────
 * Combobox de selección única, con búsqueda integrada, tolerante
 * a mayúsculas/minúsculas y acentos.
 *
 * Es un componente puramente de presentación:
 * - No conoce reglas de negocio.
 * - No decide qué opciones existen (las recibe por props).
 * - Solo informa la intención del usuario mediante `update:modelValue`.
 *
 * El padre (MapFilters.vue) es quien traduce esa intención en una
 * acción del contrato { type, value } hacia el componente raíz.
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface ComboboxOption {
  value: number | string
  label: string
}

const props = withDefaults(
  defineProps<{
    label: string
    options: ComboboxOption[]
    modelValue: number | string | null
    placeholder?: string
    disabled?: boolean
    accentColor?: 'indigo' | 'emerald' | 'amber'
  }>(),
  {
    placeholder: 'Buscar...',
    disabled: false,
    accentColor: 'indigo',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | string | null): void
}>()

const root = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const query = ref('')

/** Quita acentos y normaliza a minúsculas para comparar sin distinción */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

const selectedOption = computed(
  () => props.options.find((o) => o.value === props.modelValue) ?? null,
)

const filteredOptions = computed(() => {
  const q = normalizar(query.value.trim())
  if (!q) return props.options
  return props.options.filter((o) => normalizar(o.label).includes(q))
})

function openDropdown() {
  if (props.disabled) return
  isOpen.value = true
}

function selectOption(option: ComboboxOption) {
  emit('update:modelValue', option.value)
  query.value = ''
  isOpen.value = false
}

function clearSelection(evt?: Event) {
  evt?.stopPropagation()
  emit('update:modelValue', null)
  query.value = ''
}

function handleClickOutside(evt: MouseEvent) {
  if (root.value && !root.value.contains(evt.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

const colorClasses = computed(() => {
  const map = {
    indigo: {
      ring: 'focus:ring-indigo-500/20 focus:border-indigo-500',
      chip: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
      chipHover: 'hover:bg-indigo-200/50',
      active: 'text-indigo-900',
    },
    emerald: {
      ring: 'focus:ring-emerald-500/20 focus:border-emerald-500',
      chip: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      chipHover: 'hover:bg-emerald-200/50',
      active: 'text-emerald-900',
    },
    amber: {
      ring: 'focus:ring-amber-500/20 focus:border-amber-500',
      chip: 'bg-amber-50 text-amber-700 border-amber-200/60',
      chipHover: 'hover:bg-amber-200/50',
      active: 'text-amber-900',
    },
  }
  return map[props.accentColor]
})
</script>

<template>
  <div ref="root" class="flex flex-col gap-1.5 relative">
    <label class="font-semibold text-slate-700 text-xs uppercase tracking-wider">
      {{ label }}
    </label>

    <!-- Chip de selección actual (si existe) -->
    <div v-if="selectedOption" class="flex items-center">
      <span
        class="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium border"
        :class="[colorClasses.chip]"
      >
        <span>{{ selectedOption.label }}</span>
        <button
          v-if="!disabled"
          type="button"
          aria-label="Quitar selección"
          class="rounded-full w-4 h-4 inline-flex items-center justify-center transition"
          :class="colorClasses.chipHover"
          @click="clearSelection"
        >
          ✕
        </button>
      </span>
    </div>

    <!-- Input de búsqueda (solo cuando no hay selección, o para reemplazarla) -->
    <div v-else class="relative flex items-center">
      <svg
        class="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        v-model="query"
        type="text"
        :disabled="disabled"
        :placeholder="placeholder"
        class="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm transition focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
        :class="colorClasses.ring"
        @focus="openDropdown"
        @click="openDropdown"
      />
    </div>

    <!-- Panel desplegable de opciones -->
    <div
      v-if="isOpen && !selectedOption"
      class="absolute top-full left-0 right-0 mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto py-1"
    >
      <button
        v-for="option in filteredOptions"
        :key="option.value"
        type="button"
        class="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition truncate"
        @click="selectOption(option)"
      >
        {{ option.label }}
      </button>

      <div
        v-if="filteredOptions.length === 0"
        class="px-3 py-3 text-xs text-slate-400 italic text-center"
      >
        Sin coincidencias para "{{ query }}"
      </div>
    </div>
  </div>
</template>
