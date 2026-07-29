/**
 * LayerManager.js
 * ----------------------------------------------------------------
 * Único puente entre las capas de Leaflet y el resto de la app (Pinia,
 * Vue). Aquí NO hay lógica de negocio, solo:
 *   1) llevar el registro de qué capas existen
 *   2) reenviar sus eventos hacia afuera
 *
 * CAMBIO IMPORTANTE respecto a la versión original:
 * "registrar" una capa y "mostrarla/ocultarla" ahora son operaciones
 * distintas:
 *
 *   register(layer)    -> se hace UNA vez: conecta los eventos de la capa
 *   show(id) / hide(id) -> se llaman muchas veces: solo cambian si la
 *                          capa se ve o no en el mapa
 *
 * ¿Por qué el cambio? En la versión original, add()/remove() hacían
 * ambas cosas a la vez. Si el usuario ocultaba y volvía a mostrar una
 * capa varias veces (típico botón de "capas" en la UI), cada add()
 * volvía a suscribir los listeners de esa capa SIN quitar los
 * anteriores -> un solo clic terminaba emitiendo el mismo evento 2, 3,
 * 4 veces, cada vez que se togggleaba. Separar registro de
 * visibilidad elimina ese bug de raíz: los eventos se conectan una
 * sola vez, en register().
 * ----------------------------------------------------------------
 */
import { EventEmitter } from './EventEmitter.js'

export class LayerManager extends EventEmitter {
  constructor(mapInstance) {
    super()
    this._map = mapInstance
    this._layers = new Map() // id -> Layer
    this._unsubscribers = new Map() // id -> función para dejar de escuchar esa capa
  }

  /**
   * Registra una capa nueva: la conecta al bus de eventos y, por
   * defecto, la muestra en el mapa. Se hace una sola vez por capa.
   */
  register(layer, { visible = true } = {}) {
    if (this._layers.has(layer.id)) {
      console.warn(`La capa "${layer.id}" ya está registrada`)
      return this
    }

    this._layers.set(layer.id, layer)

    // Reenvía TODOS los eventos de la capa (feature-click, cluster-click,
    // o cualquiera que agregues mañana) sin tener que listarlos aquí.
    const unsubscribe = layer.onAny((eventName, payload) => this.emit(eventName, payload))
    this._unsubscribers.set(layer.id, unsubscribe)

    if (visible) layer.addTo(this._map)

    this.emit('manager-layer-registered', { layer, manager: this })
    return this
  }

  /** Oculta la capa del mapa; sigue registrada y se puede volver a mostrar. */
  hide(layerId) {
    this._layers.get(layerId)?.remove(this._map)
    return this
  }

  /** Vuelve a mostrar una capa registrada que estaba oculta. */
  show(layerId) {
    this._layers.get(layerId)?.addTo(this._map)
    return this
  }

  /** Alterna visible/oculta. Es lo que normalmente dispara un botón de capas. */
  toggle(layerId) {
    const layer = this._layers.get(layerId)
    if (!layer) return this
    layer.isVisible() ? this.hide(layerId) : this.show(layerId)
    return this
  }

  get(layerId) {
    return this._layers.get(layerId) || null
  }

  getAll() {
    return Array.from(this._layers.values())
  }

  /** Quita del mapa, desconecta eventos y libera memoria. No se puede reutilizar. */
  destroy(layerId) {
    const layer = this._layers.get(layerId)
    if (!layer) return this

    layer.remove(this._map)
    this._unsubscribers.get(layerId)?.()
    this._unsubscribers.delete(layerId)
    layer.destroy()
    this._layers.delete(layerId)

    this.emit('manager-layer-destroyed', { layer, manager: this })
    return this
  }

  destroyAll() {
    for (const id of Array.from(this._layers.keys())) this.destroy(id)
    return this
  }
}
