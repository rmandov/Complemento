<template>
  
  <div class="carousel-wrapper">
    <!-- Botón Izquierda -->
    <button class="carousel-btn" @click="scrollLeft">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>

    <!-- Carrusel -->
    <div class="carousel-viewport" ref="viewportRef">
      <div class="carousel-track" :style="trackStyle" @transitionend="handleTransitionEnd">
        <div
          v-for="(item, index) in infiniteItems"
          :key="`${item.id}-${index}`"
          class="carousel-slide"
        >
          <div class="project-card">
            <div class="project-card__image-wrapper">
              <img
                :src="item.image"
                :alt="item.projectName"
                class="project-card__image"
                loading="lazy"
              />
            </div>
            <div class="project-card__info">
              <h3 class="project-card__title">{{ item.projectName }}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Botón Derecha -->
    <button class="carousel-btn" @click="scrollRight">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

// ── Props ──────────────────────────────────────────────
const props = defineProps({
  items: {
    type: Array,
    required: true,
    // Estructura esperada: [{ id, projectName, image }]
  },
  autoplay: {
    type: Boolean,
    default: false,
  },
  autoplaySpeed: {
    type: Number,
    default: 4000,
  },
})

// ── Refs ───────────────────────────────────────────────
const viewportRef = ref(null)
const currentIndex = ref(0)
const isTransitioning = ref(false)
const itemsPerView = ref(7)
let autoplayInterval = null

// ── Responsive: detectar items visibles ────────────────
const breakpoints = [
  { width: 1400, items: 7 },
  { width: 1200, items: 5 },
  { width: 768, items: 3 },
  { width: 0, items: 1 },
]

function updateItemsPerView() {
  const width = window.innerWidth
  for (const bp of breakpoints) {
    if (width >= bp.width) {
      itemsPerView.value = bp.items
      break
    }
  }
}

// ── Items infinitos (clonamos al inicio y al final) ────
// Clonamos los últimos N items al principio y los primeros N al final
const cloneCount = computed(() => itemsPerView.value)

const infiniteItems = computed(() => {
  const items = props.items
  if (!items.length) return []
  const count = cloneCount.value
  const startClone = items.slice(-count)
  const endClone = items.slice(0, count)
  return [...startClone, ...items, ...endClone]
})

const totalRealItems = computed(() => props.items.length)

// ── Estilos del track ──────────────────────────────────
const trackStyle = computed(() => {
  const gap = 16 // px
  const gapTotal = gap * (itemsPerView.value - 1)
  const slideWidth = `(100% - ${gapTotal}px) / ${itemsPerView.value}`
  const translateX = `calc((${slideWidth} + ${gap}px) * -${currentIndex.value})`
  return {
    transform: `translateX(${translateX})`,
    transition: isTransitioning.value
      ? 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      : 'none',
  }
})

// ── Navegación ─────────────────────────────────────────
function scrollRight() {
  if (isTransitioning.value) return
  isTransitioning.value = true
  currentIndex.value++
}

function scrollLeft() {
  if (isTransitioning.value) return
  isTransitioning.value = true
  currentIndex.value--
}

// ── Loop infinito: reseteo silencioso al terminar ──────
function handleTransitionEnd() {
  isTransitioning.value = false
  const realLen = totalRealItems.value
  const offset = cloneCount.value

  // Si avanzamos más allá del último item real → saltamos al inicio real
  if (currentIndex.value >= realLen + offset) {
    currentIndex.value = offset
  }
  // Si retrocedimos antes del primer item real → saltamos al final real
  if (currentIndex.value < offset) {
    currentIndex.value = realLen + offset - 1
  }
}

// ── Autoplay (opcional) ────────────────────────────────
function startAutoplay() {
  if (!props.autoplay || autoplayInterval) return
  autoplayInterval = setInterval(() => {
    scrollRight()
  }, props.autoplaySpeed)
}

function stopAutoplay() {
  if (autoplayInterval) {
    clearInterval(autoplayInterval)
    autoplayInterval = null
  }
}

// ── Inicialización ─────────────────────────────────────
onMounted(() => {
  updateItemsPerView()
  window.addEventListener('resize', updateItemsPerView)

  // Posicionamos el índice en el primer item real (después de los clones iniciales)
  const offset = cloneCount.value
  currentIndex.value = offset

  if (props.autoplay) startAutoplay()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateItemsPerView)
  stopAutoplay()
})

// Pausar autoplay al interactuar
watch(currentIndex, () => {
  if (props.autoplay) {
    stopAutoplay()
    startAutoplay()
  }
})
</script>

<style scoped>
/* ── Layout principal ─────────────────────────────────── */
.carousel-wrapper {
  position: relative;
  width: 100%;
  max-width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 0;
}

/* ── Viewport (máscara) ───────────────────────────────── */
.carousel-viewport {
  flex: 1;
  overflow: hidden;
  border-radius: 12px;
}

/* ── Track (desplazable) ──────────────────────────────── */
.carousel-track {
  display: flex;
  gap: 16px;
  will-change: transform;
}

/* ── Slide (cada recuadro) ────────────────────────────── */
.carousel-slide {
  flex: 0 0 auto;
  width: calc((100% - 96px) / 7); /* 7 items - 6 gaps de 16px */
  min-width: 0;
}

/* Breakpoints responsive */
@media (max-width: 1399px) {
  .carousel-slide {
    width: calc((100% - 64px) / 5); /* 5 items */
  }
}

@media (max-width: 1199px) {
  .carousel-slide {
    width: calc((100% - 32px) / 3); /* 3 items */
  }
}

@media (max-width: 767px) {
  .carousel-slide {
    width: 100%; /* 1 item */
  }
}

/* ── Tarjeta de proyecto ──────────────────────────────── */
.project-card {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  cursor: pointer;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.project-card__image-wrapper {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #f0f0f0;
}

.project-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.project-card:hover .project-card__image {
  transform: scale(1.05);
}

.project-card__info {
  padding: 12px 16px;
}

.project-card__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Botones de navegación ────────────────────────────── */
.carousel-btn {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  transition: all 0.2s ease;
  z-index: 2;
}

.carousel-btn:hover {
  background: #f5f5f5;
  transform: scale(1.1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.carousel-btn:active {
  transform: scale(0.95);
}

.carousel-btn svg {
  width: 20px;
  height: 20px;
}

/* Ocultar botones en móvil si lo prefieres */
@media (max-width: 767px) {
  .carousel-btn {
    width: 36px;
    height: 36px;
  }
}
</style>
