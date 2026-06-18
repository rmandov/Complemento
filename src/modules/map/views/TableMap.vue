<script setup>
import { onMounted } from 'vue';
import Papa from "papaparse";

// Para cargar los GeoJson
import { useGeoJson } from "../composables/useGeoJson";
const { getGeoJson } = useGeoJson();


onMounted(()=>{
  console.log("Carga de la base con paparse");

});

</script>

<template>
  <section>
    <h2>Tabla</h2>
    <p>Aqui vamos a insertar la carga de la base de datos completa</p>
  </section>
</template>

<style scoped>
section {
  border: solid 1px orange;
}
</style>
