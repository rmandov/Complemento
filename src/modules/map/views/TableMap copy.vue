<!-- modules/map/views/TableMap.vue -->
<script setup>
import { shallowRef, onMounted } from 'vue';
import { query } from '@/data/duckdb';

const primeros10 = shallowRef([]);

onMounted(async () => {
  const result = await query('SELECT * FROM dataset LIMIT 10');
  primeros10.value = result.toArray();
});
</script>

<template>
  <section>
    <h2>Tabla</h2>
    <p v-if="primeros10.length === 0">Cargando datos...</p>
    <ul v-else>
      <li v-for="(item, idx) in primeros10" :key="idx">{{ item }}</li>
    </ul>
  </section>
</template>
