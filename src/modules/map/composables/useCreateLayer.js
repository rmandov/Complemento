import L from 'leaflet'
import { usePoligonoStore } from '@/stores/poligono'

// Para cargar los GeoJson
import { useGeoJson } from '../composables/useGeoJson'
import { shallowRef } from 'vue'
const { getGeoJson } = useGeoJson()

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
  const newEntidad = usePoligonoStore()
  /* const muncipiosLayer = shallowRef(null); */

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
      const nombreEntidad = feature.properties[name] || 'nombre del poligono'
      layer.bindTooltip(nombreEntidad)

      // El evento click puede ser gestionado aqui mismo, por ahora esta en una sentencia separada.
      layer.on({
        mouseover,
        mouseout,
      })

      layer.on('click', async (e) => {
        L.DomEvent.stopPropagation(e)
        const bounds = layer.getBounds()
        layer.setStyle(style)

        // ** INICIO - Gestion de poligono clickeado **
        // Se verifica si ya existe un poligono almacenado, esto significa que ya hubo un elemnto que fue clickeado.
        if (newEntidad.EPoligono) {
          // Si ya existe, se agrega al mapa y se libera espacio para el nuevo elemento que va a se eliminado del mapa.
          newEntidad.EPoligono.addTo(map)
          newEntidad.setEPoligono(null)

          // ** INICIO - Gestion municipios
          console.log('Municpios: ', newEntidad.municipiosLayer)

          if (newEntidad.municipiosLayer) {
            map.removeLayer(newEntidad.municipiosLayer) // ← .value porque es shallowRef
            newEntidad.clearMLayer()
          }

          // ** FIN - Gestion municipios
        }
        // Se almacena poligono clickeado y se elimina del mapa
        newEntidad.setEPoligono(layer)
        map.removeLayer(layer)
        // ** FIN - Gestion de poligono clickeado **

        // ** INCIO - Carga de muncipios de la entidad clickeada **
        // 1. Tratamiento del nombre para buscar en json
        const nombreEntidad_json = nombreEntidad
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replaceAll(' ', '_')

        const muncipios = await getGeoJson(`municipios/${nombreEntidad_json}.json`)
        if (muncipios) {
          newEntidad.municipiosLayer = createMunicipiosLayer(muncipios, {
            map,
            pane: 'poligonosPane',
            name: 'NOMGEO',
          })
          newEntidad.municipiosLayer.addTo(map)
        }

        /* console.log("Municpios descargados:", muncipios); */

        // ** FIN - Carga de muncipios de la entidad clickeada **

        map.flyToBounds(bounds)
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
  const newEntidad = usePoligonoStore()
  const {
    map,
    pane = '',
    name = 'NOMGEO',
    style = {
      weight: 1.2,
      fillColor: 'rgb(30, 133, 248)',
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

      // El evento click puede ser gestionado aqui mismo, por ahora esta en una sentencia separada.
      layer.on({
        mouseover,
        mouseout,
      })

      layer.on('click', async (e) => {
        L.DomEvent.stopPropagation(e)
        const bounds = layer.getBounds()
        layer.setStyle({ fillOpacity: 0.5, weight: 1.2 })

        console.log('Municipio clickeado!! :D')
        if (newEntidad.MPoligono) {
          // Si ya existe, se agrega al mapa y se libera espacio para el nuevo elemento que va a se eliminado del mapa.
          newEntidad.MPoligono.addTo(map)
          newEntidad.setMPoligono(null)
        }
        // Se almacena poligono clickeado y se elimina del mapa
        newEntidad.setMPoligono(layer)
        map.removeLayer(layer)

        if (map && bounds.isValid()) {
          map.flyToBounds(bounds)
        }
      })
    },
  })
  return newLayer
}
