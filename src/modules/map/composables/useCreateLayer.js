import L from 'leaflet'
import { usePoligonoStore } from '@/stores/poligono'

// ¿Que valores cambian?, esos valores son los que se usan de input
/*
1. poligonos.json => const [entidad, municipio, localida, etc] = await getGeoJson('[entidad, municipio, localida, etc].json')
2. pane_layer => Pane donde se situan los poligonos
3. styles => {} con los estilos, si no hay se tiene colores por defecto
4. name => Clave para obtener el nombre de ese layer

*/
// ¿Que valores creo?, esos valores son los outputs
/*
1. Regreso la capa que se va a aplicar en el mapa. Con no debo mandar referencia del mapa.
2. Indicar que hay una capa mas de profundida e iniciar otro procesos de carga de poligonos
*/

export function createLayer(poligonos_json, options = {}) {
  const poligonoStore = usePoligonoStore()

  const {
    map,
    pane = '',
    name = 'NOMGEO',
    style = {
      weight: 1.2,
      fillColor: 'rgb(251, 95, 16)',
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
      const nombre_layer = feature.properties[name] || 'nombre del poligono'
      layer.bindTooltip(nombre_layer)

      layer.on({
        mouseover: event_mouseover,
        mouseout: event_mouseout,
        /* click: (e) => event_click(e, map, name, poligonoStore), */
      })

      layer.on('click', async (e) => {
        L.DomEvent.stopPropagation(e)
        const bounds = layer.getBounds()
        layer.setStyle({ fillOpacity: 0.5, weight: 1.2 })

        poligonoStore.setPoligono(layer)

        if (map && bounds.isValid()) {
          map.flyToBounds(bounds)
        }
      })
    },
  })

  return newLayer
}

// Eventos
function event_click(e, map, nameProp, poligonoStore) {
  L.DomEvent.stopPropagation(e)
  const layer = e.target

  // 1. Usamos el nombre dinámico pasado desde options
  const nombre_dinamico = layer?.feature?.properties?.[nameProp] || 'sin nombre'
  console.log('Click en poligono: EVENTO', nombre_dinamico)
  console.log(layer)

  const bounds = layer.getBounds()
  if (map && bounds.isValid()) {
    map.flyToBounds(bounds)
  }

  poligonoStore.setPoligono(layer)
  console.log(poligonoStore.poligono)

  // 2. Enfocar al layer clickeado
}

function event_mouseover(e) {
  const layer = e.target
  layer.setStyle({ fillOpacity: 0.8, weight: 2 })
}

function event_mouseout(e) {
  const layer = e.target
  layer.setStyle({ fillOpacity: 0.5, weight: 1.2 })
}
