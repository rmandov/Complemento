<script setup lang="ts">
import type { Component, KeepAlive } from 'vue';
import ComponentMapa from '../mapa/componentMapa.vue';
import Proyectos from '../proyectos/Proyectos.vue';

const activeTab = defineModel<number>({
  required: true
});

const tabs:Tab[] = [
  {
    id: 0,
    label: "Mapa",
    component: ComponentMapa
  },
  {
    id:1,
    label:"Proyectos",
    component:Proyectos
  }
]

export interface Tab {
  id: number,
  label: string,
  component: Component,
  icono?:string
}
</script>
<template>
  <section class="flex flex-col gap-2  w-full h-[75dvh] border rounded-xl shadow-xl border-gray-100 px-3 py-3 bg-white">
    <div>
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
        class="boton-tab" :class="{
          'activo':tab.id === activeTab
        }"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="flex-1 ">
      <KeepAlive>
        <component :is="tabs.find(tab => tab.id === activeTab)?.component" />
      </KeepAlive>
    </div>
  </section>
</template>
<style lang="css" scoped>
.boton-tab{
  padding:0.75rem 1.25rem;
  background-color: white;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.3s ease;
}
.boton-tab.activo{
  color: #2563eb !important;
  text-decoration: underline #2563eb 2px !important;
  text-underline-offset: 1rem;
  font-weight: bold;
}
.boton-tab:hover{
  color: #111827;
  text-decoration: underline #111827 2px;
  text-underline-offset: 1rem;
  font-weight: bold;
}

</style>
