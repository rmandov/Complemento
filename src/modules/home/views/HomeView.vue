<script setup>
import { RouterView } from 'vue-router'
import SphereJourney from '@/modules/home/components/SphereJourney.vue'
</script>

<template>
  <main class="home">
    <SphereJourney />
    <!-- Otras secciones del Home pueden agregarse antes o después del recorrido. -->
  </main>
  <RouterView />
</template>

<style scoped>
.home {
  font-family: NotoSans, sans-serif;
  width: 100%;
  box-sizing: border-box;
  padding-inline: clamp(12px, 3vw, 50px);
  margin: 0;
  background: #fff;
  /* No usar overflow:hidden/auto: interfiere con la sección sticky. */
}
.home :deep(.sphere-journey) { max-width: 1500px; margin-inline: auto; }
@media (max-width: 767px) { .home { padding-inline: 0; } }
</style>
