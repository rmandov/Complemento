import { shallowRef, onUnmounted, ref } from "vue";
import L from "leaflet";

import { useMapStore } from "@/stores/map";
import { usePoligonoStore } from "@/stores/poligonoStore";

export function useMap(containerRef) {
  const map = shallowRef(null);
  const mapStore = useMapStore();
  const poligonoStore = usePoligonoStore();

  // Mexico bounds
  const defaultView = {
    /* center: [23.6345, -102.5528], */
    center: [23.6345, -102.5528],
    zoom: 5,
  };

  const mexicoBounds = L.latLngBounds(
    [14.5, -118.5], // Suroeste
    [32.8, -86.5], // Noreste
  );

  // Inicializador del mapa
  const initMap = () => {
    //  Si el contenedor de Referencia no es nulo o hay un valor en el map, NO realiza acciones.
    if (!containerRef.value || map.value) return;

    // Definimos el mapa y su encuadre
    map.value = L.map(containerRef.value, {
      minZoom: 5,
      maxBounds: mexicoBounds,
      maxBoundsViscosity: 0.9,
      scrollWheelZoom: false,
      zoomControl: true,
    });
    /* map.value.setView(defaultView.center, defaultView.zoom); */
    map.value.fitBounds(mexicoBounds);

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
    flyToBounds(map.value, mexicoBounds);
  };

  // Movernos al encuadre que querramos
  const flyToBounds = (map, bounds) => {
    if (!map || !bounds) return console.log("No se tiene bounds o mapa");

    map.setMaxBounds(null);

    map.flyToBounds(bounds, {
      padding: [0, 0],
      duration: 0.5,
    });

    map.once("moveend", () => {
      map.setMaxBounds(bounds);

      mapStore.setView({
        center: map.getCenter(),
        zoom: map.getZoom(),
        bounds: bounds,
      });
    });
  };

  // Recibe el map.value para gestionar el uso de poligonos
  function goBack() {
    // Si existe una entidad almacenada en pinia, significa que fue clickeada esa entidad
    // Elmina la capa de municipios que se addTo al mapa y coloca el poligono de la entidad que se guardó.
    if (poligonoStore.entidad) {
      map.value.removeLayer(poligonoStore.municipiosLayer);
      poligonoStore.entidad.addTo(map.value);
    }
    // Limpia cualquier poligono que fuera almacenado en clicks realizados
    poligonoStore.clear();
    // Cambia el setView enfocando a Mexico
    resetView();
  }

  // Limpieza para evitar fugas de memoria
  /*   onUnmounted(() => {
    if (map.value) {
      map.value.remove()
      map.value = null
    }
  }) */

  // INICIO - Movimiento de zoom con ctrl + wheel

  const showWarning = ref(false);
  let warningTimeout = null;
  const tooltipPos = ref({ x: 0, y: 0 });

  // Actualiza las coordenadas X e Y relativas al contenedor del mapa
  const updateMousePosition = (event) => {
    // Ajustamos un pequeño desfase (15px) para que el tooltip no tape la punta del cursor
    tooltipPos.value = {
      x: event.clientX + 15,
      y: event.clientY + 15,
    };
  };

  function handleWheel(event) {
    // Si la tecla Ctrl está presionada, permitimos el zoom manual
    if (event.ctrlKey) {
      event.preventDefault(); // Evita que la página web haga scroll

      const currentZoom = map.value.getZoom();
      // event.deltaY < 0 significa scroll hacia arriba (Zoom In)
      if (event.deltaY < 0) {
        map.value.setZoom(currentZoom + 1);
      } else {
        map.value.setZoom(currentZoom - 1);
      }
      showWarning.value = false;
    } else {
      // Si NO está presionada la tecla Ctrl, mostramos la advertencia
      showWarning.value = true;

      // Ocultar el aviso después de 2 segundos de inactividad
      clearTimeout(warningTimeout);
      warningTimeout = setTimeout(() => {
        showWarning.value = false;
      }, 800);
    }
  }
  // FIN - Movimiento de zoom con ctrl + wheel

  return {
    map,
    initMap,
    goBack,
    flyToBounds,
    updateMousePosition,
    handleWheel,
    showWarning,
    tooltipPos,
  };
}
