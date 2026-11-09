<script setup>
import { ref, onMounted } from 'vue'

import {
  executeQuery,
} from '@/data/queryManager'

// =====================================================
// ESTADO
// =====================================================

const tablas = ref([])

const cargando = ref(false)

const error = ref('')

// Cantidad máxima de registros que queremos
// mostrar por tabla.
const limite = 1000

// =====================================================
// CONVERTIR RESULTADO DE DUCKDB
// =====================================================

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

// =====================================================
// CARGAR TODAS LAS TABLAS
// =====================================================

async function cargarTablas() {
  cargando.value = true

  error.value = ''

  // Importante si esta función se vuelve
  // a ejecutar manualmente.
  tablas.value = []

  try {
    // ===============================================
    // 1. Obtener las tablas existentes en DuckDB
    // ===============================================

    const resultadoTablas =
      await executeQuery(
        'sistema',
        'listarTablas',
      )

    const nombresTablas =
      toPlainObjects(resultadoTablas)

    console.log(
      'Tablas encontradas:',
      nombresTablas,
    )

    // ===============================================
    // 2. Recorrer cada tabla
    // ===============================================

    for (const tabla of nombresTablas) {
      const nombre = tabla.table_name

      console.log(
        `Consultando tabla: ${nombre}`,
      )

      // =============================================
      // 3. Ejecutar query definida en queries.json
      // =============================================

      const resultado =
        await executeQuery(
          'sistema',
          'contenidoTabla',
          {
            tabla: nombre,
            limite,
          },
        )

      // =============================================
      // 4. Convertir resultado
      // =============================================

      const filas =
        toPlainObjects(resultado)

      // =============================================
      // 5. Guardar tabla + registros
      // =============================================

      tablas.value.push({
        nombre,
        filas,
      })

      // =============================================
      // 6. Mostrar también en consola
      // =============================================

      console.log(
        `TABLA: ${nombre}`,
      )

      console.table(filas)
    }
  } catch (err) {
    console.error(
      'Error cargando tablas:',
      err,
    )

    error.value =
      err.message ||
      'Error cargando las tablas'
  } finally {
    cargando.value = false
  }
}

// =====================================================
// AL CARGAR COMPONENTE
// =====================================================

onMounted(() => {
  cargarTablas()
})
</script>

<template>
  <section>
    <h1>
      Tablas DuckDB
    </h1>

    <!-- ========================================= -->
    <!-- CARGANDO -->
    <!-- ========================================= -->

    <p v-if="cargando">
      Cargando tablas...
    </p>

    <!-- ========================================= -->
    <!-- ERROR -->
    <!-- ========================================= -->

    <p v-if="error" style="color: crimson">
      {{ error }}
    </p>

    <!-- ========================================= -->
    <!-- TABLAS -->
    <!-- ========================================= -->

    <div v-for="tabla in tablas" :key="tabla.nombre" class="tabla-contenedor">
      <h2>
        {{ tabla.nombre }}
      </h2>

      <p>
        Registros mostrados:
        {{ tabla.filas.length }}
      </p>

      <!-- ======================================= -->
      <!-- TABLA -->
      <!-- ======================================= -->

      <div v-if="tabla.filas.length > 0" class="tabla-scroll">
        <table border="1" cellpadding="6" cellspacing="0">
          <thead>
            <tr>
              <th v-for="columna in Object.keys(
                tabla.filas[0]
              )" :key="columna">
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
      </div>

      <!-- ======================================= -->
      <!-- TABLA VACÍA -->
      <!-- ======================================= -->

      <p v-else>
        Esta tabla no tiene registros.
      </p>
    </div>
  </section>
</template>

<style scoped>
.tabla-contenedor {
  margin-bottom: 40px;
}

.tabla-scroll {
  width: 100%;
  overflow-x: auto;
}

table {
  border-collapse: collapse;
  white-space: nowrap;
}

th,
td {
  padding: 6px;
  text-align: left;
}
</style>
