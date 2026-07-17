<script setup>
import Botones from "./Botones.vue";
</script>
<template>
  <div class="container">
    <Botones>
      <div class="line"></div>
    </Botones>
  </div>
</template>
<style scoped>
.container {
  width: 100%;
  background-color: rgba(127, 255, 212, 0);
}
.line {
  height: 8px;
  background-color: black;
  z-index: 9999;
}
</style>
