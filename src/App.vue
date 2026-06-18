<script setup>
import MapView from './modules/map/views/MapView.vue';
import TableMap from './modules/map/views/TableMap.vue';
</script>

<template>
  <nav>Complementarios</nav>
  <MapView></MapView>
  <TableMap></TableMap>
</template>

<style scoped>
nav {
  border: solid 1px purple;
  height: var(--nav-height);
}
</style>
