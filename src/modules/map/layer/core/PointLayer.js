/**
 * PointLayer.js
 * ----------------------------------------------------------------
 * Capa de puntos individuales, SIN agrupar. Útil cuando tienes pocos
 * puntos (decenas). Si vas a mostrar cientos o miles de puntos
 * cercanos entre sí (ej. hospitales en todo el país), usa
 * ClusterLayer en su lugar: sin cluster, el mapa se satura de
 * marcadores encimados y se vuelve ilegible.
 * ----------------------------------------------------------------
 */
import { Layer } from './Layer.js'

export class PointLayer extends Layer {
  constructor(config) {
    super(config)
    this._pointToLayer = config.pointToLayer || null
    this._popupTemplate = config.popupTemplate || null
  }

  create() {
    if (!this.geojson) throw new Error('PointLayer necesita geojson')

    this._layer = L.geoJSON(this.geojson, {
      pointToLayer: (feature, latlng) => {
        if (this._pointToLayer) return this._pointToLayer(feature, latlng)
        // circleMarker por defecto: se dibuja con SVG, no depende de
        // imágenes de ícono (evita el clásico "ícono roto" de Leaflet
        // al usar bundlers como Vite/Webpack; ver README).
        return L.circleMarker(latlng, {
          radius: 6,
          fillColor: '#ff7800',
          color: '#000',
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8,
        })
      },
      onEachFeature: (feature, leafletLayer) => {
        if (this._popupTemplate) {
          leafletLayer.bindPopup(this._popupTemplate(feature.properties))
        }

        leafletLayer.on('click', (e) => {
          this.emit('feature-click', {
            feature,
            layer: this,
            originalEvent: e,
            properties: feature.properties,
          })
        })
      },
    })

    this.emit('layer-created', { layer: this, leafletLayer: this._layer })
    return this
  }
}
