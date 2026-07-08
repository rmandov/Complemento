// src/modules/map/composables/useRadarMunicipiosClip.js
import * as turf from "@turf/turf";
import { useMunicipiosCache } from "./useMunicipiosCache";

const { getMunicipiosByEntidad, getBboxesByEntidad } = useMunicipiosCache();

/**
 * Recorta los municipios de una entidad contra un círculo (radar).
 *
 * @param {Object} entidadFeature - Feature de la entidad seleccionada
 * @param {Array<number>} radarCenter - [lng, lat] centro del radar
 * @param {number} radarRadiusKm - Radio en kilómetros
 * @returns {Promise<FeatureCollection|null>} - Municipios recortados al radar
 */
export async function getMunicipiosClippedByRadar(entidadFeature, radarCenter, radarRadiusKm) {
  const cveEnt = entidadFeature?.properties?.CVE_ENT;

  // 1. Cargar municipios (usa tu cache existente)
  const municipiosFC = await getMunicipiosByEntidad(entidadFeature);
  if (!municipiosFC || !municipiosFC.features?.length) return null;

  // 2. Crear el polígono del radar (círculo aproximado por N segmentos)
  const radarCircle = turf.circle(radarCenter, radarRadiusKm, {
    units: "kilometers",
    steps: 64, // entre más steps, más suave el círculo
    properties: { type: "radar" },
  });

  // 3. Optimización: filtrar por bbox antes de calcular intersección costosa
  const bboxes = getBboxesByEntidad(cveEnt);
  const radarBbox = turf.bbox(radarCircle);

  const clippedFeatures = [];

  for (let i = 0; i < municipiosFC.features.length; i++) {
    const municipio = municipiosFC.features[i];

    // Filtro rápido por bbox: si no se solapan, saltar
    if (bboxes) {
      const munBbox = bboxes[i];
      if (!turf.booleanIntersects(turf.bboxPolygon(munBbox), turf.bboxPolygon(radarBbox))) {
        continue;
      }
    }

    // 4. Cálculo de intersección real
    try {
      const intersection = turf.intersect(turf.featureCollection([municipio, radarCircle]));

      if (intersection) {
        // Preservar las propiedades originales del municipio
        clippedFeatures.push({
          ...intersection,
          properties: {
            ...municipio.properties,
            _radarClipped: true, // flag opcional para estilizar diferente
          },
        });
      }
    } catch (err) {
      // Algunos polígonos degenerados pueden fallar en turf.intersect
      console.warn("Error intersectando municipio:", municipio.properties?.NOMGEO || i, err);
    }
  }

  return turf.featureCollection(clippedFeatures);
}
