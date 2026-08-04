// src/modules/map/composables/useCreateLayer.js
import L from 'leaflet'
import { usePoligonoStore } from '@/stores/poligonoStore'
import { useMapStore } from '@/stores/map'
import { useSeleccionStore } from '@/stores/seleccionStore'
import { useMunicipiosCache } from '../composables/useMunicipiosCache'
import { useMap } from './mapControler'
import { useActivateClickLayer } from '@/stores/layerActivoStore'

const { getMunicipiosByEntidad } = useMunicipiosCache()

// ═══════════════════════════════════════════════════════════════
// LÓGICA DE SELECCIÓN REUTILIZABLE (click del mapa o filtro)
// ═══════════════════════════════════════════════════════════════

/**
 * Selecciona una entidad: oculta la anterior, carga municipios, actualiza stores.
 * @param {L.Map} map - Instancia de Leaflet
 * @param {L.Layer} layer - Layer de la entidad
 * @param {object} options - { force: true } para saltar validación de click activo
 */
export async function selectEntidad(map, layer, options = {}) {
  const poligonoStore = usePoligonoStore()
  const datosEntidad = useMapStore()
  const { flyToBounds } = useMap()
  const ClickLayer = useActivateClickLayer()

  const feature = layer.feature
  const cveEnt = feature.properties['CVE_ENT']

  // Evitar doble selección
  if (poligonoStore.entidad === layer) return

  // Solo ejecutar si el click en layer está activo, o si viene forzado del filtro
  if (!ClickLayer.clickEnLayerActivo && !options.force) return

  const bounds = layer.getBounds()

  // Restaurar estilo original
  layer.setStyle(
    layer._originalStyle || {
      weight: 1.2,
      fillColor: 'rgb(92, 142, 254)',
      fillOpacity: 0.1,
      color: 'white',
    },
  )

  // ── Restaurar entidad anterior ──
  if (poligonoStore.entidad) {
    poligonoStore.entidad.addTo(map)
    poligonoStore.setEntidad(null)

    if (poligonoStore.isMunicipiosLayer) {
      map.removeLayer(poligonoStore.municipiosLayer)
      poligonoStore.clearMunicipiosLayer()
      poligonoStore.setMunicipio(null)
    }
  }

  // ── Seleccionar nueva entidad ──
  poligonoStore.setEntidad(layer)
  map.removeLayer(layer)

  // ── Cargar y pintar municipios ──
  const municipios = await getMunicipiosByEntidad(feature)

  if (municipios) {
    const municipiosLayer = createMunicipiosLayer(municipios, {
      map,
      pane: 'poligonosPane',
      name: 'NOMGEO',
    })
    poligonoStore.setMunicipiosLayer(municipiosLayer)
    municipiosLayer.addTo(map)
  }

  // ── Actualizar stores (esto dispara el watcher, pero ya tenemos el layer) ──
  datosEntidad.setEntidad(cveEnt)
  datosEntidad.setCVE_ENT(cveEnt)

  if (bounds.isValid()) {
    flyToBounds(map, bounds)
  }
}

/**
 * Selecciona un municipio: oculta el anterior, actualiza stores.
 * @param {L.Map} map - Instancia de Leaflet
 * @param {L.Layer} layer - Layer del municipio
 * @param {object} options - { force: true } para saltar validación de click activo
 */
export async function selectMunicipio(map, layer, options = {}) {
  const poligonoStore = usePoligonoStore()
  const datosMunicipio = useMapStore()
  const seleccionStore = useSeleccionStore()
  const { flyToBounds } = useMap()
  const ClickLayer = useActivateClickLayer()

  const feature = layer.feature
  const cvegeo = feature.properties?.CVEGEO

  if (poligonoStore.municipio === layer) return
  if (!ClickLayer.clickEnLayerActivo && !options.force) return

  const bounds = layer.getBounds()
  layer.setStyle({ fillOpacity: 0.1, weight: 1.2 })

  // ── Restaurar municipio anterior ──
  if (poligonoStore.municipio) {
    poligonoStore.municipio.addTo(map)
    poligonoStore.setMunicipio(null)
  }

  // ── Seleccionar nuevo municipio ──
  poligonoStore.setMunicipio(layer)
  map.removeLayer(layer)

  datosMunicipio.setMunicipio(cvegeo)
  seleccionStore.setCVEGEO(cvegeo)

  if (map && bounds.isValid()) {
    flyToBounds(map, bounds)
  }
}

// ═══════════════════════════════════════════════════════════════
// CARGA DE ENTIDADES
// ═══════════════════════════════════════════════════════════════

