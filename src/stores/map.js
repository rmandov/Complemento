// stores/map.js
import { ref } from "vue";
import { defineStore } from "pinia";

export const useMapStore = defineStore("map", () => {
  // State
  const view = ref({
    center: { lat: 23.6345, lng: -102.5528 },
    zoom: 5,
    bounds: null,
  });

  const entidad = ref("entidad");

  const municipio = ref("municipio");

  const CVE_ENT = ref("00");

  // Actions
  function setCenter(center) {
    view.value.center = center;
  }

  function setZoom(zoom) {
    view.value.zoom = zoom;
  }

  function setBounds(bounds) {
    view.value.bounds = bounds;
  }

  function setEntidad(newEntidad) {
    entidad.value = newEntidad;
  }

  function setMunicipio(newMunicipio) {
    municipio.value = newMunicipio;
  }

  function setView({ center, zoom, bounds }) {
    if (center) view.value.center = center;
    if (zoom !== undefined) view.value.zoom = zoom;
    if (bounds) view.value.bounds = bounds;
  }

  function setCVE_ENT(newCVE_ENT) {
    CVE_ENT.value = newCVE_ENT;
  }

  return {
    view,
    setCenter,
    setZoom,
    setBounds,
    setView,
    CVE_ENT,
    setCVE_ENT,
    entidad,
    setEntidad,
    municipio,
    setMunicipio,
  };
});
