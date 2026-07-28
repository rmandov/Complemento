<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

// Props opcionales para personalizar la animación
defineProps({
  duration: {
    type: Number,
    default: 0.7
  },
  stagger: {
    type: Number,
    default: 0.04
  },
  ease: {
    type: String,
    default: 'power4.out'
  },
  x: {
    type: Number,
    default: 150
  },
  delay: {
    type: Number,
    default: 0
  }
});

gsap.registerPlugin(SplitText);

const textRef = ref(null);
let split = null;
let animation = null;

onMounted(() => {
  if (!textRef.value) return;

  split = SplitText.create(textRef.value, { type: 'chars' });

  animation = gsap.from(split.chars, {
    x: 150,           // Entran desde la derecha
    opacity: 0,
    duration: 0.7,
    ease: "power4.out",
    stagger: {
      each: 0.04,
      from: "start"     // ← Empieza por el primer carácter (izquierda → derecha)
    }
  });
});

onUnmounted(() => {
  animation?.kill();
  split?.revert();
});
</script>

<template>
  <div ref="textRef" class="text-reveal">
    <slot>
      <!-- Texto por defecto si no se provee slot -->
      Break apart HTML text into characters for easy animation.
    </slot>
  </div>
</template>

<style scoped></style>
