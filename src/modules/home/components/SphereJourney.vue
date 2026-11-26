<script setup>
import { ref } from 'vue'
import StageContent from './StageContent.vue'
import StageNavigation from './StageNavigation.vue'
import { useScrollStages } from '../composables/useScrollStages'
import { useJourneyScene } from '../composables/useJourneyScene'
import stagesJson from '../data/stages.json'
import { JOURNEY_CONFIG } from '../config/journeyConfig'

const stages = stagesJson.filter((item) => item && item.id && item.titulo)
const sectionRef = ref(null)
const canvasRef = ref(null)
const { progress, activeIndex, goToStage } = useScrollStages(sectionRef, stages.length)
const { error } = useJourneyScene(canvasRef, progress, stages.length)
/* const stage = computed(() => stages[activeIndex.value] || null) */

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
      <!-- <h1 class="title">
        Complementariedades y sinergias de los
        Programas y Proyectos de Inversión (PPI)
      </h1> -->

      <div class="sphere-journey__stage">
        <div ref="canvasRef" class="sphere-journey__canvas" aria-hidden="true"></div>
        <StageNavigation :stages="stages" :active-index="activeIndex" :map-route="JOURNEY_CONFIG.layout.mapRoute"
          @navigate="goToStage" />
        <StageContent :stages="stages" :progress="progress" />

        <p v-if="error" class="sphere-journey__error" role="alert">{{ error }}</p>
        <p v-if="!stages.length" class="sphere-journey__error">Agrega etapas en data/stages.json.</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.sphere-journey {
  --journey-navbar-offset: var(--journey-navbar-desktop);
  position: relative;
  height: var(--journey-height);
  min-height: calc(100svh - var(--journey-navbar-offset));
  width: 100%;
  isolation: isolate;
  background: #fff;
  /* Mantener overflow visible en los ancestros para que funcione sticky. */
}

.sphere-journey__sticky {
  position: sticky;
  top: var(--journey-navbar-offset);
  height: calc(100svh - var(--journey-navbar-offset));
  width: 100%;
  overflow: hidden;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.title {
  flex: none;
  position: relative;
  z-index: 4;
  margin: 0;
  padding: 18px 24px 12px;
  font-size: clamp(1.35rem, 2.3vw, 2.35rem);
  font-family: NotoSans-ExtraBold, NotoSans, sans-serif;
  line-height: 1.25;
  text-align: center;
  color: #000000;
  background: #fff;
}

.sphere-journey__stage {
  position: relative;
  flex: 1;
  min-height: 0;
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
  top: 10px;
  right: 15px;
  max-width: 430px;
  padding: 12px 16px;
  border-radius: 10px;
  background: #fff;
  color: #9c2a30;
  font-size: 0.9rem;
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

  .title {
    font-size: clamp(1rem, 4.2vw, 1.3rem);
    padding: 12px 12px 8px;
  }

  .sphere-journey__error {
    left: 75px;
    right: 12px;
    font-size: 0.85rem;
  }
}

@media (max-height: 500px) {
  .title {
    font-size: 1rem;
    padding: 8px 12px;
  }
}
</style>
