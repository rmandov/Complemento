// composables/useEntidadesLayer.js
import L from 'leaflet'

import { useGeoJson } from './useGeoJson'
import { useMap } from './mapControler'
import { useMapLayersStore } from '@/stores/mapLayers'

export async function useEntidadesLayer(map) {
  // Para cargar los GeoJson
  const { getGeoJson } = useGeoJson()

  // Manejo de capas
  const mapLayers = useMapLayersStore()

  // Controles del mapa
  const { flyToBounds } = useMap(map)

  const entidades = await getGeoJson('/entidades.json')

  // Se verifica que se tenga le geojson de las entidades y el mapa
  if (entidades && map.value) {
    const entidadesLayer = L.geoJSON(entidades, {
      pane: 'poligonosPane',
      style: {
        weight: 1.2,
        fillColor: '#9295e4',
        fillOpacity: 0.5,
        color: 'white',
        dashArray: '3',
      },
      onEachFeature: (feature, layer) => {
        const nombre = feature.properties.NOMGEO || 'Estado'
        layer.bindTooltip(nombre)

        layer.on('mouseover', () => layer.setStyle({ fillOpacity: 0.8, weight: 2 }))
        layer.on('mouseout', () => layer.setStyle({ fillOpacity: 0.5, weight: 1.2 }))

        layer.on('click', async (e) => {
          L.DomEvent.stopPropagation(e)
          layer.setStyle({ fillOpacity: 0.5, weight: 1.2 })

          const nombreEntidad = layer.feature.properties.NOMGEO
          console.log('Entidad clickeada:', nombreEntidad)

          mapLayers.bajarNivel(
            layer, // la capa del estado que se clickeó
            map.value, // instancia del mapa
            nombreEntidad, // nombre para mostrar (opcional)
            /* capaMunicipios, */ // nueva capa extra (municipios)
          )

          // Si ya hay un estado seleccionado, limpiar antes
          /*           if (layer_estado_seleccionado.value) {
            if (layer_municipios_seleccionado.value) {
              map.value.removeLayer(layer_municipios_seleccionado.value);
              layer_municipios_seleccionado.value = null;
            }
            layer_estado_seleccionado.value.addTo(map.value);
            layer_estado_seleccionado.value = null;
          } */

          // Guardar la capa del estado actual para poder regresar después
          /*  layer_estado_seleccionado.value = layer;
          map.value.removeLayer(layer); */

          // Cargar municipios
          const entidad_json = nombreEntidad
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replaceAll(' ', '_')

          console.log('Aqui se carga el layer de municipios!!!')

          /* await carga_municipios(entidad_json); */

          // Opcional: ocultar proyectos mientras se ven municipios
          /* if (capaProyectos.value && map.value.hasLayer(capaProyectos.value)) {
            map.value.removeLayer(capaProyectos.value)
          } */

          // Encuadrar la vista al estado
          const bounds = layer.getBounds()
          console.log('Este es el encuadre de la entidad: ', bounds)

          flyToBounds(map, bounds)
        })
      },
    })
    entidadesLayer.addTo(map.value)
  }
}
