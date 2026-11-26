<script setup lang="ts">
import { h, inject, Ref } from 'vue';
import { PPI } from '../utils/duckdb';
import Tabla, { Columna } from './Tabla/Tabla.vue';
import { label } from 'three/tsl';
import { formatearMoneda } from '../utils/querys/generales';

const proyectosPPI = inject<Ref<PPI[]>>("datos")!;
const columnas: Columna[] = [
  {
    key: 'CC',
    label: 'CC',
    sortable: true,
    width:"2rem"
  },
  /*
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
    key: "RAMO",
    label: "Ramo",
    sortable: true,
    width:"10rem"
  },
  {
    key: "UNIDAD",
    label: "Unidad",
    sortable: true,
    width:"10rem"
  },
  {
    key: "CLASIFICACION",
    label: "Clasificacion",
    sortable: true,
    width:"10rem"
  },*/
  {
    key: "FECHA_INICIO_CAL_FF",
    label: "Fecha inicio",
    sortable: true,
    width:"10rem",
    render: (fila) =>
      h(
        'span',
        {
          class: 'max-w-full overflow-auto max-h-[5rem]'
        },
        new Date(fila.FECHA_INICIO_CAL_FF).toLocaleDateString()
      )
  },
  {
    key: "FECHA_FIN_CAL_FF",
    label: "Fecha final",
    sortable: true,
    width:"10rem",
    render: (fila) =>
      h(
        'span',
        {
          class: 'max-w-full overflow-auto max-h-[5rem]'
        },
        new Date(fila.FECHA_FIN_CAL_FF).toLocaleDateString()
      )
  },
  {
    key: "MONTO_TOTAL_INVERSION",
    label: "Monto total de inversión",
    sortable: true,
    width:"10rem",
    render: (fila) =>
      h(
        'span',
        {
          class: 'max-w-full overflow-auto max-h-[5rem]'
        },
        formatearMoneda(fila.MONTO_TOTAL_INVERSION)
      )
  },
  {
    key: "BENEFICIOS_ESPERADOS",
    label: "Beneficios esperados",
    sortable: true,
    width:"20rem"
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
