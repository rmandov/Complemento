<script setup>
import { useMapStore } from '@/stores/map'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'

const mapStore = useMapStore()
const { CVE_ENT: entidad_clave } = storeToRefs(mapStore)

onMounted(() => {
  console.log('Esta es la entidad clave:', entidad_clave.value)
})
</script>

<template>
  <h2>INFORMACIÓN</h2>

  <p v-if="entidad_clave !== '00'">CVE_ENT: {{ entidad_clave }}</p>

  <p v-else>No hay clave de entidad</p>
</template>
