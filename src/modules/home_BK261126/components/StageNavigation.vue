<script setup>
defineProps({
  stages: { type: Array, required: true },
  activeIndex: { type: Number, default: 0 },
})
const emit = defineEmits(['navigate', 'map'])
</script>

<template>
  <nav class="stage-navigation" aria-label="Navegación del recorrido">
    <ol class="stage-navigation__list">
      <li v-for="(stage, index) in stages" :key="stage.id">
        <button
          type="button"
          class="stage-navigation__button"
          :class="{ 'is-active': index === activeIndex }"
          :aria-current="index === activeIndex ? 'step' : undefined"
          @click="emit('navigate', index)"
        >
          <span class="stage-navigation__dot" aria-hidden="true"></span>
          <span class="stage-navigation__label">{{ stage.titulo }}</span>
        </button>
      </li>
    </ol>
    <button type="button" class="stage-navigation__map" @click="emit('map')">
      <span class="stage-navigation__map-icon" aria-hidden="true">⌖</span>
      <span>Ir al mapa</span>
    </button>
  </nav>
</template>

<style scoped>
.stage-navigation {
  position: absolute;
  z-index: 3;
  top: 50%; left: clamp(15px, 3%, 46px);
  transform: translateY(-50%);
  width: min(180px, 18%);
  display: flex;
  flex-direction: column;
  max-height: calc(100% - 36px);
  gap: 14px;
}
.stage-navigation__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0;
  margin: 0;
  list-style: none;
  overflow-y: auto;
  scrollbar-width: thin;
}
.stage-navigation__button, .stage-navigation__map {
  appearance: none; border: 0; background: none; cursor: pointer;
  display: inline-flex; align-items: center;
  gap: 12px; min-height: 40px;
  font-family: NotoSans, sans-serif;
  font-size: 0.94rem;
  color: #627592;
  text-align: left;
  padding: 8px 5px;
  width: 100%;
}
.stage-navigation__button:hover, .stage-navigation__map:hover { color: #245baf; }
.stage-navigation__button:focus-visible, .stage-navigation__map:focus-visible {
  outline: 2px solid #2563eb; outline-offset: 3px; border-radius: 6px;
}
.stage-navigation__button.is-active { color: #163b7a; font-weight: 700; }
.stage-navigation__dot {
  width: 11px; height: 11px; border-radius: 50%; flex: none;
  border: 2px solid #90a4c2; background: #fff;
  transition: background 180ms ease, border-color 180ms ease;
}
.is-active .stage-navigation__dot { border-color: #2563eb; background: #2563eb; }
.stage-navigation__label { overflow-wrap: anywhere; }
.stage-navigation__map {
  border-top: 1px solid #cbd5e1;
  padding-top: 16px;
  font-weight: 700;
  color: #245baf;
}
.stage-navigation__map-icon { font-size: 1.3rem; }
@media (max-width: 767px) {
  .stage-navigation {
    top: 8px; left: 10px; right: 10px; width: auto;
    transform: none;
    max-height: none;
    flex-direction: row; align-items: stretch; gap: 8px;
    border-radius: 14px; padding: 5px 7px;
    background: rgb(255 255 255 / 86%);
    box-shadow: 0 4px 25px rgb(53 77 115 / 8%);
  }
  .stage-navigation__list {
    flex-direction: row; flex: 1; overflow-x: auto; overflow-y: hidden;
    gap: 5px; min-width: 0; white-space: nowrap;
  }
  .stage-navigation__button, .stage-navigation__map {
    min-height: 37px; width: auto; padding: 5px 8px;
    font-size: 0.8rem; gap: 6px;
  }
  .stage-navigation__dot { width: 9px; height: 9px; }
  .stage-navigation__map {
    border-top: none; border-left: 1px solid #cbd5e1;
    padding: 4px 6px 4px 10px;
    white-space: nowrap;
  }
  .stage-navigation__map-icon { display: none; }
}
</style>
