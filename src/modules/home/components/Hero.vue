<script setup>
import CantidadProyectos from '@/modules/home/components/CantidadProyectos.vue'
import SplitText from '@/modules/home/components/SplitText.vue'
import TextBlock from '@/modules/home/components/TextBlock.vue'
</script>

<template>
  <section class="hero-section">
    <!-- Capa de animación: cubre toda la sección, todo lo demás va encima -->
    <div class="hero-animation" aria-hidden="true">
      <!-- Bloque que "recorta" la esquina superior izquierda para el título -->
      <div class="hero-animation-notch"></div>
    </div>

    <!-- Contenido: siempre por encima de la animación -->
    <div class="hero-content">
      <!-- Bloque de título (eyebrow + título principal) -->
      <div class="hero-title-block">
        <div class="hero-eyebrow">
          <span>Conoce la cartera de inversión del país</span>
          <img class="hero-eyebrow-icon" src="../../../assets/img/img_circle.png" alt="Botón" />
        </div>

        <h1 class="hero-title">
          <SplitText>
            <TextBlock :radius="10" :overlap="-8" :lines="[
              {
                text: 'Complementariedades y',
                padding: '15px 50px 10px 24px',
                corners: { topLeft: true, topRight: true, bottomRight: true, bottomLeft: false },
              },
              {
                text: 'sinergias en Programas',
                padding: '10px 20px 10px 24px',
                corners: { topLeft: false, topRight: false, bottomRight: true, bottomLeft: false },
              },
              {
                text: 'y Proyectos de',
                padding: '10px 60px 10px 24px',
                corners: { topLeft: false, topRight: false, bottomRight: true, bottomLeft: false },
              },
              {
                text: 'Inversión (PPI)',
                indent: 0,
                padding: '10px 24px 15px',
                corners: { topLeft: false, topRight: false, bottomRight: true, bottomLeft: true },
              },
            ]" />
          </SplitText>
        </h1>
      </div>

      <!-- Contador de proyectos: flota fuera del hero -->
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
    </div>
  </section>
</template>

<style scoped>
.hero-section {
  position: relative;
  background-color: rgb(224, 224, 224);
  border-radius: 32px;
  padding: 40px;
  min-height: 620px;
  margin-bottom: 32px;
  margin-top: 90px;
  overflow: visible;
}

/* ─── Capa reservada para la futura animación ─── */
.hero-animation {
  position: absolute;
  inset: 0;
  border-radius: 32px;
  overflow: hidden;
  background-color: rgb(224, 224, 224);
  /* aquí irá el <video>/animación en el futuro */
  z-index: 0;
  pointer-events: none;
}

/*
  Bloque "transparente" que recorta la esquina superior izquierda.
  IMPORTANTE: --hero-notch-bg debe coincidir con el color que hay
  DETRÁS de .hero-section (el fondo real de la página/layout),
  para que el recorte se vea continuo con lo que hay afuera.
*/
.hero-animation-notch {
  --hero-notch-bg: #ffffff;
  /* ajusta a tu color de fondo real */
  --notch-w: 60px;
  /* ancho del recorte: debe cubrir el ancho de hero-title-block */
  --notch-h: 230px;
  /* alto del recorte: debe cubrir el alto de hero-title-block */
  --notch-fillet: 32px;
  /* radio de la curva de unión (usa el mismo que el border-radius de la sección) */

  position: absolute;
  top: 0;
  left: 0;
  width: var(--notch-w);
  height: var(--notch-h);
  background-color: var(--hero-notch-bg);
  border-top-left-radius: 32px;
  /* coincide con la esquina exterior de .hero-section */
  z-index: 1;
}

/* Fillet cóncavo: redondea la esquina interior donde el notch
   se une con el área visible de la animación */
.hero-animation-notch::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 100%;
  width: var(--notch-fillet);
  height: var(--notch-fillet);
  background: radial-gradient(circle at top left,
      var(--hero-notch-bg) var(--notch-fillet),
      transparent calc(var(--notch-fillet) + 1px));
}

/* Contenedor de todo el contenido real, siempre encima de la animación */
.hero-content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(280px, 45%) 1fr;
  grid-template-areas:
    "title stats"
    "description description";
  column-gap: 32px;
  row-gap: 24px;
}

.hero-title-block {
  grid-area: title;
  position: absolute;
  top: -120px;
  left: 40px;
  z-index: 2;
  max-width: min(560px, calc(100% - 64px));
  border-radius: 24px;
  padding: 24px 32px;
}

.hero-eyebrow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-weight: 700;
  font-size: clamp(0.8rem, 0.7rem + 0.5vw, 0.95rem);
  margin-bottom: 16px;
}

.hero-eyebrow-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.hero-title {
  font-family: NotoSansBold;
  font-weight: bold;
  font-size: clamp(1.5rem, 1.1rem + 1.8vw, 2.25rem);
  line-height: 1.15;
  margin: 0;
}

.hero-stats {
  grid-area: stats;
  position: absolute;
  top: -80px;
  right: -80px;
  z-index: 2;
}

.hero-description {
  grid-area: description;
  align-self: start;
  padding-top: 8px;
  margin-top: clamp(40px, 8vw, 96px);
}

@media (max-width: 768px) {
  .hero-content {
    grid-template-columns: 1fr;
    grid-template-areas:
      "title"
      "stats"
      "description";
    padding-top: 24px;
  }

  .hero-section {
    padding: 24px;
  }

  .hero-title-block {
    position: relative;
    top: auto;
    left: auto;
    max-width: 100%;
    padding: 16px 0;
  }

  .hero-stats {
    position: relative;
    top: auto;
    right: auto;
    justify-self: start;
    text-align: left;
  }

  .hero-description {
    margin-top: 0;
  }

  /* En móvil el título vuelve al flujo normal, así que el recorte ya no aplica */
  .hero-animation-notch {
    display: none;
  }
}
</style>
