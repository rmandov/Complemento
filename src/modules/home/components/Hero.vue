<script setup>
import CantidadProyectos from '@/modules/home/components/CantidadProyectos.vue'
import SplitText from '@/modules/home/components/SplitText.vue'
</script>

<template>
  <section class="hero-section">
    <!-- Bloque de título (eyebrow + título principal) -->
    <div class="hero-title-block">
      <div class="hero-eyebrow">
        <span>Conoce la cartera de inversión del país</span>
        <img class="hero-eyebrow-icon" src="../../../assets/img/img_circle.png" alt="Botón" />
      </div>

      <h1 class="hero-title text-4xl font-bold">
        <SplitText>
          Complementariedades y sinergias en Programas y Proyectos de Inversión (PPI)
        </SplitText>
      </h1>
    </div>

    <!-- Contador de proyectos: ahora flota fuera del hero -->
    <div class="hero-stats">
      <CantidadProyectos />
    </div>

    <!-- Descripción -->
    <div class="hero-description">
      <p>
        <SplitText>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur accusamus dicta vitae
          fugiat, cupiditate voluptates aliquid quia alias! Doloremque aliquam quidem ad veniam
          soluta alias vitae culpa facere esse neque?
        </SplitText>
      </p>
    </div>

    <!-- Zona reservada para la futura animación -->
    <div class="hero-animation" aria-hidden="true"></div>
  </section>
</template>

<style scoped>
.hero-section {
  position: relative;
  display: grid;
  grid-template-columns: minmax(320px, 45%) 1fr;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "title stats"
    "description animation";
  column-gap: 32px;
  row-gap: 24px;
  background-color: rgb(224, 224, 224);
  border-radius: 32px;
  padding: 40px;
  min-height: 620px;
  margin-bottom: 32px;
  overflow: visible;
  /* Permite que el contenido sobresalga */
}

.hero-title-block {
  grid-area: title;
  background-color: #fff;
  border-radius: 24px;
  padding: 24px 32px;
  align-self: start;
}

.hero-eyebrow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-weight: 700;
  font-size: 0.95rem;
  margin-bottom: 16px;
}

.hero-eyebrow-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.hero-title {
  font-family: NotoSansBold;
  line-height: 1.2;
  margin: 0;
}

/* ─── Cambios principales aquí ─── */
.hero-stats {
  grid-area: stats;
  position: absolute;
  /* Se sale del flujo del grid */
  top: -80px;
  /* Sobresale hacia arriba */
  right: -80px;
  /* Sobresale hacia la derecha */
  z-index: 10;
  /* Se muestra por encima de todo */
  /* justify-self y align-self ya no son necesarios en desktop */
}

.hero-description {
  grid-area: description;
  align-self: start;
  padding-top: 8px;
}

.hero-animation {
  grid-area: animation;
}

@media (max-width: 768px) {
  .hero-section {
    grid-template-columns: 1fr;
    grid-template-areas:
      "title"
      "stats"
      "description"
      "animation";
    padding: 24px;
  }

  .hero-stats {
    position: relative;
    /* Vuelve al flujo normal en móvil */
    top: auto;
    right: auto;
    justify-self: start;
    text-align: left;
  }
}
</style>
