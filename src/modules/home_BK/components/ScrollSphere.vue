<script setup>
import { ref, watch, onMounted } from 'vue'
import { useSphereScene } from '../composables/useSphereScene'

const props = defineProps({
  trigger: { type: Object, required: true },
  color: { type: [String, Number], default: '#3075ed' },
  size: { type: Number, default: 0.7 },
  scrub: { type: Number, default: 0.65 },
  showPath: { type: Boolean, default: true },
})
const emit = defineEmits(['progress'])
const container = ref(null)
const error = ref('')
const { initScene } = useSphereScene()
let mounted = false

function initialize() {
  if (!mounted || !container.value || !props.trigger) return
  error.value = ''
  initScene({
    container: container.value,
    trigger: props.trigger,
    color: props.color,
    size: props.size,
    scrub: props.scrub,
    showPath: props.showPath,
    onProgress: (value) => emit('progress', value),
    onError: (message) => { error.value = message },
  })
}

onMounted(() => { mounted = true; initialize() })
watch(() => [props.trigger, props.color, props.size, props.scrub, props.showPath],
  initialize, { flush: 'post' })
</script>

<template>
  <div ref="container" class="sphere-layer">
    <p v-if="error" class="sphere-error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.sphere-layer {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100vh;
  height: 100svh;
  z-index: 2;
  /* El canvas no bloquea los botones ni el scroll de tus componentes. */
  pointer-events: none;
}
.sphere-layer :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}
.sphere-error {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  margin: 0;
  padding: 16px;
  color: #fff;
  background: #17233d;
  border-radius: 8px;
  font-size: 16px;
  line-height: 1.5;
}
</style>
