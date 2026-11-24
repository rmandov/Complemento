<script setup lang="ts">
import { inject, Ref } from 'vue';
import { PPI } from '../utils/duckdb';

const proyectosPPI = inject<Ref<PPI[]>>("datos")!;

</script>
<template>
  <section class="w-full h-full overflow-auto max-h-full">
    <table class="bg-white w-full">
      <colgroup>
        <col style="width: 5rem;">
        <col style="width: auto;">
        <col style="width: 5rem;">
      </colgroup>
      <thead class="sticky top-0 bg-white">
        <tr>
          <th colspan="9"> Proyectos: {{ proyectosPPI.length }}
          </th>
        </tr>
        <tr>
          <th>CC</th>
          <th>EF</th>
          <th>Mun</th>
          <th>Región</th>
          <th>Metrópoli</th>
          <th>Estatus</th>
          <th>TIPO3_PPI</th>
          <th>LAT</th>
          <th>LON</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, idx) in proyectosPPI" :key="idx">
          <td>{{ row.CC }}</td>
          <td>{{ row.EF }}</td>
          <td>{{ row.MUN }}</td>
          <td>{{ row.REGION }}</td>
          <td>{{ row.METROPOLI }}</td>
          <td>{{ row.ESTATUS_OPERACION }}</td>
          <td>{{ row.TIPO3_PPI }}</td>
          <td>{{ row.LATITUD }}</td>
          <td>{{ row.LONGITUD }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
<style scoped>
td,
th {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--color-gray-300);
}
</style>
