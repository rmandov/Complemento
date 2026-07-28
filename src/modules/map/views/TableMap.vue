<script setup>
import { shallowRef, ref, watch, computed } from 'vue'
import { query } from '@/data/duckdb'
import { useMapStore } from '@/stores/map'
import { storeToRefs } from 'pinia'

const mapStore = useMapStore()

// Desestructurar la ref específica que necesitas
const { CVE_ENT: entidad_clave } = storeToRefs(mapStore)

// Valor por defecto si es null/undefined
const entidadDefault = computed(() => entidad_clave.value || '01')

const resultados = shallowRef([])
const cargando = ref(false)
const error = ref('')

const cantidad = 5000

// ✅ Query computada: se actualiza automáticamente cuando cambia entidadDefault
const sqlQuery = computed(
  () => `
  SELECT
  ID_PPI_ESPACIAL,
  NOMBRE_PPI,
  ESTATUS_OPERACION,
FROM dataset
WHERE ID_ENTIDAD_FEDERATIVA = '${entidadDefault.value}';
`,
)

function toPlainObjects(arrowResult) {
  return arrowResult.toArray().map((row) => {
    const plain = {}
    for (const key in row) {
      const val = row[key]
      plain[key] = typeof val === 'bigint' ? Number(val) : val
    }
    return plain
  })
}

async function ejecutar() {
  cargando.value = true
  error.value = ''
  resultados.value = []

  try {
    const result = await query(sqlQuery.value.trim())
    resultados.value = toPlainObjects(result)
  } catch (err) {
    error.value = err.message || 'Error en la consulta'
  } finally {
    cargando.value = false
  }
}

// Watcher: ejecuta automáticamente cuando cambia la entidad
watch(
  entidadDefault,
  () => {
    ejecutar()
  },
  { immediate: true },
)

// También puedes usar watchEffect si prefieres:
// watchEffect(() => {
//   sqlQuery.value; // dependencia
//   ejecutar();
// });
</script>

<template>
  <section class="table-map">
    <h2>Consulta SQL</h2>

    <textarea v-model="sqlQuery" rows="5" cols="70"
      placeholder="Escribe tu query y presiona Ctrl+Enter para ejecutar..."
      @keydown.ctrl.enter.prevent="ejecutar"></textarea>

    <div style="margin-top: 8px">
      <button @click="ejecutar" :disabled="cargando">
        {{ cargando ? 'Ejecutando...' : 'Ejecutar (Ctrl + Enter)' }}
      </button>
    </div>

    <p v-if="error" style="color: crimson">{{ error }}</p>

    <div v-if="resultados.length > 0" style="margin-top: 16px">
      <table border="1" cellpadding="8" cellspacing="0">
        <thead>
          <tr>
            <th v-for="(col, i) in resultados[0]?.Schema?.fields.map((f) => f.name) ??
              Object.keys(resultados[0])" :key="i">
              {{ col }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(fila, idx) in resultados" :key="idx">
            <td v-for="(val, key) in fila" :key="key">
              {{ val }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.table-map {
  max-height: 83vh;
  overflow-y: auto;
  width: 100%;
}
</style>

<!-- <textarea
  v-model="sqlQuery"
  @keydown.enter.prevent="ejecutar"
></textarea> -->
