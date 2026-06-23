<script setup>
import { RouterView, RouterLink } from 'vue-router'
import CantidadProyectos from '../../home/components/CantidadProyectos.vue'
import Slider from '@/modules/home/components/Slider.vue'
</script>

<template>
  <div class="home">
    <!-- Hero -->
    <section class="hero-section">
      <!-- 2/5 -->
      <div class="hero-animacion">
        <div class="animacion">Aquí irá una animación</div>
      </div>

      <!-- 3/5 -->
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

    <!-- Botones -->
    <section class="boton-section">
      <!-- Botón 1: Categorías -->
      <RouterLink class="boton" to="/fichas">
        <div class="boton-contenido">
          <img class="boton-imagen" src="../../../assets/img/img_circle.png" alt="Categorías" />
          <span class="boton-texto">Categorías</span>
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

      <!-- Botón 2: Fichas -->
      <RouterLink class="boton" to="/mapa">
        <div class="boton-contenido">
          <img class="boton-imagen" src="../../../assets/img/Mexico.png" alt="Fichas" />
          <span class="boton-texto">Territorio</span>
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
    </section>

    <!-- Sección Proyectos -->
    <section class="proyectos-section">
      <h2>Proyectos estratégicos</h2>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Autem quam ipsa, amet omnis
        perspiciatis distinctio culpa sequi ratione ad! Recusandae ipsam ut rerum beatae inventore
        mollitia blanditiis atque quidem aut!
      </p>
      <Slider />
    </section>
  </div>

  <RouterView />
</template>

<style scoped>
.home {
  margin: 30px 50px;
  font-family: NotoSans;
  max-width: 1800px;
  margin-left: auto;
  margin-right: auto;
}

/* Distribución de 2/5 para la animación y 3/5 para el texto */

.hero-section {
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
}

.hero-animacion {
  flex: 2; /* 2 parte */
  min-width: 0;
}

.hero-texto {
  flex: 3; /* 3 partes */
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero-title{
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

/* Seccion de botones */
.boton-section {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
}

.boton {
  flex: 1; /* 50% cada uno */
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between; /* contenido a la izq, flecha a la der */
  gap: 12px;
  padding: 16px 20px;
/*   background-color: beige; */
  border-radius: 20px;
  border-width: 1px;
  border-style: solid;
  border-color: rgb(220, 220, 230);
}

.boton-contenido {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0; /* permite truncar texto si es necesario */
}

.boton-imagen {
  width: 40px;
  height: 40px;
  object-fit: cover;
  flex-shrink: 0; /* No se encoge */
}

.boton-texto {
  font-size: 1rem;
}

.boton-flecha {
  flex-shrink: 0; /* No se encoge */
}

/* Sección Proyectos */

.proyectos-section {
  margin-bottom: 32px;
}

/* ============================================
   RESPONSIVE: tablet y móvil
   ============================================ */
@media (max-width: 768px) {
  /* Hero: apila verticalmente */
  .hero-section {
    flex-direction: column;
  }

  .hero-animacion,
  .hero-texto {
    flex: none; /* quita la proporción 2/5 - 3/5 */
    width: 100%;
  }

  /* Botones: apila verticalmente */
  .boton-section {
    flex-direction: column;
  }

  .boton {
    width: 100%;
    flex: none;
  }
}
</style>
