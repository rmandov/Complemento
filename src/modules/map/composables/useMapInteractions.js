// src/modules/map/composables/useMapInteractions.js
import { ref, onBeforeUnmount } from 'vue'

/**
 * Composable responsable ÚNICAMENTE de: mantener el `center` reactivo
 * del radar y escuchar (o dejar de escuchar) el evento 'click' del mapa
 * para moverlo.
 *
 * CAMBIO IMPORTANTE (activar/desactivar radar):
 * Antes existía un `watch(() => map.value, ...)` con `immediate: true`
 * que enganchaba el listener de click automáticamente en cuanto el mapa
 * estaba listo, SIN IMPORTAR si se llamaba a register()/unregister().
 * Eso hacía imposible "apagar" de verdad el radar: el click seguía
 * moviendo el centro pasara lo que pasara.
 *
 * Ahora el enganche del listener depende EXCLUSIVAMENTE de llamar a
 * register() / unregister() explícitamente. MapView.vue decide cuándo
 * hacerlo (al activar/desactivar el radar), por lo que mientras nadie
 * llame a register(), un click en el mapa NO EJECUTA NINGUNA LÓGICA.
 */
export function useMapInteractions(map) {
  const center = ref(null)

  function onMapClick(e) {
    center.value = {
      lat: e.latlng.lat,
      lng: e.latlng.lng,
    }
  }

  // Engancha el listener de click del mapa. Leaflet deduplica
  // automáticamente si se llama dos veces seguidas con la misma función,
  // así que es seguro invocarlo aunque ya estuviera registrado.
  function register() {
    if (map.value) map.value.on('click', onMapClick)
  }

  // Desengancha por completo el listener de click del mapa. A partir de
  // este punto, ningún click sobre el mapa modificará `center`.
  function unregister() {
    if (map.value) map.value.off('click', onMapClick)
  }

  // Red de seguridad: si el componente se desmonta sin haber llamado a
  // unregister() manualmente, se limpia igual para evitar fugas.
  onBeforeUnmount(() => {
    unregister()
  })

  return {
    center,
    register,
    unregister,
  }
}

