<script setup>
import { MEXICO_ICON } from '@/assets/img/mexicoIcon'
import { handleMouseMove, handleMouseLeave } from '../composables/gsap/magenticButton'

import { useActivateClickLayer } from '@/stores/layerActivoStore'
const ClickLayer = useActivateClickLayer()

const emit = defineEmits(['go-back', 'toggle-proyectos', 'button-mousemove', 'button-mouseleave'])
</script>

<template>
  <div class="buttons">
    <!-- Botón para regresar a vista México -->
    <button
      class="focus-mexico shadow-lg"
      @click="emit('go-back')"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
    >
      <div class="magnetic">
        <svg width="90" height="90" viewBox="150 -40 200 600" xmlns="http://www.w3.org/2000/svg">
          <path fill="#afafaf" :d="MEXICO_ICON" />
        </svg>
      </div>
    </button>

    <!-- Botón magnético -->
    <button
      class="back-button shadow-lg"
      @click="emit('toggle-proyectos')"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
    >
      <div class="magnetic">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="#005cc8"
          viewBox="0 0 16 16"
        >
          <path
            fill-rule="evenodd"
            d="M3.1 11.2a.5.5 0 0 1 .4-.2H6a.5.5 0 0 1 0 1H3.75L1.5 15h13l-2.25-3H10a.5.5 0 0 1 0-1h2.5a.5.5 0 0 1 .4.2l3 4a.5.5 0 0 1-.4.8H.5a.5.5 0 0 1-.4-.8z"
          />
          <path
            fill-rule="evenodd"
            d="M4 4a4 4 0 1 1 4.5 3.969V13.5a.5.5 0 0 1-1 0V7.97A4 4 0 0 1 4 3.999z"
          />
        </svg>
      </div>
    </button>

    <!-- Botón magnético -->
    <button
      class="radar shadow-lg"
      @click="ClickLayer.toggleClick"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
    >
      <div class="magnetic">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          class="bi bi-crosshair"
          viewBox="0 0 16 16"
        >
          <path
            d="M8.5.5a.5.5 0 0 0-1 0v.518A7 7 0 0 0 1.018 7.5H.5a.5.5 0 0 0 0 1h.518A7 7 0 0 0 7.5 14.982v.518a.5.5 0 0 0 1 0v-.518A7 7 0 0 0 14.982 8.5h.518a.5.5 0 0 0 0-1h-.518A7 7 0 0 0 8.5 1.018zm-6.48 7A6 6 0 0 1 7.5 2.02v.48a.5.5 0 0 0 1 0v-.48a6 6 0 0 1 5.48 5.48h-.48a.5.5 0 0 0 0 1h.48a6 6 0 0 1-5.48 5.48v-.48a.5.5 0 0 0-1 0v.48A6 6 0 0 1 2.02 8.5h.48a.5.5 0 0 0 0-1zM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4"
          />
        </svg>
      </div>
    </button>
  </div>
</template>
<style scoped>
.back-button {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  background: white;
  border: 1px solid #e41616;
  cursor: pointer;
}

.focus-mexico {
  position: absolute;
  top: -10px;
  right: -10px;
  z-index: 1000;
  background: rgb(255, 255, 255);
  /* border: 1px solid blue; */
  cursor: pointer;
  border-radius: 100px;

  overflow: hidden;

  justify-items: center;
  align-content: center;
  /* padding: 1rem; */

  height: 100px;
  aspect-ratio: 1/1;

  transform: scale(0.4);

  display: flex;
  align-items: center;
  justify-content: center;

  will-change: transform;
}

.back-button {
  position: absolute;
  top: 80px;
  right: 20px;
  z-index: 1000;
  background: #fff;
  cursor: pointer;
  border-radius: 100px;
  overflow: hidden;
  border: none;

  height: 38px;
  aspect-ratio: 1 / 1;

  display: flex;
  align-items: center;
  justify-content: center;

  will-change: transform;
}

.radar {
  position: absolute;
  top: 135px;
  right: 20px;
  z-index: 1000;
  background: #fff;
  cursor: pointer;
  border-radius: 100px;
  overflow: hidden;
  border: none;

  height: 38px;
  aspect-ratio: 1 / 1;

  display: flex;
  align-items: center;
  justify-content: center;

  will-change: transform;
}

.magnetic {
  display: flex;
  align-items: center;
  justify-content: center;
  will-change: transform;
  pointer-events: none; /* importante para que el mouse siga "perteneciendo" al botón */
}
</style>
