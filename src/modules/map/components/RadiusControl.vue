<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  radius: Number,
  count: Number,
  min: { default: 50000 },
  max: { default: 300000 },
  step: { default: 100 },
})

const emit = defineEmits(['update:radius'])

const localRadius = ref(props.radius)

// Sincroniza localRadius con la prop radius del padre
watch(
  () => props.radius,
  (newVal) => {
    localRadius.value = newVal
  },
)

// Cuando cambien min o max, ajusta localRadius si está fuera de rango
watch(
  () => [props.min, props.max],
  () => {
    if (localRadius.value < props.min) {
      localRadius.value = props.min
    } else if (localRadius.value > props.max) {
      localRadius.value = props.max
    }
  },
  { deep: true }, // no estrictamente necesario, pero por si acaso
)

// También podemos ajustar en el evento input para mantener consistencia
const onInput = (event) => {
  let value = Number(event.target.value)
  // Recortar a los límites actuales (por si acaso)
  value = Math.min(Math.max(value, props.min), props.max)
  localRadius.value = value
}

const onChange = () => {
  emit('update:radius', localRadius.value)
}
</script>

<template>
  <div class="radius-control">
    <label>Radio: {{ Math.trunc((radius / 1000) * 10) / 10 }} Km</label>
    <input
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="localRadius"
      @input="onInput"
      @change="onChange"
    />
    <span>Proyectos en el área: {{ count }}</span>
  </div>
</template>

<style scoped>
.radius-control {
  position: absolute;
  bottom: 20px;
  right: 5px;
  z-index: 1000;
  background: white;
  padding: 8px;
  border-radius: 6px;
}
input {
  margin-right: 1rem;
  margin-left: 1rem;
}
</style>
