<script setup>
import { RouterView, RouterLink } from "vue-router";
</script>

<template>
 <!--  <div class="hero-content">
    
    <div class="hero-text">
      <span class="hero-eyebrow">Portal de Transparencia</span>
      <h1 class="hero-title">Datos Abiertos</h1>
      <p class="hero-description">
        Explora, descarga y analiza la información pública presupuestaria de la Administración
        Pública Federal. Aquí encontrarás datos históricos, estadísticas, reportes y recursos
        descargables organizados por categorías para facilitar tu consulta.
      </p>
    </div>
    <div class="hero-image-wrapper">
      
    </div>
  </div> -->
  <RouterLink to="/mapa">Mapa</RouterLink>
  <RouterLink to="/fichas">Fichas</RouterLink>
  <RouterView />
</template>

<style scoped>

.hero-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;
  align-items: center;
}

@media (min-width: 768px) {
  .hero-content {
    grid-template-columns: 1.2fr 1fr;
    gap: 3rem;
  }
}

.hero-text {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.hero-eyebrow {
  display: inline-block;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--cyan-dark, #0891b2);
  margin-bottom: 0.25rem;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 800;
  font-family: 'NotoSans-Extrabold', 'Noto Sans', sans-serif;
  color: var(--text-primary, #111827);
  line-height: 1.1;
  margin: 0;
  text-align: left;
}

@media (min-width: 640px) {
  .hero-title {
    font-size: 3.5rem;
  }
}

.hero-description {
  font-size: 1.125rem;
  line-height: 1.75;
  color: var(--text-secondary, #4b5563);
  max-width: 540px;
  margin: 0.5rem 0 0;
}

.hero-image-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-image {
  width: 100%;
  max-width: 400px;
  height: auto;
  object-fit: contain;
}
</style>
