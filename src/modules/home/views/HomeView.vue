<script setup>
import { RouterView } from "vue-router";
import { ref, onMounted } from "vue";

import Hero from "@/modules/home/components/Hero.vue";
import Tren from "@/modules/home/components/Tren.vue";
import Botones from "@/modules/home/components/Botones.vue";
import Carousel from "@/modules/home/components/Carousel2.vue";
import { useGeoJson } from "@/modules/map/composables/useGeoJson";
const { getGeoJson } = useGeoJson();

const projects = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await getGeoJson("proyectos_carrusel.json");
    if (res) {
      projects.value = res;
    } else {
      console.warn("El JSON no es un array:", res);
    }
  } catch (error) {
    console.error("Error cargando proyectos:", error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="home">
    <!-- Hero -->
    <Hero />
    <!-- Seccion botones -->
    <Tren />

    <!-- Sección Proyectos -->
    <section class="proyectos-section">
      <h2 class="text-2xl font-bold">Proyectos estratégicos</h2>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Autem quam ipsa, amet omnis
        perspiciatis distinctio culpa sequi ratione ad! Recusandae ipsam ut rerum beatae inventore
        mollitia blanditiis atque quidem aut!
      </p>

      <Carousel></Carousel>
    </section>
  </div>

  <RouterView />
</template>

<style scoped>
.home {
  margin: 30px 50px;
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
