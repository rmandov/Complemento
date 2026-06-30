<template>
  <div ref="gallery" class="gallery">
    <ul ref="cardsContainer" class="cards">
      <li
        v-for="(image, index) in images"
        :key="index"
        :style="{ backgroundImage: `url(${image})` }"
      ></li>
    </ul>
    <div class="actions">
      <button ref="prevBtn" class="prev">Prev</button>
      <button ref="nextBtn" class="next">Next</button>
    </div>
  </div>
  <div ref="dragProxy" class="drag-proxy"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";

gsap.registerPlugin(Draggable);

const props = defineProps({
  images: {
    type: Array,
    default: () => [
      "https://assets.codepen.io/16327/portrait-number-01.png",
      "https://assets.codepen.io/16327/portrait-number-02.png",
      "https://assets.codepen.io/16327/portrait-number-03.png",
      "https://assets.codepen.io/16327/portrait-number-04.png",
      "https://assets.codepen.io/16327/portrait-number-05.png",
      "https://assets.codepen.io/16327/portrait-number-06.png",
      "https://assets.codepen.io/16327/portrait-number-07.png",
      "https://assets.codepen.io/16327/portrait-number-01.png",
      "https://assets.codepen.io/16327/portrait-number-02.png",
      "https://assets.codepen.io/16327/portrait-number-03.png",
      "https://assets.codepen.io/16327/portrait-number-04.png",
      "https://assets.codepen.io/16327/portrait-number-05.png",
      "https://assets.codepen.io/16327/portrait-number-06.png",
      "https://assets.codepen.io/16327/portrait-number-07.png",
    ],
  },
});

const gallery = ref(null);
const cardsContainer = ref(null);
const dragProxy = ref(null);
const prevBtn = ref(null);
const nextBtn = ref(null);

let seamlessLoop;
let draggableInstance;
let currentTween = null;
let currentOffset = 0;

const spacing = 0.1;
const snapTime = gsap.utils.snap(spacing);
const playhead = { offset: 0 };

function buildSeamlessLoop(items, spacing, animateFunc) {
  const overlap = Math.ceil(1 / spacing);
  const startTime = items.length * spacing + 0.5;
  const loopTime = (items.length + overlap) * spacing + 1;
  const rawSequence = gsap.timeline({ paused: true });
  const seamlessLoop = gsap.timeline({
    paused: true,
    repeat: -1,
    onRepeat() {
      if (this._time === this._dur) {
        this._tTime += this._dur - 0.01;
      }
    },
  });

  const l = items.length + overlap * 2;

  for (let i = 0; i < l; i++) {
    const index = i % items.length;
    const time = i * spacing;
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
}

function goToOffset(offset) {
  if (currentTween) currentTween.kill();
  currentOffset = offset;

  const snappedTime = snapTime(offset);
  const wrapTime = gsap.utils.wrap(0, seamlessLoop.duration());

  currentTween = gsap.to(playhead, {
    offset: snappedTime,
    duration: 0.5,
    ease: "power3",
    onUpdate() {
      seamlessLoop.time(wrapTime(playhead.offset));
    },
  });
}

onMounted(() => {
  const cards = gsap.utils.toArray(cardsContainer.value.querySelectorAll("li"));

  gsap.set(cards, { xPercent: 400, opacity: 0, scale: 0 });

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

  seamlessLoop = buildSeamlessLoop(cards, spacing, animateFunc);

  const wrapTime = gsap.utils.wrap(0, seamlessLoop.duration());
  seamlessLoop.time(wrapTime(0));

  const onNext = () => {
    currentOffset += spacing;
    goToOffset(currentOffset);
  };

  const onPrev = () => {
    currentOffset -= spacing;
    goToOffset(currentOffset);
  };

  nextBtn.value.addEventListener("click", onNext);
  prevBtn.value.addEventListener("click", onPrev);

  draggableInstance = Draggable.create(dragProxy.value, {
    type: "x",
    trigger: cardsContainer.value,
    onPress() {
      if (currentTween) currentTween.kill();
      this.startOffset = playhead.offset;
    },
    onDrag() {
      const newOffset = this.startOffset + (this.startX - this.x) * 0.001;
      playhead.offset = newOffset;
      seamlessLoop.time(wrapTime(newOffset));
    },
    onDragEnd() {
      currentOffset = playhead.offset;
      goToOffset(currentOffset);
    },
  })[0];
});

onUnmounted(() => {
  if (currentTween) currentTween.kill();
  if (seamlessLoop) seamlessLoop.kill();
  if (draggableInstance) draggableInstance.kill();
});
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.gallery {
  position: relative; /* Cambiado de absolute a relative */
  width: 100%;
  height: 100vh; /* Ocupa toda la altura visible */
  overflow: hidden;
  background: #111; /* Fondo oscuro trasladado aquí */
}

.cards {
  position: absolute;
  width: 14rem;
  height: 18rem;
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
  text-align: center;
  line-height: 18rem;
  font-size: 2rem;
  position: absolute;
  background-size: contain;
  background-repeat: no-repeat;
  top: 0;
  left: 0;
  border-radius: 0.8rem;
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

button {
  cursor: pointer;
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 0.4rem;
  background: #333;
  color: #fff;
  font-size: 1rem;
  transition: background 0.2s;
}

button:hover {
  background: #555;
}

.drag-proxy {
  visibility: hidden;
  position: absolute;
}
</style>
