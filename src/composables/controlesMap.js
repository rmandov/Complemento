import { shallowRef, ref, onUnmounted } from 'vue'
import L from 'leaflet'

export function useMap(containerRef) {
  // shallowRef evita la reactividad profunda (más rápido)
  const map = shallowRef(null)
  const currentBounds = ref(null) // Encuadre actual

  const mexicoBounds = [
    [14.5, -118.5], // Suroeste
    [32.8, -86.0], // Noreste
  ]

  const initMap = () => {
    if (!containerRef.value || map.value) return
    map.value = L.map(containerRef.value, {
      minZoom: 5,
      maxBounds: mexicoBounds,
      maxBoundsViscosity: 1,
    }).setView([23.6345, -102.5528], 5)

    // Se añade mapa de OpenStreetMap
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | SHCP',
    }).addTo(map.value)
  }

  // Me regresa al encuadre de Mexico
  const resetView = () => {
    if (!map.value) return
    map.value.flyTo([23.6345, -102.5528], 5, { animate: true, duration: 0.8, easeLinearity: 0.1 })
  }

  // Me desplazo al encuadre seleccionado
  const flyToBounds = (bounds, zoom = 8) => {
    if (!map.value) return
    map.value.flyToBounds(bounds, {
      padding: [50, 50],
      duration: 1.2,
      easeLinearity: 0.25,
    })
    currentBounds.value = bounds
  }

  // Limpieza para evitar fugas de memoria
  onUnmounted(() => {
    if (map.value) {
      map.value.remove()
      map.value = null
    }
  })

  return { map, initMap, resetView, flyToBounds, currentBounds }
}
