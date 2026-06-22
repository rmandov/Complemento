<template>
  <div class="radius-control">
    <label>Radio: {{ radius / 1000 }} Km</label>
    <input
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="radius"
      @input="$emit('update:radius', Number($event.target.value))"
    />
    <span>Proyectos en el área: {{ count }}</span>
  </div>
</template>

<script setup>
defineProps({
  radius: Number,
  count: Number,
  min: { default: 100 },
  max: { default: 50000 },
  step: { default: 100 },
})
defineEmits(['update:radius'])
</script>

<style scoped>
input {
  margin-right: 1rem;
  margin-left: 1rem;
}
</style>
