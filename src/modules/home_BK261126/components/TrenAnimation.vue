<!-- TrenAnimation.vue -->
<script setup>
import Botones from './MagneticButton.vue'
</script>

<template>
  <div class="tren-container">
    <Botones class="tren-botones" />

    <div class="tren-text">
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur accusamus dicta vitae
        fugiat, cupiditate voluptates aliquid quia alias! Doloremque aliquam quidem ad veniam soluta alias vitae culpa
        facere esse neque? lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur accusamus dicta vitae
        fugiat, cupiditate voluptates aliquid quia alias! Doloremque aliquam quidem ad veniam soluta alias vitae culpa
        facere esse neque? lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur
      </p>
    </div>
  </div>
</template>

<style scoped>
.tren-container {
  display: grid;

  /* botón | espacio | texto */
  grid-template-columns: 31% 8% 61%;

  align-items: center;

  width: 100%;
  min-height: 130px;

  margin: 2rem 0;
}

.tren-botones {
  grid-column: 1;

  width: 100%;
}

.tren-text {
  grid-column: 3;

  display: flex;
  align-items: center;
  justify-content: center;

  text-align: left;
  font-size: clamp(0.9rem, 0.8rem + 0.3vw, 1.1rem);
  line-height: 1.5;

  padding: 0 16px;
}

.tren-text p {
  margin: 0;
}

/* ========================================
   LAPTOP CON POCA ALTURA
======================================== */

@media (min-width: 1024px) and (max-height: 820px) {
  .tren-container {
    min-height: 110px;
  }

  .tren-text {
    font-size: 0.95rem;
    line-height: 1.4;
  }
}

/* ========================================
   TABLET / MÓVIL
======================================== */

@media (max-width: 1023px) {
  .tren-container {
    display: flex;
    flex-direction: column;

    gap: 24px;

    min-height: auto;

    margin: 32px 0;
  }

  .tren-botones,
  .tren-text {
    width: 100%;
  }

  .tren-text {
    padding: 0;
  }
}
</style>
