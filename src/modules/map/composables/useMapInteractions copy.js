// composables/useMapInteractions.js
import { ref, onUnmounted } from 'vue'

export function useMapInteractions(mapRef) {
  const center = ref(null) // { lat, lng }

  function onClick(e) {
    center.value = e.latlng
  }

  function register() {
    if (mapRef.value) {
      mapRef.value.on('click', onClick)
    }
  }

  function unregister() {
    if (mapRef.value) {
      mapRef.value.off('click', onClick)
    }
  }

  return { center, register, unregister }
}
