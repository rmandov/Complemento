<script setup lang="ts">
//@ts-ignore
import "./index.css"
import { provide, ref } from 'vue';
import FiltrosMapa from './filtros/FiltrosMapa.vue';
import PestanasMapa from './pestanasMapa/pestanasMapa.vue';
const tabActiva = ref<number>(0);
const filtros = ref<Filtros>({
  tipo_filtro:null
})

export interface Filtros {
  id_ef?: string,
  id_municipio?: string;
  tipo_filtro?:number | null;
}
provide("filtros", filtros)

</script>
<template>
  <div class="seccion">
    <article class="flex flex-col lg:flex-row gap-4 min-h-full w-full ">
      <FiltrosMapa />
      <PestanasMapa v-model="tabActiva" />
    </article>
  </div>
</template>
<style scoped>
</style>
