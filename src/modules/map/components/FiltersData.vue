<script setup lang="ts">
import { computed, watch } from 'vue'

/**
 * Tipos internos
 */
interface Municipio {
  entidad: string
  nombre: string
}

interface Ubicacion {
  entidades: string[]
  municipios: string[]
}

/**
 * Props (datos que NO se modifican directamente)
 */
const props = defineProps<{
  /** Lista completa de las 32 entidades federativas (strings) */
  entidades: string[]
  /** Lista completa de municipios, cada uno con su entidad asociada */
  municipios: Municipio[]
  /** Control de visibilidad del slider de radar */
  showRadar: boolean
  /** Valor mínimo del radar (km) */
  radarMin: number
  /** Valor máximo del radar (km) */
  radarMax: number
}>()

/**
 * Models (v-model bidireccional para cada control)
 */
const cartera = defineModel<string>('cartera', { default: '' })
const ubicacion = defineModel<Ubicacion>('ubicacion', {
  default: () => ({ entidades: [], municipios: [] })
})
const radar = defineModel<number>('radar', { default: 0 })

/**
 * Municipios filtrados: solo aquellos cuyas entidades están seleccionadas.
 * Se recalcula reactivamente cuando cambia ubicacion.entidades o la lista externa.
 */
const municipiosFiltrados = computed<Municipio[]>(() => {
  const entidadesSeleccionadas = ubicacion.value?.entidades ?? []
  if (entidadesSeleccionadas.length === 0) return []
  return props.municipios.filter((m) =>
    entidadesSeleccionadas.includes(m.entidad)
  )
})

/**
 * Indica si el selector de municipios debe mostrarse:
 * - Hay al menos una entidad seleccionada.
 * - Existe al menos un municipio correspondiente en los datos filtrados.
 */
const mostrarSelectorMunicipios = computed<boolean>(
  () =>
    (ubicacion.value?.entidades ?? []).length > 0 &&
    municipiosFiltrados.value.length > 0
)

// ─── Métodos para manipular la ubicación ──────────────────────────────

/**
 * Actualiza la lista de entidades y, automáticamente, limpia los municipios
 * que ya no pertenezcan a las entidades resultantes.
 */
function actualizarEntidades(nuevasEntidades: string[]) {
  // Filtrar municipios actuales que sigan siendo válidos
  const municipiosValidos = (ubicacion.value?.municipios ?? []).filter((mun) =>
    nuevasEntidades.some((ent) =>
      props.municipios.some(
        (m) => m.nombre === mun && m.entidad === ent
      )
    )
  )
  // Emitir nuevo objeto completo (respetando el v-model)
  ubicacion.value = {
    entidades: nuevasEntidades,
    municipios: municipiosValidos
  }
}

/**
 * Alternar una entidad en la selección.
 */
function toggleEntidad(entidad: string) {
  const actuales = ubicacion.value?.entidades ?? []
  const index = actuales.indexOf(entidad)
  const nuevas = index === -1
    ? [...actuales, entidad]
    : actuales.filter((e) => e !== entidad)
  actualizarEntidades(nuevas)
}

/**
 * Alternar un municipio (por su nombre) en la selección.
 * Solo se permite si el municipio pertenece a alguna entidad seleccionada.
 */
function toggleMunicipio(nombre: string) {
  const actuales = ubicacion.value?.municipios ?? []
  const entidadesSeleccionadas = ubicacion.value?.entidades ?? []

  // Verificar que el municipio esté entre los filtrados (seguridad)
  const municipio = municipiosFiltrados.value.find((m) => m.nombre === nombre)
  if (!municipio) return

  const index = actuales.indexOf(nombre)
  const nuevosMunicipios = index === -1
    ? [...actuales, nombre]
    : actuales.filter((m) => m !== nombre)

  // Emitir nuevo objeto sin cambiar entidades
  ubicacion.value = {
    entidades: entidadesSeleccionadas,
    municipios: nuevosMunicipios
  }
}

// ─── Sincronización ante cambios externos ─────────────────────────────

/**
 * Si cambia la lista de entidades disponibles (prop), eliminamos cualquier
 * entidad seleccionada que ya no exista, y también sus municipios asociados.
 */
watch(
  () => props.entidades,
  (nuevaLista) => {
    if (!ubicacion.value) return
    const entidadesValidas = ubicacion.value.entidades.filter((e) =>
      nuevaLista.includes(e)
    )
    const municipiosValidos = ubicacion.value.municipios.filter((mun) =>
      entidadesValidas.some((ent) =>
        props.municipios.some(
          (m) => m.nombre === mun && m.entidad === ent
        )
      )
    )

    // Solo emitir si realmente hubo un cambio
    if (
      entidadesValidas.length !== ubicacion.value.entidades.length ||
      municipiosValidos.length !== ubicacion.value.municipios.length
    ) {
      ubicacion.value = {
        entidades: entidadesValidas,
        municipios: municipiosValidos
      }
    }
  }
)

