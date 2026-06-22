import { shallowRef, onUnmounted } from "vue";
import L from "leaflet";

import { useMapStore } from "@/stores/map";

export function useMap(containerRef) {
  const map = shallowRef(null);
  const mapStore = useMapStore();

  // Mexico bounds
  const defaultView = {
    center: [23.6345, -102.5528],
    zoom: 5,
  };

  // Inicializador del mapa
  const initMap = () => {
    //  Si el contenedor de Referencia no es nulo o hay un valor en el map, NO realiza acciones.
    if (!containerRef.value || map.value) return;

    // Definimos el mapa y su encuadre
    map.value = L.map(containerRef.value, { preferCanvas: true, minZoom: 5 });
    map.value.setView(defaultView.center, defaultView.zoom);

    // Agregamos capa de calles
    // Esta puede eliminarse y solo usarse las geometrias que nos da el geojson
    const calles = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      },
    );

    calles.addTo(map.value);
  };

  // Retorno al encuadre original - Mexico Bounds
  const resetView = () => {
    if (!map.value) return;

    map.value.flyTo(defaultView.center, defaultView.zoom, {
      animate: true,
      duration: 0.5,
      easeLinearity: 0.1,
    });

    // Actualizar store inmediatamente (o después de la animación)
    mapStore.setView({
      center: defaultView.center,
      zoom: defaultView.zoom,
      bounds: map.value.getBounds(),
    });
  };

  // Movernos al encuadre que querramos
  const flyToBounds = (map, bounds) => {
    if (!map || !bounds) return console.log("No se tiene bounds o mapa");

    map.flyToBounds(bounds, {
      padding: [0, 0],
      duration: 0.5,
    });

    map.once("moveend", () => {
      mapStore.setView({
        center: map.getCenter(),
        zoom: map.getZoom(),
        bounds: bounds,
      });
    });
  };

  // Limpieza para evitar fugas de memoria
  /*   onUnmounted(() => {
    if (map.value) {
      map.value.remove()
      map.value = null
    }
  }) */

  return { map, initMap, resetView, flyToBounds };
}
