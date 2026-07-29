/**
 * EventEmitter.js
 * ----------------------------------------------------------------
 * Bus de eventos simple: es la base de comunicación de todo el
 * framework. Las capas (Layer) NUNCA llaman directamente a Pinia ni
 * a Vue, solo "avisan" con emit(...) que algo pasó. Quien esté
 * interesado se suscribe con on(...).
 *
 * NOVEDAD respecto a la versión original: se añadió onAny(), que
 * permite escuchar TODOS los eventos sin tener que listarlos uno por
 * uno. Es lo que usa LayerManager para reenviar automáticamente
 * cualquier evento que emita una capa -incluso eventos que no
 * existían todavía, como "cluster-click" en ClusterLayer- sin tener
 * que modificar LayerManager cada vez que agregas un evento nuevo.
 * ----------------------------------------------------------------
 */
export class EventEmitter {
  constructor() {
    this._handlers = new Map() // 'evento' -> [callback, callback, ...]
    this._anyHandlers = [] // callbacks que escuchan TODOS los eventos
  }

  /** Escucha un evento puntual. Devuelve una función para desuscribirse. */
  on(event, handler) {
    if (!this._handlers.has(event)) this._handlers.set(event, [])
    this._handlers.get(event).push(handler)
    return () => this.off(event, handler)
  }

  /**
   * Escucha TODOS los eventos, sin importar el nombre.
   * El handler recibe (nombreDelEvento, payload).
   * Devuelve una función para dejar de escuchar.
   */
  onAny(handler) {
    this._anyHandlers.push(handler)
    return () => {
      this._anyHandlers = this._anyHandlers.filter((h) => h !== handler)
    }
  }

  off(event, handler) {
    const handlers = this._handlers.get(event)
    if (!handlers) return
    this._handlers.set(
      event,
      handlers.filter((h) => h !== handler),
    )
  }

  emit(event, payload) {
    this._handlers.get(event)?.forEach((handler) => handler(payload))
    this._anyHandlers.forEach((handler) => handler(event, payload))
  }

  /** Quita todos los listeners. Se usa al destruir una capa. */
  clear() {
    this._handlers.clear()
    this._anyHandlers = []
  }
}
