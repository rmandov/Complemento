<template>
  <div v-if="cards.length" class="gallery" ref="galleryRef">
    <ul class="cards" ref="cardsRef">
      <li v-for="(card, index) in cards" :key="index" :ref="(el) => setCardRef(el, index)" @click="goToCard(index)"
        class="card-item">
        <img :src="card.image" :alt="card.title" loading="lazy" />

        <div class="card-content">
          <h3>{{ card.title }}</h3>
          <p>{{ card.description }}</p>
        </div>
      </li>
    </ul>

    <template v-if="cards.length > 1">
      <button class="arrow arrow-prev" @click="prev" aria-label="Anterior">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <button class="arrow arrow-next" @click="next" aria-label="Siguiente">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      <div class="actions">
        <button class="prev" @click="prev">Prev</button>
        <button class="next" @click="next">Next</button>
      </div>
    </template>
  </div>

  <div v-if="cards.length > 1" class="drag-proxy" ref="dragProxyRef"></div>
</template>


<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import gsap from 'gsap'
import { Draggable } from 'gsap/Draggable'
import cardsData from './cards.json'

gsap.registerPlugin(Draggable)

// Datos originales, sin duplicaciones
const cards = Array.isArray(cardsData) ? cardsData : []
const totalCards = cards.length

const galleryRef = ref(null)
const cardsRef = ref(null)
const dragProxyRef = ref(null)

const cardElements = []

const setCardRef = (el, index) => {
  if (el) cardElements[index] = el
}

// Posición virtual del carrusel
const playhead = { position: 0 }

let draggableInstance = null
let resizeObserver = null
let pixelsPerCard = 150

// Distancia circular más corta entre tarjetas
const circularDistance = (index, position, total) => {
  let distance = (index - position) % total

  if (distance > total / 2) distance -= total
  if (distance < -total / 2) distance += total

  return distance
}

// Calcula la presentación de las tarjetas
const renderCarousel = () => {
  if (!galleryRef.value || !cardElements.length) return

  const galleryWidth = galleryRef.value.clientWidth
  const cardWidth = cardElements[0].offsetWidth || 224

  // Caso 1: una única tarjeta
  if (totalCards === 1) {
    gsap.set(cardElements[0], {
      x: 0,
      scale: 1,
      opacity: 1,
      visibility: 'visible',
      zIndex: 100,
    })
    return
  }

  // Caso 2: dos tarjetas, visibles sin duplicar
  if (totalCards === 2) {
    const baseScale =
      galleryWidth <= 768
        ? Math.min(0.66, (galleryWidth - 32) / (2 * cardWidth))
        : 0.96

    const gap =
      cardWidth * baseScale + (galleryWidth <= 768 ? 8 : 24)

    cardElements.forEach((element, index) => {
      const distance = Math.abs(
        circularDistance(index, playhead.position, totalCards)
      )

      const focus = Math.max(0, 1 - distance)

      gsap.set(element, {
        x: (index === 0 ? -1 : 1) * gap / 2,
        scale: baseScale * (0.9 + focus * 0.1),
        opacity: 0.72 + focus * 0.28,
        visibility: 'visible',
        zIndex: Math.round(10 + focus * 90),
      })
    })

    pixelsPerCard = gap
    return
  }

  // Caso 3: tres o más tarjetas
  pixelsPerCard = Math.min(
    cardWidth * 0.83,
    Math.max(76, (galleryWidth - cardWidth) / 4)
  )

  const visibleSides =
    galleryWidth <= 768
      ? 0
      : Math.max(
        1,
        Math.floor(
          (galleryWidth - cardWidth) / (2 * pixelsPerCard)
        )
      )

  cardElements.forEach((element, index) => {
    const distance = circularDistance(
      index,
      playhead.position,
      totalCards
    )

    const absDistance = Math.abs(distance)

    const opacity = gsap.utils.clamp(
      0,
      1,
      visibleSides + 1 - absDistance
    )

    const scale = Math.max(0.64, 1 - absDistance * 0.11)

    gsap.set(element, {
      x: distance * pixelsPerCard,
      scale,
      opacity,
      visibility: opacity > 0 ? 'visible' : 'hidden',
      zIndex: Math.round(100 - absDistance * 10),
      pointerEvents: opacity > 0.2 ? 'auto' : 'none',
    })
  })
}

// Animar hacia una posición del carrusel
const animateToPosition = (position) => {
  if (totalCards <= 1) return

  gsap.killTweensOf(playhead)

  gsap.to(playhead, {
    position,
    duration: 0.6,
    ease: 'power3.out',
    onUpdate: renderCarousel,
    onComplete: renderCarousel,
  })
}

// Seleccionar una tarjeta
const goToCard = (index) => {
  if (totalCards <= 1) return

  // Buscar el camino circular más corto
  const cycle = Math.round(
    (playhead.position - index) / totalCards
  )

  const target = index + cycle * totalCards

  animateToPosition(target)
}

