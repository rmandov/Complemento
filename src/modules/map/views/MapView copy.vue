<script setup>
import { ref, onMounted, shallowRef } from 'vue'
import L from 'leaflet'

import { useMap } from '@/composables/controlesMap'
import { useProyectosLayer } from '../composables/useProyectosLayer'

import 'leaflet/dist/leaflet.css'

const mapContainer = ref(null)

/*
Estado seleccionado, guardamos su valores:
- Layer del estado
- Nombre del estado

Util en goBack function, al regresar a la vista de Mexico podemos volver a cargar el layer de la entidad y eliminar el layer del municipio
*/

const layer_estado_seleccionado = shallowRef(null)
const layer_municipios_seleccionado = shallowRef(null)
const capaProyectos = shallowRef(null) // ← guardar capa de proyectos

// Inicializar el mapa
const { map, initMap, resetView, flyToBounds, currentBounds } = useMap(mapContainer)

const geoJsonPromise = fetch('/entidades.json')
  .then((res) => res.json())
  .catch((err) => {
    console.error('Error cargando estados:', err)
    return null
  })

const geoJsonProyectos = fetch('/PPIs/PRUEBA_PPI_geojson.json')
  .then((res) => res.json())
  .catch((err) => {
    console.error('Error cargando estados:', err)
    return null
  })

// Función para cargar y mostrar proyectos (se ejecutará después de tener datos)
async function cargarProyectos(proyectosData) {
  if (!map.value || !proyectosData) return

  // Si ya existe una capa de proyectos, la removemos para evitar duplicados
  if (capaProyectos.value) {
    map.value.removeLayer(capaProyectos.value)
  }

  // Configuración de estilos por categoría
  const estilosPorCategoria = {
    'Infraestructura, Comunicaciones y Transportes': { fillColor: '#e74c3c' },
    'Instituto de Seguridad y Servicios Sociales de los Trabajadores del Estado': {
      fillColor: '#27ae60',
    },
  }
  const estiloBase = { radius: 5, weight: 1, fillOpacity: 0.7, color: '#333' }

  // Crear capa GeoJSON de proyectos
  const proyectosLayer = L.geoJSON(proyectosData, {
    pointToLayer: (feature, latlng) => {
      // Determinar estilo según categoría
      const categoria = feature.properties.CATEGORIA || ''
      const estiloPersonalizado = estilosPorCategoria[categoria] || { fillColor: '#3498db' }
      return L.circleMarker(latlng, {
        ...estiloBase,
        ...estiloPersonalizado,
      })
    },
    onEachFeature: (feature, layer) => {
      // Tooltip con nombre corto o fallback
      const nombre = feature.properties.NOMBRE_CORTO || feature.properties.NOMBRE || 'Proyecto'
      layer.bindTooltip(nombre)

      // Evento click opcional
      layer.on('click', () => {
        console.log('Proyecto seleccionado:', nombre, feature.properties)
      })
    },
  })

  proyectosLayer.addTo(map.value)
  capaProyectos.value = proyectosLayer
}

// Boton para regresa a la vista Mexico
async function goBack() {
  // 1. Se mueve a la vista completa de Mexico
  resetView()

  // 2. Se elimina la capa de municipios
  if (layer_municipios_seleccionado.value) {
    map.value.removeLayer(layer_municipios_seleccionado.value)
    layer_municipios_seleccionado.value = null
  }

  // 3. Se agrega la capa del estado completo
  if (layer_estado_seleccionado.value) {
    layer_estado_seleccionado.value.addTo(map.value)
    layer_estado_seleccionado.value = null
  }

  // Volver a mostrar los proyectos si estaban ocultos (opcional)
  if (capaProyectos.value && !map.value.hasLayer(capaProyectos.value)) {
    capaProyectos.value.addTo(map.value)
  }
}

