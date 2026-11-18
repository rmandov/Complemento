import type {  Feature, GeoJsonObject } from "geojson";

import { fetchPublicJson, nombreEntidadASlug } from "./mapController";


interface MunicipiosCacheEntry {
  slug: string;
  promise: Promise<GeoJsonObject> | null;
  data: GeoJsonObject | null;
}

/**
 * Cache compartido por toda la aplicación.
 */
const municipiosCache = new Map<number, MunicipiosCacheEntry>();

export function useMunicipiosCache() {
  /**
   * Obtiene (de cache o por red) el FeatureCollection de municipios
   * correspondiente a una entidad.
   */
  async function getMunicipiosByEntidad(
    entidadFeature: Feature | null | undefined
  ): Promise<GeoJsonObject | null> {
    const cveEnt = Number(entidadFeature?.properties?.CVE_ENT);
    const nombre = entidadFeature?.properties?.NOMGEO as string | undefined;

    if (!cveEnt || !nombre) {
      console.warn(
        "useMunicipiosCache: entidad sin CVE_ENT/NOMGEO",
        entidadFeature
      );
      return null;
    }

    const cached = municipiosCache.get(cveEnt);

    // Ya está cargado
    if (cached?.data) {
      return cached.data;
    }

    // Ya existe una petición en curso
    if (cached?.promise) {
      return cached.promise;
    }

    const slug = nombreEntidadASlug(nombre);

    const promise = fetchPublicJson(
      `datos/municipios/${slug}.json`
    ) as Promise<GeoJsonObject>;

    promise.then((data) => {
      municipiosCache.set(cveEnt, {
        slug,
        promise: null,
        data,
      });
    });

    municipiosCache.set(cveEnt, {
      slug,
      promise,
      data: null,
    });

    return promise;
  }



  /**
   * Indica si la entidad ya fue cargada.
   */
  function isEntidadCacheada(cveEnt: number): boolean {
    return Boolean(municipiosCache.get(cveEnt)?.data);
  }

  return {
    getMunicipiosByEntidad,
    isEntidadCacheada,
  };
}
