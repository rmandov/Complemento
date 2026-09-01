<script setup>
import { RouterView } from 'vue-router'
import { ref, onMounted } from 'vue'

import HeroAnimation from '@/modules/home/components/HeroAnimation.vue'
import TrenAnimation from '@/modules/home/components/TrenAnimation.vue'
import Carousel from '@/modules/home/components/Carousel2.vue'
import { useGeoJson } from '@/modules/map/composables/useGeoJson'
const { getGeoJson } = useGeoJson()

const projects = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await getGeoJson('proyectos_carrusel.json')
    if (res) {
      projects.value = res
    } else {
      console.warn('El JSON no es un array:', res)
    }
  } catch (error) {
    console.error('Error cargando proyectos:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="home">
    <!-- Primera pantalla -->
    <div class="home-intro">
      <HeroAnimation />
      <TrenAnimation />
    </div>

    <!-- Sección Proyectos -->
    <!--
    <section class="proyectos-section">
      ...
    </section>
    -->
  </div>

  <RouterView />
</template>

<style scoped>
.home {
  width: min(calc(100% - 100px), 1400px);
  margin: 0 auto;
  font-family: NotoSans;
}

/* ========================================
   HERO + TREN
======================================== */

.home-intro {
  display: grid;

  /*
    Hero ocupa el espacio disponible.
    Tren ocupa solamente lo que necesita.
  */
  grid-template-rows: minmax(0, 1fr) auto;

  gap: clamp(16px, 2vh, 28px);

  /*
    Dejamos espacio superior para el contenido
    que sobresale del Hero.
  */
  padding-top: clamp(70px, 9vh, 90px);

  /*
    Altura aproximada de la primera pantalla.

    Si tienes un navbar fijo de, por ejemplo, 80px,
    puedes cambiarlo por:
    min-height: calc(100dvh - 80px);
  */
  min-height: 100dvh;

  box-sizing: border-box;
}

/* ========================================
   PROYECTOS
======================================== */

.proyectos-section {
  margin-bottom: 32px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 1.1rem;
}

/* ========================================
   LAPTOPS DE POCA ALTURA
   Ejemplo: 1366 × 768
======================================== */

@media (min-width: 1024px) and (max-height: 820px) {
  .home-intro {
    padding-top: 65px;
    gap: 14px;
  }
}

/* ========================================
   TABLET
======================================== */

@media (max-width: 1023px) {
  .home {
    width: min(calc(100% - 48px), 1400px);
  }

  .home-intro {
    display: block;
    min-height: auto;
    padding-top: 32px;
  }
}

/* ========================================
   MÓVIL
======================================== */

@media (max-width: 768px) {
  .home {
    width: calc(100% - 32px);
  }

  .home-intro {
    padding-top: 16px;
  }
}
</style>
