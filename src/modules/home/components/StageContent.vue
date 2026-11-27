<script setup>
import { computed } from 'vue'

const props = defineProps({
  stages: { type: Array, default: () => [] },
  progress: { type: Number, default: 0 },
})

// Desplazamiento continuo basado en el mismo progreso del scroll.
// Al detener el scroll, también se detiene el texto.
const position = computed(() => {
  const progress = Math.max(0, Math.min(1, props.progress))

  return progress * Math.max(0, props.stages.length - 1)
})
</script>

<template>
  <!-- Esta ventana aplica el difuminado únicamente al texto. -->
  <div class="stage-content">
    <div class="stage-content__track" :style="{
      transform: `translate3d(0, ${-position * 100}%, 0)`,
    }">
      <!-- Todas las etapas están presentes y se desplazan juntas. -->
      <article v-for="(stage, index) in stages" :key="stage.id" :style="{ top: `${index * 100}%` }" :class="[
        'stage-content__step',
        index % 2 === 0 ? 'is-left' : 'is-right',
      ]">
        <div class="stage-content__copy">
          <p class="stage-content__eyebrow">
            Etapa {{ index + 1 }} / {{ stages.length }}
          </p>

          <h2 class="stage-content__title">
            {{ stage.titulo }}
          </h2>

          <p v-if="stage.texto1" class="stage-content__text">
            {{ stage.texto1 }}
          </p>

          <p v-if="stage.texto2" class="stage-content__text">
            {{ stage.texto2 }}
          </p>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.stage-content {
  /* Tamaño del difuminado superior e inferior. */
  --fade-zone: 20%;

  position: absolute;
  inset: 0;
  z-index: 2;
  overflow: hidden;
  pointer-events: none;

  -webkit-mask-image: linear-gradient(to bottom,
      transparent 0%,
      #000 var(--fade-zone),
      #000 calc(100% - var(--fade-zone)),
      transparent 100%);

  mask-image: linear-gradient(to bottom,
      transparent 0%,
      #000 var(--fade-zone),
      #000 calc(100% - var(--fade-zone)),
      transparent 100%);
}

/* Este contenedor completo se mueve con el scroll. */
.stage-content__track {
  position: absolute;
  inset: 0;
  will-change: transform;
}

/* Cada etapa ocupa una pantalla del área de contenido. */
.stage-content__step {
  position: absolute;
  left: 0;
  width: 100%;
  height: 100%;

  display: flex;
  align-items: center;
}

.stage-content__copy {
  box-sizing: border-box;
  width: min(37%, 430px);
  padding-block: 24px;
  pointer-events: auto;
}

/* Alternancia de los textos en escritorio. */
.is-left .stage-content__copy {
  margin-left: clamp(200px, 21%, 300px);
}

.is-right .stage-content__copy {
  margin-left: auto;
  margin-right: clamp(20px, 4%, 70px);
}

.stage-content__eyebrow {
  margin: 0 0 12px;
  color: #53719b;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.stage-content__title {
  margin: 0 0 18px;
  font-family: NotoSansBold, NotoSans, sans-serif;
  font-size: clamp(1.5rem, 2vw, 2.2rem);
  line-height: 1.2;
  color: #172b49;
}

.stage-content__text {
  margin: 0 0 14px;
  font-size: clamp(1rem, 1.1vw, 1.1rem);
  line-height: 1.65;
  color: #344762;
}

.stage-content__text:last-child {
  margin-bottom: 0;
}

@media (min-width: 768px) and (max-width: 1023px) {
  .stage-content__copy {
    width: 48%;
  }

  .is-left .stage-content__copy {
    margin-left: 23%;
  }
}

@media (max-width: 767px) {
  .stage-content {
    --fade-zone: 12%;
  }

  .stage-content__step {
    align-items: flex-end;
  }

  .stage-content__copy {
    width: auto;
    max-width: none;
    margin-bottom: clamp(56px, 12svh, 110px);
    padding-block: 16px;
  }

  .is-left .stage-content__copy,
  .is-right .stage-content__copy {
    margin-left: 76px;
    margin-right: 16px;
  }

  .stage-content__title {
    font-size: clamp(1.15rem, 4.3vw, 1.6rem);
    margin-bottom: 10px;
  }

  .stage-content__text {
    font-size: 0.9rem;
    line-height: 1.5;
  }
}
</style>
