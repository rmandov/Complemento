/**
 * ejemplo-geojson.js
 * ----------------------------------------------------------------
 * Datos de EJEMPLO para que MapView.vue funcione sin necesitar una
 * API real. En producción, reemplaza estas constantes por datos que
 * vengan de tu backend (fetch, Pinia, etc.): la forma (GeoJSON
 * FeatureCollection) es lo único que debe respetarse.
 * ----------------------------------------------------------------
 */

// Polígonos simplificados alrededor de la Ciudad de México.
// OJO: NO son límites administrativos reales, son cajas ilustrativas
// solo para que veas PolygonLayer funcionando.
export const zonasGeoJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Zona Centro (ejemplo)' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-99.2, 19.38],
            [-99.06, 19.38],
            [-99.06, 19.48],
            [-99.2, 19.48],
            [-99.2, 19.38],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Zona Norte (ejemplo)' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-99.2, 19.48],
            [-99.06, 19.48],
            [-99.06, 19.58],
            [-99.2, 19.58],
            [-99.2, 19.48],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Zona Sur (ejemplo)' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-99.2, 19.2],
            [-99.06, 19.2],
            [-99.06, 19.38],
            [-99.2, 19.38],
            [-99.2, 19.2],
          ],
        ],
      },
    },
  ],
}

/** Genera N puntos aleatorios alrededor de cada centro (simula hospitales). */
function generarPuntos(centros, porCentro, radioGrados) {
  const features = []
  let n = 1
  centros.forEach(({ nombre, lat, lng }) => {
    for (let i = 0; i < porCentro; i++) {
      const dLat = (Math.random() - 0.5) * radioGrados
      const dLng = (Math.random() - 0.5) * radioGrados
      features.push({
        type: 'Feature',
        properties: { name: `Hospital ${nombre} #${n++}`, address: 'Dirección de ejemplo' },
        geometry: { type: 'Point', coordinates: [lng + dLng, lat + dLat] },
      })
    }
  })
  return { type: 'FeatureCollection', features }
}

// ~45 puntos repartidos en 3 grupos: suficientes para ver el efecto
// de ClusterLayer al alejar el zoom.
export const hospitalesGeoJSON = generarPuntos(
  [
    { nombre: 'Centro', lat: 19.43, lng: -99.13 },
    { nombre: 'Norte', lat: 19.5, lng: -99.15 },
    { nombre: 'Sur', lat: 19.3, lng: -99.1 },
  ],
  15,
  0.08,
)
