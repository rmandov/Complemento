/**
 * ClusterLayer.js  (NUEVO)
 * ----------------------------------------------------------------
 * Capa de puntos que se agrupan automáticamente en "clusters" cuando
 * hay muchos cerca entre sí. Típico con cientos o miles de
 * marcadores: hospitales, sucursales, sensores, unidades de flotilla...
 *
 * Usa el plugin leaflet.markercluster por debajo, pero -igual que el
 * resto de las capas- solo se comunica hacia afuera mediante eventos.
 * Nadie fuera de esta clase necesita saber que existe
 * L.markerClusterGroup: para LayerManager, Pinia y Vue, ClusterLayer
 * es una capa más.
 *
 * Requiere, una sola vez en el punto de entrada de tu app (main.js):
 *
 *   npm install leaflet.markercluster
 *
 *   import 'leaflet.markercluster/dist/MarkerCluster.css';
 *   import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
 *   import 'leaflet.markercluster'; // registra L.markerClusterGroup
 * ----------------------------------------------------------------
 */
import { Layer } from './Layer.js'

export class ClusterLayer extends Layer {
  constructor(config) {
    super(config)
    this._pointToLayer = config.pointToLayer || null
    this._popupTemplate = config.popupTemplate || null
    // Opciones del plugin: radio de agrupación, comportamiento en zoom
    // máximo, etc. Todas las opciones:
    // https://github.com/Leaflet/Leaflet.markercluster#options
    this._clusterOptions = {
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      ...config.clusterOptions,
    }
  }

  create() {
    if (!this.geojson) throw new Error('ClusterLayer necesita geojson')
    if (typeof L.markerClusterGroup !== 'function') {
      throw new Error(
        'Falta leaflet.markercluster. Instálalo con "npm install leaflet.markercluster" ' +
          'e importa su JS y CSS antes de usar ClusterLayer (ver comentario al inicio de este archivo).',
      )
    }

    const clusterGroup = L.markerClusterGroup(this._clusterOptions)

    // Igual que PointLayer: construimos los puntos con L.geoJSON...
    const puntos = L.geoJSON(this.geojson, {
      pointToLayer: (feature, latlng) => {
        if (this._pointToLayer) return this._pointToLayer(feature, latlng)
        return L.circleMarker(latlng, {
          radius: 8,
          fillColor: '#2a9d8f',
          color: '#fff',
          weight: 1,
          fillOpacity: 0.9,
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

    // ...y los metemos uno por uno en el grupo de clusters. Se hace así,
    // en vez de clusterGroup.addLayer(puntos) directo, para no depender
    // de cómo maneja internamente el plugin los LayerGroup anidados:
    // eachLayer() es la forma explícita y documentada de agregar
    // marcadores individuales.
    puntos.eachLayer((marker) => clusterGroup.addLayer(marker))

    // Evento propio del cluster: útil para, por ejemplo, mostrar
    // "N elementos agrupados aquí" en un panel de Pinia (ver
    // useMapStore.js -> registerClusterClick).
    clusterGroup.on('clusterclick', (e) => {
      this.emit('cluster-click', {
        layer: this,
        count: e.layer.getChildCount(),
        latlng: e.layer.getLatLng(),
        originalEvent: e,
      })
    })

    this._layer = clusterGroup
    this.emit('layer-created', { layer: this, leafletLayer: this._layer })
    return this
  }
}
