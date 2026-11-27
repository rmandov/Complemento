<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  stages: { type: Array, required: true },
  activeIndex: { type: Number, default: 0 },
  mapRoute: { type: String, default: '/mapa' },
})
const emit = defineEmits(['navigate'])
</script>

<template>
  <nav class="stage-navigation" aria-label="Navegación del recorrido">
    <ol class="stage-navigation__list">
      <li v-for="(stage, index) in stages" :key="stage.id">
        <button type="button" class="stage-navigation__button" :class="{ 'is-active': index === activeIndex }"
          :aria-label="`Etapa ${index + 1}: ${stage.titulo}`" :title="stage.titulo"
          :aria-current="index === activeIndex ? 'step' : undefined" @click="emit('navigate', index)">
          <span class="stage-navigation__number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>

        </button>
      </li>
    </ol>

    <!-- Siempre accesible durante el recorrido; navega a /mapa directamente. -->
    <RouterLink :to="mapRoute" class="stage-navigation__map" aria-label="Ir al mapa" title="Ir al mapa">
      <span class="stage-navigation__map-icon" aria-hidden="true">⌖</span>
      <span class="stage-navigation__map-label">Ir al mapa</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.stage-navigation {
  position: absolute;
  z-index: 3;
  top: 0;
  bottom: 0;
  left: clamp(8px, 2%, 28px);
  width: clamp(150px, 17%, 210px);
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 18px;
  padding: 18px 4px 24px;
  box-sizing: border-box;
}

.stage-navigation__list {
  align-self: center;
  max-height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px;
  margin: 0;
  list-style: none;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #9bb7e7 #fff;
}

.stage-navigation__button,
.stage-navigation__map {
  box-sizing: border-box;
  appearance: none;
  border: 0;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  font-family: NotoSans, sans-serif;
  font-size: 0.9rem;
  line-height: 1.4;
  color: #61718b;
  text-align: left;
  text-decoration: none;
  padding: 8px 4px;
  width: 100%;
}

.stage-navigation__button:hover,
.stage-navigation__map:hover {
  color: #245baf;
}

.stage-navigation__button:focus-visible,
.stage-navigation__map:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
  border-radius: 6px;
}

.stage-navigation__button.is-active {
  color: #163b7a;
  font-weight: 700;
}

.stage-navigation__number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex: none;
  display: grid;
  place-items: center;
  border: 1px solid #d7e1f0;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  transition: background 180ms ease, border-color 180ms ease;
}

.is-active .stage-navigation__number {
  border-color: #3075ed;
  background: #3075ed;
  color: #fff;
}

.stage-navigation__label {
  overflow-wrap: anywhere;
}

.stage-navigation__map {
  flex: none;
  border: 1px solid #9ab7e7;
  border-radius: 10px;
  padding: 10px 12px;
  font-weight: 700;
  color: #245baf;
  justify-content: center;
}

.stage-navigation__map-icon {
  font-size: 1.4rem;
  line-height: 1;
}

@media (max-width: 767px) {

  /* En móvil también se conserva el lateral izquierdo, con etapas numeradas. */
  .stage-navigation {
    left: 4px;
    width: 58px;
    padding: 8px 3px 16px;
    gap: 12px;
  }

  .stage-navigation__list {
    padding: 3px;
    gap: 8px;
  }

  .stage-navigation__button {
    justify-content: center;
    padding: 4px 0;
    min-height: 44px;
  }

  .stage-navigation__number {
    width: 34px;
    height: 34px;
  }

  .stage-navigation__label,
  .stage-navigation__map-label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .stage-navigation__map {
    padding: 10px 0;
    min-height: 46px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .stage-navigation__number {
    transition: none;
  }
}
</style>
