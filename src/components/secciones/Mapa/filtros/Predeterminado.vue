<script setup lang="ts">
import FiltroAreaInteres from './FiltroAreaInteres.vue';
import FiltroTopProyectos from './FiltroTopProyectos.vue';


</script>
<template>
  <div class="rounded-lg flex flex-col gap-4 border border-gray-100 shadow p-2 bg-white relative  max-h-[100%] overflow-visible w-full h-full">
    <FiltroTopProyectos />
    <FiltroAreaInteres />
  </div>

</template>
<style scoped></style>
