<script setup>
import { RouterView, RouterLink } from "vue-router";
import { ref, onMounted } from "vue";
import gsap from "gsap";
import CantidadProyectos from "../../home/components/CantidadProyectos.vue";
import Carousel from "@/modules/home/components/Carousel.vue";
import { useGeoJson } from "@/modules/map/composables/useGeoJson";
const { getGeoJson } = useGeoJson();

const projects = ref([]);
const loading = ref(true);

// Configuración de los botones
const botones = [
  {
    to: "/fichas",
    img: new URL("../../../assets/img/img_circle.png", import.meta.url).href,
    label: "Categorías",
  },
  {
    to: "/mapa",
    img: new URL("../../../assets/img/Mexico.png", import.meta.url).href,
    label: "Territorio",
  },
];

// Efecto magnético
const handleMouseMove = (e) => {
  const zone = e.currentTarget; // .magnetic-zone
  const btn = zone.querySelector(".boton");
  const text = zone.querySelector(".boton-imgtxt");

  if (!btn || !text) return;

  const rect = zone.getBoundingClientRect();

  const x = gsap.utils.mapRange(
    rect.left,
    rect.right,
    -rect.width / 2,
    rect.width / 2,
    e.clientX,
  );

  const y = gsap.utils.mapRange(
    rect.top,
    rect.bottom,
    -rect.height / 2,
    rect.height / 2,
    e.clientY,
  );

  // El botón se mueve suavemente
  gsap.to(btn, {
    x: x * 0.15,
    y: y * 0.15,
    duration: 0.4,
    ease: "power2.out",
  });

  // El texto se mueve más para "rebotar" dentro del botón
  gsap.to(text, {
    x: x * 0.15,
    y: y * 0.15,
   /*  x: x * 0.55,
    y: y * 0.55, */
    duration: 0.5,
    ease: "power2.out",
  });
};

const handleMouseLeave = (e) => {
  const zone = e.currentTarget;
  const btn = zone.querySelector(".boton");
  const text = zone.querySelector(".boton-imgtxt");

  if (!btn || !text) return;

  gsap.to([btn, text], {
    x: 0,
    y: 0,
    duration: 0.7,
    ease: "elastic.out(1, 0.4)",
    overwrite: true,
  });
};

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
    <section class="hero-section">
      <div class="hero-animacion">
        <div class="animacion">Aquí irá una animación</div>
      </div>
      <div class="hero-texto">
        <h1 class="hero-title">
          Complementariedad y sinergia entre Programas y Proyectos de Inversión (PPI)
        </h1>
        <p class="hero-description">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur accusamus dicta vitae
          fugiat, cupiditate voluptates aliquid quia alias! Doloremque aliquam quidem ad veniam
          soluta alias vitae culpa facere esse neque?
        </p>
        <CantidadProyectos />
      </div>
    </section>

    <!-- Botones con efecto magnético -->
    <section class="boton-section">
      <div
        v-for="(btn, index) in botones"
        :key="index"
        class="magnetic-zone"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
      >
        <RouterLink class="boton" :to="btn.to">
          <div class="boton-contenido">
            <div class="boton-imgtxt">
              <img class="boton-imagen" :src="btn.img" :alt="btn.label" />
              <span class="boton-texto">{{ btn.label }}</span>
            </div>
          </div>
          <svg
            class="boton-flecha"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path
              fill-rule="evenodd"
              d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"
            />
          </svg>
        </RouterLink>
      </div>
    </section>

    <!-- Sección Proyectos -->
    <section class="proyectos-section">
      <div v-if="loading" class="loading-state">Cargando proyectos...</div>
      <Carousel
        v-else-if="projects.length"
        :items="projects"
        :autoplay="false"
        :autoplay-speed="5000"
      />
      <div v-else class="empty-state">No hay proyectos disponibles.</div>
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

/* Hero */
.hero-section {
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
}

.hero-animacion {
  flex: 2;
  min-width: 0;
}

.hero-texto {
  flex: 3;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero-title {
  font-family: NotoSansBold;
}

.animacion {
  width: 100%;
  height: 100%;
  background-color: rgb(242, 242, 242);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* Botones */
.boton-section {
  display: flex;
  gap: 120px;
  margin: 64px 0 64px 0;
  justify-content: center;
}

.magnetic-zone {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 300px;
  height: 150px;
  border-radius: 50%;
  /* border: 1px dashed #ccc; */ /* Descomenta si quieres ver el área de captura */
}

.boton {
  flex: 1;
  min-width: 0;
  max-width: 300px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 20px;
  border: 1px solid rgb(220, 220, 230);
  text-decoration: none;
  color: inherit;
  /* ===== IMPORTANTE para el efecto magnético ===== */
  position: relative;
  overflow: hidden;
  will-change: transform;
}
.boton-imgtxt{
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

}

.boton-contenido {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.boton-imagen {
  width: 40px;
  height: 40px;
  object-fit: cover;
  flex-shrink: 0;
}

.boton-texto {
  font-size: 1rem;
  /* ===== IMPORTANTE para que GSAP transforme el span ===== */
  display: inline-block;
  will-change: transform;
}

.boton-flecha {
  flex-shrink: 0;
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
  .hero-section {
    flex-direction: column;
  }

  .hero-animacion,
  .hero-texto {
    flex: none;
    width: 100%;
  }

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
