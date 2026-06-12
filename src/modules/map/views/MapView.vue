<script setup>
import { ref, onMounted, shallowRef } from 'vue'
import L from 'leaflet'

import { useMap } from '@/composables/controlesMap'
// Eliminamos import de useProyectosLayer

import 'leaflet/dist/leaflet.css'

const mapContainer = ref(null)

const layer_estado_seleccionado = shallowRef(null)
const layer_municipios_seleccionado = shallowRef(null)
const capaProyectos = shallowRef(null) // ← guardar capa de proyectos

const { map, initMap, resetView, flyToBounds, currentBounds } = useMap(mapContainer)

// Capa para mostrar informacion

// Promesas de datos
const geoJsonPromise = fetch('/entidades.json')
  .then((res) => res.json())
  .catch((err) => {
    console.error('Error cargando estados:', err)
    return null
  })



const geoJsonProyectos = fetch('/PPIs/Azul.json')
  .then((res) => res.json())
  .catch((err) => {
    console.error('Error cargando proyectos:', err)
    return null
  })




// Función para cargar y mostrar proyectos (se ejecutará después de tener datos)
async function cargarProyectos(proyectosData) {
  if (!map.value || !proyectosData) return

  // Si ya existe una capa de proyectos, la removemos para evitar duplicados
  if (capaProyectos.value) {
    map.value.removeLayer(capaProyectos.value)
  }

  const estiloBase = { radius: 5, weight: 1, fillOpacity: 0.7, color: '#333', fillColor: '#3498db' }

  // Crear capa GeoJSON de proyectos
  const proyectosLayer = L.geoJSON(proyectosData, {
    pointToLayer: (feature, latlng) => {
      // Determinar estilo según categoría
      const marker = L.circleMarker(latlng, {
        ...estiloBase,
      })
      marker.options.pane = 'proyectosPane' // forzar pane
      return marker
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
    pane: 'proyectosPane',
  })

  proyectosLayer.addTo(map.value)
  capaProyectos.value = proyectosLayer
}

// Botón para regresar a vista México
async function goBack() {
  resetView()

  if (layer_municipios_seleccionado.value) {
    map.value.removeLayer(layer_municipios_seleccionado.value)
    layer_municipios_seleccionado.value = null
  }

  if (layer_estado_seleccionado.value) {
    layer_estado_seleccionado.value.addTo(map.value)
    layer_estado_seleccionado.value = null
  }

  // Volver a mostrar los proyectos si estaban ocultos (opcional)
  if (capaProyectos.value && !map.value.hasLayer(capaProyectos.value)) {
    capaProyectos.value.addTo(map.value)
  }
}

// Función para cargar municipios (declarada antes de usarse)
const carga_municipios = async (estado) => {
  try {
    const response = await fetch(`/municipios/${estado}.json`)
    const geojson = await response.json()
    console.log('Municipios cargados:', geojson)

    const municipiosCapa = L.geoJSON(geojson, {
      pane: 'poligonosPane',
      style: {
        color: '#D32F2F',
        weight: 1,
        fillColor: '#FFCDD2',
        fillOpacity: 0.2,
        dashArray: '3',
      },
      onEachFeature: (feature, layer) => {
        const municipio_nombre = feature.properties.NOMGEO || 'Municipio'
        layer.bindTooltip(municipio_nombre)

        layer.on('mouseover', () => {
          layer.setStyle({ fillOpacity: 0, weight: 1.5 })
        })
        layer.on('mouseout', () => {
          layer.setStyle({ fillOpacity: 0.2, weight: 1 })
        })

        layer.on('click', async (e) => {
          // Encuadrar la vista al municipio
          L.DomEvent.stopPropagation(e)

          // Si ya hay un municipio seleccionado, limpiar antes
          if (layer_municipios_seleccionado.value) {
            layer_municipios_seleccionado.value.setStyle({ color: '#D32F2F' })
          }

          layer.setStyle({ color: '#0000ff' })
          const bounds = layer.getBounds()
          console.log('Encuadre municipio', bounds)

          flyToBounds(bounds)
        })
      },
    })

    municipiosCapa.addTo(map.value)
    layer_municipios_seleccionado.value = municipiosCapa
  } catch (err) {
    console.error('Error cargando municipios:', err)
  }
}

onMounted(async () => {
  initMap()

  // Creamos controladores y divs dentro del mapa
  // 1. Abajo
  var container_bl = L.control({
    position: 'bottomleft'
  });

 /*  container_bl.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'descripcion'); // create a div with a class "info"
    this.update();
    return this._div;
}; */

container_bl.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'container_bl');

    this._cuadrado = L.DomUtil.create('div', 'cuadrado', this._div);
    this._descripcion = L.DomUtil.create('div', 'descripcion', this._div);

    this._cuadrado.innerHTML = 'Título';
    this._descripcion.innerHTML = 'Contenido';

    this.update();

    return this._div;
}

// method that we will use to update the control based on feature properties passed
container_bl.update = function (props) {
    this._descripcion.innerHTML = '<h4>Descripción</h4>' +  (props ?
        '<b>' + props.name + '</b><br />' + props.density + ' people / mi<sup>2</sup>'
        : 'Lorem ipsum dolor sit amet consectetur, adipisicing elit. In obcaecati aliquam porro culpa dignissimos, exercitationem quam. Illum cumque perspiciatis asperiores maxime aliquam laborum qui impedit neque, corrupti veritatis, aut molestiae?');
};

container_bl.addTo(map.value);


  // Crear pane para polígonos (estados y municipios) con z-index bajo
  map.value.createPane('poligonosPane')
  map.value.getPane('poligonosPane').style.zIndex = 400

  // Crear pane para proyectos (puntos) con z-index alto
  map.value.createPane('proyectosPane')
  map.value.getPane('proyectosPane').style.zIndex = 700

  // 1. Cargar estados
  const entidades = await geoJsonPromise
  if (entidades && map.value) {
    const estadosCapa = L.geoJSON(entidades, {
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

          const entidad_clickeada = layer.feature.properties.NOMGEO
          console.log('Estado clickeado:', entidad_clickeada)

          // Si ya hay un estado seleccionado, limpiar antes
          if (layer_estado_seleccionado.value) {
            if (layer_municipios_seleccionado.value) {
              map.value.removeLayer(layer_municipios_seleccionado.value)
              layer_municipios_seleccionado.value = null
            }
            layer_estado_seleccionado.value.addTo(map.value)
            layer_estado_seleccionado.value = null
          }

          // Guardar la capa del estado actual para poder regresar después
          layer_estado_seleccionado.value = layer
          map.value.removeLayer(layer)

          // Cargar municipios
          const entidad_json = entidad_clickeada
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replaceAll(' ', '_')
          await carga_municipios(entidad_json)

          // Opcional: ocultar proyectos mientras se ven municipios
          /* if (capaProyectos.value && map.value.hasLayer(capaProyectos.value)) {
            map.value.removeLayer(capaProyectos.value)
          } */

          // Encuadrar la vista al estado
          const bounds = layer.getBounds()
          flyToBounds(bounds)
        })
      },
    })
    estadosCapa.addTo(map.value)
  }

  // 2. Cargar proyectos (directamente sin composable)
  const proyectosData = await geoJsonProyectos
  if (proyectosData) {

    console.log("Aqui estan los proyectos de Azul :D, ", proyectosData);

    await cargarProyectos(proyectosData)


  }
})
</script>

<template>
  <div class="map-wraper">
    <div style="height: 100%; width: 300px; border: solid 1px purple;"></div>
    <div ref="mapContainer" class="map"></div>
    <button class="back-button" @click="goBack">Enfocar a todo el país</button>
  </div>
</template>

<style scoped>
.map-wraper {
  display: flex;
  border: solid 1px blue;
  width: calc(100dvw - (100dvw - 100%));
  /*  height: 100dvh; */
  height: calc(100dvh - var(--nav-height));
  /* height: 100dvh; */
  padding: 1rem;
}

.map {
  border: solid 1px red;
  width: 100%;
  height: 100%;
}
.back-button {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  background: white;
  border: 1px solid #ccc;
  padding: 5px 10px;
  cursor: pointer;
}


</style>
