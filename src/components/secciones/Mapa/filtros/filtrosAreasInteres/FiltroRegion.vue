<script lang="ts" setup>
import { onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import SelectInputBusqueda, { SelectOption } from '../../forms/SelectInputBusqueda.vue';
import {   obtenerRegiones } from '../../utils/querys/predeterminadoQuerys.js';
import { inject } from 'vue';
import { Filtros } from '../../ViewMapa.vue';
const regiones = ref<SelectOption[]>([]);

const filtros = inject<Ref<Filtros>>("filtros")!;
onMounted(async () => {
  regiones.value = (await obtenerRegiones()).map((item) => {
    return {
      value: item.REGION,
      label: item.REGION
    }
  });
})
onUnmounted(()=>{
  filtros.value.region=undefined;
})



</script>
<template>
  <div class="flex flex-col gap-2 relative">
    <SelectInputBusqueda id="region" label="Región" :options="regiones" :bloquear-deseleccionar="true"
      v-model="filtros.region" />

  </div>
</template>
<style scoped></style>
