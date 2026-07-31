<script setup>
import { RouterLink } from 'vue-router'

const botones = [
  {
    to: '/fichas',
    img: new URL('../../../assets/img/img_circle.png', import.meta.url).href,
    label: 'Categoría',
    description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit.!',
  },
  {
    to: '/mapa',
    img: new URL('../../../assets/img/Mexico.png', import.meta.url).href,
    label: 'Territorio',
    description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit.!',
  },
]
</script>

<template>
  <section class="boton-section">
    <RouterLink v-for="(btn, index) in botones" :key="index" class="boton-card" :to="btn.to">
      <div class="boton-icono">
        <img :src="btn.img" :alt="btn.label" />
      </div>

      <div class="boton-info">
        <h3 class="boton-titulo">{{ btn.label }}</h3>
        <p class="boton-descripcion">{{ btn.description }}</p>
      </div>
    </RouterLink>
  </section>
</template>

<style scoped>
.boton-section {
  display: flex;
  gap: 24px;
}

.boton-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 32px;
  border-radius: 24px;
  background-color: rgb(224, 224, 224);
  text-decoration: none;
  color: inherit;
}

.boton-icono {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.boton-icono img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.boton-info {
  min-width: 0;
}

.boton-titulo {
  font-family: NotoSansBold;
  font-size: 1.5rem;
  margin: 0 0 8px 0;
}

.boton-descripcion {
  margin: 0;
  font-size: 0.95rem;
  color: #333;
}

@media (max-width: 768px) {
  .boton-section {
    flex-direction: column;
  }
}
</style>
