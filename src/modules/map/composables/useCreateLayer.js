// src/modules/map/composables/useCreateLayer.js
import L from "leaflet";
import { usePoligonoStore } from "@/stores/poligonoStore";
import { useMapStore } from "@/stores/map";

// Para cargar los GeoJson
import { useGeoJson } from "../composables/useGeoJson";
import { useMap } from "./mapControler";

const { getGeoJson } = useGeoJson();

// ¿Que valores cambian?, esos valores son los que se usan de input
/*
1. poligonos.json => const [entidad, municipio, localida, etc] = await getGeoJson('[entidad, municipio, localida, etc].json')
2. pane_layer => Pane donde se situan los poligonos
3. styles => {} con los estilos, si no hay se tiene colores por defecto
4. name => Clave para obtener el nombre de ese layer

*/
// ¿Que valores creo?, esos valores son los outputs
/*
1. Regreso la capa que se va a aplicar en el mapa. Con no debo mandar referencia del mapa.
2. Indicar que hay una capa mas de profundida e iniciar otro procesos de carga de poligonos
*/

// Carga Entidades
export function createLayer(poligonos_json, options = {}) {
  const poligonoStore = usePoligonoStore();
  const datosEntidad = useMapStore();
  const { flyToBounds } = useMap();

  const {
    map,
    pane = "",
    name = "NOMGEO",
    style = {
      weight: 1.2,
      fillColor: "rgb(251, 95, 16)",
      fillOpacity: 0.5,
      color: "white",
      dashArray: "3",
    },
  } = options;

  if (!poligonos_json) return;

  const newLayer = L.geoJSON(poligonos_json, {
    pane,
    style,
    onEachFeature: (feature, layer) => {
      const nombreEntidad = feature.properties[name] || "nombre del poligono";
      layer.bindTooltip(nombreEntidad);

      // El evento click puede ser gestionado aqui mismo, por ahora esta en una sentencia separada.
      layer.on({
        mouseover,
        mouseout,
      });

      layer.on("click", async (e) => {
        L.DomEvent.stopPropagation(e);
        const bounds = layer.getBounds();
        layer.setStyle(style);

        // ** INICIO - Gestion de poligono clickeado **
        // Se verifica si ya existe un poligono almacenado, esto significa que ya hubo un elemnto que fue clickeado.
        if (poligonoStore.entidad) {
          // Si ya existe, se agrega al mapa y se libera espacio para el nuevo elemento que va a se eliminado del mapa.
          poligonoStore.entidad.addTo(map);
          poligonoStore.setEntidad(null);

          // ** INICIO - Gestion municipios
          if (poligonoStore.isMunicipiosLayer) {
            map.removeLayer(poligonoStore.municipiosLayer);
            poligonoStore.clearMunicipiosLayer();
          }
          // ** FIN - Gestion municipios
        }
        // Se almacena poligono clickeado y se elimina del mapa
        poligonoStore.setEntidad(layer);
        map.removeLayer(layer);
        // ** FIN - Gestion de poligono clickeado **

        // ** INICIO - Carga de muncipios de la entidad clickeada **
        // 1. Tratamiento del nombre para buscar en json
        const nombreEntidad_json = nombreEntidad
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replaceAll(" ", "_");

        const muncipios = await getGeoJson(`municipios/${nombreEntidad_json}.json`);

        if (muncipios) {
          const municipiosLayer = createMunicipiosLayer(muncipios, {
            map,
            pane: "poligonosPane",
            name: "NOMGEO",
          });

          poligonoStore.setMunicipiosLayer(municipiosLayer);
          poligonoStore.municipiosLayer.addTo(map);
        }
        // ** FIN - Carga de muncipios de la entidad clickeada **

        /* map.flyToBounds(bounds); */

        // Cambio de título de Entidad
        datosEntidad.setEntidad(nombreEntidad);

        const claveEntidad = feature.properties["CVE_ENT"] || "69";

        datosEntidad.setCVE_ENT(claveEntidad);

        flyToBounds(map, bounds);
      });
    },
  });

  return newLayer;
}

// Eventos
function mouseover(e) {
  const layer = e.target;
  layer.setStyle({ fillOpacity: 0.8, weight: 2 });
}

function mouseout(e) {
  const layer = e.target;
  layer.setStyle({ fillOpacity: 0.5, weight: 1.2 });
}

// Carga municipios
function createMunicipiosLayer(poligonos_json, options = {}) {
  const datosMunicipio = useMapStore();
  const poligonoStore = usePoligonoStore();
  const { flyToBounds } = useMap();
  const {
    map,
    pane = "",
    name = "NOMGEO",
    style = {
      weight: 1.2,
      fillColor: "rgb(30, 133, 248)",
      fillOpacity: 0.5,
      color: "white",
      dashArray: "3",
    },
  } = options;

  if (!poligonos_json) return;

  const newLayer = L.geoJSON(poligonos_json, {
    pane,
    style,
    onEachFeature: (feature, layer) => {
      const nombreLayer = feature.properties[name] || "nombre del poligono";
      layer.bindTooltip(nombreLayer);

      // El evento click puede ser gestionado aqui mismo, por ahora esta en una sentencia separada.
      layer.on({
        mouseover,
        mouseout,
      });

      layer.on("click", async (e) => {
        L.DomEvent.stopPropagation(e);
        const bounds = layer.getBounds();
        layer.setStyle({ fillOpacity: 0.5, weight: 1.2 });
        if (poligonoStore.municipio) {
          // Si ya existe, se agrega al mapa y se libera espacio para el nuevo elemento que va a se eliminado del mapa.
          poligonoStore.municipio.addTo(map);
          poligonoStore.setMunicipio(null);
        }
        // Se almacena poligono clickeado y se elimina del mapa
        poligonoStore.setMunicipio(layer);
        map.removeLayer(layer);

        datosMunicipio.setMunicipio(nombreLayer);

        if (map && bounds.isValid()) {
          flyToBounds(map, bounds);
        }
      });
    },
  });
  return newLayer;
}
