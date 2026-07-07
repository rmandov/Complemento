<template>
  <div class="gallery" ref="galleryRef">
    <ul class="cards" ref="cardsRef">
      <li
        v-for="(card, index) in loopCards"
        :key="index"
        :ref="el => setCardRef(el, index)"
      >
        <img :src="card.image" :alt="card.title" loading="lazy" />
        <div class="card-content">
          <h3>{{ card.title }}</h3>
          <p>{{ card.description }}</p>
        </div>
      </li>
    </ul>

    <div class="actions">
      <button class="prev" @click="prev">Prev</button>
      <button class="next" @click="next">Next</button>
    </div>
  </div>
  <div class="drag-proxy" ref="dragProxyRef"></div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
import cardsData from './cards.json';

gsap.registerPlugin(Draggable);

const galleryRef = ref(null);
const cardsRef = ref(null);
const dragProxyRef = ref(null);
const cardElements = ref([]);

const setCardRef = (el, index) => {
  if (el) cardElements.value[index] = el;
};

const spacing = 0.1;

// ── CLAVE 1: duplicar tarjetas hasta alcanzar el mínimo que exige el loop ──
// Con spacing 0.1 se necesitan ~16 elementos para que la fórmula de
// buildSeamlessLoop no genere una duración negativa en el segundo tween.
const loopCards = computed(() => {
  const minItems = Math.ceil(1.5 / spacing) + 1; // 16 para spacing=0.1
  const items = [];
  while (items.length < minItems) {
    items.push(...cardsData);
  }
  return items.slice(0, Math.max(minItems, cardsData.length * 3));
});

// ── Estado del playhead ──
const playhead = { offset: 0 };
let iteration = 0;
let seamlessLoop, wrapTime, snapTime;

// ── Animación individual de cada tarjeta ──
const animateFunc = (element) => {
  const tl = gsap.timeline();
  tl.fromTo(
    element,
    { scale: 0, opacity: 0 },
    {
      scale: 1,
      opacity: 1,
      zIndex: 100,
      duration: 0.5,
      yoyo: true,
      repeat: 1,
      ease: 'power1.in',
      immediateRender: false,
    }
  ).fromTo(
    element,
    { xPercent: 400 },
    { xPercent: -400, duration: 1, ease: 'none', immediateRender: false },
    0
  );
  return tl;
};

// ── Loop infinito (igual al original, pero con suficientes items) ──
const buildSeamlessLoop = (items, spacing, animateFunc) => {
  let overlap = Math.ceil(1 / spacing),
    startTime = items.length * spacing + 0.5,
    loopTime = (items.length + overlap) * spacing + 1,
    rawSequence = gsap.timeline({ paused: true }),
    seamlessLoop = gsap.timeline({
      paused: true,
      repeat: -1,
      onRepeat() {
        this._time === this._dur && (this._tTime += this._dur - 0.01);
      },
    }),
    l = items.length + overlap * 2,
    time, i, index;

  for (i = 0; i < l; i++) {
    index = i % items.length;
    time = i * spacing;
    rawSequence.add(animateFunc(items[index]), time);
    i <= items.length && seamlessLoop.add('label' + i, time);
  }

  rawSequence.time(startTime);
  seamlessLoop
    .to(rawSequence, {
      time: loopTime,
      duration: loopTime - startTime,
      ease: 'none',
    })
    .fromTo(
      rawSequence,
      { time: overlap * spacing + 1 },
      {
        time: startTime,
        duration: startTime - (overlap * spacing + 1),
        immediateRender: false,
        ease: 'none',
      }
    );
  return seamlessLoop;
};

const updateCarousel = (offset) => {
  seamlessLoop.time(wrapTime(offset));
};

// ── CLAVE 2: navegación con tracking de iteración (sin ScrollTrigger) ──
const animateToOffset = (offset) => {
  let snappedTime = snapTime(offset);
  let progress = (snappedTime - seamlessLoop.duration() * iteration) / seamlessLoop.duration();

  // Si cruzamos los límites [0, 1), ajustamos la iteración
  if (progress >= 1 || progress < 0) {
    iteration += Math.floor(progress);
  }

  // Recalcular progreso con la iteración ya corregida
  let newProgress = (snappedTime - seamlessLoop.duration() * iteration) / seamlessLoop.duration();
  let wrappedProgress = gsap.utils.wrap(0, 1, newProgress);
  let targetOffset = seamlessLoop.duration() * iteration + wrappedProgress * seamlessLoop.duration();

  // Snap final para aterrizar exactamente sobre una tarjeta
  targetOffset = snapTime(targetOffset);

  gsap.to(playhead, {
    offset: targetOffset,
    duration: 0.6,
    ease: 'power3.out',
    onUpdate: () => updateCarousel(playhead.offset),
  });
};

const next = () => animateToOffset(playhead.offset + spacing);
const prev = () => animateToOffset(playhead.offset - spacing);

// ── Inicialización ──
const initCarousel = () => {
  gsap.set(cardElements.value, { xPercent: 400, opacity: 0, scale: 0 });

  seamlessLoop = buildSeamlessLoop(cardElements.value, spacing, animateFunc);
  wrapTime = gsap.utils.wrap(0, seamlessLoop.duration());
  snapTime = gsap.utils.snap(spacing);

  updateCarousel(0);

  // Draggable horizontal
  Draggable.create(dragProxyRef.value, {
    type: 'x',
    trigger: cardsRef.value,
    onPress() {
      this.startOffset = playhead.offset;
    },
    onDrag() {
      playhead.offset = this.startOffset + (this.startX - this.x) * 0.001;
      updateCarousel(playhead.offset);
    },
    onDragEnd() {
      animateToOffset(playhead.offset);
    },
  });
};

onMounted(() => {
  initCarousel();
});
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.gallery {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #111;
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
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.cards li img {
  width: 100%;
  height: 55%;
  object-fit: cover;
  display: block;
}

.card-content {
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
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
  color: #aaa;
  line-height: 1.4;
}

.actions {
  position: absolute;
  bottom: 25px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  z-index: 10;
}

.actions button {
  background: #88ce02;
  border: none;
  padding: 0.6rem 1.4rem;
  border-radius: 2rem;
  color: #111;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s;
}

.actions button:hover {
  transform: scale(1.05);
  background: #9be02a;
}

.drag-proxy {
  visibility: hidden;
  position: absolute;
}
</style>