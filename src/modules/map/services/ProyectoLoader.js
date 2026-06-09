/**
 * Normaliza coordenadas 3D a 2D y valida features.
 * Elimina geometrías inválidas sin romper el flujo.
 */
export class ProyectoLoader {
  async cargar(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

    const data = await res.json();
    if (data.type !== "FeatureCollection") {
      throw new Error("El archivo no es un FeatureCollection válido");
    }

    const features = (data.features || [])
      .map((f) => this._normalizarFeature(f))
      .filter((f) => this._esValido(f));

    console.log(`[ProyectoLoader] ${features.length}/${data.features.length} features válidos`);
    return features;
  }

  /** Convierte coordenadas [lon, lat, 0] → [lon, lat] */
  _normalizarFeature(feature) {
    const coords = feature.geometry?.coordinates;
    if (Array.isArray(coords) && coords.length === 3 && coords[2] === 0) {
      return {
        ...feature,
        geometry: {
          ...feature.geometry,
          coordinates: [coords[0], coords[1]], // 2D
        },
      };
    }
    return feature;
  }

  _esValido(feature) {
    const coords = feature.geometry?.coordinates;
    return (
      feature.geometry?.type === "Point" &&
      Array.isArray(coords) &&
      coords.length >= 2 &&
      !isNaN(coords[0]) &&
      !isNaN(coords[1]) &&
      coords[0] >= -180 &&
      coords[0] <= 180 &&
      coords[1] >= -90 &&
      coords[1] <= 90
    );
  }
}
