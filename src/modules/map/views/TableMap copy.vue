<!-- modules/map/views/TableMap.vue -->
<script setup>
import { shallowRef, onMounted } from 'vue'
import { query } from '@/data/duckdb'

const primeros10 = shallowRef([])

onMounted(async () => {
  /* const consulta = `
SELECT
  COUNT(*) AS total,
  SUM(CASE WHEN LATITUD_INICIAL IS NULL THEN 1 ELSE 0 END) AS sin_latitud,
  SUM(CASE WHEN LONGITUD_INICIAL IS NULL THEN 1 ELSE 0 END) AS sin_longitud,
  SUM(CASE WHEN MUNICIPIO IS NULL THEN 1 ELSE 0 END) AS sin_municipio,
  SUM(CASE WHEN NOMBRE_LARGO IS NULL THEN 1 ELSE 0 END) AS sin_nombre
FROM dataset
WHERE ENTIDAD_FEDERATIVA_ID = '11';
` */
  const consulta = `
SELECT
  COUNT(*) AS total,
  SUM(CASE WHEN ENTIDAD_FEDERATIVA_ID = '20' THEN 1 ELSE 0 END) AS entidad_federativa
FROM dataset;
`

  const result = await query(consulta)
  primeros10.value = result.toArray()
})
</script>

<template>
  <section>
    <h2>Tabla</h2>
    <p v-if="primeros10.length === 0">Cargando datos...</p>
    <ul v-else>
      <li class="base" v-for="(item, idx) in primeros10" :key="idx">{{ item }}</li>
    </ul>
  </section>
</template>

<style scoped>
.base {
  margin-bottom: 1rem;
}
</style>
