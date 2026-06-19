<script setup>
import { RouterView, RouterLink } from "vue-router";
</script>

<template>
  <nav>Complementarios</nav>
  <RouterLink to="/">Home</RouterLink>
  <RouterView />
</template>

<style scoped>
nav {
  border: solid 1px purple;
  height: var(--nav-height);
}
</style>
