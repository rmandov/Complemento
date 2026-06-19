<script setup>
import { useInfoStore } from "@/stores/info";
import { storeToRefs } from "pinia"; // <-- Importa esto
import { useMapStore } from "@/stores/map";
import { watch } from "vue";

// ✅ Inicializa el store AQUÍ, fuera de onMounted
const ppi = useInfoStore();
const nombre = useMapStore();

ppi.setInfo({
  short_name: "hola",
  id_municipio: "como estas?",
});

// ✅ Usa storeToRefs para mantener la reactividad
const { information } = storeToRefs(ppi);

const {entidad} = storeToRefs(nombre)

const cambioMunicipio = () => {
  ppi.setIdMunicipio("Municipio cambiado");
};

watch(entidad, () => {
  
  nombre.setMunicipio("")
  console.log(nombre.entidad);
});


</script>

<template>
  <div class="overlay">
    <!-- Puedes usar information directamente o xd -->
    <p>{{ information.short_name }}</p>
    <p>{{ information.id_municipio }}</p>
    <p>{{ nombre.entidad }}</p>
    <p>{{ nombre.municipio }}</p>
  </div>
  <button @click="cambioMunicipio">Puchame</button>
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
  font-size: 20px;
}
</style>
