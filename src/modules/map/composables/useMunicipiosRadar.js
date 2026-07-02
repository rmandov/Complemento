// src/modules/map/composables/useMunicipiosRadar.js
import { ref, shallowRef } from 'vue'
import * as turf from '@turf/turf'

import { useMunicipiosCache } from './useMunicipiosCache'
import { bboxSeSolapan } from '../utils/geoUtils'

const { getMunicipiosByEntidad, getBboxesByEntidad } = useMunicipiosCache()

/**
 * Composable que calcula, con carga perezosa de municipios por entidad,
 * qué municipios son tocados —total o parcialmente, o solo por el
 * borde— por el círculo del radar.
 *
 * ESTRATEGIA EN 2 FASES:
 *
 *  FASE A (barata, sin red): usando entidades.json —que YA está cargado
 *  en memoria para dibujar el mapa base— se calcula el bbox de cada
 *  entidad una sola vez (turf.bbox), y se compara ese bbox contra el
 *  bbox del radar con una simple comparación numérica (bboxSeSolapan,
 *  sin turf). Esto da la lista de "entidades candidatas": las ÚNICAS de
 *  las que hace falta descargar el archivo de municipios.
 *
 *  FASE B (precisa, con turf): con los municipios de las entidades
 *  candidatas ya cargados (o recuperados de cache), se filtra cada
 *  municipio primero por bbox (barato, usando bboxes precalculados en
 *  useMunicipiosCache) y, si pasa ese filtro, se confirma con
 *  turf.booleanIntersects contra el polígono real del radar. Esa función
 *  cubre en una sola llamada los 3 casos pedidos: contención total,
 *  solape parcial y toque de borde.
 */
