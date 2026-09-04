<script setup>
import { RouterView } from 'vue-router'
import { ref, onMounted } from 'vue'

import HeroAnimation from '@/modules/home/components/HeroAnimation.vue'
import TrenAnimation from '@/modules/home/components/TrenAnimation.vue'
import Carousel from '@/modules/home/components/Carousel2.vue'
import { useGeoJson } from '@/modules/map/composables/useGeoJson'
import ParticleCircle from '@/modules/home/animations/ParticleCircle.vue'
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
    <!-- Hero -->
    <HeroAnimation />
    <!-- Seccion botones -->
    <TrenAnimation />

    <!-- Sección Proyectos -->
    <!-- <section class="proyectos-section">
      <h2 class="text-2xl font-bold">Proyectos estratégicos</h2>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Autem quam ipsa, amet omnis
        perspiciatis distinctio culpa sequi ratione ad! Recusandae ipsam ut rerum beatae inventore
        mollitia blanditiis atque quidem aut!
      </p>

      <Carousel></Carousel>
    </section> -->
    <!--
    <div class="contenedor">
      <div class="rectangulo_1"></div>
      <div class="rectangulo_2"></div>
    </div> -->
  </div>

  <section class="demo">
    <ParticleCircle :count="5000" :color="0x2563eb" :repulsion-radius="150" :repulsion-strength="130" />
  </section>

  <RouterView />
</template>

<style scoped>
.home {
  margin: 50px 50px;
  font-family: NotoSans;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

/* Proyectos */
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

.contenedor {
  position: relative;
  width: 100%;
  height: 200px;
  /* altura de ambos */
}

.rectangulo_1 {
  position: absolute;
  inset: 0;

  background: #000;
}

.rectangulo_2 {
  position: absolute;
  inset: 0;

  background: #f0f0f0;
  border-radius: 20px 20px 0 0;

  z-index: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .boton-section {
    flex-direction: column;
    align-items: center;
    gap: 32px;
  }

  .boton {
    width: 100%;
    flex: none;
  }
}
</style>