export function createLayer(poligonos_json, options = {}) {
  const poligonoStore = usePoligonoStore()
  const datosEntidad = useMapStore()
  const ClickLayer = useActivateClickLayer()
  const { flyToBounds } = useMap()

  const {
    map,
    pane = '',
    name = 'NOMGEO',
    /* style = {
      weight: 1.2,
      fillColor: 'rgb(58, 118, 248)',
      fillOpacity: 0.1,
      color: 'rgb(92, 142, 254)',
      opacity: 1,
      dashArray: '10, 5',
      lineCap: 'round'
    }, */
    style = {
      weight: 1.2,
      fillColor: 'rgb(61, 1, 226)',
      fillOpacity: 0.1,
      color: 'rgb(116, 92, 254)',
      opacity: 1,
      dashArray: '10, 5',
      lineCap: 'round'
    },
  } = options

  if (!poligonos_json) return

  const listaEntidades = []

  const newLayer = L.geoJSON(poligonos_json, {
    pane,
    style,
    onEachFeature: (feature, layer) => {
      const nombreEntidad = feature.properties[name] || 'nombre del poligono'

      // Guardar estilo original para restaurarlo después
      layer._originalStyle = style

      // Guardar entidades en la lista
      listaEntidades.push({
        nombre: nombreEntidad,
        cvegeo: feature.properties?.CVE_ENT,
      })

      layer.bindTooltip(nombreEntidad)

      layer.on({
        mouseover,
        mouseout,
      })

      // ── CLICK: delegar a selectEntidad ──
      layer.on('click', async (e) => {
        if (ClickLayer.clickEnLayerActivo) {
          L.DomEvent.stopPropagation(e)
        }
        if (!ClickLayer.clickEnLayerActivo) return

        await selectEntidad(map, layer)
      })

      // ── Registrar en el store para navegación desde filtros ──
      poligonoStore.registerEntidadLayer(feature.properties.CVE_ENT, layer)
    },
  })

  // Guardar la lista completa en Pinia
  datosEntidad.setEntidades(listaEntidades.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')))

  return newLayer
}

// Eventos hover
function mouseover(e) {
  const layer = e.target
  layer.setStyle({ fillOpacity: 0.8, weight: 1.2 })
}

function mouseout(e) {
  const layer = e.target
  layer.setStyle(layer._originalStyle || { fillOpacity: 0.1, weight: 1.2 })
}

// ═══════════════════════════════════════════════════════════════
// CARGA DE MUNICIPIOS (ahora exportada)
// ═══════════════════════════════════════════════════════════════

export function createMunicipiosLayer(poligonos_json, options = {}) {
  const ClickLayer = useActivateClickLayer()
  const datosMunicipio = useMapStore()
  const poligonoStore = usePoligonoStore()
  const seleccionStore = useSeleccionStore()
  const { flyToBounds } = useMap()

  const {
    map,
    pane = '',
    name = 'NOMGEO',
    style = {
      weight: 1.2,
      /* fillColor: 'rgb(92, 142, 254)', */
      fillColor: 'rgb(248, 204, 58)',
      /* fillOpacity: 0.5, */
      fillOpacity: 0.1,
      color: 'rgb(254, 178, 92)',
      opacity: 1,
      dashArray: '10, 5',
      lineCap: 'round'
    },
  } = options

  if (!poligonos_json) return

  // Limpiar la lista anterior y el registry
  datosMunicipio.clearMunicipios()
  poligonoStore.clearMunicipioLayers()

  const listaMunicipios = []

  const newLayer = L.geoJSON(poligonos_json, {
    pane,
    style,
    onEachFeature: (feature, layer) => {
      const nombreLayer = feature.properties[name] || 'nombre del poligono'

      listaMunicipios.push({
        nombre: nombreLayer,
        cvegeo: feature.properties?.CVEGEO,
      })

      layer.bindTooltip(nombreLayer)

      layer.on({
        mouseover,
        mouseout,
      })

      // ── CLICK: delegar a selectMunicipio ──
      layer.on('click', async (e) => {
        if (ClickLayer.clickEnLayerActivo) {
          L.DomEvent.stopPropagation(e)
        }
        if (!ClickLayer.clickEnLayerActivo) return

        await selectMunicipio(map, layer)
      })

      // ── Registrar en el store ──
      poligonoStore.registerMunicipioLayer(feature.properties.CVEGEO, layer)
    },
  })

  // Guardar la lista completa en Pinia
  datosMunicipio.setMunicipios(
    listaMunicipios.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
  )

  return newLayer
}
