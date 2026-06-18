<script setup>
import { useInfoStore } from '@/stores/info'
import { storeToRefs } from 'pinia' // <-- Importa esto

// ✅ Inicializa el store AQUÍ, fuera de onMounted
const ppi = useInfoStore()

// ✅ Usa storeToRefs para mantener la reactividad
const { information } = storeToRefs(ppi)
</script>

<template>
  <div class="overlay">
    <!-- Puedes usar information directamente o xd -->
    <p>Esta información viene de un component: {{ information.short_name }}</p>
    <p>ID Municipio: {{ information.id_municipio }}</p>
  </div>
</template>

<style scoped>
.overlay {
  position: absolute;
  top: 50%; /* Mejor arriba a la izquierda que centrado */
  left: 50%;
  z-index: 1000; /* Más alto que todo */
  pointer-events: none;

  /* Fondo para que se lea el texto sobre el mapa */
  background: rgba(255, 255, 255, 0.95);
  padding: 12px 16px;
}

.overlay p {
  font-size: 14px;
}
</style>
