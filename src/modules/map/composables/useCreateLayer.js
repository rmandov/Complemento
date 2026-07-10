// src/modules/map/composables/useCreateLayer.js
import L from 'leaflet'
import { usePoligonoStore } from '@/stores/poligonoStore'
import { useMapStore } from '@/stores/map'
// NUEVO: store centralizado de selección (CVEGEO, ID_PPI_ESPACIAL)
import { useSeleccionStore } from '@/stores/seleccionStore'

import { useMunicipiosCache } from '../composables/useMunicipiosCache'
import { useMap } from './mapControler'

const { getMunicipiosByEntidad } = useMunicipiosCache()

// Carga Entidades
export function createLayer(poligonos_json, options = {}) {
  const poligonoStore = usePoligonoStore()
  const datosEntidad = useMapStore()
  const { flyToBounds } = useMap()

  const {
    map,
    pane = '',
    name = 'NOMGEO',
    style = {
      weight: 1.2,
      fillColor: 'rgb(106, 106, 106)',
      fillOpacity: 0.5,
      color: 'white',
      dashArray: '3',
    },
  } = options

  if (!poligonos_json) return

  const newLayer = L.geoJSON(poligonos_json, {
    pane,
    style,
    onEachFeature: (feature, layer) => {
      const nombreEntidad = feature.properties[name] || 'nombre del poligono'
      layer.bindTooltip(nombreEntidad)

      layer.on({
        mouseover,
        mouseout,
      })

      layer.on('click', async (e) => {
        L.DomEvent.stopPropagation(e)
        const bounds = layer.getBounds()
        layer.setStyle(style)

        if (poligonoStore.entidad) {
          poligonoStore.entidad.addTo(map)
          poligonoStore.setEntidad(null)

          if (poligonoStore.isMunicipiosLayer) {
            map.removeLayer(poligonoStore.municipiosLayer)
            poligonoStore.clearMunicipiosLayer()
          }
        }
        poligonoStore.setEntidad(layer)
        map.removeLayer(layer)

        const muncipios = await getMunicipiosByEntidad(feature)

        if (muncipios) {
          const municipiosLayer = createMunicipiosLayer(muncipios, {
            map,
            pane: 'poligonosPane',
            name: 'NOMGEO',
          })

          poligonoStore.setMunicipiosLayer(municipiosLayer)
          poligonoStore.municipiosLayer.addTo(map)
        }

        datosEntidad.setEntidad(nombreEntidad)

        const claveEntidad = feature.properties['CVE_ENT'] || '69'

        datosEntidad.setCVE_ENT(claveEntidad)

        flyToBounds(map, bounds)
      })
    },
  })

  return newLayer
}

// Eventos
function mouseover(e) {
  const layer = e.target
  layer.setStyle({ fillOpacity: 0.8, weight: 2 })
}

function mouseout(e) {
  const layer = e.target
  layer.setStyle({ fillOpacity: 0.5, weight: 1.2 })
}

// Carga municipios
function createMunicipiosLayer(poligonos_json, options = {}) {
  const datosMunicipio = useMapStore()
  const poligonoStore = usePoligonoStore()
  // NUEVO: store centralizado de selección
  const seleccionStore = useSeleccionStore()
  const { flyToBounds } = useMap()
  const {
    map,
    pane = '',
    name = 'NOMGEO',
    style = {
      weight: 1.2,
      fillColor: 'rgb(151, 151, 151)',
      fillOpacity: 0.5,
      color: 'white',
      dashArray: '3',
    },
  } = options

  if (!poligonos_json) return

  const newLayer = L.geoJSON(poligonos_json, {
    pane,
    style,
    onEachFeature: (feature, layer) => {
      const nombreLayer = feature.properties[name] || 'nombre del poligono'
      layer.bindTooltip(nombreLayer)

      layer.on({
        mouseover,
        mouseout,
      })

      layer.on('click', async (e) => {
        L.DomEvent.stopPropagation(e)
        const bounds = layer.getBounds()
        layer.setStyle({ fillOpacity: 0.5, weight: 1.2 })
        if (poligonoStore.municipio) {
          poligonoStore.municipio.addTo(map)
          poligonoStore.setMunicipio(null)
        }
        poligonoStore.setMunicipio(layer)
        map.removeLayer(layer)

        datosMunicipio.setMunicipio(nombreLayer)

        // ── NUEVO: Task 3 ────────────────────────────────────────
        // El CVEGEO ya viene incluido en las properties del feature
        // GeoJSON de cada municipio (ej. "01001"), tal como se ve en
        // municipios/<estado>.json. Se extrae directo, sin necesidad
        // de recalcularlo ni pedirlo por red.
        const cveGeo = feature.properties?.CVEGEO ?? null
        console.log('📍 CVEGEO del municipio seleccionado:', cveGeo)

        // Se centraliza en Pinia (Task 4): cualquier componente puede
        // leer seleccionStore.cveGeo de forma reactiva.
        seleccionStore.setCVEGEO(cveGeo)
        // ───────────────────────────────────────────────────────

        if (map && bounds.isValid()) {
          flyToBounds(map, bounds)
        }
      })
    },
  })
  return newLayer
}
