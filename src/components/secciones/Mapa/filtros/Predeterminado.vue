<script setup lang="ts">
import { inject, Ref } from 'vue';
import FiltroAreaInteres from './FiltroAreaInteres.vue';
import FiltroRamo from './filtrosAreasInteres/FiltroRamo.vue';
import FiltroTopProyectos from './FiltroTopProyectos.vue';
import { Filtros } from '../ViewMapa.vue';
const filtros = inject<Ref<Filtros>>("filtros")!;

</script>
<template>
  <div class="rounded-lg flex flex-col gap-4 border border-gray-100 shadow p-2 bg-white relative  max-h-[100%] overflow-visible w-full h-full">
    <FiltroRamo v-if="filtros.tipo_filtro === 3"/>
    <FiltroTopProyectos />
    <FiltroAreaInteres />

  </div>

</template>
<style scoped></style>
