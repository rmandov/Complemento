<script lang="ts" setup>
import { onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import SelectInputBusqueda, { SelectOption } from '../../forms/SelectInputBusqueda.vue';
import {   obtenerMertropolis } from '../../utils/querys/predeterminadoQuerys.js';
import { inject } from 'vue';
import { Filtros } from '../../ViewMapa.vue';
const metropolis = ref<SelectOption[]>([]);

const filtros = inject<Ref<Filtros>>("filtros")!;
onMounted(async () => {
  metropolis.value = (await obtenerMertropolis()).map((item) => {
    return {
      value: item.METROPOLI,
      label: item.METROPOLI
    }
  });
})
onUnmounted(()=>{
  filtros.value.metropoli=undefined;
})



</script>
<template>
  <div class="flex flex-col gap-2 relative">
    <SelectInputBusqueda id="metropoli" label="Metrópoli" :options="metropolis" :bloquear-deseleccionar="true"
      v-model="filtros.metropoli" />

  </div>
</template>
<style scoped></style>
