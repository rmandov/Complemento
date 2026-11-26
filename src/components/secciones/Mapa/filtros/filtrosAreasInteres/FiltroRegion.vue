<script lang="ts" setup>
import { onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import SelectInputBusqueda, { SelectOption } from '../../forms/SelectInputBusqueda.vue';
import {   obtenerEF, obtenerMunicipios, obtenerRegiones } from '../../utils/querys/predeterminadoQuerys.js';
import { inject } from 'vue';
import { Filtros } from '../../ViewMapa.vue';
const regiones = ref<SelectOption[]>([]);
const ef_options = ref<SelectOption[]>([]);
const mun_options = ref<SelectOption[]>([]);


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
async function listarMun(id: string) {
  mun_options.value = (await obtenerMunicipios({
    id_ef:id
  })).map((item) => {
    return {
      value: item.ID_MUN,
      label: item.MUN
    }
  })
}
async function listarEF(reg:string){

    ef_options.value = (await obtenerEF({
    region:reg
  })).map((item) => {
    return {
      value: item.ID_EF,
      label: item.EF
    }
  });
}
watch(()=>filtros.value.region,async (reg)=>{
  if(reg){
    await listarEF(reg)
  }
  else{
    ef_options.value=[]
  }
    filtros.value.id_ef=undefined;
    filtros.value.id_municipio=undefined;

},{
  deep:true
})
watch(() => filtros.value.id_ef, async (nvo) => {
  if (nvo !== undefined && nvo !== null) {
    await listarMun(nvo);
  }
  else{
    filtros.value.id_municipio=undefined
    mun_options.value=[]
  }
}, {
  deep:true
})



</script>
<template>
  <div class="flex flex-col gap-2 relative">
    <SelectInputBusqueda id="region" label="Región" :options="regiones" :bloquear-deseleccionar="false"
      v-model="filtros.region" />
    <SelectInputBusqueda v-if="ef_options.length > 0" id="ef" label="Estado" :options="ef_options" :bloquear-deseleccionar="false"
      v-model="filtros.id_ef" />
    <SelectInputBusqueda v-if="mun_options.length > 0" id="mun" label="Municipio" :options="mun_options" :bloquear-deseleccionar="false"
      v-model="filtros.id_municipio" />
  </div>
</template>
<style scoped></style>
