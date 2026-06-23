<script setup>
import { ref, watch } from 'vue'

/* defineProps({

})
defineEmits(['update:radius']) */

const props = defineProps({
  radius: Number,
  count: Number,
  min: { default: 100 },
  max: { default: 50000 },
  step: { default: 100 },
})

const emit = defineEmits(['update:radius'])

const localRadius = ref(props.radius)

watch(
  () => props.radius,
  v => localRadius.value = v
)
</script>
<template>
  <div class="radius-control">
    <label>Radio: {{ radius / 1000 }} Km</label>
    <input
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="localRadius"
      @input="localRadius = Number($event.target.value)"
      @change="emit('update:radius', localRadius)"
    />
    <span>Proyectos en el área: {{ count }}</span>
  </div>
</template>


<style scoped>
input {
  margin-right: 1rem;
  margin-left: 1rem;
}
</style>
