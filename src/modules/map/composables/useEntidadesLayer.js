import L from "leaflet";
import { useGeoJson } from "./useGeoJson";
import { useMap } from "./mapControler";
import { useMapLayersStore } from "@/stores/mapLayers";

export async function useEntidadesLayer(map) {
  const { getGeoJson } = useGeoJson();
  const mapLayers = useMapLayersStore();
  const { flyToBounds } = useMap(map);

  const entidades = await getGeoJson("/entidades.json");

  // Si no tengo el geojson y el mapda donde aplicarlo no hagas nada
  if (!entidades || !map.value) return;

  const entidadesLayer = L.geoJSON(entidades, {
    pane: "entidadesPane",
    style: {
      weight: 1.2,
      fillColor: "#9295e4",
      fillOpacity: 0.5,
      color: "white",
      dashArray: "3",
    },
    onEachFeature: (feature, layer) => {
      const nombre = feature.properties.NOMGEO || "Estado";
      layer.bindTooltip(nombre);

      layer.on("mouseover", () => layer.setStyle({ fillOpacity: 0.8, weight: 2 }));
      layer.on("mouseout", () => layer.setStyle({ fillOpacity: 0.5, weight: 1.2 }));

      layer.on("click", async (e) => {
        // El click solo ocurre en la capa, no le informa mas arriba del evento
        L.DomEvent.stopPropagation(e);

        const nombreEntidad = feature.properties.NOMGEO;
        console.log("Entidad clickeada:", nombreEntidad);

        // Determinar si ya estamos en nivel de estados (nivel 1)
        const yaEnNivelEstado = mapLayers.nivelActual >= 1;

        // Cargar municipios del estado clickeado
        const entidad_json = nombreEntidad
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replaceAll(" ", "_");

        console.log("Cargando municipios para:", entidad_json);

        // Aquí cargarías el GeoJSON de municipios
        // const municipios = await getGeoJson(`/municipios/${entidad_json}.json`);
        // const capaMunicipios = L.geoJSON(municipios, { ... });

        if (yaEnNivelEstado) {
          // Ya estamos viendo un estado → cambiar a OTRO estado (mismo nivel)
          console.log("Cambiando de estado (mismo nivel)");
          mapLayers.cambiarMismoNivel(
            layer,
            map.value,
            nombreEntidad,
            // capaMunicipios  // nueva capa extra
          );
        } else {
          // Primera vez que entramos a nivel estado
          console.log("Entrando a nivel estado");
          mapLayers.bajarNivel(
            layer,
            map.value,
            nombreEntidad,
            // capaMunicipios
          );
        }

        // Encuadrar vista
        const bounds = layer.getBounds();
        flyToBounds(map, bounds);
      });
    },
  });

  entidadesLayer.addTo(map.value);
}
