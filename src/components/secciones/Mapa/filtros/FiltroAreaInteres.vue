<script setup lang="ts">
import { icon } from 'leaflet';
import { ref } from 'vue';
import FiltroRegion from './filtrosAreasInteres/FiltroRegion.vue';
import FiltroEstado from './filtrosAreasInteres/FiltroEstado.vue';
import FiltroMetropoli from './filtrosAreasInteres/FiltroMetropoli.vue';
import { handleMouseLeave, handleMouseMove } from '@/modules/map/composables/gsap/magenticButton.js';

const areas = [{
  id: 0,
  label: "Región",
  icon: "crop_free",
  component: FiltroRegion
}, {
  id: 1,
  label: "Estado",
  icon: "pin_drop",
  component: FiltroEstado
}, {
  id: 2,
  label: "Metrópolis",
  icon: "location_city",
  component: FiltroMetropoli
}]
const areaActiva = ref<number | null>(null)
function handleClickArea(id: number) {
  if (id === areaActiva.value) {
    areaActiva.value = null;
    return
  }
  areaActiva.value = id;
}

</script>
<template>
  <div class="rounded-lg border border-gray-100 shadow p-2 bg-white  max-h-[100%] overflow-visible w-full">
    <div class="rounded border border-gray-100 shadow p-2 bg-sky-50 max-h-[100%] overflow-visble h-full flex flex-col gap-2">
      <div class="flex items-center justify-between border-b border-gray-300">
        <h5 class="font-bold">Área de interés</h5>
      </div>
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-start gap-4 flex-wrap">
          <button type="button" class="btn-area flex flex-col items-center gap-2 cursor-pointer" :class="{
            'activo': areaActiva === area.id
          }" v-for="area in areas" :key="area.id" @click="handleClickArea(area.id)" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave">
            <div
              class="circulo rounded-full w-12 h-12 shadow-xl bg-white flex items-center justify-center border border-gray-200">
              <span class="magnetic material-symbols-outlined">
                {{ area.icon }}
              </span>
            </div>
            <h6 class="truncate text-xs titulo">
              {{ area.label }}
            </h6>
          </button>
        </div>
        <div v-if="areaActiva !== null">
            <component :is="areas.find(tab => tab.id === areaActiva)?.component" />
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.btn-area .circulo,
.btn-area .titulo {
  transition: all ease 0.3s;
}

.btn-area.activo .circulo {
  border: 1px solid var(--color-sky-400);
}

.btn-area.activo .titulo {
  font-weight: bold;
}
</style>
