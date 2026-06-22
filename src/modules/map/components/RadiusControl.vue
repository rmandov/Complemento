<template>
  <div class="radius-control">
    <label>Radio: {{ radius }} m</label>
    <input
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="radius"
      @input="$emit('update:radius', Number($event.target.value))"
    />
    <span>{{ count }} dentro</span>
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
