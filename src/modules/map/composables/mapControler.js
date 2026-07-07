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
    map.value = L.map(containerRef.value, {
      minZoom: 5,

      scrollWheelZoom: false,
      zoomControl: false,
    });
    map.value.setView(defaultView.center, defaultView.zoom);

    /*     // Enable scroll zoom when the user clicks/focuses on the map
    map.value.on("focus", () => {
      map.value.scrollWheelZoom.enable();
    });

    // Disable it again when they click away
    map.value.on("blur", () => {
      map.value.scrollWheelZoom.disable();
    }); */

    // Agregamos capa de calles
    // Esta puede eliminarse y solo usarse las geometrias que nos da el geojson
    /*     const calles = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      },
    );

    calles.addTo(map.value); */

    // 1. Capa de fondo (SIN ETIQUETAS)
    const callesFondo = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      },
    );

    // 2. Capa de etiquetas (SOLO TEXTO TRANSPARENTE) forzada en un pane superior
    const callesLabels = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png",
      {
        attribution: "&copy; CARTO",
        subdomains: "abcd",
        minZoom: 11,
        pane: "markerPane",
      },
    );

    // 3. Agrupamos ambas en una sola capa lógica para que el usuario las active juntas
    const calles = L.layerGroup([callesFondo, callesLabels]);

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
