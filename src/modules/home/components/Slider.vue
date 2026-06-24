<script setup>
import { ref, computed } from "vue";

const slides = ["Imagen 1", "Imagen 2", "Imagen 3"];

const currentIndex = ref(0);

function next() {
  currentIndex.value = (currentIndex.value + 1) % slides.length;
}

function prev() {
  currentIndex.value = (currentIndex.value - 1 + slides.length) % slides.length;
}

const trackStyle = computed(() => ({
  transform: `translateX(-${currentIndex.value * 100}%)`,
}));
</script>

<template>
  <div class="carousel">
    <button @click="prev">←</button>

    <div class="viewport">
      <div class="track" :style="trackStyle">
        <div v-for="slide in slides" :key="slide" class="slide">
          {{ slide }}
        </div>
      </div>
    </div>

    <button @click="next">→</button>
  </div>
</template>

<style scoped>
.viewport {
  overflow: hidden;
  width: 100%;
}

.track {
  display: flex;
  transition: transform 0.3s ease;
}

.slide {
  min-width: 100%;
  /* height: 50px; */
}
</style>
