<script setup>
import { useMapStore } from '@/stores/map'
import { storeToRefs } from 'pinia'
import { onMounted, reactive,ref } from 'vue'

import FiltersData from './FiltersData.vue'

const filtros = reactive({
  cartera: '',
  ubicacion: { entidades: ['Jalisco'], municipios: [] },
  radar: 20
})

const todasLasEntidades = ['Jalisco', 'Nuevo León', 'Puebla', /* ... */]
const todosLosMunicipios = [
  { entidad: 'Jalisco', nombre: 'Guadalajara' },
  { entidad: 'Jalisco', nombre: 'Zapopan' },
  { entidad: 'Puebla', nombre: 'Tehuacán' },
  // ...
]
const mostrarRadar = ref(true)

const mapStore = useMapStore()
const { CVE_ENT: entidad_clave, municipio, entidad } = storeToRefs(mapStore)

onMounted(() => {
  console.log('Esta es la entidad clave:', entidad_clave.value)
})
</script>

<template>

  <section
    class="barra-lateral shadow-sm bg-white/100"
  >

  <FiltersData v-model:cartera="filtros.cartera"
    v-model:ubicacion="filtros.ubicacion"
    v-model:radar="filtros.radar"
    :entidades="todasLasEntidades"
    :municipios="todosLosMunicipios"
    :show-radar="mostrarRadar"
    :radar-min="5"
    :radar-max="100"></FiltersData>

    <div class="card flex flex-col h-full">
      <div class="title h-20 text-center">
        <h2 class="font-bold" v-if="entidad_clave !== '00'">{{ entidad_clave }}. {{ entidad }}</h2>
        <h2 class="font-bold" v-else>Selecciona una entidad</h2>
        <h3 v-if="municipio !== 'municipio'">{{ municipio }}</h3>
        <h3 v-else></h3>
      </div>
      <div class="body flex-1">
        <p>
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Inventore quia nostrum dolore
          neque pariatur id corrupti saepe, atque dolor maiores cumque magnam commodi repellendus
          eos vero rem minus quae fugit?
        </p>
      </div>
    </div>


  </section>

</template>
<style>
.barra-lateral {
  position: relative;
  /*  height: calc(100% - 30px); */
  /* width: 300px; */
  width: 30%;
  /* border: solid 1px purple; */
  /* background-color: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(15px); */
  transition: all 0.3s ease;
  /* bottom: 15px;
  left: 15px; */

  /*  z-index: 500;  */ /* Más alto que todo */
  /* pointer-events: none; */
  border-radius: 10px;
  overflow: auto;

 /*  padding: 1rem; */

  background-color: rgb(231, 231, 231);
}

.title {
  /* border: solid 1px rgb(136, 255, 0); */

  justify-items: center;
  align-content: center;

  font-family: NotoSans;
  font-size: 1rem;

  padding: 1rem;

  transition: all 0.3s ease;
}

.body {
  padding: 1rem;
}
</style>
