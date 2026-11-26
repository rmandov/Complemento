<script lang="ts" setup>
import { onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import SelectInputBusqueda, { SelectOption } from '../../forms/SelectInputBusqueda.vue';
import { obtenerEF, obtenerMunicipios, obtenerRamos, obtenerUnidades } from '../../utils/querys/predeterminadoQuerys.js';
import { inject } from 'vue';
import { Filtros } from '../../ViewMapa.vue';
import { regresarMapa } from '../../utils/mapController.js';
const ramo_options = ref<SelectOption[]>([]);
const unidad_options = ref<SelectOption[]>([]);

const filtros = inject<Ref<Filtros>>("filtros")!;
onMounted(async () => {
  ramo_options.value = (await obtenerRamos({})).map((item) => {
    return {
      value: item.RAMO,
      label: item.RAMO
    }
  });

})
onUnmounted(() => {
  filtros.value.ramo = undefined;
  filtros.value.unidad = undefined;
  regresarMapa();
})
async function listarUnidades(id: string) {
  unidad_options.value = (await obtenerUnidades({
    ramo: id
  })).map((item) => {
    return {
      value: item.UNIDAD,
      label: item.UNIDAD
    }
  })
}
watch(() => filtros.value.ramo, async (nvo) => {
  filtros.value.unidad = undefined;

  if (nvo !== undefined && nvo !== null) {
    await listarUnidades(nvo);
  }
  else {
    unidad_options.value = [];
  }
}, {
  deep: true
})

</script>
<template>
  <div class="flex flex-col gap-2 relative">
    <SelectInputBusqueda id="ramo" label="Ramo" :options="ramo_options" :bloquear-deseleccionar="false"
      v-model="filtros.ramo" />
    <SelectInputBusqueda v-if="unidad_options.length > 0" id="unidad" label="Unidad" :options="unidad_options"
      :bloquear-deseleccionar="false" v-model="filtros.unidad" />
  </div>
</template>
<style scoped></style>
