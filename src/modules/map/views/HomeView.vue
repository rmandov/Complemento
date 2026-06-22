<script setup>
import { RouterView, RouterLink } from 'vue-router'
</script>

<template>
  <div class="home">
    <div class="hero-section">
      <div class="animacion">Aquí irá una animación</div>
      <div class="hero-text">
        <h1 class="hero-title">Complementariedades</h1>
        <p class="hero-description">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur accusamus dicta vitae
          fugiat, cupiditate voluptates aliquid quia alias! Doloremque aliquam quidem ad veniam
          soluta alias vitae culpa facere esse neque?
        </p>
      </div>
    </div>
    <div class="hero-image-wrapper"></div>
  </div>
  <RouterLink to="/mapa">Mapa</RouterLink>
  <RouterLink to="/fichas">Fichas</RouterLink>
  <RouterView />
</template>

<style scoped>
.home {
  margin: 20px;
}
.hero-section {
  display: flex;
}
.animacion {
  position: relative;
  display: inline-block;
  background-color: antiquewhite;
  width: 800px;
  height: 200px;
  margin: 15px;
  text-align: center;
}
</style>
