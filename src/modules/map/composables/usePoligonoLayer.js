// composables/useCapaPoligono.js
import L from 'leaflet'
import { usePoligonoStore } from '@/stores/poligonoLevels'

export function createCapaPoligono(geojson, options = {}) {
  const store = usePoligonoStore()

  const {
    map,
    pane = `nivel-${store.nivelActual}`,
    nameKey = 'NOMGEO',
    style = {
      weight: 1.2,
      fillColor: 'rgb(251, 95, 16)',
      fillOpacity: 0.5,
      color: 'white',
      dashArray: '3',
    },
    nivel = 0,
    onNivelSiguiente = null,
    zoomPadding = [50, 50],
  } = options

  if (!geojson || !map) {
    console.warn('createCapaPoligono: se requiere geojson y map')
    return null
  }

  // Crear pane si no existe
  if (!map.getPane(pane)) {
    map.createPane(pane)
    map.getPane(pane).style.zIndex = 400 + nivel
  }

  const capa = L.geoJSON(geojson, {
    pane,
    style,
    onEachFeature: (feature, layer) => {
      const nombre = feature.properties?.[nameKey] || `Polígono ${feature.id || ''}`
      layer.bindTooltip(nombre, {
        permanent: false,
        direction: 'center',
        className: 'tooltip-poligono',
      })

      // Eventos de interacción
      layer.on({
        mouseover: (e) => {
          e.target.setStyle({ fillOpacity: 0.8, weight: 2, color: '#333' })
        },
        mouseout: (e) => {
          e.target.setStyle(style)
        },
        click: async (e) => {
          L.DomEvent.stopPropagation(e)

          const bounds = layer.getBounds()
          const props = feature.properties

          // 1. ZOOM al polígono seleccionado (antes de eliminarlo para que se vea la animación)
          if (bounds.isValid()) {
            map.flyToBounds(bounds, {
              padding: zoomPadding,
              duration: 0.8,
            })
          }

          // 2. ELIMINAR SOLO EL LAYER CLICKEADO (no toda la capa)
          // El polígono específico desaparece, el resto de la capa permanece visible
          capa.removeLayer(layer)

          // 3. Guardar en el stack el estado del layer eliminado para poder recuperarlo al regresar
          store.pushCapa(
            layer, // El layer específico eliminado
            geojson, // El geojson completo de la capa padre
            { ...options, nivel },
            {
              nombre,
              properties: props,
              bounds: bounds.toBBoxString(),
              feature: feature, // Guardamos el feature completo para recrear el layer
            },
          )

          // 4. Cargar siguiente nivel (hijos) que se mostrarán donde estaba el layer eliminado
          if (typeof onNivelSiguiente === 'function') {
            try {
              const geojsonHijo = await onNivelSiguiente(props, layer, bounds, nivel + 1)

              if (geojsonHijo) {
                // Crear la siguiente capa con el mismo bounds/visualización
                const capaHija = createCapaPoligono(geojsonHijo, {
                  ...options,
                  nivel: nivel + 1,
                  pane: `nivel-${nivel + 1}`,
                  style: { ...style, fillColor: getColorNivel(nivel + 1) },
                })

                if (capaHija) {
                  capaHija.addTo(map)

                  // Opcional: hacer zoom a los bounds de la nueva capa para ajustar
                  // const boundsHija = capaHija.getBounds();
                  // if (boundsHija.isValid()) {
                  //   map.flyToBounds(boundsHija, { padding: [20, 20] });
                  // }
                }
              } else {
                // No hay siguiente nivel, mostrar info del polígono
                mostrarInfoFinal(props, map, bounds.getCenter())
              }
            } catch (error) {
              console.error('Error cargando siguiente nivel:', error)
              // En caso de error, restaurar el layer eliminado
              restaurarLayer(capa, store, feature)
            }
          }
        },
      })
    },
  })

  // Marcar la capa para identificación
  capa._esCapaPoligono = true
  capa._nivel = nivel

  return capa
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Restaura un layer eliminado a su capa padre (usado en errores o al regresar)
 */
function restaurarLayer(capaPadre, store, feature) {
  // Recrear el layer a partir del feature guardado
  const layerRestaurado = L.geoJSON(feature, {
    pane: capaPadre.options.pane,
    style: capaPadre.options.style,
  })

  // Añadir de vuelta a la capa padre
  layerRestaurado.eachLayer((l) => {
    capaPadre.addLayer(l)
  })

  return layerRestaurado
}

/**
 * Regresa un nivel en la jerarquía
 */
export function regresarNivel(map, store, optionsBase) {
  const capaRemovida = store.popCapa()

  if (!capaRemovida) return false

  const { layer, geojson, options, metadata } = capaRemovida
  const nivel = capaRemovida.nivel

  // 1. Eliminar la capa hija actual (nivel + 1) del mapa
  map.eachLayer((l) => {
    if (l._esCapaPoligono && l._nivel > nivel) {
      map.removeLayer(l)
    }
  })

  // 2. Restaurar el layer eliminado a su capa padre
  // Necesitamos encontrar la capa padre en el mapa
  let capaPadre = null
  map.eachLayer((l) => {
    if (l._esCapaPoligono && l._nivel === nivel) {
      capaPadre = l
    }
  })

  if (capaPadre && metadata?.feature) {
    // Recrear el layer individual y añadirlo de vuelta
    const layerRestaurado = L.geoJSON(metadata.feature, {
      pane: capaPadre.options.pane,
      style: capaPadre.options.style,
      onEachFeature: (feature, layer) => {
        // Re-enganchar eventos...
        // Esto es complejo, mejor recrear toda la capa padre
      },
    })

    // MEJOR ENFOQUE: Recrear toda la capa padre completa
    if (capaPadre) {
      map.removeLayer(capaPadre)
    }

    const nuevaCapaPadre = createCapaPoligono(geojson, {
      ...optionsBase,
      ...options,
      map,
      nivel: nivel,
    })

    if (nuevaCapaPadre) {
      nuevaCapaPadre.addTo(map)

      // Hacer zoom a los bounds guardados
      if (metadata?.bounds) {
        const b = metadata.bounds.split(',').map(Number)
        map.flyToBounds(
          [
            [b[1], b[0]],
            [b[3], b[2]],
          ],
          { duration: 0.8 },
        )
      }
    }
  }

  return true
}

/**
 * Colores diferentes por nivel
 */
function getColorNivel(nivel) {
  const colores = [
    'rgb(251, 95, 16)',
    'rgb(33, 150, 243)',
    'rgb(76, 175, 80)',
    'rgb(156, 39, 176)',
    'rgb(233, 30, 99)',
  ]
  return colores[nivel % colores.length]
}

/**
 * Mostrar información cuando no hay más niveles
 */
function mostrarInfoFinal(props, map, latlng) {
  const popup = L.popup()
    .setLatLng(latlng)
    .setContent(
      `
      <div style="min-width:200px">
        <h4>${props.NOMGEO || 'Detalle'}</h4>
        <pre>${JSON.stringify(props, null, 2)}</pre>
      </div>
    `,
    )
    .openOn(map)
}
