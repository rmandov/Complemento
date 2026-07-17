<script setup>
import CantidadProyectos from '@/modules/home/components/CantidadProyectos.vue'
</script>
<template>
  <section class="hero-section">
    <div class="hero-animacion">
      <div class="animacion">Aquí irá una animación</div>
    </div>
    <div class="hero-texto">
      <h1 class="hero-title text-4xl font-bold">
        Complementariedad y sinergia entre Programas y Proyectos de Inversión (PPI)
      </h1>
      <p class="hero-description">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur accusamus dicta vitae
        fugiat, cupiditate voluptates aliquid quia alias! Doloremque aliquam quidem ad veniam soluta
        alias vitae culpa facere esse neque?
      </p>
      <CantidadProyectos />
    </div>
  </section>
</template>

<style scoped>
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
@media (max-width: 768px) {
  .hero-section {
    flex-direction: column;
  }

  .hero-animacion,
  .hero-texto {
    flex: none;
    width: 100%;
  }
}
</style>
