// src/modules/map/composables/useMapNavigation.js
import { usePoligonoStore } from '@/stores/poligonoStore'
import { useMapStore } from '@/stores/map'
import { selectEntidad, selectMunicipio } from './useCreateLayer'

export function useMapNavigation(mapRef) {
  const poligonoStore = usePoligonoStore()

  async function flyToEntidad(cveEnt) {
    if (!mapRef.value || !cveEnt) return

    const layer = poligonoStore.getEntidadLayer(cveEnt)
    if (!layer) {
      console.warn('[useMapNavigation] Layer no encontrado para entidad:', cveEnt)
      return
    }

    // Usar la MISMA lógica del click, forzando ejecución
    await selectEntidad(mapRef.value, layer, { force: true })
  }

  async function flyToMunicipio(cvegeo) {
    if (!mapRef.value || !cvegeo) return

    // 1. ¿Ya está cargado el municipio?
    let layer = poligonoStore.getMunicipioLayer(cvegeo)
    if (layer) {
      await selectMunicipio(mapRef.value, layer, { force: true })
      return
    }

    // 2. Si no está cargado, extraer entidad padre (primeros 2 dígitos)
    const cveEnt = cvegeo.substring(0, 2)
    const entidadLayer = poligonoStore.getEntidadLayer(cveEnt)

    if (!entidadLayer) {
      console.warn('[useMapNavigation] No se encontró entidad padre:', cveEnt)
      return
    }

    // 3. Seleccionar entidad (esto carga los municipios y los registra)
    await selectEntidad(mapRef.value, entidadLayer, { force: true })

    // 4. Esperar a que Leaflet renderice y registre los nuevos layers
    await new Promise(resolve => setTimeout(resolve, 100))

    // 5. Buscar de nuevo el municipio
    layer = poligonoStore.getMunicipioLayer(cvegeo)
    if (layer) {
      await selectMunicipio(mapRef.value, layer, { force: true })
    } else {
      console.warn('[useMapNavigation] Municipio no encontrado tras cargar entidad:', cvegeo)
    }
  }

  return { flyToEntidad, flyToMunicipio }
}
