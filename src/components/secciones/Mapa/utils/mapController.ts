import { ref, Ref } from "vue";
import L from "leaflet";
import { GeoJsonObject } from "geojson";
export let mapa: L.Map | null = null;
export function initMap(mapaContainer: Ref<HTMLElement | null>): L.Map | null {
  if (!mapaContainer.value) return null;

  const mapaC = L.map(mapaContainer.value, {
    center: [23.6345, -102.5528],
    zoom: 5,
    minZoom,
    maxZoom,
    maxBounds: mexicoBounds,
    maxBoundsViscosity: 0.5,
    scrollWheelZoom: false,
    zoomControl: true,
  });

  // Crear pane para etiquetas
  mapaC.createPane("labels");
  mapaC.createPane("proyectos");
  mapaC.getPane("proyectos")!.style.zIndex = "250";
  mapaC.getPane("labels")!.style.zIndex = "100";

  const callesFondo = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "Tiles &copy; Esri",
      maxZoom: 16,
    },
  );

  const calles = L.layerGroup([callesFondo]);

  calles.addTo(mapaC);

  // Mensaje de ayuda
  let mensajeZoom: HTMLDivElement | null = null;
  let timeoutMensaje: number | null = null;

  function mostrarMensajeZoom() {
    if (mensajeZoom) return;

    mensajeZoom = document.createElement("div");

    mensajeZoom.innerHTML =
      "Mantén presionada la tecla <b>Ctrl</b> y usa la rueda del mouse para hacer zoom";

    Object.assign(mensajeZoom.style, {
      position: "absolute",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: "1000",
      background: "rgba(0,0,0,0.75)",
      color: "white",
      padding: "10px 16px",
      borderRadius: "6px",
      fontSize: "14px",
      pointerEvents: "none",
    });

    mapaC.getContainer().appendChild(mensajeZoom);

    timeoutMensaje = window.setTimeout(() => {
      mensajeZoom?.remove();
      mensajeZoom = null;
    }, 2500);
  }

  const container = mapaC.getContainer();

  container.addEventListener(
    "wheel",
    (event: WheelEvent) => {
      event.preventDefault();
      if (event.ctrlKey) {
        // Permite zoom
        mapaC.scrollWheelZoom.enable();

        if (mensajeZoom) {
          mensajeZoom.remove();
          mensajeZoom = null;
        }

        if (timeoutMensaje) {
          clearTimeout(timeoutMensaje);
        }

        return;
      }

      // Bloquea el scroll normal
      event.preventDefault();

      // Deshabilita zoom
      mapaC.scrollWheelZoom.disable();

      mostrarMensajeZoom();
    },
    {
      passive: false,
    },
  );
  mapa = mapaC;
  return mapa;
}

// Límites geográficos de México
export const mexicoBounds = L.latLngBounds([14.5, -118.5], [32.8, -86.5]);

export const minZoom = 5;
export const maxZoom = 16;
export function regresarMapa() {
  mapa?.flyToBounds(mexicoBounds);
}
//@ts-ignore
export const baseUrl = import.meta.env.BASE_URL;

export function addGeoJsonToMap(
  map: L.Map,
  geojson: GeoJsonObject,
  options: L.GeoJSONOptions = {},
  paneName = "geojsonPane",
  zIndex = 400,
  events: GeoJsonEvents = {},
): L.GeoJSON {

  if (!map.getPane(paneName)) {
    map.createPane(paneName);
    map.getPane(paneName)!.style.zIndex = zIndex.toString();
  }

  const layer = L.geoJSON(geojson, {
    ...options,
    pane: paneName,

    onEachFeature: (feature, layer) => {



      layer.on({
        click: (event) => {
          layer.closeTooltip();

          events.onFeatureClick?.({ feature, layer, event });
        },

        mouseover: (event) => {
          events.onFeatureMouseOver?.({ feature, layer, event });
        },

        mouseout: (event) => {
          events.onFeatureMouseOut?.({ feature, layer, event });
        },
      });

      options.onEachFeature?.(feature, layer);
    },
  });

  layer.addTo(map);

  return layer;
}
export const capaEstados = ref<L.GeoJSON | null>(null);
export const capaMunicipios = ref<L.GeoJSON | null>(null);
export const geoJsonEstados = ref();
export const capaProyectos = ref<L.FeatureGroup>();
export function removeGeoJsonFromMap(map: L.Map, layer: L.GeoJSON | null | undefined): void {
  if (!layer) return;

  if (map.hasLayer(layer)) {
    map.removeLayer(layer);
  }
}
export async function fetchPublicJson<T>(path: string): Promise<T | null> {
  // @ts-ignore
  const base = import.meta.env.BASE_URL;

  const url = `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

  try {
    const res = await fetch(url);

    // Si no existe (404) o cualquier error HTTP
    if (!res.ok) {
      console.warn(`JSON no encontrado: ${url} (${res.status})`);
      return null;
    }

    return await res.json();
  } catch (err) {
    // Error de red, CORS, etc.
    console.warn(`Error de red al cargar JSON: ${url}`, err);
    return null;
  }
}

export interface GeoJsonEvents {
  onFeatureClick?: (params: GeoJsonFeatureEvent) => void;
  onFeatureMouseOver?: (params: GeoJsonFeatureEvent) => void;
  onFeatureMouseOut?: (params: GeoJsonFeatureEvent) => void;
}
export interface GeoJsonFeatureEvent {
  feature: GeoJSON.Feature;
  layer: L.Layer;
  event: L.LeafletMouseEvent;
}

export function formatearID(id: string): string {
  return id;//parseInt(id).toString();
}
export function volarABounds(bounds: L.LatLngBounds, options?: L.FitBoundsOptions) {
  mapa?.flyToBounds(bounds, {
    duration: 1.5,
    ...options,
  });
}
/**
 * Convierte el nombre de una entidad (NOMGEO) al slug usado para nombrar
 * los archivos JSON de municipios en /municipios/<slug>.json
 */
export function nombreEntidadASlug(nombre: string) {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll(" ", "_");
}
