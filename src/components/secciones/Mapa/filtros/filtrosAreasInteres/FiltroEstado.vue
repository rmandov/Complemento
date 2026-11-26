<script lang="ts" setup>
import { onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import SelectInputBusqueda, { SelectOption } from '../../forms/SelectInputBusqueda.vue';
import { obtenerEF, obtenerMunicipios } from '../../utils/querys/predeterminadoQuerys.js';
import { inject } from 'vue';
import { Filtros } from '../../ViewMapa.vue';
import { regresarMapa } from '../../utils/mapController.js';
const ef_options = ref<SelectOption[]>([]);
const mun_options = ref<SelectOption[]>([]);

const filtros = inject<Ref<Filtros>>("filtros")!;
onMounted(async () => {
  ef_options.value = (await obtenerEF({
    id_ef:undefined
  })).map((item) => {
    return {
      value: item.ID_EF,
      label: item.EF
    }
  });
  if(filtros.value.id_ef){
    await listarMun(filtros.value.id_ef)
  }
})
onUnmounted(()=>{
  filtros.value.id_ef=undefined;
  filtros.value.id_municipio=undefined;
  regresarMapa();
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
watch(() => filtros.value.id_ef, async (nvo) => {
      filtros.value.id_municipio=undefined;

  if (nvo !== undefined && nvo !== null) {
    await listarMun(nvo);
  }
  else{
    mun_options.value=[]
  }
}, {
  deep:true
})

</script>
<template>
  <div class="flex flex-col gap-2 relative">
    <SelectInputBusqueda id="ef" label="Estado" :options="ef_options" :bloquear-deseleccionar="false"
      v-model="filtros.id_ef" />
    <SelectInputBusqueda v-if="mun_options.length > 0" id="mun" label="Municipio" :options="mun_options" :bloquear-deseleccionar="false"
      v-model="filtros.id_municipio" />
  </div>
</template>
<style scoped></style>
