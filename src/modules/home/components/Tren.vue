<script setup>
import Botones from './Botones.vue'
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
  display: flex;
  align-items: stretch;
  gap: 24px;
  margin-bottom: 32px;
}

.tren-botones {
  flex: 2;
}

.tren-text {
  flex: 1;
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
    flex-direction: column;
  }
}
</style>
