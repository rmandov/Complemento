<script setup>
import { onMounted } from 'vue';



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