/**
 * Si por alguna razón los municipios seleccionados dejan de pertenecer a las
 * entidades seleccionadas (por ejemplo, una actualización externa del modelo),
 * corregimos automáticamente.
 */
watch(
  () => ubicacion.value?.entidades,
  (nuevasEntidades) => {
    if (!ubicacion.value) return
    const entidades = nuevasEntidades ?? []
    const municipiosValidos = ubicacion.value.municipios.filter((mun) =>
      entidades.some((ent) =>
        props.municipios.some(
          (m) => m.nombre === mun && m.entidad === ent
        )
      )
    )
    if (municipiosValidos.length !== ubicacion.value.municipios.length) {
      ubicacion.value = {
        entidades,
        municipios: municipiosValidos
      }
    }
  }
)
</script>

<template>
  <div class="map-controller">
    <!-- 1. Cartera -->
    <div class="control-group">
      <label for="cartera-input">Cartera</label>
      <input
        id="cartera-input"
        v-model="cartera"
        type="text"
        placeholder="Escribe la cartera..."
      />
    </div>

    <!-- 2. Ubicación -->
    <fieldset class="control-group">
      <legend>Ubicación</legend>

      <!-- Entidades -->
      <div class="checkboxes">
        <p class="subtitle">Entidades</p>
        <div
          v-for="entidad in props.entidades"
          :key="entidad"
          class="checkbox-item"
        >
          <input
            type="checkbox"
            :id="`ent-${entidad}`"
            :value="entidad"
            :checked="(ubicacion?.entidades ?? []).includes(entidad)"
            @change="toggleEntidad(entidad)"
          />
          <label :for="`ent-${entidad}`">{{ entidad }}</label>
        </div>
      </div>

      <!-- Municipios (condicional) -->
      <div v-if="mostrarSelectorMunicipios" class="checkboxes">
        <p class="subtitle">Municipios</p>
        <div
          v-for="municipio in municipiosFiltrados"
          :key="municipio.nombre"
          class="checkbox-item"
        >
          <input
            type="checkbox"
            :id="`mun-${municipio.nombre}`"
            :value="municipio.nombre"
            :checked="(ubicacion?.municipios ?? []).includes(municipio.nombre)"
            @change="toggleMunicipio(municipio.nombre)"
          />
          <label :for="`mun-${municipio.nombre}`">
            {{ municipio.nombre }}
          </label>
        </div>
      </div>
      <!-- Resumen visual -->
      <div class="resumen-ubicacion">
        <div v-if="(ubicacion?.entidades ?? []).length > 0">
          <strong>Entidades seleccionadas:</strong>
          {{ (ubicacion?.entidades ?? []).join(', ') || 'Ninguna' }}
        </div>
        <div
          v-if="(ubicacion?.municipios ?? []).length > 0"
          style="margin-top: 0.5rem"
        >
          <strong>Municipios seleccionados:</strong>
          {{ (ubicacion?.municipios ?? []).join(', ') }}
        </div>
        <div
          v-if="
            (ubicacion?.entidades ?? []).length === 0 &&
            (ubicacion?.municipios ?? []).length === 0
          "
        >
          <em>Sin selección geográfica</em>
        </div>
      </div>
    </fieldset>

    <!-- 3. Radar (slider condicional) -->
    <div v-if="showRadar" class="control-group">
      <label for="radar-slider">
        Radar: {{ radar }} km
      </label>
      <input
        id="radar-slider"
        v-model.number="radar"
        type="range"
        :min="radarMin"
        :max="radarMax"
        step="1"
      />
      <div class="radar-values">
        <span>{{ radarMin }} km</span>
        <span>{{ radarMax }} km</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-controller {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  max-width: 400px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  max-height: 200px;
  overflow-y: auto;
  padding-left: 0.5rem;
}

.subtitle {
  font-weight: 600;
  margin: 0.2rem 0;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.resumen-ubicacion {
  margin-top: 0.8rem;
  font-size: 0.9em;
  background: #f9f9f9;
  padding: 0.5rem;
  border-radius: 4px;
}

.radar-values {
  display: flex;
  justify-content: space-between;
  font-size: 0.8em;
  color: #555;
}

input[type='text'] {
  padding: 0.4rem;
  border: 1px solid #aaa;
  border-radius: 4px;
}
</style>
