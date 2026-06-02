import { ref } from "vue";

export function useStatesLayer(map, onStateClick) {
  const layer = ref(null);
  const isLoading = ref(false);

  const load = async (url) => {
    isLoading.value = true;
    try {
      const response = await fetch(url);
      const geojson = await response.json();

      layer.value = L.geoJSON(geojson, {
        style: {
          color: "#1565C0",
          weight: 1.5,
          fillColor: "#90CAF9",
          fillOpacity: 0.5,
        },
        onEachFeature: (feature, layer) => {
          const nombre = feature.properties.NOMGEO || "Estado";
          const cvegeo = feature.properties.CVEGEO || feature.properties.CVE_ENT;

          layer.bindTooltip(nombre, { sticky: true });

          layer.on("mouseover", () => {
            layer.setStyle({ fillOpacity: 0.8, weight: 2.5, color: "#0D47A1" });
          });
          layer.on("mouseout", () => {
            layer.setStyle({ fillOpacity: 0.5, weight: 1.5, color: "#1565C0" });
          });

          layer.on("click", (e) => {
            L.DomEvent.stopPropagation(e); // Evitar que el click llegue al mapa
            onStateClick({
              cvegeo,
              nombre,
              feature,
              bounds: layer.getBounds(),
            });
          });
        },
      }).addTo(map);

      return layer.value;
    } finally {
      isLoading.value = false;
    }
  };

  const remove = () => {
    if (layer.value) {
      map.removeLayer(layer.value);
      layer.value = null;
    }
  };

  return { load, remove, isLoading };
}
