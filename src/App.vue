<script setup>
import { RouterView, RouterLink } from "vue-router";
</script>

<template>
  <nav>Complementarios</nav>
  <RouterView />
</template>

<style scoped>
nav {
  border: solid 1px purple;
  height: var(--nav-height);
}
</style>
