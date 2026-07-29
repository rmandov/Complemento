/**
 * PolygonLayer.js
 * ----------------------------------------------------------------
 * Capa de polígonos (zonas, estados, áreas de cobertura...) a partir
 * de GeoJSON. Solo dibuja las formas y emite eventos de interacción;
 * nunca decide qué hacer con ellos.
 * ----------------------------------------------------------------
 */
import { Layer } from './Layer.js'

export class PolygonLayer extends Layer {
  constructor(config) {
    super(config)
    this._style = config.style || {}
    this._hoverStyle = config.hoverStyle || {}
    this._tooltipTemplate = config.tooltipTemplate || null
  }

  create() {
    if (!this.geojson) throw new Error('PolygonLayer necesita geojson')

    this._layer = L.geoJSON(this.geojson, {
      style: () => ({ ...this._style }),
      onEachFeature: (feature, leafletLayer) => {
        if (this._tooltipTemplate) {
          leafletLayer.bindTooltip(this._tooltipTemplate(feature.properties), { sticky: true })
        }

        // Interacción -> emit(). Nunca lógica de negocio aquí.
        leafletLayer.on('click', (e) => {
          this.emit('feature-click', {
            feature,
            layer: this,
            originalEvent: e,
            properties: feature.properties,
          })
        })

        leafletLayer.on('mouseover', (e) => {
          leafletLayer.setStyle(this._hoverStyle)
          this.emit('feature-hover', { feature, layer: this, originalEvent: e })
        })

        leafletLayer.on('mouseout', (e) => {
          leafletLayer.setStyle(this._style)
          this.emit('feature-out', { feature, layer: this, originalEvent: e })
        })
      },
    })

    this.emit('layer-created', { layer: this, leafletLayer: this._layer })
    return this
  }
}
