import L from "leaflet";
import { useGeoJson } from "./useGeoJson";
import { useMap } from "./mapControler";
import { useMapLayersStore } from "@/stores/mapLayers";

export async function useEntidadesLayer(map) {
  const { getGeoJson } = useGeoJson();
  const mapLayers = useMapLayersStore();
  const { flyToBounds } = useMap(map);

  const entidades = await getGeoJson("/entidades.json");

  if (!entidades || !map.value) return;

  const entidadesLayer = L.geoJSON(entidades, {
    pane: "poligonosPane",
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
        L.DomEvent.stopPropagation(e);
        layer.setStyle({ fillOpacity: 0.5, weight: 1.2 });

        const nombreEntidad = layer.feature.properties.NOMGEO;
        console.log("Entidad clickeada:", nombreEntidad);

        // 🔑 DECISIÓN: ¿Primer estado o cambiando de estado?
        if (mapLayers.estadoActual && mapLayers.estadoActual !== nombreEntidad) {
          // Ya hay un estado seleccionado y es DIFERENTE → cambiar de estado
          console.log("Cambiando de estado...");

          // Aquí cargarías los municipios del nuevo estado
          // const capaMunicipios = await cargarMunicipios(nombreEntidad);

          mapLayers.cambiarEstado(
            layer,
            map.value,
            nombreEntidad,
            // capaMunicipios  // nueva capa de municipios
          );
        } else if (!mapLayers.estadoActual) {
          // Primer estado seleccionado
          console.log("Primer estado seleccionado...");

          mapLayers.bajarNivel(
            layer,
            map.value,
            nombreEntidad,
            // capaMunicipios
          );
        }
        // Si es el mismo estado, no hacer nada (ya está seleccionado)

        // Cargar municipios del estado
        const entidad_json = nombreEntidad
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replaceAll(" ", "_");

        console.log("Cargando municipios para:", entidad_json);
        // await carga_municipios(entidad_json);

        // Encuadrar vista
        const bounds = layer.getBounds();
        flyToBounds(map, bounds);
      });
    },
  });

  entidadesLayer.addTo(map.value);
}
