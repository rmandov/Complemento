import { defineStore } from "pinia";
import { shallowRef } from "vue";

export const useMapLayersStore = defineStore("mapLayers", () => {
  const pila = shallowRef([]); // [{ layer, nombre }, ...]
  const capaExtra = shallowRef(null);

  // Nombre del estado actualmente seleccionado
  const estadoActual = shallowRef(null);

  function bajarNivel(layer, map, nombre, nuevaCapaExtra = null) {
    // Quitar capa extra actual
    if (capaExtra.value && map) {
      map.removeLayer(capaExtra.value);
      capaExtra.value = null;
    }
    // Ocultar la capa clickeada y guardarla en la pila
    if (layer && map && map.hasLayer(layer)) {
      map.removeLayer(layer);
    }
    pila.value.push({ layer, nombre: nombre || "Sin nombre" });
    estadoActual.value = nombre;

    // Mostrar nueva capa extra (municipios)
    if (nuevaCapaExtra && map) {
      nuevaCapaExtra.addTo(map);
      capaExtra.value = nuevaCapaExtra;
    }
  }

  function subirNivel(map) {
    if (pila.value.length === 0) return;

    if (capaExtra.value && map) {
      map.removeLayer(capaExtra.value);
      capaExtra.value = null;
    }

    const { layer } = pila.value.pop();
    if (layer && map) {
      layer.addTo(map);
    }

    // Actualizar estado actual al anterior (o null si es la raíz)
    estadoActual.value = pila.value.length > 0 ? pila.value[pila.value.length - 1].nombre : null;
  }

  /**
   * Cambiar de estado dentro del mismo nivel.
   * Restaura el estado anterior y empila el nuevo.
   */
  function cambiarEstado(layerAnterior, map, nombreAnterior, nuevaCapaExtra = null) {
    // 1. Quitar capa extra actual (municipios del estado previo)
    if (capaExtra.value && map) {
      map.removeLayer(capaExtra.value);
      capaExtra.value = null;
    }

    // 2. Restaurar el estado que estaba en la cima de la pila
    //    (el que se ocultó al entrar al nivel actual)
    if (pila.value.length > 0) {
      const { layer: estadoPrevio } = pila.value[pila.value.length - 1];
      if (estadoPrevio && map && !map.hasLayer(estadoPrevio)) {
        estadoPrevio.addTo(map);
      }
      // Sacar el estado previo de la pila porque lo vamos a reemplazar
      pila.value.pop();
    }

    // 3. Ocultar el nuevo estado clickeado y guardarlo
    if (layerAnterior && map && map.hasLayer(layerAnterior)) {
      map.removeLayer(layerAnterior);
    }
    pila.value.push({ layer: layerAnterior, nombre: nombreAnterior || "Sin nombre" });
    estadoActual.value = nombreAnterior;

    // 4. Mostrar nueva capa extra (municipios del nuevo estado)
    if (nuevaCapaExtra && map) {
      nuevaCapaExtra.addTo(map);
      capaExtra.value = nuevaCapaExtra;
    }
  }

  function reset(map) {
    if (capaExtra.value && map) {
      map.removeLayer(capaExtra.value);
      capaExtra.value = null;
    }
    for (const { layer } of pila.value) {
      if (layer && map && !map.hasLayer(layer)) {
        layer.addTo(map);
      }
    }
    pila.value = [];
    estadoActual.value = null;
  }

  return {
    pila,
    capaExtra,
    estadoActual,
    bajarNivel,
    subirNivel,
    cambiarEstado,
    reset,
  };
});
