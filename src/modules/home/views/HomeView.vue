<script setup>
import { RouterView } from 'vue-router'
import SphereJourney from '@/modules/home/components/SphereJourney.vue'
import TrenAnimation from '@/modules/home/components/TrenAnimation.vue'

/*
 * Se mantienen los componentes originales del Home dentro del módulo.
 * El nuevo recorrido ocupa su PROPIA sección sticky y no tapa el footer.
 * Para habilitar otros bloques originales (HeroAnimation, Carousel, etc.),
 * impórtalos aquí e insértalos antes o después de la sección #map-section.
 */
</script>

<template>
  <main class="home">
    <!-- NUEVO: etapas, modelo GLB, navegación lateral y contenido dinámico. -->
    <SphereJourney />

    <!-- Este bloque ya contenía el botón Territorio -> /mapa.
         El acceso "Ir al mapa" desplaza aquí, SIN cambiar de ruta. -->
    <section id="map-section" class="home-map-section" aria-label="Acceso al mapa">
      <TrenAnimation />
    </section>

    <!-- Puedes reactivar tus secciones del Home aquí: carruseles, proyectos, etc. -->
  </main>

  <!-- Conservado de la estructura del archivo original. -->
  <RouterView />
</template>

<style scoped>
.home {
  font-family: NotoSans, sans-serif;
  width: 100%;
  max-width: 1500px;
  box-sizing: border-box;
  padding-inline: clamp(16px, 3vw, 50px);
  margin: 24px auto 0;
  /* Evitar overflow: hidden/auto; desactiva el sticky del recorrido. */
}
.home-map-section {
  scroll-margin-top: 100px;
  padding: 16px 0 56px;
}
@media (max-width: 1023px) {
  .home-map-section { scroll-margin-top: 85px; }
}
@media (max-width: 767px) {
  .home { margin-top: 12px; }
  .home-map-section { scroll-margin-top: 72px; }
}
</style>
