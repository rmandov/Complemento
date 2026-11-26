
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

export interface SelectOption {
  value: number | string
  label: string
}

interface Props {
  id: string
  label: string
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  bloquearDeseleccionar: boolean
}

const emit = defineEmits(['limpiar'])

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Seleccione una opción',
  disabled: false,
  bloquearDeseleccionar: true,
})

const model = defineModel<number | string | null>({
  default: null,
})

const abierto = ref(false)
const busqueda = ref('')

const inputBuscar = ref<HTMLInputElement>()
const contenedor = ref<HTMLElement>()

const estiloLista = ref({
  position: 'fixed' as const,
  top: '0px',
  left: '0px',
  width: '0px',
  maxHeight: '240px',
  zIndex: 99999,
})

const filtradas = computed(() => {
  if (!busqueda.value) return props.options

  return props.options.filter(o =>
    {
      const busc = o?.label?.toLowerCase().includes(busqueda.value.toLowerCase())
      return busc
    }
  )
})

const textoSeleccionado = computed(() => {
  const opcion = props.options.find(
    o => String(o.value) === String(model.value)
  )

  return opcion?.label ?? ''
})

// Actualizar posición de la lista
function actualizarPosicionLista() {
  if (!contenedor.value || !abierto.value) return

  const select = contenedor.value.querySelector('.select')

  if (!select) return

  const rect = select.getBoundingClientRect()

  const espacioAbajo = window.innerHeight - rect.bottom
  const espacioArriba = rect.top

  const alturaMaxima = 240
  const espacioDisponible = Math.max(
    100,
    espacioAbajo >= alturaMaxima + 10
      ? espacioAbajo - 10
      : espacioArriba > espacioAbajo
        ? espacioArriba - 10
        : espacioAbajo - 10
  )

  const abrirArriba =
    espacioAbajo < alturaMaxima + 10 &&
    espacioArriba > espacioAbajo

  estiloLista.value = {
    position: 'fixed',
    top: abrirArriba
      ? `${rect.top - Math.min(alturaMaxima, espacioDisponible) - 4}px`
      : `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    maxHeight: `${Math.min(alturaMaxima, espacioDisponible)}px`,
    zIndex: 99999,
  }
}

// Abrir lista
async function abrir() {
  if (props.disabled) return

  abierto.value = true
  busqueda.value = ''

  await nextTick()

  actualizarPosicionLista()

  inputBuscar.value?.focus()
}

// Seleccionar opción
function seleccionar(opcion: SelectOption) {
  model.value = opcion.value
  abierto.value = false
  busqueda.value = ''
}

// Cerrar lista
function cerrar() {
  abierto.value = false
  busqueda.value = ''
}

// Limpiar selección
function limpiar() {
  model.value = null
  busqueda.value = ''
  emit('limpiar')
}

// Detectar scroll y resize
function manejarScroll() {
  if (abierto.value) {
    actualizarPosicionLista()
  }
}

function manejarResize() {
  if (abierto.value) {
    actualizarPosicionLista()
  }
}

// Cerrar al perder el foco
function alPerderFocus(event: FocusEvent) {
  const siguienteElemento = event.relatedTarget as Node | null

  if (
    siguienteElemento &&
    contenedor.value?.contains(siguienteElemento)
  ) {
    return
  }

  cerrar()
}

// Eventos globales
watch(abierto, (valor) => {
  if (valor) {
    window.addEventListener('scroll', manejarScroll, true)
    window.addEventListener('resize', manejarResize)
  } else {
    window.removeEventListener('scroll', manejarScroll, true)
    window.removeEventListener('resize', manejarResize)
  }
})

// Cerrar si el modelo se limpia externamente
watch(model, (nuevoValor) => {
  if (nuevoValor === null) {
    cerrar()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', manejarScroll, true)
  window.removeEventListener('resize', manejarResize)
})
</script>

<template>
  <div
    class="contenedor"
    ref="contenedor"
    @focusout="alPerderFocus"
  >
    <label :for="id" class="font-bold">
      {{ label }}
    </label>

    <div class="select">
      <button
        v-if="model !== null && !bloquearDeseleccionar"
        type="button"
        class="btn-limpiar"
        @mousedown.prevent
        @click="limpiar"
      >
        ✕
      </button>

      <span
        class="icono-chevron material-symbols-outlined"
        :class="{ 'icono-abierto': abierto }"
      >
        keyboard_arrow_down
      </span>

      <input
        v-if="abierto"
        :id="id"
        v-model="busqueda"
        class="input-form input-select"
        :class="{ 'seleccionado': model }"
        :placeholder="placeholder"
        ref="inputBuscar"
      />

      <div
        v-else
        class="seleccion"
        :class="{
          'seleccion-desactivada': disabled,
          'seleccionado': model
        }"
        @click="abrir"
      >
        {{ textoSeleccionado || placeholder }}
      </div>
    </div>

    <!-- La lista se renderiza directamente en body -->
    <Teleport to="body">
      <div
        v-if="abierto"
        class="lista"
        :style="estiloLista"
      >
        <button
          type="button"
          v-for="opcion in filtradas"
          :key="opcion.value"
          @mousedown.prevent
          @click="seleccionar(opcion)"
          class="opcion"
        >
          {{ opcion.label }}
        </button>

        <div
          v-if="filtradas.length === 0"
          class="vacio"
        >
          Sin resultados
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.contenedor {
  display: flex;
  flex-direction: column;
  position: relative;

  --color-primario: #1b365d;
  --color-primario-complementario: #7991BE;
  --colo-secundario: #0f172a;
  --color-secundario-complementario: #DAE2FD;
  --color-terciario: #0047c8;
  --color-terciario-complemenario: #BEFFDB;
  --color-blanco: #f8fafc;
  --color-gris: #565E74;
  --color-borde-cards: #e6e2e2;
  --color-gris-claro: #C4C7C9;
  --color-rojo: #cb0909;
  --color-rojo-claro: #e26c6c;
  --color-fondo-pagina: #f8fafc;
  --color-texto-pagina: #000000;
  --color-borde: #d8d8d8;
}

.select {
  position: relative;
}

.seleccion {
  width: 100%;
  border: 1px solid var(--color-borde-cards);
  padding: 0.5rem 4rem 0.5rem 0.5rem;
  border-radius: 6px;
  background: white;
  max-width: 100%;
  text-wrap: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  cursor: pointer;
}

.seleccionado{
  padding-right: 4.5rem;
}
.input-select.seleccionado {
  padding-right: 2.5rem !important;
}

.input-select {
  padding-right: 2rem !important;
}

.seleccion-desactivada {
  color: #888;
  cursor: not-allowed !important;
}

.icono-chevron {
  position: absolute;
  right: 0.6rem;
  top: 0.8rem;
  transition: all 0.2s ease-in-out;
  pointer-events: none;
}

.icono-abierto {
  transform: rotate(-180deg);
}

.btn-limpiar {
  position: absolute;
  right: 2rem;
  top: 0.6rem;
  border-radius: 50%;
  border: 1px solid var(--color-borde-cards);
  width: 1.5rem;
  height: 1.5rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.1s ease-in-out;
}

.btn-limpiar:hover {
  color: white;
  background-color: var(--color-rojo-claro);
  border-color: var(--color-rojo);
  font-weight: bold;
}
</style>

<!-- Estilos globales porque Teleport mueve la lista fuera del componente -->
<style>
.lista {
  position: fixed;
  border: 1px solid #e6e2e2;
  background: white;
  border-radius: 6px;
  overflow-y: auto;
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.lista .opcion {
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  text-align: start;
  flex-shrink: 0;
  border: none;
  background: white;
  width: 100%;
}

.lista .opcion:hover {
  background: #0047c8;
  color: #f8fafc;
}

.lista .vacio {
  color: #888;
  padding: 0.5rem;
}

.lista::-webkit-scrollbar {
  width: 10px;
}

.lista::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 10px;
}

.lista::-webkit-scrollbar-thumb {
  background: #565E74;
  border-radius: 10px;
}

.lista::-webkit-scrollbar-thumb:hover {
  background: #0047c8;
}
</style>
