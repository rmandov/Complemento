// src/modules/map/utils/geoUtils.js

/**
 * Convierte el nombre de una entidad (NOMGEO) al slug usado para nombrar
 * los archivos JSON de municipios en /municipios/<slug>.json
 */
export function nombreEntidadASlug(nombre) {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll(' ', '_')
}

/**
 * Comparación numérica pura (SIN turf) para saber si dos bounding boxes,
 * en formato [minX, minY, maxX, maxY], se solapan en algún punto.
 */
export function bboxSeSolapan(bboxA, bboxB) {
  const [minXA, minYA, maxXA, maxYA] = bboxA
  const [minXB, minYB, maxXB, maxYB] = bboxB

  const seSolapanEnX = minXA <= maxXB && maxXA >= minXB
  const seSolapanEnY = minYA <= maxYB && maxYA >= minYB

  return seSolapanEnX && seSolapanEnY
}

/**
 * NUEVO: coordenadas por defecto donde debe aparecer el radar cada vez
 * que se ACTIVA (Ciudad de México, Zócalo / Plaza de la Constitución).
 * Se usa desde MapView.vue en activarRadar(). Si prefieres otro punto
 * exacto de referencia para CDMX, solo hay que cambiar este objeto.
 */
export const CDMX_CENTER = { lat: 19.432608, lng: -99.133209 }
