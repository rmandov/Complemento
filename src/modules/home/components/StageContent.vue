<script setup>
defineProps({
  stage: { type: Object, default: null },
  number: { type: Number, default: 1 },
  total: { type: Number, default: 1 },
})
</script>

<template>
  <div class="stage-content" aria-live="polite" aria-atomic="true">
    <Transition name="stage-fade" mode="out-in" appear>
      <article v-if="stage" :key="stage.id" :class="[
        'stage-content__panel',
        number % 2 === 1
          ? 'stage-content__panel--left'
          : 'stage-content__panel--right'
      ]">
        <p class="stage-content__eyebrow">
          Recorrido {{ number }} / {{ total }}
        </p>

        <h2 class="stage-content__title">
          {{ stage.titulo }}
        </h2>

        <p class="stage-content__text">
          {{ stage.texto1 }}
        </p>

        <p class="stage-content__text">
          {{ stage.texto2 }}
        </p>
      </article>
    </Transition>
  </div>
</template>

<style scoped>
.stage-content {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.stage-content__panel {
  position: absolute;
  bottom: clamp(26px, 8%, 105px);
  width: min(39%, 430px);
  box-sizing: border-box;

  border: 1px solid rgb(147 167 199 / 24%);
  border-radius: 22px;
  padding: clamp(19px, 2.4vw, 32px);
  background: rgb(255 255 255 / 90%);
  box-shadow: 0 14px 50px rgb(53 77 115 / 9%);
  backdrop-filter: blur(12px);
}

/* Etapas 1, 3, 5, 7... */
.stage-content__panel--left {
  left: clamp(190px, 19%, 280px);
  right: auto;
}

/* Etapas 2, 4, 6, 8... */
.stage-content__panel--right {
  right: clamp(24px, 5%, 90px);
  left: auto;
}

.stage-content__eyebrow {
  margin: 0 0 10px;
  color: #53719b;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.72rem;
  font-weight: 700;
}

.stage-content__title {
  font-family: NotoSansBold, NotoSans, sans-serif;
  font-size: clamp(1.4rem, 1.6vw + 0.6rem, 2.15rem);
  margin: 0 0 14px;
  line-height: 1.15;
  color: #172b49;
}

.stage-content__text {
  color: #344762;
  line-height: 1.55;
  font-size: clamp(0.9rem, 0.5vw + 0.75rem, 1.05rem);
  margin: 0 0 11px;
}

.stage-content__text:last-child {
  margin-bottom: 0;
}

.stage-fade-enter-active,
.stage-fade-leave-active {
  transition:
    opacity 0.45s ease,
    transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
}

/* El texto izquierdo entra desde la izquierda */
.stage-content__panel--left.stage-fade-enter-from {
  opacity: 0;
  transform: translateX(-45px);
}

/* El texto derecho entra desde la derecha */
.stage-content__panel--right.stage-fade-enter-from {
  opacity: 0;
  transform: translateX(45px);
}

/* Salidas alternadas */
.stage-content__panel--left.stage-fade-leave-to {
  opacity: 0;
  transform: translateX(-25px);
}

.stage-content__panel--right.stage-fade-leave-to {
  opacity: 0;
  transform: translateX(25px);
}

@media (max-width: 1023px) {
  .stage-content__panel {
    width: min(51%, 450px);
  }

  .stage-content__panel--left {
    left: 23%;
  }

  .stage-content__panel--right {
    right: 5%;
  }
}

@media (max-width: 767px) {
  .stage-content__panel {
    width: min(86%, 360px);
    bottom: 15px;
    padding: 18px;
    border-radius: 17px;
  }

  .stage-content__panel--left {
    left: 12px;
    right: auto;
  }

  .stage-content__panel--right {
    right: 12px;
    left: auto;
  }

  .stage-content__title {
    font-size: clamp(1.35rem, 5vw, 1.7rem);
    margin-bottom: 8px;
  }

  .stage-content__text {
    font-size: 0.88rem;
    line-height: 1.42;
    margin-bottom: 6px;
  }
}

@media (max-height: 560px) {
  .stage-content {
    bottom: 8px;
  }

  .stage-content__panel {
    padding: 12px 15px;
  }

  .stage-content__eyebrow {
    margin-bottom: 4px;
  }

  .stage-content__title {
    margin-bottom: 4px;
  }

  .stage-content__text {
    line-height: 1.3;
  }
}

@media (prefers-reduced-motion: reduce) {

  .stage-fade-enter-active,
  .stage-fade-leave-active {
    transition: none;
  }
}
</style>
