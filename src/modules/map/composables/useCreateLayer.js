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
  const newPoligono = usePoligonoStore()

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

      // El evento click puede ser gestionado aqui mismo, por ahora esta en una sentencia separada.
      layer.on({
        mouseover,
        mouseout,
      })

      layer.on('click', async (e) => {
        L.DomEvent.stopPropagation(e)
        const bounds = layer.getBounds()
        layer.setStyle({ fillOpacity: 0.5, weight: 1.2 })

        // ** INICIO - Gestion de poligono clickeado **
        // Se verifica si ya existe un poligono almacenado, esto significa que ya hubo un elemnto que fue clickeado.
        if (newPoligono.poligono) {
          // Si ya existe, se agrega al mapa y se libera espacio para el nuevo elemento que va a se eliminado del mapa.
          newPoligono.poligono.addTo(map)
          newPoligono.setPoligono(null)
        }
        // Se almacena poligono clickeado y se elimina del mapa
        newPoligono.setPoligono(layer)
        map.removeLayer(layer)
        // ** FIN - Gestion de poligono clickeado **

        if (map && bounds.isValid()) {
          map.flyToBounds(bounds)
        }
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
