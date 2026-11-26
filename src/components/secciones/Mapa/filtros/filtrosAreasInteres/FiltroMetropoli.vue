<script lang="ts" setup>
import { onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import SelectInputBusqueda, { SelectOption } from '../../forms/SelectInputBusqueda.vue';
import {   obtenerEF, obtenerMertropolis, obtenerMunicipios,  } from '../../utils/querys/predeterminadoQuerys.js';
import { inject } from 'vue';
import { Filtros } from '../../ViewMapa.vue';
const metropolis = ref<SelectOption[]>([]);
const ef_options = ref<SelectOption[]>([]);
const mun_options = ref<SelectOption[]>([]);


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
async function listarEF(met:string){

    ef_options.value = (await obtenerEF({
    metropoli:met
  })).map((item) => {
    return {
      value: item.ID_EF,
      label: item.EF
    }
  });
}
watch(()=>filtros.value.metropoli,async (met)=>{
  if(met){
    await listarEF(met)
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
  console.log("ef",nvo);

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
    <SelectInputBusqueda id="metropoli" label="Metrópoli" :options="metropolis" :bloquear-deseleccionar="false"
      v-model="filtros.metropoli" />
    <SelectInputBusqueda v-if="ef_options.length > 0" id="ef" label="Estado" :options="ef_options" :bloquear-deseleccionar="false"
      v-model="filtros.id_ef" />
    <SelectInputBusqueda v-if="mun_options.length > 0" id="mun" label="Municipio" :options="mun_options" :bloquear-deseleccionar="false"
      v-model="filtros.id_municipio" />
  </div>
</template>
<style scoped></style>
