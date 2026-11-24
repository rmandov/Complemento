<script setup lang="ts">
//@ts-ignore
import "./index.css"
import { provide, ref } from 'vue';
import FiltrosMapa from './filtros/FiltrosMapa.vue';
import PestanasMapa from './pestanasMapa/pestanasMapa.vue';
import { PPI } from "./utils/duckdb";
import { regresarMapa } from "./utils/mapController";
const tabActiva = ref<number>(0);
const filtros = ref<Filtros>({
  tipo_filtro: null
})
const datos = ref<PPI[]>([]);

export interface Filtros {
  id_ef?: string,
  id_municipio?: string;
  tipo_filtro?: number | null;
  fase?: string[] | null;
  estatus?: string[];
  tipo3_PPI?: string;
  region?:string;
  metropoli?:string;
}
const limpiarFiltros = () => {
  filtros.value = {
    id_ef: undefined,
    id_municipio: undefined,
    fase: undefined,
    tipo3_PPI: undefined,
    estatus:undefined,
    region:undefined,
    metropoli:undefined,
  }
  regresarMapa();
  console.count("se ejecuta limpiar")
}
provide("filtros", filtros);
provide("datos", datos);
provide("limpiarFiltros", limpiarFiltros);
</script>
<template>
  <div class="seccion h-full">
    <article class="flex flex-col lg:flex-row gap-4 min-h-[150dvh] h-[150dvh] lg:min-h-[75dvh] lg:h-[75dvh] w-full  ">
      <FiltrosMapa />
      <PestanasMapa v-model="tabActiva" />
    </article>
  </div>
</template>
<style scoped></style>
