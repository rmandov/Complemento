import L from 'leaflet'
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

function event_mouseover(e) {
  const layer = e.target
  layer.setStyle({ fillOpacity: 0.8, weight: 2 })
}

function event_mouseout(e) {
  L.DomEvent.stopPropagation(e)

  const layer = e.target
  layer.setStyle({ fillOpacity: 0.5, weight: 1.2 })
}

function event_click(e) {
  const layer = e.target
  console.log('Aqui se gestionan los eventos click')
}

export function createLayer(poligonos_json, options = {}) {
  const {
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
        click: event_click,
      })
    },
  })

  return newLayer
}
