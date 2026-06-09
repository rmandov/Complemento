import { ref, shallowRef, onMounted } from "vue";
import { ProyectoLoader } from "@/modules/map/services/ProyectoLoader.js";
import { ProyectoRenderer } from "../services/ProyectoRenderes";

/**
 * Composable para gestionar la capa de proyectos en Leaflet.
 *
 * @param {Object} options
 * @param {string} options.url - URL del GeoJSON
 * @param {L.Map} options.map - Instancia del mapa Leaflet
 * @param {Object} options.config - Configuración de renderizado
 */
export function useProyectosLayer({ url, map, config = {} }) {
  const cargando = ref(false);
  const error = ref(null);
  const total = ref(0);
  const features = ref([]);

  // shallowRef es clave para objetos Leaflet (no necesitan reactividad profunda)
  const capa = shallowRef(null);

  const loader = new ProyectoLoader();
  const renderer = new ProyectoRenderer({
    ...config,
    onClick: (feature, layer) => {
      // Emitir hacia arriba o manejar internamente
      emitSeleccion(feature);
      if (config.onClick) config.onClick(feature, layer);
    },
  });

  // Estado de selección interno
  const seleccionado = shallowRef(null);

  async function cargar() {
    if (!map.value) {
      error.value = "El mapa no está inicializado";
      return;
    }

    cargando.value = true;
    error.value = null;

    try {
      features.value = await loader.cargar(url);
      total.value = features.value.length;

      // Crear y añadir capa
      const nuevaCapa = renderer.crearCapa(features.value);
      nuevaCapa.addTo(map.value);

      // Limpiar capa anterior si existe
      if (capa.value) {
        map.value.removeLayer(capa.value);
      }
      capa.value = nuevaCapa;
    } catch (err) {
      console.error("[useProyectosLayer]", err);
      error.value = err.message;
    } finally {
      cargando.value = false;
    }
  }

  function emitSeleccion(feature) {
    seleccionado.value = feature;
    // Aquí podrías emitir un evento global o actualizar un store
  }

  function resaltarPorId(id, estilo = { fillColor: "#e74c3c", color: "#c0392b" }) {
    if (!capa.value) return;
    capa.value.eachLayer((layer) => {
      const fid = layer.feature?.properties?.fid;
      if (fid === id) {
        layer.setStyle(estilo);
        layer.openTooltip();
      } else {
        // Restaurar estilo base (simplificado; idealmente guardar estilo original)
        layer.setStyle(renderer.config.estiloBase);
      }
    });
  }

  function filtrarPorCategoria(categoria) {
    if (!capa.value) return;
    capa.value.eachLayer((layer) => {
      const ramo = layer.feature?.properties?.RAMO_DESC;
      if (categoria && ramo !== categoria) {
        layer.setStyle({ opacity: 0, fillOpacity: 0 }); // Ocultar
      } else {
        layer.setStyle({ opacity: 1, fillOpacity: 0.8 }); // Mostrar
      }
    });
  }

  function destruir() {
    if (capa.value && map.value) {
      map.value.removeLayer(capa.value);
      capa.value = null;
    }
  }

  onMounted(() => {
    if (url) cargar();
  });

  return {
    cargando,
    error,
    total,
    features,
    capa,
    seleccionado,
    cargar,
    resaltarPorId,
    filtrarPorCategoria,
    destruir,
  };
}
