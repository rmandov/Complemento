<script setup lang="ts">
import { inject, onMounted, Ref, ref, watch } from 'vue';
import { calcularTop3, CalcularTop3, ContarTotal, contarTotal, ListaEstatus, obtenerEstatus, obtenerPPIFIltro } from '../utils/querys/predeterminadoQuerys';
import { Filtros } from '../ViewMapa.vue';
import { PPI } from '../utils/duckdb';

const filtros = inject<Ref<Filtros>>("filtros")!;
const proyectosPPI = inject<Ref<PPI[]>>("datos")!;

const top3 = ref<CalcularTop3[]>([]);
const estatus = ref<ListaEstatus[]>([])
onMounted(async () => {
  proyectosPPI.value = await obtenerPPIFIltro({})
  await actualizarTop(filtros.value);
  await obtenerListasEstatus();

})
watch(proyectosPPI, () => {

  actualizarTop(filtros.value);
}, {
  deep: true
})
async function actualizarTop(filtros: Filtros) {
  top3.value = await calcularTop3(filtros);
}
async function obtenerListasEstatus() {
  estatus.value = await obtenerEstatus() ?? [];
}
function handleCLickEstatus(id: string) {
  const estatusSeleccionados = filtros.value.estatus ?? [];

  if (estatusSeleccionados.includes(id)) {
    filtros.value.estatus = estatusSeleccionados.filter(f => f !== id);
  } else {
    filtros.value.estatus = [...estatusSeleccionados, id];
  }
}

</script>
<template>
  <div class="rounded-lg border border-gray-100 shadow p-2 bg-white  max-h-[100%] overflow-auto w-full">
    <div class="rounded border border-gray-100 shadow p-2 bg-sky-50 flex flex-col gap-2">
      <div>
        <div class="flex items-center justify-between border-b border-gray-300">
          <h5 class="font-bold">Proyectos</h5>
          <h5 class="font-bold">{{ proyectosPPI.length }}</h5>
        </div>
        <div class="flex gap-0">
          <div v-for="top in top3" :key="top.CLASIFICACION"
            class="flex-1 border-e border-gray-200 px-1 max-w-1/3 last:border-e-0">
            <h5 class="text-xs truncate font-semibold text-center" :title="top.CLASIFICACION">{{ top.CLASIFICACION }}
            </h5>
            <h5 class="text-xs truncate font-semibold text-center">{{ top.total }}</h5>
          </div>
        </div>
      </div>
      <div>
        <h5 class="font-bold">Estatus</h5>
        <div v-for="(est, ind) in estatus" :key="ind" class=" flex items-center justify-between gap-2">
          <label :for="est.ESTATUS_OPERACION" class="truncate text-xs" :title="est.ESTATUS_OPERACION">{{
            est.ESTATUS_OPERACION
          }}</label>
          <input type="checkbox" :id="est.ESTATUS_OPERACION" :name="est.ESTATUS_OPERACION"
           :value="est.ESTATUS_OPERACION"
            :checked="filtros.estatus?.includes(est.ESTATUS_OPERACION)"
            @change="handleCLickEstatus(est.ESTATUS_OPERACION)" />
        </div>

      </div>
    </div>
  </div>

</template>
<style scoped></style>
