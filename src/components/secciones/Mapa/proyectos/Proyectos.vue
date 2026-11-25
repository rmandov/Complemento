<script setup lang="ts">
import { inject, Ref } from 'vue';
import { PPI } from '../utils/duckdb';
import Tabla, { Columna } from './Tabla/Tabla.vue';
import { label } from 'three/tsl';

const proyectosPPI = inject<Ref<PPI[]>>("datos")!;
const columnas: Columna[] = [
  {
    key: 'CC',
    label: 'CC',
    sortable: true,
    width:"10rem"
  },
  {
    key: "EF",
    label: "Estado",
    sortable: true,
    width:"10rem"
  },
  {
    key: "MUN",
    label: "Municipio",
    sortable: true,
    width:"10rem"
  },
  {
    key: "REGION",
    label: "Región",
    sortable: true,
    width:"10rem"
  },
  {
    key: "METROPOLI",
    label: "Metrópoli",
    sortable: true,
    width:"10rem"
  },
  {
    key: "ESTATUS_OPERACION",
    label: "Estatus",
    sortable: true,
    width:"10rem"
  },
  {
    key: "TIPO3_PPI",
    label: "TIPO3_PPI",
    sortable: true,
    width:"10rem"
  },
  {
    key: "LATITUD",
    label: "Latitud",
    sortable: false,
    width:"10rem"
  },
  {
    key: "LONGITUD",
    label: "Longitud",
    sortable: false,
    width:"10rem"
  },
];


</script>
<template>
  <section class="w-full h-full overflow-auto max-h-full">
    <Tabla :datos="proyectosPPI" :columnas="columnas" />
  </section>
</template>
<style scoped>
td,
th {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--color-gray-300);
}
</style>
