<script setup>
import CantidadProyectos from '@/modules/home/components/CantidadProyectos.vue'
import SplitText from '@/modules/home/components/SplitText.vue'
import TextBlock from '@/modules/home/components/TextBlock.vue'
</script>

<template>
  <section class="hero-section">
    <!-- Capa de animación: cubre toda la sección, todo lo demás va encima -->
    <div class="hero-animation" aria-hidden="true">
      <!-- Bloque invisible (mismo color que el fondo de la página) -->
      <div class="hero-animation-notch"></div>

      <!-- Transición curva: rectángulo_1 (fondo/invisible) + rectángulo_2 (animación) -->
      <div class="hero-animation-curve">
        <div class="rectangulo_1"></div>
        <div class="rectangulo_2"></div>
      </div>
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
      <!-- <div class="hero-description">
        <p>
          <SplitText>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur accusamus dicta vitae
            fugiat, cupiditate voluptates aliquid quia alias! Doloremque aliquam quidem ad veniam
            soluta alias vitae culpa facere esse neque?
          </SplitText>
        </p>
      </div> -->
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

/* ─── Capa reservada para la futura animación ───
   Variables compartidas: --notch-w es el "grosor" del bloque invisible,
   y también el ancho de los rectángulos de la curva de transición */
.hero-animation {
  --notch-bg: #ffffff;
  /* ajusta al color de fondo real de la página */
  --notch-w: 112px;
  /* grosor del bloque invisible y de los rectángulos */
  --notch-h: 130px;
  /* alto del bloque invisible */
  --notch-radius: 32px;
  /* debe coincidir con el border-radius de .hero-section */

  position: absolute;
  inset: 0;
  border-radius: var(--notch-radius);
  overflow: hidden;
  background-color: rgb(224, 224, 224);
  /* aquí irá el <video>/animación en el futuro */
  z-index: 0;
  pointer-events: none;
}

/* Bloque invisible (mismo color que el fondo de la página) */
.hero-animation-notch {
  position: absolute;
  top: 0;
  left: 0;
  width: var(--notch-w);
  height: var(--notch-h);
  background-color: var(--notch-bg);
  border-top-left-radius: var(--notch-radius);
  z-index: 2;
}

/* Contenedor de los dos rectángulos superpuestos, justo debajo del bloque invisible */
.hero-animation-curve {
  position: absolute;
  top: var(--notch-h);
  left: 0;
  width: var(--notch-w);
  height: 30px;
  z-index: 2;
}

/* Rectángulo 1: va detrás, mismo color que el bloque invisible (sin bordes) */
.rectangulo_1 {
  position: absolute;
  inset: 0;
  background-color: var(--notch-bg);
}

/* Rectángulo 2: va encima, mismo color que la animación,
   con esquinas superiores redondeadas → crea la curva de unión */
.rectangulo_2 {
  position: absolute;
  inset: 0;
  background-color: rgb(224, 224, 224);
  /* mismo color que .hero-animation */
  border-radius: var(--notch-radius) var(--notch-radius) 0 0;
  z-index: 1;
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

  /* En móvil el título vuelve al flujo normal, ya no aplica el recorte */
  .hero-animation-notch,
  .hero-animation-curve {
    display: none;
  }
}
</style>