export function useMunicipiosRadar() {
  // Resultado reactivo: features de municipios tocados por el radar.
  // shallowRef porque reemplazamos el array completo en cada cálculo,
  // no necesitamos reactividad profunda sobre cada feature.
  const municipiosEnRadar = shallowRef([])

  // Bandera para mostrar un loader mientras se descargan municipios que
  // todavía no estaban en cache.
  const cargandoMunicipios = ref(false)

  // Índice de bbox por entidad, calculado UNA sola vez cuando se
  // inicializa el composable con entidades.json.
  // Map<CVE_ENT, { feature, bbox, nombre }>
  let entidadesBboxIndex = null

  // Token incremental: si el radar se mueve varias veces rápido y hay
  // varias cargas async en curso, solo nos interesa el resultado de la
  // ÚLTIMA llamada. Evita que una respuesta "vieja" y lenta sobrescriba
  // a una más nueva y rápida (condición de carrera).
  let ultimoToken = 0

  // Timer del debounce
  let debounceTimer = null

  /**
   * Debe llamarse UNA vez, cuando entidades.json ya está disponible
   * (MapView.vue ya lo carga en onMounted para dibujar el mapa base;
   * aquí se reutiliza ese mismo objeto, sin volver a pedirlo por red).
   */
  function inicializarConEntidades(entidadesGeoJson) {
    entidadesBboxIndex = new Map()

    if (!entidadesGeoJson?.features?.length) {
      console.warn('useMunicipiosRadar: entidades.json vacío o inválido')
      return
    }

    for (const feature of entidadesGeoJson.features) {
      const cveEnt = feature.properties?.CVE_ENT
      if (!cveEnt) continue

      entidadesBboxIndex.set(cveEnt, {
        feature,
        bbox: turf.bbox(feature),
        nombre: feature.properties.NOMGEO,
      })
    }

    console.log(
      `✅ Índice de bbox de entidades listo (${entidadesBboxIndex.size}) para búsqueda de municipios en radar`,
    )
  }

  /**
   * FASE A: dado el bbox del radar, regresa las entidades cuyo bbox se
   * solapa con el del radar. Comparación puramente numérica: NO usa
   * turf porque se ejecuta contra ~32 entidades y el costo de una
   * operación geométrica completa aquí no se justifica.
   */
  function obtenerEntidadesCandidatas(radarBbox) {
    const candidatas = []
    for (const [cveEnt, info] of entidadesBboxIndex.entries()) {
      if (bboxSeSolapan(radarBbox, info.bbox)) {
        candidatas.push({ cveEnt, ...info })
      }
    }
    return candidatas
  }

  /**
   * FASE B: dado el polígono del radar y los municipios ya cargados de
   * UNA entidad candidata, regresa los municipios que efectivamente
   * intersectan el radar.
   *
   * Prefiltro por bbox (barato, usando bboxes precalculados y cacheados
   * en useMunicipiosCache) antes de turf.booleanIntersects (más costoso),
   * para no evaluar la geometría completa de municipios que obviamente
   * no pueden tocar el radar.
   */
  function filtrarMunicipiosQueIntersectan(radarPolygon, radarBbox, municipiosGeoJson, cveEnt) {
    if (!municipiosGeoJson?.features?.length) return []

    const bboxesCacheados = getBboxesByEntidad(cveEnt) || []
    const encontrados = []

    municipiosGeoJson.features.forEach((municipioFeature, index) => {
      // Fallback defensivo por si el bbox cacheado no estuviera listo
      // por algún motivo; en condiciones normales siempre viene de cache.
      const municipioBbox = bboxesCacheados[index] || turf.bbox(municipioFeature)

      if (!bboxSeSolapan(radarBbox, municipioBbox)) return

      // Confirmación precisa: cubre contención total, solape parcial y
      // toque de borde en una sola llamada.
      if (turf.booleanIntersects(radarPolygon, municipioFeature)) {
        encontrados.push(municipioFeature)
      }
    })

    return encontrados
  }

  /**
   * Orquesta las 2 fases. Es async porque puede necesitar descargar por
   * red archivos de municipios que aún no estén en cache.
   */
  async function calcularMunicipiosEnRadar(center, radiusMetros) {
    if (!entidadesBboxIndex) {
      console.warn('useMunicipiosRadar: llama inicializarConEntidades() antes de usar el radar')
      return
    }
    if (!center || !radiusMetros) {
      municipiosEnRadar.value = []
      return
    }

    // Token de esta ejecución en particular.
    const miToken = ++ultimoToken

    const radiusKm = radiusMetros / 1000

    // Círculo del radar como polígono turf (64 lados: precisión de sobra
    // para radios de hasta decenas de km). Coordenadas en [lng, lat],
    // igual que ya usa geokdbush.around en MapView.vue.
    const radarPolygon = turf.circle([center.lng, center.lat], radiusKm, {
      units: 'kilometers',
      steps: 64,
    })
    const radarBbox = turf.bbox(radarPolygon)

    // --- FASE A ---
    const entidadesCandidatas = obtenerEntidadesCandidatas(radarBbox)

    if (!entidadesCandidatas.length) {
      municipiosEnRadar.value = []
      return
    }

    cargandoMunicipios.value = true

    try {
      // Se cargan en PARALELO los municipios de todas las entidades
      // candidatas. getMunicipiosByEntidad ya deduplica peticiones
      // repetidas y reutiliza cache internamente.
      const resultadosPorEntidad = await Promise.all(
        entidadesCandidatas.map(async (c) => ({
          cveEnt: c.cveEnt,
          municipiosGeoJson: await getMunicipiosByEntidad(c.feature),
        })),
      )

      // Si mientras esperábamos la red llegó una petición más nueva
      // (el usuario siguió moviendo el radar), descartamos este
      // resultado para no pisar el resultado correcto con uno obsoleto.
      if (miToken !== ultimoToken) return

      // --- FASE B ---
      let resultado = []
      for (const { cveEnt, municipiosGeoJson } of resultadosPorEntidad) {
        resultado = resultado.concat(
          filtrarMunicipiosQueIntersectan(radarPolygon, radarBbox, municipiosGeoJson, cveEnt),
        )
      }

      municipiosEnRadar.value = resultado

      console.log(
        `🏘️ Municipios tocados por el radar: ${resultado.length}`,
        resultado.map((f) => f.properties.NOMGEO),
      )
    } catch (error) {
      console.error('Error calculando municipios en radar:', error)
    } finally {
      if (miToken === ultimoToken) cargandoMunicipios.value = false
    }
  }

  /**
   * Versión con debounce de calcularMunicipiosEnRadar, pensada para
   * conectarse directamente al watch([center, radius]) de MapView.vue.
   * Evita disparar cálculos/peticiones de red en ráfaga si center o
   * radius cambian varias veces en un lapso muy corto.
   */
  function actualizarMunicipiosEnRadar(center, radiusMetros, delay = 200) {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      calcularMunicipiosEnRadar(center, radiusMetros)
    }, delay)
  }

  return {
    municipiosEnRadar,
    cargandoMunicipios,
    inicializarConEntidades,
    actualizarMunicipiosEnRadar,
    // Se expone también sin debounce por si en el futuro se quiere forzar
    // un cálculo inmediato (ej. justo en el dragend del marker del radar).
    calcularMunicipiosEnRadar,
  }
}
