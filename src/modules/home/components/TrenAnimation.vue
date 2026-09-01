<script setup>
import Botones from './MagneticButton.vue'
</script>

<template>
  <div class="tren-container">
    <Botones class="tren-botones" />

    <div class="tren-text">
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur accusamus dicta vitae
        fugiat, cupiditate voluptates aliquid quia alias!
      </p>
    </div>
  </div>
</template>

<style scoped>
.tren-container {
  display: grid;

  /* 30% botón | 20% espacio | 50% texto */
  grid-template-columns: 30% 20% 50%;

  align-items: center;
  margin-bottom: 32px;
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

  text-align: center;
  font-weight: 700;
  font-size: 1.1rem;
  padding: 0 16px;
}

@media (max-width: 768px) {
  .tren-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .tren-botones,
  .tren-text {
    width: 100%;
  }
}
</style>