// Navegación circular
const next = () => {
  if (totalCards <= 1) return
  animateToPosition(Math.round(playhead.position) + 1)
}

const prev = () => {
  if (totalCards <= 1) return
  animateToPosition(Math.round(playhead.position) - 1)
}

// Inicialización
const initCarousel = () => {
  if (!totalCards) return

  renderCarousel()

  // Una tarjeta no necesita desplazamiento
  if (totalCards === 1) return

  if (dragProxyRef.value && cardsRef.value) {
    draggableInstance = Draggable.create(dragProxyRef.value, {
      type: 'x',
      trigger: cardsRef.value,

      onPress() {
        gsap.killTweensOf(playhead)
        this.startPosition = playhead.position
      },

      onDrag() {
        const movement = this.x - this.startX

        playhead.position =
          this.startPosition - movement / pixelsPerCard

        renderCarousel()
      },

      onDragEnd() {
        animateToPosition(Math.round(playhead.position))
      },
    })[0]
  }
}

onMounted(() => {
  initCarousel()

  if (galleryRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(renderCarousel)
    resizeObserver.observe(galleryRef.value)
  }
})

onUnmounted(() => {
  gsap.killTweensOf(playhead)
  draggableInstance?.kill()
  resizeObserver?.disconnect()
})
</script>


<style scoped>
* {
  box-sizing: border-box;
}

.gallery {
  position: relative;
  width: 100%;
  height: 60vh;
  overflow: hidden;
  background: #ffffff;
  user-select: none;
  -webkit-user-select: none;
}

.cards {
  position: absolute;
  width: 14rem;
  height: 22rem;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 0;
  margin: 0;
}

.cards li {
  list-style: none;
  padding: 0;
  margin: 0;
  width: 14rem;
  aspect-ratio: 9/16;
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 0.8rem;
  overflow: hidden;
  background: #696969;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  transition: box-shadow 0.3s ease;
}

.cards li:hover {
  box-shadow: 0 15px 40px rgb(63, 63, 63);
}

.cards li img {
  width: 100%;
  height: 55%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}

.card-content {
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  pointer-events: none;
  background-color: #5e5e5e;
}

.card-content h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  color: #fff;
  font-weight: 600;
}

.card-content p {
  margin: 0;
  font-size: 0.8rem;
  color: #e4e4e4;
  line-height: 1.4;
}

/* ─── Desktop ─── */
.actions {
  position: absolute;
  bottom: 0px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  z-index: 10;
}

.actions button {
  background: #dddddd;
  border: none;
  padding: 0.6rem 1.4rem;
  border-radius: 2rem;
  color: #000000;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.2s,
    background 0.2s;
}

.actions button:hover {
  transform: scale(1.05);
  background: #aaaaaa;
}

.arrow {
  display: none;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.25);
  color: #fff;
  cursor: pointer;
  z-index: 20;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  transition:
    opacity 0.3s,
    background 0.3s;
}

.arrow svg {
  width: 20px;
  height: 20px;
}

.arrow-prev {
  left: 12px;
}

.arrow-next {
  right: 12px;
}

/* ─── Tablet pequeña y móvil ─── */
@media (max-width: 768px) {
  .gallery {
    height: 70vh;
    touch-action: pan-y;
  }

  /*
    CLAVE DEL FIX:
    - En lugar de width:75vw (que hace tarjetas gigantes en tablets),
    - Usamos height:min(60vh,520px) como dimensión principal.
    - El ancho se calcula automáticamente desde aspect-ratio:9/16.
    - max-width:85vw evita que en landscape exótico se desborde horizontal.
  */
  .cards {
    width: auto;
    height: min(60vh, 520px);
    max-width: 85vw;
    aspect-ratio: 9/16;
    top: 50%;
    /* centrado vertical perfecto */
  }

  .cards li {
    width: auto;
    height: 100%;
    max-width: 85vw;
    aspect-ratio: 9/16;
    border-radius: 1rem;
  }

  .card-content h3 {
    font-size: 1rem;
  }

  .card-content p {
    font-size: 0.75rem;
  }

  .actions {
    display: none;
  }

  .arrow {
    display: flex;
    opacity: 0.35;
  }

  .arrow:active {
    opacity: 0.8;
    background: rgba(0, 0, 0, 0.45);
  }

  .cards::after {
    content: '';
    position: absolute;
    bottom: -30px;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 4px;
    background: rgba(0, 0, 0, 0.15);
    border-radius: 2px;
    pointer-events: none;
  }
}

/* ─── Móvil muy pequeño: ajuste fino ─── */
@media (max-width: 400px) {
  .cards {
    height: min(65vh, 480px);
  }
}

/* ─── Tablets landscape / medianas ─── */
@media (min-width: 769px) and (max-width: 1024px) {
  .cards {
    width: 12rem;
    height: 19rem;
  }

  .cards li {
    width: 12rem;
  }
}

.drag-proxy {
  visibility: hidden;
  position: absolute;
}
</style>
