// src/modules/map/composables/useMapNavigation.js
import { usePoligonoStore } from '@/stores/poligonoStore'
import { useMapStore } from '@/stores/map'
import { useMap } from './mapControler'
import { useMunicipiosCache } from './useMunicipiosCache'
import { createMunicipiosLayer } from './useCreateLayer' // Necesitarás exportarla

export function useMapNavigation(mapRef) {
  const poligonoStore = usePoligonoStore()
  const mapStore = useMapStore()
  const { flyToBounds } = useMap()
  const { getMunicipiosByEntidad } = useMunicipiosCache()

  /**
   * Navega a una entidad por su CVE_ENT
   */
  function flyToEntidad(cveEnt) {
    if (!mapRef.value || !cveEnt) return

    const layer = poligonoStore.getEntidadLayer(cveEnt)
    if (layer) {
      const bounds = layer.getBounds()
      flyToBounds(mapRef.value, bounds)
    }
  }

  /**
   * Navega a un municipio por su CVEGEO.
   * Si el municipio no está cargado (lazy), carga la entidad primero.
   */
  async function flyToMunicipio(cvegeo) {
    if (!mapRef.value || !cvegeo) return

    // 1. ¿Ya está cargado el municipio?
    let layer = poligonoStore.getMunicipioLayer(cvegeo)
    if (layer) {
      flyToBounds(mapRef.value, layer.getBounds())
      return
    }

    // 2. Si no está cargado, extraemos la entidad padre (primeros 2 dígitos)
    const cveEnt = cvegeo.substring(0, 2)

    // 3. Asegurar que la entidad esté seleccionada y sus municipios cargados
    //    Esto replica la lógica del click en el mapa
    const entidadLayer = poligonoStore.getEntidadLayer(cveEnt)

    if (entidadLayer) {
      // Simular el "click" en la entidad para cargar municipios
      const bounds = entidadLayer.getBounds()

      // Quitar la entidad del mapa (como hace tu click handler)
      if (poligonoStore.entidad) {
        poligonoStore.entidad.addTo(mapRef.value)
      }
      poligonoStore.setEntidad(entidadLayer)
      mapRef.value.removeLayer(entidadLayer)

      // Cargar municipios
      const municipios = await getMunicipiosByEntidad(entidadLayer.feature)

      if (municipios) {
        const municipiosLayer = createMunicipiosLayer(municipios, {
          map: mapRef.value,
          pane: 'poligonosPane',
          name: 'NOMGEO',
        })

        poligonoStore.setMunicipiosLayer(municipiosLayer)
        municipiosLayer.addTo(mapRef.value)

        // Actualizar stores
        mapStore.setEntidad(cveEnt)
        mapStore.setCVE_ENT(cveEnt)

        // 4. Ahora sí buscar el municipio específico
        // Pequeño delay para asegurar que los layers se registraron
        setTimeout(() => {
          const targetLayer = poligonoStore.getMunicipioLayer(cvegeo)
          if (targetLayer) {
            flyToBounds(mapRef.value, targetLayer.getBounds())

            // Simular selección de municipio
            mapStore.setMunicipio(cvegeo)
            poligonoStore.setMunicipio(targetLayer)
            mapRef.value.removeLayer(targetLayer)
          }
        }, 100)
      }
    }
  }

  return { flyToEntidad, flyToMunicipio }
}
