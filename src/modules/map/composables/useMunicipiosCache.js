// src/modules/map/composables/useMunicipiosCache.js
import * as turf from '@turf/turf'
import { useGeoJson } from './useGeoJson'
import { nombreEntidadASlug } from '../utils/geoUtils'

const { getGeoJson } = useGeoJson()

/**
 * Cache a nivel de MÓDULO (fuera de la función useMunicipiosCache), a
 * propósito: esto lo convierte en un singleton compartido por TODA la
 * aplicación. Tanto el clic manual sobre una entidad (useCreateLayer.js)
 * como el cálculo automático del radar (useMunicipiosRadar.js) leen y
 * escriben en el MISMO Map, así que el archivo de municipios de una
 * entidad nunca se descarga dos veces sin importar quién lo pida primero.
 *
 * Estructura de cada entrada del Map (key = CVE_ENT):
 * {
 *   slug:    string              -> nombre de archivo usado (debug)
 *   promise: Promise|null        -> presente mientras la petición está en curso
 *   data:    FeatureCollection|null -> presente una vez resuelta la carga
 *   bboxes:  Array|null          -> bbox por feature, calculado bajo demanda
 * }
 */
const municipiosCache = new Map()

export function useMunicipiosCache() {
  /**
   * Obtiene (de cache o por red) el FeatureCollection de municipios de
   * una entidad, a partir de su feature de entidades.json.
   *
   * Deduplica dos escenarios:
   *  - Cache "frío" ya resuelto -> regresa inmediato, sin red.
   *  - Petición en curso (alguien más ya la pidió y seguimos esperando)
   *    -> se engancha a la MISMA promesa en vez de lanzar un fetch nuevo.
   */
  async function getMunicipiosByEntidad(entidadFeature) {
    const cveEnt = entidadFeature?.properties?.CVE_ENT
    const nombre = entidadFeature?.properties?.NOMGEO

    if (!cveEnt || !nombre) {
      console.warn('useMunicipiosCache: entidad sin CVE_ENT/NOMGEO', entidadFeature)
      return null
    }

    const cached = municipiosCache.get(cveEnt)

    // Caso 1: ya resuelto -> se regresa directo desde cache.
    if (cached?.data) return cached.data

    // Caso 2: ya hay una petición en curso para esta misma entidad
    // (ej. el radar y un clic manual casi simultáneos) -> reutilizamos
    // esa misma Promise en vez de duplicar el fetch.
    if (cached?.promise) return cached.promise

    // Caso 3: no existe en cache -> se dispara la carga. Se guarda la
    // Promise ANTES del await para que cualquier llamada concurrente
    // caiga en el Caso 2 de inmediato.
    const slug = nombreEntidadASlug(nombre)

    const promise = getGeoJson(`municipios/${slug}.json`).then((data) => {
      municipiosCache.set(cveEnt, { slug, promise: null, data, bboxes: null })
      return data
    })

    municipiosCache.set(cveEnt, { slug, promise, data: null, bboxes: null })

    return promise
  }

  /**
   * Regresa el array de bbox (uno por feature, mismo orden que
   * data.features) de los municipios de una entidad YA cacheada.
   *
   * Se calcula la PRIMERA vez que se pide y se reutiliza después. Esto es
   * clave para el rendimiento: sin este cache, cada movimiento del radar
   * recalcularía turf.bbox() para, por ejemplo, los 570 municipios de
   * Oaxaca una y otra vez.
   *
   * Regresa null si la entidad todavía no ha sido cargada (no debería
   * pasar si se llama después de un await a getMunicipiosByEntidad).
   */
  function getBboxesByEntidad(cveEnt) {
    const entry = municipiosCache.get(cveEnt)
    if (!entry?.data) return null

    if (!entry.bboxes) {
      entry.bboxes = entry.data.features.map((feature) => turf.bbox(feature))
    }

    return entry.bboxes
  }

  /**
   * Indica si los municipios de una entidad ya están en cache, sin
   * disparar ninguna petición. Útil para feedback en UI (ej. "cargando
   * municipios de Puebla...").
   */
  function isEntidadCacheada(cveEnt) {
    return Boolean(municipiosCache.get(cveEnt)?.data)
  }

  return {
    getMunicipiosByEntidad,
    getBboxesByEntidad,
    isEntidadCacheada,
  }
}
