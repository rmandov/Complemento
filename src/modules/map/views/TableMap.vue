<script setup>
import { shallowRef, ref, watch } from 'vue';
import { query } from '@/data/duckdb';

const resultados = shallowRef([]);
const sqlQuery = ref(`SELECT COUNT(*) AS total FROM dataset`);

async function ejecutarConsulta() {
  const result = await query(sqlQuery.value);
  resultados.value = result.toArray();
}

// Se ejecuta al montar y cada vez que cambie el string del query
watch(sqlQuery, ejecutarConsulta, { immediate: true });
</script>

<template>
  <section>
    <h2>Consulta SQL</h2>

    <textarea
      v-model="sqlQuery"
      rows="4"
      cols="60"
      placeholder="Escribe tu query SQL..."
    ></textarea>

    <p v-if="resultados.length === 0">Cargando...</p>

    <ul v-else>
      <li v-for="(fila, idx) in resultados" :key="idx">
        {{ fila }}
      </li>
    </ul>
  </section>
</template>
