<template>
  <div class="gallery" ref="galleryRef">
    <ul class="cards" ref="cardsRef">
      <li
        v-for="(card, index) in loopCards"
        :key="index"
        :ref="(el) => setCardRef(el, index)"
        @click="goToCard(index)"
        class="card-item"
      >
        <img :src="card.image" :alt="card.title" loading="lazy" />
        <div class="card-content">
          <h3>{{ card.title }}</h3>
          <p>{{ card.description }}</p>
        </div>
      </li>
    </ul>

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
  </div>
  <div class="drag-proxy" ref="dragProxyRef"></div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import cardsData from "./cards.json";

gsap.registerPlugin(Draggable);

const galleryRef = ref(null);
const cardsRef = ref(null);
const dragProxyRef = ref(null);
const cardElements = ref([]);

const setCardRef = (el, index) => {
  if (el) cardElements.value[index] = el;
};

const spacing = 0.1;

const loopCards = computed(() => {
  const minItems = Math.ceil(1.5 / spacing) + 1;
  const items = [];
  while (items.length < minItems) {
    items.push(...cardsData);
  }
  return items.slice(0, Math.max(minItems, cardsData.length * 3));
});

const playhead = { offset: 0 };
let iteration = 0;
let seamlessLoop, wrapTime, snapTime;

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
      ease: "power1.in",
      immediateRender: false,
    },
  ).fromTo(
    element,
    { xPercent: 400 },
    { xPercent: -400, duration: 1, ease: "none", immediateRender: false },
    0,
  );
  return tl;
};

const buildSeamlessLoop = (items, spacing, animateFunc) => {
  let overlap = Math.ceil(1 / spacing),
    startTime = items.length * spacing + 0.5,
    loopTime = (items.length + overlap) * spacing + 1,
    rawSequence = gsap.timeline({ paused: true }),
    seamlessLoop = gsap.timeline({
      paused: true,
      repeat: -1,
      onRepeat() {
        const tl = this;
        if (tl._time === tl._dur) {
          tl._tTime += tl._dur - 0.01;
        }
      },
    }),
    l = items.length + overlap * 2,
    time,
    i,
    index;

  for (i = 0; i < l; i++) {
    index = i % items.length;
    time = i * spacing;
    rawSequence.add(animateFunc(items[index]), time);

    if (i <= items.length) {
      seamlessLoop.add("label" + i, time);
    }
  }

  rawSequence.time(startTime);
  seamlessLoop
    .to(rawSequence, {
      time: loopTime,
      duration: loopTime - startTime,
      ease: "none",
    })
    .fromTo(
      rawSequence,
      { time: overlap * spacing + 1 },
      {
        time: startTime,
        duration: startTime - (overlap * spacing + 1),
        immediateRender: false,
        ease: "none",
      },
    );
  return seamlessLoop;
};

const updateCarousel = (offset) => {
  seamlessLoop.time(wrapTime(offset));
};

const animateToOffset = (offset) => {
  let snappedTime = snapTime(offset);
  let progress = (snappedTime - seamlessLoop.duration() * iteration) / seamlessLoop.duration();

  if (progress >= 1 || progress < 0) {
    iteration += Math.floor(progress);
  }

  let newProgress = (snappedTime - seamlessLoop.duration() * iteration) / seamlessLoop.duration();
  let wrappedProgress = gsap.utils.wrap(0, 1, newProgress);
  let targetOffset =
    seamlessLoop.duration() * iteration + wrappedProgress * seamlessLoop.duration();

  targetOffset = snapTime(targetOffset);

  gsap.to(playhead, {
    offset: targetOffset,
    duration: 0.6,
    ease: "power3.out",
    onUpdate: () => updateCarousel(playhead.offset),
  });
};

const goToCard = (clickedIndex) => {
  const total = loopCards.value.length;
  const currentVirtualIndex = Math.round(playhead.offset / spacing);
  const currentRelative = ((currentVirtualIndex % total) + total) % total;
  let diff = clickedIndex - currentRelative;

  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;
  if (diff === 0) return;

  animateToOffset(playhead.offset + diff * spacing);
};

const next = () => animateToOffset(playhead.offset + spacing);
const prev = () => animateToOffset(playhead.offset - spacing);

const initCarousel = () => {
  gsap.set(cardElements.value, { xPercent: 400, opacity: 0, scale: 0 });

  seamlessLoop = buildSeamlessLoop(cardElements.value, spacing, animateFunc);
  wrapTime = gsap.utils.wrap(0, seamlessLoop.duration());
  snapTime = gsap.utils.snap(spacing);

  updateCarousel(0);

  Draggable.create(dragProxyRef.value, {
    type: "x",
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
  transition: transform 0.2s, background 0.2s;
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
  transition: opacity 0.3s, background 0.3s;
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
    top: 50%; /* centrado vertical perfecto */
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
    content: "";
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