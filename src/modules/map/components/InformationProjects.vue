<script setup>
import { useInfoStore } from "@/stores/info";
import { storeToRefs } from "pinia"; // <-- Importa esto
import { ref, watch } from "vue";

// ✅ Inicializa el store AQUÍ, fuera de onMounted
const ppi = useInfoStore();

// ✅ Usa storeToRefs para mantener la reactividad
const { information } = storeToRefs(ppi);

// Variable local reactiva (opcional, puedes usar information directamente en template)
const xd = ref(information.value.short_name);

// ✅ Observa cambios en el store
watch(information, (newVal) => {
  xd.value = newVal.short_name;
}, { deep: true, immediate: true });
</script>

<template>
  <!-- Puedes usar information directamente o xd -->
  <p>Esta información viene de un component: {{ information.short_name }}</p>
  <p>ID Municipio: {{ information.id_municipio }}</p>
</template>

<style scoped>
p {
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border-radius: 8px;
  pointer-events: auto; /* Permite interacción si tiene botones */
}
</style>