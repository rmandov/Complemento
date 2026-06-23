<script setup>
import { RouterView, useRouter } from "vue-router";
const router = useRouter()
const goBackPage = () => {
  router.go(-1) // o router.back()
}
</script>

<template>
  <nav><button @click="goBackPage">Regresar</button>Complementarios</nav>
  <RouterView />
</template>

<style scoped>
nav {
  border: solid 1px purple;
  height: var(--nav-height);
}
</style>
