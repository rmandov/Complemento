<script setup>
import { computed, ref } from 'vue'
import StageContent from './StageContent.vue'
import StageNavigation from './StageNavigation.vue'
import { useScrollStages } from '../composables/useScrollStages'
import { useJourneyScene } from '../composables/useJourneyScene'
import stagesJson from '../data/stages.json'
import { JOURNEY_CONFIG } from '../config/journeyConfig'

// Todas las etapas vienen de stages.json; NO duplicar etapas en los componentes.
const stages = stagesJson.filter((item) => item && item.id && item.titulo)
const sectionRef = ref(null)
const canvasRef = ref(null)
const { progress, activeIndex, goToStage, goToMap } = useScrollStages(sectionRef, stages.length)
const { error } = useJourneyScene(canvasRef, progress, stages.length)
const stage = computed(() => stages[activeIndex.value] || null)

const journeyStyle = {
  '--journey-navbar-desktop': `${JOURNEY_CONFIG.layout.navbarDesktopPx}px`,
  '--journey-navbar-tablet': `${JOURNEY_CONFIG.layout.navbarTabletPx}px`,
  '--journey-navbar-mobile': `${JOURNEY_CONFIG.layout.navbarMobilePx}px`,
  '--journey-height': `calc(100svh - var(--journey-navbar-offset) + ${Math.max(0, stages.length - 1) * JOURNEY_CONFIG.journey.scrollVhPerStage}svh)`,
}
</script>

<template>
  <section ref="sectionRef" class="sphere-journey" :style="journeyStyle" aria-label="Recorrido interactivo 3D">
    <div class="sphere-journey__sticky">

      <!-- Título fijo durante el recorrido -->
      <h1 class="title">
        Complementariedades y sinergias de los
        Programas y Proyectos de Inversión (PPI)
      </h1>

      <div ref="canvasRef" class="sphere-journey__canvas" aria-hidden="true"></div>

      <StageNavigation v-if="stages.length" :stages="stages" :active-index="activeIndex" @navigate="goToStage"
        @map="goToMap" />

      <StageContent :stage="stage" :number="activeIndex + 1" :total="stages.length" />

      <p v-if="error" class="sphere-journey__error" role="alert">
        {{ error }}
      </p>

      <p v-if="!stages.length" class="sphere-journey__error">
        Agrega etapas en data/stages.json.
      </p>

    </div>
  </section>
</template>

<style scoped>
.title {
  position: absolute;
  top: 0;
  left: 0;

  width: 100%;
  margin: 0;
  padding: 18px 24px;

  font-size: clamp(1.5rem, 2.5vw, 2.5rem);
  font-family: NotoSans-ExtraBold, sans-serif;
  text-align: center;
  color: #000;

  z-index: 10;
  pointer-events: none;
}

.sphere-journey {
  --journey-navbar-offset: var(--journey-navbar-desktop);
  position: relative;
  height: var(--journey-height);
  min-height: calc(100svh - var(--journey-navbar-offset));
  width: 100%;
  isolation: isolate;
  margin-bottom: 45px;
  /* No poner overflow:hidden/auto: desactiva el sticky del hijo. */
}

.sphere-journey__sticky {
  position: sticky;
  top: var(--journey-navbar-offset);
  height: calc(100svh - var(--journey-navbar-offset));
  min-height: 270px;
  width: 100%;
  border-radius: 26px;
  overflow: hidden;
  background: transparent;
}

.sphere-journey__canvas {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.sphere-journey__canvas :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

.sphere-journey__error {
  z-index: 4;
  position: absolute;
  top: 70px;
  right: 15px;
  max-width: 430px;
  padding: 12px 16px;
  border-radius: 10px;
  background: #ffffff;
  color: #9c2a30;
  font-size: 0.88rem;
}

@media (max-width: 1023px) {
  .sphere-journey {
    --journey-navbar-offset: var(--journey-navbar-tablet);
  }
}

@media (max-width: 767px) {
  .sphere-journey {
    --journey-navbar-offset: var(--journey-navbar-mobile);
  }

  .sphere-journey__sticky {
    border-radius: 16px;
  }

  .sphere-journey__error {
    top: 58px;
  }
}
</style>
