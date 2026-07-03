// src/modules/map/utils/geoUtils.js

/**
 * Convierte el nombre de una entidad (NOMGEO) al slug usado para nombrar
 * los archivos JSON de municipios en /municipios/<slug>.json
 *
 * Ejemplo: "Coahuila de Zaragoza" -> "coahuila_de_zaragoza"
 *
 * IMPORTANTE: esta función es EXACTAMENTE la lógica que ya existía dentro
 * del click handler de useCreateLayer.js. Se extrae aquí para que tanto
 * el clic manual sobre una entidad como la carga automática del radar
 * usen la MISMA fuente de verdad (evita que un día diverjan y un archivo
 * deje de encontrarse).
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
 * en formato [minX, minY, maxX, maxY] (el formato que retorna turf.bbox),
 * se solapan en algún punto.
 *
 * Se usa como filtro "barato" de primera pasada (Fase A) antes de aplicar
 * operaciones de turf más costosas (Fase B). Evita correr
 * turf.booleanIntersects sobre polígonos que ni siquiera comparten región,
 * lo cual sería innecesariamente caro si se hiciera contra TODOS los
 * municipios del país en cada movimiento del radar.
 */
export function bboxSeSolapan(bboxA, bboxB) {
  const [minXA, minYA, maxXA, maxYA] = bboxA
  const [minXB, minYB, maxXB, maxYB] = bboxB

  // Si un bbox está completamente a la izquierda/derecha/arriba/abajo
  // del otro, es geométricamente imposible que se toquen.
  const seSolapanEnX = minXA <= maxXB && maxXA >= minXB
  const seSolapanEnY = minYA <= maxYB && maxYA >= minYB

  return seSolapanEnX && seSolapanEnY
}
