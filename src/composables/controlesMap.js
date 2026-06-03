import { shallowRef, ref, onUnmounted } from "vue";
import L from "leaflet";

export function useMap(containerRef) {
  // shallowRef evita la reactividad profunda (más rápido)
  const map = shallowRef(null);
  const currentBounds = ref(null); // Encuadre actual

  /* const mexicoBounds = [
    [14.5, -118.5], // Suroeste
    [32.8, -86.0], // Noreste
  ]; */

  const initMap = () => {
    if (!containerRef.value || map.value) return;
    map.value = L.map(containerRef.value, {
      minZoom: 5,
      /*
      maxBounds: mexicoBounds,
      maxBoundsViscosity: 1, */
    }).setView([23.6345, -102.5528], 5);

    // Se añade mapa de OpenStreetMap
    /*
    Opciones:

      - https://tile.openstreetmap.org/{z}/{x}/{y}.png


      - 2. https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png
      - 1. https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png

    */

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map.value);
  };

  // Me regresa al encuadre de Mexico
  const resetView = () => {
    if (!map.value) return;
    map.value.flyTo([23.6345, -102.5528], 5, { animate: true, duration: 0.8, easeLinearity: 0.1 });
  };

  // Me desplazo al encuadre seleccionado
  /* const flyToBounds = (bounds, zoom = 5) => {
    if (!map.value) return;
    map.value.flyToBounds(bounds, {
      padding: [0, 0],
      duration: 0.7,
      easeLinearity: 0.25,
    });
    currentBounds.value = bounds;
  }; */

  const flyToBounds = (bounds) => {
    if (!map.value || !bounds) return;

    map.value.flyToBounds(bounds, {
      padding: [0, 0],
      duration: 0.7,
    });

    currentBounds.value = bounds;
  };

  // Limpieza para evitar fugas de memoria
  onUnmounted(() => {
    if (map.value) {
      map.value.remove();
      map.value = null;
    }
  });

  return { map, initMap, resetView, flyToBounds, currentBounds };
}
