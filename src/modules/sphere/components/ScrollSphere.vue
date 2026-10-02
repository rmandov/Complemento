<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { createSphereScene } from '../composables/useSphereScene'
const props = defineProps({ trigger: { type: Object, required: true } })
const emit = defineEmits(['progress'])
const container = ref(null)
const error = ref('')
let cleanup
onMounted(() => {
  cleanup = createSphereScene({ container: container.value, trigger: props.trigger,
    onProgress: (value) => emit('progress', value), onError: (message) => { error.value = message },
  })
})
onBeforeUnmount(() => cleanup?.())
</script>

<template>
  <div ref="container" class="sphere-stage"></div>
  <p v-if="error" class="scene-error" role="alert">{{ error }}</p>
</template>
