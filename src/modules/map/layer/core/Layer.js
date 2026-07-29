/**
 * Layer.js
 * ----------------------------------------------------------------
 * Clase base abstracta para cualquier tipo de capa (polígonos, puntos,
 * clusters...). Define el ciclo de vida común a todas:
 *
 *    create()  -> construye la geometría de Leaflet, una sola vez
 *    addTo()   -> la muestra en el mapa
 *    remove()  -> la oculta del mapa (sin destruirla)
 *    destroy() -> la libera definitivamente
 *
 * Regla de oro para cualquier subclase nueva (PolygonLayer, PointLayer,
 * ClusterLayer, o la que tú agregues mañana): implementa create() y
 * usa this.emit(...) para avisar lo que pasa. Nunca importes Pinia
 * aquí: de reaccionar a los eventos se encarga quien esté escuchando
 * (normalmente LayerManager).
 * ----------------------------------------------------------------
 */
import { EventEmitter } from './EventEmitter.js'

let _idCounter = 0

export class Layer extends EventEmitter {
  constructor({ name, geojson = null, options = {} } = {}) {
    super()
    this.id = `layer-${name ?? 'sin-nombre'}-${++_idCounter}`
    this.name = name
    this.geojson = geojson
    this.options = options
    this._layer = null // instancia real de Leaflet, nace en create()
    this._visible = false
    this._destroyed = false
  }

  // ---------- Cada subclase DEBE implementar esto ----------

  /** Debe crear y asignar `this._layer` (la instancia de Leaflet). */
  create() {
    throw new Error(`create() debe implementarse en ${this.constructor.name}`)
  }

  // ---------- Ciclo de vida común (no hace falta tocarlo) ----------

  addTo(map) {
    if (this._destroyed) {
      throw new Error(`No se puede usar la capa "${this.name}": ya fue destruida`)
    }
    if (!this._layer) this.create()
    if (!this._visible) {
      this._layer.addTo(map)
      this._visible = true
      this.emit('layer-added', { layer: this, leafletLayer: this._layer })
    }
    return this
  }

  remove(map) {
    if (this._layer && this._visible) {
      map.removeLayer(this._layer)
      this._visible = false
      this.emit('layer-removed', { layer: this, leafletLayer: this._layer })
    }
    return this
  }

  show() {
    this._layer?.setStyle?.({ opacity: 1, fillOpacity: 0.5 })
    this._visible = true
    return this
  }

  hide() {
    this._layer?.setStyle?.({ opacity: 0, fillOpacity: 0 })
    this._visible = false
    return this
  }

  /** Libera memoria y desconecta todos los listeners. Sin vuelta atrás. */
  destroy() {
    this.emit('layer-destroyed', { layer: this })
    this._layer = null
    this._destroyed = true
    this.clear() // heredado de EventEmitter
  }

  isVisible() {
    return this._visible
  }

  getLeafletLayer() {
    return this._layer
  }
}
