import { ref } from 'vue'
import L from 'leaflet'

export function useMap(containerRef) {
  const map = ref(null)
  const currentBounds = ref(null)

  const init = () => {
    map.value = L.map(containerRef.value).setView([23.6345, -102.5528], 5)

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | SHCP',
    }).addTo(map.value)

    return map.value
  }

  const flyToBounds = (bounds, zoom = 8) => {
    if (!map.value) return
    map.value.flyToBounds(bounds, {
      padding: [50, 50],
      duration: 1.2,
      easeLinearity: 0.25,
    })
    currentBounds.value = bounds
  }

  const resetView = () => {
    if (!map.value) return
    map.value.flyTo([23.6345, -102.5528], 5, {
      duration: 1.2,
    })
    currentBounds.value = null
  }

  return {
    map,
    init,
    flyToBounds,
    resetView,
    currentBounds,
  }
}
