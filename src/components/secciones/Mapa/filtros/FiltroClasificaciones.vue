<script lang="ts" setup>
import { inject, onMounted, Ref, ref, watch } from 'vue';
import {  obtenerClasificaciones } from '../utils/querys/predeterminadoQuerys.js';
import { Filtros } from '../ViewMapa.vue';
import { clasificacionColores, ClassificationStyle } from '../utils/estilosCapas.js';

const filtros = inject<Ref<Filtros>>('filtros')!;
const expandido = ref(true);
const mostrarLabel = ref(true);
const clas_opciones = ref<string[]>([]);

onMounted(async () => {
  clas_opciones.value = (await obtenerClasificaciones()).map((op) => op.CLASIFICACION);
  filtros.value.clasificacion = clas_opciones.value;
})

function handleChangeExpandido() {
  expandido.value = !expandido.value;
}
function handleChangeLabel() {
  mostrarLabel.value = !mostrarLabel.value;
}
function handleClickClas(id: string) {
  const todasSeleccionadas = clas_opciones.value.every((id) => filtros.value.clasificacion?.includes(id));
  const seleccionada = filtros.value.clasificacion?.includes(id);
  if (!filtros.value.clasificacion) {
    return
  }
  if (todasSeleccionadas) {
    filtros.value.clasificacion = [id];
    return
  }
  if (seleccionada && filtros.value.clasificacion?.length === 1) {
    filtros.value.clasificacion = clas_opciones.value;
    return
  }
  filtros.value.clasificacion = seleccionada ? filtros.value.clasificacion?.filter((item) => item !== id) :
    [...filtros.value.clasificacion, id]

}
watch(()=>filtros.value.clasificacion,(nvo)=>{
  if(!nvo){
      filtros.value.clasificacion = clas_opciones.value;

  }
},{deep:true})




const getColores = (
  classification: string
): ClassificationStyle => {
  const key = classification.trim().replace(/\s+/g, " ");

  return clasificacionColores[key] ?? {
    normal: "#808080",
    hover: "#A0A0A0",
    icon: "category",
  };
};
</script>
<template>
  <div class="absolute   max-w-[10rem] ps-2
   z-999 left-0 top-20 h-full overflow-hidden max-h-[calc(100%-5rem)]
   flex flex-col items-start justify-start gap-2 contenedor
   ">

    <div class="flex items-center justify-start gap-1" v-if="clas_opciones.length">
      <button type="button" @click="handleChangeExpandido" class="rounded-full w-8 h-8 shadow-xl flex items-center justify-center bg-white cursor-pointer
          border border-gray-200 hover:bg-gray-100
        ">
        <span class="material-symbols-outlined  icono-btn" :class="{
          'expandido': expandido
        }">
          chevron_right
        </span>
      </button>
      <button v-if="expandido" type="button" @click="handleChangeLabel" class="btn-expandir rotate-90 rounded-full w-8 h-8 shadow-xl flex items-center bg-white justify-center cursor-pointer
          border border-gray-200 hover:bg-gray-100
        " :class="{
          'expandido': mostrarLabel
        }">
        <span class="material-symbols-outlined ">
          {{ mostrarLabel ? "unfold_less" : "unfold_more" }}
        </span>
      </button>
    </div>
    <div class=" contenedor-clas  flex-1 max-h-full  max-w-full flex flex-col gap-2 w-auto items-start " :class="{
      'expandido': expandido
    }">

      <button type="button" v-for="clas in clas_opciones" :key="clas" @click="handleClickClas(clas)" class="btn-clas rounded-full w-full h-8 p-1 bg-(--color-fondo) hover:bg-(--color-hover) shadow-lg text-white
      cursor-pointer flex items-center justify-start gap-0 px-2
      " :class="{
        'activo': filtros.clasificacion?.includes(clas)
      }" :style="{
        '--color-fondo': getColores(clas).normal,
        '--color-hover': getColores(clas).hover
      }" :title="clas">
        <div class=" flex items-center justify-start max-w-full">
          <span class="material-symbols-outlined ">
            {{ getColores(clas).icon }}
          </span>
          <span class="text-xs truncate label-btn" :class="{
            'expandido': mostrarLabel

          }">{{ clas }}</span>
        </div>
      </button>
    </div>
  </div>
</template>
<style scoped>
.contenedor-clas {
  max-width: 0px;
  transition: all 0.3s ease;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
}

.contenedor-clas.expandido {
  max-width: 100%;
  padding-right: 0.5rem;
  padding-bottom: 0.5rem;
}

.icono-btn {
  transition: all 0.3s ease;
}

.icono-btn.expandido {
  transform: rotate(180deg) !important;
}

.contenedor {
  pointer-events: none;
}

.contenedor>* {
  pointer-events: auto;
}



.contenedor-clas::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.contenedor-clas::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.contenedor-clas::-webkit-scrollbar-thumb {
  background: rgba(85, 85, 85, 0.4);
  border-radius: 4px;
}

.contenedor-clas::-webkit-scrollbar-thumb:hover {
  background: #555555;
}

.btn-clas {
  opacity: 0.3;
}

.btn-clas.activo {
  opacity: 1;
}

.btn-expandir {
  opacity: 0.3;
}

.btn-expandir.expandido,
.btn-expandir:hover {
  opacity: 1;
}

.label-btn {
  max-width: 0px;
  transition: all 0.3s ease;
  padding-left: 0;
}

.label-btn.expandido {
  max-width: 100%;
  padding-left: 0.25rem;
}
</style>
