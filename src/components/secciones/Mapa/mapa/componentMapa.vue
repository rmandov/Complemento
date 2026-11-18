<script setup lang="ts">
import { inject, onMounted, Ref, ref, watch } from 'vue';
import {
  initMap,
  geoJsonEstados,
  fetchPublicJson,
  addGeoJsonToMap,
  capaEstados,
  GeoJsonFeatureEvent,
  formatearID,
  volarABounds,
  capaMunicipios,
  removeGeoJsonFromMap
} from '../utils/mapController';

import L from 'leaflet';
// @ts-ignore
import 'leaflet/dist/leaflet.css';
import { Feature, FeatureCollection } from "geojson";

import BotonRegresar from './BotonRegresar.vue';
import { Filtros } from '../ViewMapa.vue';
import {
  estiloEF,
  estiloEFHover,
  estiloEFSeleccionado,
  estiloMun,
  estiloMunHover,
  estiloMunSeleccionado
} from '../utils/estilosCapas';
import { useMunicipiosCache } from '../utils/useMunicipiosCache';
import { ExtendedFeatureCollection } from 'd3-geo';

const mapa = ref<L.Map | null>(null);
const mapaContainer = ref<HTMLElement | null>(null);

const filtros = inject<Ref<Filtros>>('filtros')!;

const { getMunicipiosByEntidad } = useMunicipiosCache();

// Inicializar mapa
onMounted(() => {
  mapa.value = initMap(mapaContainer);
  crearCapaEstados();
});

// Crear capa GeoJSON
async function crearCapaEstados() {
  if (!mapa.value) return;

  if (!geoJsonEstados.value) {
    geoJsonEstados.value = await fetchPublicJson('datos/entidades.json');
  }

  if (geoJsonEstados.value) {
    capaEstados.value = addGeoJsonToMap(
      //@ts-ignore
      mapa.value,
      geoJsonEstados.value,
      {
        style: estiloEF,
      },
      'entidadesPane',
      200,
      {
        onFeatureClick: handleClickEF,
        onFeatureMouseOver: handleMouseOverEF,
        onFeatureMouseOut: handleMouseOutEF
      }
    );

    // Aplicar selección existente al cargar la capa
    actualizarEstiloEF(filtros.value.id_ef);
  }
}

async function crearCapaMunicipio(entidad: Feature) {

  if (!mapa.value) return;
  const muncipios = await getMunicipiosByEntidad(entidad);

  if (muncipios) {
    capaMunicipios.value = addGeoJsonToMap(
      //@ts-ignore
      mapa.value,
      muncipios,
      {
        style: estiloMun,
      },
      "municipiosPane",
      300,
      {
        onFeatureClick: handleClickMun,
        onFeatureMouseOver: handleMouseOverMun,
        onFeatureMouseOut: handleMouseOutMun
      },
    );
  }
}

// Actualizar estilos de todos los estados según el filtro
function actualizarEstiloEF(idSeleccionado: string | null | undefined) {
  if (!capaEstados.value) return;

  capaEstados.value.eachLayer((layer) => {
    if (!(layer instanceof L.Path)) return;

    const feature = (layer as L.Path & {
      feature?: GeoJSON.Feature;
    }).feature;

    const idEstado = formatearID(feature?.properties?.CVE_ENT);


    if (idEstado === idSeleccionado?.toString()) {
      layer.setStyle(estiloEFSeleccionado);
      const bounds = (layer as L.Polygon).getBounds();

      volarABounds(bounds)
    } else {
      layer.setStyle(estiloEF);
    }
  });
}
// Actualizar estilos de todos los municipios según el filtro
function actualizarEstiloMun(idSeleccionado: string | null | undefined) {
  if (!capaMunicipios.value) return;

  capaMunicipios.value.eachLayer((layer) => {
    if (!(layer instanceof L.Path)) return;

    const feature = (layer as L.Path & {
      feature?: GeoJSON.Feature;
    }).feature;

    const idEstado = formatearID(feature?.properties?.CVE_MUN);


    if (idEstado === idSeleccionado?.toString()) {
      layer.setStyle(estiloMunSeleccionado);
      const bounds = (layer as L.Polygon).getBounds();

      volarABounds(bounds)
    } else {
      layer.setStyle(estiloMun);
    }
  });
}

// Detectar cambios del filtro de entidad federativa
watch(
  () => filtros.value.id_ef,
  (nuevoId) => {
    actualizarEstiloEF(nuevoId);
    eliminarLimitesMunicipios();
    const featEstado = geoJsonEstados.value as FeatureCollection;
    if (nuevoId) {
      const fSeleccionado = featEstado.features[parseInt(nuevoId) - 1];
      crearCapaMunicipio(fSeleccionado)
    }
    else{
      filtros.value.id_municipio = undefined;
    }
  }
);
// Detectar cambios del filtro de municipio
watch(
  () => filtros.value.id_municipio,
  (nuevoId) => {
    actualizarEstiloMun(nuevoId);
  }
);


// Evento de clic sobre un estado
function handleClickEF({ feature, layer }: GeoJsonFeatureEvent) {
  const id = formatearID(feature.properties?.CVE_ENT);
  filtros.value.id_ef = id;
}

// Hover sobre un estado
function handleMouseOverEF({ feature, layer }: GeoJsonFeatureEvent) {
  const id = formatearID(feature.properties?.CVE_ENT);
  if (
    layer instanceof L.Path &&
    filtros.value.id_ef !== id
  ) {
    layer.setStyle(estiloEFHover);
  }
}

// Retirar hover de un estado
function handleMouseOutEF({ feature, layer }: GeoJsonFeatureEvent) {
  const id = formatearID(feature.properties?.CVE_ENT)
  if (
    layer instanceof L.Path &&
    filtros.value.id_ef !== id
  ) {
    layer.setStyle(estiloEF);
  }
}

// Evento de clic sobre un municipio
function handleClickMun({ feature, layer }: GeoJsonFeatureEvent) {
  const id = formatearID(feature.properties?.CVE_MUN);
  filtros.value.id_municipio = id;
}
// Hover sobre un municipio
function handleMouseOverMun({ feature, layer }: GeoJsonFeatureEvent) {

  const id = formatearID(feature.properties?.CVE_MUN);

  if (
    layer instanceof L.Path &&
    filtros.value.id_municipio?.toString() !== id
  ) {
    layer.setStyle(estiloMunHover);
  }
}

// Retirar hover de un municipio
function handleMouseOutMun({ feature, layer }: GeoJsonFeatureEvent) {
  const id = formatearID(feature.properties?.CVE_MUN)
    console.log(typeof id , typeof  filtros.value.id_municipio, id === filtros.value.id_municipio );

  if (
    layer instanceof L.Path &&
    filtros.value.id_municipio?.toString() !== id
  ) {
    layer.setStyle(estiloMun);
  }
}
function eliminarLimitesMunicipios() {
  if (mapa.value && capaMunicipios.value) {
    //@ts-ignore
    removeGeoJsonFromMap(mapa.value, capaMunicipios.value);
  }
}
</script>

<template>
  <div class="w-full h-full rounded-lg overflow-hidden relative">
    <div ref="mapaContainer" class="w-full h-full"></div>
    <BotonRegresar @on-click="filtros.id_ef = undefined"/>
  </div>
</template>
<style scoped></style>