onMounted(async () => {
  // Carga del mapa centrado en Mexico
  initMap()

  // Cargamos las entidades
  const entidades = await geoJsonPromise

  if (entidades && map.value) {
    // Añadir la capa GeoJSON al mapa existente
    const estadosCapa = L.geoJSON(entidades, {
      style: {
        color: '#1565C0',
        weight: 1.2,
        fillColor: '#90CAF9',
        fillOpacity: 0.5,
      },

      onEachFeature: (feature, layer) => {
        // Tooltip
        const nombre = feature.properties.NOMGEO || 'Estado'
        layer.bindTooltip(nombre)

        // Mouse sobre el estado
        layer.on('mouseover', () =>
          layer.setStyle({
            fillOpacity: 0.8,
            weight: 2,
          }),
        )

        // Acciones al dejar de posicionarse en el estado
        layer.on('mouseout', () => layer.setStyle({ fillOpacity: 0.5, weight: 1.2 }))

        // Acciones al clickear un estado
        layer.on('click', (e) => {
          L.DomEvent.stopPropagation(e) // Evitar que el click llegue al mapa

          // Resteo de styles
          layer.setStyle({
            fillOpacity: 0.5,
            weight: 1.2,
          })

          // Estado seleccionado
          const entidad_clickeada = layer.feature.properties.NOMGEO
          console.log('Este es el estado clickeado: ', entidad_clickeada)
          console.log('Esta son sus propiedades: ', layer.feature.properties)

          async function gestionEntidadClick(nombre_entidad) {
            const entidad_json = nombre_entidad
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replaceAll(' ', '_')
            console.log(entidad_json)

            // En esta etapa verificamos si ya no encontramos dentro de un estado seleccionado y nos estamos moviendo a otra entidad
            // La forma de comprobarlo es verificando si ya existe una entidad layer guardada
            if (layer_estado_seleccionado.value != null) {
              console.log('Ya existe una entidad seleccionada')

              // 2. Se elimina la capa de municipios
              map.value.removeLayer(layer_municipios_seleccionado.value)
              layer_municipios_seleccionado.value = null

              // 3. Se agrega la capa del estado completo
              layer_estado_seleccionado.value.addTo(map.value)
              layer_estado_seleccionado.value = null
            }

            // Esta carga de municipios le pertenecera a controlesMunicipio
            //    1. Eliminar de la capa de estados el polígono del estado que fue seleccionado, para poder aplicar sus municipios como nueva capa

            //      1.1. Primero se guarda la capa a eliminar
            layer_estado_seleccionado.value = layer
            console.log(
              'Si se guardo bien este valor tendría que verse aquí: \n',
              layer_estado_seleccionado.value,
            )
            console.log('voy a ver si este valor es igual al de arriba: ', layer)

            //      1.2. Eliminar el layer del estado seleccionado
            map.value.removeLayer(layer)
            /* remove_entidades() */

            //    2. Carga de municipios del estado
            await carga_municipios(entidad_json)

            //    3. Carga de municipios del estado seleecinado
            const encuadre_entidad = layer.getBounds()
            console.log(
              'Este es el rectangulo que compone la entidad seleccionada: ',
              encuadre_entidad,
            )
            flyToBounds(encuadre_entidad)
            console.log('Encuadre entidad: ', currentBounds)
          }

          gestionEntidadClick(entidad_clickeada)
        })
      },
    })
    estadosCapa.addTo(map.value)

    // Esta función puede incluirse en la carga de un estado seleccionado
    const remove_entidades = () => {
      if (estadosCapa) {
        map.value.removeLayer(estadosCapa)
        estadosCapa.value = null
      }
    }

    // Esta funcion se puede intregar en un composable para carga de municipios
    const carga_municipios = async (estado) => {
      try {
        // 1. Carga de los poligonos del los municipios del estado seleccionado
        const response = await fetch(`/municipios/${estado}.json`)
        const geojson = await response.json()
        console.log('Municipios: \n', geojson)

        // 2. Crear layer
        const municipiosCapa = L.geoJSON(geojson, {
          style: {
            color: '#D32F2F',
            weight: 1,
            fillColor: '#FFCDD2',
            fillOpacity: 0.6,
          },

          onEachFeature: (feature, layer) => {
            const municipio_nombre = feature.properties.NOMGEO || 'Municipio'
            layer.bindTooltip(municipio_nombre)

            layer.on('mouseover', () => {
              layer.setStyle({
                fillOpacity: 0.9,
                weight: 1.5,
                color: '#B71C1C',
              })
            })
            layer.on('mouseout', () => {
              layer.setStyle({ fillOpacity: 0.5, weight: 1, color: '#D32F2F' })
            })
          },
        })

        municipiosCapa.addTo(map.value)
        layer_municipios_seleccionado.value = municipiosCapa
      } catch (err) {
        console.error('Error cargando municipios:', err)
      }
    }
  }

  // Carga de proyectos

  // Carga de proyectos (después de tener los datos resueltos)
  const proyectosData = await geoJsonProyectos

  // Configuración única
  const configProyectos = {
    tooltipField: 'NOMBRE_CORTO',
    tooltipFallback: 'PPI',
    estiloBase: { radius: 5, weight: 1, fillOpacity: 0.7 },
    estilosPorCategoria: {
      'Infraestructura, Comunicaciones y Transportes': { fillColor: '#e74c3c' },
      'Instituto de Seguridad y Servicios Sociales de los Trabajadores del Estado': {
        fillColor: '#27ae60',
      },
    },
    onClick: (feature) => {
      console.log('Proyecto seleccionado:', feature.properties.NOMBRE_CORTO)
    },
  }

  const {
    cargando: cargandoProyectos,
    error: errorProyectos,
    total: totalProyectos,
    capa: capaProyectos,
    seleccionado: proyectoSeleccionado,
    cargar: cargarProyectos,
    filtrarPorCategoria,
  } = useProyectosLayer({
    map,
    data: proyectosData, // ✅ Ahora son los datos ya resueltos
    config: configProyectos,
  })

  // ✅ Agregar la capa de proyectos al mapa
  if (capaProyectos.value) {
    capaProyectos.value.addTo(map.value)
  }

  console.log(cargandoProyectos.value)
})
</script>

<template>
  <div class="map-wraper">
    <div ref="mapContainer" class="map"></div>
    <button class="back-button" @click="goBack">Enfocar a todo el pais</button>
  </div>
</template>

<style scoped>
.map {
  width: 100%;
  height: 500px;
}
</style>
