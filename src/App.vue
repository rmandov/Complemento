<script setup>
import MapView from './modules/map/views/MapView.vue'
</script>

<template>
  <nav>Complementarios</nav>
  <MapView></MapView>
  <div style="height: 400px; background-color: red"></div>
</template>

<style scoped>
nav {
  border: solid 1px purple;
  height: var(--nav-height);
}
</style>
