import { defineStore } from "pinia";
import { shallowRef } from "vue";

export const useMapLayersStore = defineStore("mapLayers", () => {
  // Pila de niveles: cada nivel es { layer, nombre, extra }
  // Nivel 0 = raíz, Nivel 1 = estados, Nivel 2 = municipios, etc.
  const pila = shallowRef([]);

  // Capa extra del nivel ACTUAL (municipios, localidades, etc.)
  const capaExtra = shallowRef(null);

  // Nivel actual de profundidad (0 = raíz, 1 = estado, 2 = municipio...)
  const nivelActual = shallowRef(0);

  /**
   * Bajar un nivel (drill-down): entrar por primera vez a un nuevo nivel
   * Ej: De raíz → Estado, o de Estado → Municipio
   */
  function bajarNivel(layer, map, nombre, nuevaCapaExtra = null) {
    // Limpiar capa extra del nivel anterior (si existe)
    if (capaExtra.value && map) {
      map.removeLayer(capaExtra.value);
      capaExtra.value = null;
    }

    // Ocultar la capa clickeada y guardarla en la pila
    if (layer && map && map.hasLayer(layer)) {
      map.removeLayer(layer);
    }

    pila.value.push({
      layer,
      nombre: nombre || "Sin nombre",
      // Guardamos la capa extra que teníamos en el nivel anterior (por si acaso)
      extraPrevio: capaExtra.value,
    });

    nivelActual.value = pila.value.length;

    // Mostrar nueva capa extra del nivel actual
    if (nuevaCapaExtra && map) {
      nuevaCapaExtra.addTo(map);
      capaExtra.value = nuevaCapaExtra;
    }
  }

  /**
   * Cambiar de elemento DENTRO del mismo nivel
   * Ej: Estado A → Estado B, o Municipio X → Municipio Y
   */
  function cambiarMismoNivel(layerNueva, map, nombreNuevo, nuevaCapaExtra = null) {
    if (pila.value.length === 0) {
      // No hay nada en la pila, comportamiento igual a bajarNivel
      bajarNivel(layerNueva, map, nombreNuevo, nuevaCapaExtra);
      return;
    }

    // 1. Quitar capa extra actual (del elemento previo en este nivel)
    if (capaExtra.value && map) {
      map.removeLayer(capaExtra.value);
      capaExtra.value = null;
    }

    // 2. Restaurar el elemento anterior que está en la cima de la pila
    const indiceActual = pila.value.length - 1;
    const elementoPrevio = pila.value[indiceActual];

    if (elementoPrevio.layer && map && !map.hasLayer(elementoPrevio.layer)) {
      elementoPrevio.layer.addTo(map);
    }

    // 3. Reemplazar el elemento en la cima con el nuevo
    // Ocultar la nueva capa y guardarla
    if (layerNueva && map && map.hasLayer(layerNueva)) {
      map.removeLayer(layerNueva);
    }

    pila.value[indiceActual] = {
      layer: layerNueva,
      nombre: nombreNuevo || "Sin nombre",
      extraPrevio: elementoPrevio.extraPrevio,
    };

    // 4. Mostrar nueva capa extra del nuevo elemento
    if (nuevaCapaExtra && map) {
      nuevaCapaExtra.addTo(map);
      capaExtra.value = nuevaCapaExtra;
    }
  }

  /**
   * Subir un nivel (volver atrás)
   */
  function subirNivel(map) {
    if (pila.value.length === 0) return;

    // Quitar capa extra actual
    if (capaExtra.value && map) {
      map.removeLayer(capaExtra.value);
      capaExtra.value = null;
    }

    // Recuperar y mostrar el último elemento
    const { layer, extraPrevio } = pila.value.pop();

    if (layer && map && !map.hasLayer(layer)) {
      layer.addTo(map);
    }

    // Restaurar la capa extra del nivel anterior si existía
    if (extraPrevio && map) {
      extraPrevio.addTo(map);
      capaExtra.value = extraPrevio;
    }

    nivelActual.value = pila.value.length;
  }

  /**
   * Volver a la raíz
   */
  function reset(map) {
    if (capaExtra.value && map) {
      map.removeLayer(capaExtra.value);
      capaExtra.value = null;
    }

    // Restaurar en orden inverso (de arriba hacia abajo)
    for (let i = pila.value.length - 1; i >= 0; i--) {
      const { layer } = pila.value[i];
      if (layer && map && !map.hasLayer(layer)) {
        layer.addTo(map);
      }
    }

    pila.value = [];
    nivelActual.value = 0;
  }

  return {
    pila,
    capaExtra,
    nivelActual,
    bajarNivel,
    cambiarMismoNivel,
    subirNivel,
    reset,
  };
});
