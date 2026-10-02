<script setup>
import { ref, onMounted } from 'vue'
import { query } from '@/data/duckdb'

const tablas = ref([])
const cargando = ref(false)
const error = ref('')

function toPlainObjects(arrowResult) {
  return arrowResult.toArray().map((row) => {
    const plain = {}

    for (const key in row) {
      const val = row[key]

      plain[key] =
        typeof val === 'bigint'
          ? Number(val)
          : val
    }

    return plain
  })
}

async function cargarTablas() {
  cargando.value = true
  error.value = ''

  try {
    // 1. Preguntar a DuckDB qué tablas existen
    const resultadoTablas = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'main'
      ORDER BY table_name
    `)

    const nombresTablas =
      toPlainObjects(resultadoTablas)

    console.log('Tablas encontradas:', nombresTablas)

    // 2. Recorrer cada tabla
    for (const tabla of nombresTablas) {
      const nombre = tabla.table_name

      console.log(`Consultando tabla: ${nombre}`)

      // 3. Consultar su contenido
      const resultado = await query(`
        SELECT *
        FROM "${nombre}"
        LIMIT 1000
      `)

      const filas = toPlainObjects(resultado)

      // 4. Guardar nombre + datos
      tablas.value.push({
        nombre,
        filas,
      })

      // También la imprimimos en consola
      console.log(`TABLA: ${nombre}`)
      console.table(filas)
    }
  } catch (err) {
    console.error(err)

    error.value =
      err.message || 'Error cargando las tablas'
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  cargarTablas()
})
</script>

<template>
  <section>
    <h1>Tablas DuckDB</h1>

    <p v-if="cargando">
      Cargando tablas...
    </p>

    <p v-if="error" style="color: crimson">
      {{ error }}
    </p>

    <div v-for="tabla in tablas" :key="tabla.nombre" style="margin-bottom: 40px">
      <h2>
        {{ tabla.nombre }}
      </h2>

      <p>
        Registros mostrados:
        {{ tabla.filas.length }}
      </p>

      <table v-if="tabla.filas.length > 0" border="1" cellpadding="6" cellspacing="0">
        <thead>
          <tr>
            <th v-for="columna in Object.keys(tabla.filas[0])" :key="columna">
              {{ columna }}
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(fila, index) in tabla.filas" :key="index">
            <td v-for="(valor, columna) in fila" :key="columna">
              {{ valor }}
            </td>
          </tr>
        </tbody>
      </table>

      <p v-else>
        Esta tabla no tiene registros.
      </p>
    </div>
  </section>
</template>
