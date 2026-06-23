import { ref, watch, onBeforeUnmount } from 'vue'

export function useMapInteractions(map) {
  const center = ref(null)

  function onMapClick(e) {
    center.value = {
      lat: e.latlng.lat,
      lng: e.latlng.lng,
    }
  }

  // Watch reactivo: si map.value existe (ahora o más tarde), registra el listener
  const stopWatching = watch(
    () => map.value,
    (newMap, oldMap) => {
      if (oldMap) oldMap.off('click', onMapClick)
      if (newMap) newMap.on('click', onMapClick)
    },
    { immediate: true },
  )

  // Mantengo register/unregister por compatibilidad con tu onMounted/onUnmounted
  function register() {
    if (map.value) map.value.on('click', onMapClick)
  }

  function unregister() {
    if (map.value) map.value.off('click', onMapClick)
    stopWatching()
  }

  onBeforeUnmount(() => {
    unregister()
  })

  return {
    center,
    register,
    unregister,
  }
}
