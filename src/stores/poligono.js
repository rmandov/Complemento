// stores/handleLayers.js
import { shallowRef } from "vue";
import { defineStore } from "pinia";

export const usePoligonoStore = defineStore("poligono", () => {
  const poligono = shallowRef(null);

  function setPoligono(nuevoPoligono) {
    poligono.value = nuevoPoligono;
  }

  return { poligono, setPoligono };
});
