<script setup lang="ts">
import { inject, ref, watch } from 'vue';
import { Filtros } from '../ViewMapa.vue';
import { Ref } from 'vue';

import Predeterminado from './Predeterminado.vue';
import { handleMouseLeave, handleMouseMove } from '@/modules/map/composables/gsap/magenticButton';

const filtros = inject<Ref<Filtros>>("filtros")!;
const limpiarFiltros = inject<() => void>("limpiarFiltros")!;
const activeTab = ref<number | null>(null);
function handleClickTab(id: number) {
  //limpiarFiltros()

  if (id === activeTab.value) {
    activeTab.value = null
      filtros.value.tipo_filtro = undefined;

    return
  }
  activeTab.value = id;
  filtros.value.tipo_filtro = id;

}
watch(() => filtros.value.tipo_filtro, (nvo) => {
  const tipo3=["Proyecto","Programa"]
  if( nvo !== undefined){
    const ind=tipo3[nvo];

    filtros.value.tipo3_PPI =  ind ?? undefined

  }
  else{
    filtros.value.tipo3_PPI = undefined
    activeTab.value=null;
  }

})
const tabs = [
  {
    id: 0,
    label: "Proyectos",
    icono: "location_on"
  },
  {
    id: 1,
    label: "Programas",
    icono: "map"
  },
  {
    id: 2,
    label: "Ramo",
    icono: "dashboard_customize"
  }
]

</script>
<template>
  <aside
    class="w-full lg:w-[30%] lg:min-w-[30%]  h-full overflow-auto lg:overflow-hidden max-h-full  flex flex-col gap-4 p-4 rounded-xl shadow-xl border border-gray-100 bg-white">
    <div class="rounded-lg border border-gray-100 shadow p-2 bg-white">
      <h5 class="font-bold">Complementariedades y sinergias de los Programas y Proyectos de Inversión (PPI)</h5>
      <table class="hidden">
        <thead>
          <tr>
            <td>filtro</td>
            <td>valor</td>
          </tr>
        </thead>
        <tbody>
          <tr v-for="[clave, valor] in Object.entries(filtros)" :key="clave">
            <td>{{ clave }}</td>
            <td>{{ valor }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="flex-1 max-h-full h-full overflow-hidden py-1 flex flex-col xl:flex-row gap-4">
      <div class="grid grid-cols-4 xl:flex flex-col
       gap-2 rounded-lg border border-gray-100 shadow p-2 bg-sky-50/50">
        <button type="button" v-for="tab in tabs" :key="tab.id" :title="tab.label"
          class="rounded-md shadow border border-gray-100 boton-tipo-filtro p-2 bg-white col-span-2 md:col-span-1 lg:col-span-4"
          :class="{
            'activo': activeTab === tab.id
          }" @click="handleClickTab(tab.id)" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave">
          <span class="magnetic material-symbols-outlined" v-if="tab.icono">
            {{ tab.icono }}
          </span>
          <span class="text-sm">{{ tab.label }}</span>
        </button>
      </div>
      <div class=" flex-1 flex flex-col gap-2 items-end h-full overflow-hidden relative max-h-full">
        <div class="flex-1 max-h-full h-full w-full overflow-auto">
          <Predeterminado/>
        </div>
        <button type="button" class=" rounded py-0 px-2 bg-sky-600 hover:bg-sky-800 text-white
           cursor-pointer transition-all ease duration-300" @click="limpiarFiltros">
          Limpiar
        </button>
      </div>
    </div>

  </aside>
</template>
<style lang="css" scoped>
.boton-tipo-filtro {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 5rem;
  width: auto;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
}

.boton-tipo-filtro:hover,
.boton-tipo-filtro.activo {
  background-color: var(--color-gray-50);
  border-color: var(--color-indigo-600);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid #ddd;
  text-align: left;
}

th {
  background-color: #f4f4f4;
}
</style>
