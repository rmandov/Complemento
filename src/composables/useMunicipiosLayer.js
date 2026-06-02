import { ref } from "vue";

export function useMunicipiosLayer(map) {
  const layer = ref(null);
  const isLoading = ref(false);
  const currentState = ref(null);

  const load = async (cvegeo, nombreEstado) => {
    // Limpiar capa anterior
    remove();

    isLoading.value = true;
    currentState.value = { cvegeo, nombre: nombreEstado };

    try {
      const response = await fetch(`/municipios/${cvegeo}.geojson`);
      if (!response.ok) throw new Error(`No se encontró el archivo para el estado ${cvegeo}`);

      const geojson = await response.json();

      layer.value = L.geoJSON(geojson, {
        style: {
          color: "#D32F2F",
          weight: 1,
          fillColor: "#FFCDD2",
          fillOpacity: 0.6,
        },
        onEachFeature: (feature, layer) => {
          const nombre = feature.properties.NOMGEO || feature.properties.NOM_MUN || "Municipio";
          layer.bindTooltip(nombre);

          layer.on("mouseover", () => {
            layer.setStyle({ fillOpacity: 0.9, weight: 1.5, color: "#B71C1C" });
          });
          layer.on("mouseout", () => {
            layer.setStyle({ fillOpacity: 0.6, weight: 1, color: "#D32F2F" });
          });
        },
      }).addTo(map);

      return layer.value;
    } catch (err) {
      console.error("Error cargando municipios:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const remove = () => {
    if (layer.value) {
      map.removeLayer(layer.value);
      layer.value = null;
    }
    currentState.value = null;
  };

  return { load, remove, isLoading, currentState };
}
