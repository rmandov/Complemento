// src/modules/map/composables/useMunicipiosRadar.js
import { ref, shallowRef } from 'vue'
import * as turf from '@turf/turf'

import { useMunicipiosCache } from './useMunicipiosCache'
import { bboxSeSolapan } from '../utils/geoUtils'

const { getMunicipiosByEntidad, getBboxesByEntidad } = useMunicipiosCache()

export function useMunicipiosRadar() {
  // Lista de municipios completos que tocan el radar (para tablas/paneles)
  const municipiosEnRadar = shallowRef([])

  // FeatureCollection de municipios RECORTADOS al límite del radar (para el mapa)
  const municipiosRecortadosEnRadar = shallowRef(null)

  const cargandoMunicipios = ref(false)

  let entidadesBboxIndex = null
  let ultimoToken = 0

  // Timers separados para no pisarse entre lista y capa recortada
  let debounceTimer = null
  let debounceTimerRecortados = null

  /* ───────────────────────────────────────────────
     INICIALIZACIÓN
     ─────────────────────────────────────────────── */
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

    /* console.log(`✅ Índice de bbox de entidades listo (${entidadesBboxIndex.size})`) */
  }

  /* ───────────────────────────────────────────────
     FASE A
     ─────────────────────────────────────────────── */
  function obtenerEntidadesCandidatas(radarBbox) {
    const candidatas = []
    for (const [cveEnt, info] of entidadesBboxIndex.entries()) {
      if (bboxSeSolapan(radarBbox, info.bbox)) {
        candidatas.push({ cveEnt, ...info })
      }
    }
    return candidatas
  }

  /* ───────────────────────────────────────────────
     FASE B — municipios completos que tocan el radar
     ─────────────────────────────────────────────── */
  function filtrarMunicipiosQueIntersectan(radarPolygon, radarBbox, municipiosGeoJson, cveEnt) {
    if (!municipiosGeoJson?.features?.length) return []

    const bboxesCacheados = getBboxesByEntidad(cveEnt) || []
    const encontrados = []

    municipiosGeoJson.features.forEach((municipioFeature, index) => {
      const municipioBbox = bboxesCacheados[index] || turf.bbox(municipioFeature)
      if (!bboxSeSolapan(radarBbox, municipioBbox)) return
      if (turf.booleanIntersects(radarPolygon, municipioFeature)) {
        encontrados.push(municipioFeature)
      }
    })

    return encontrados
  }

  /* ───────────────────────────────────────────────
     FASE B RECORTADA — geometría cortada al círculo del radar
     ─────────────────────────────────────────────── */
  function recortarMunicipiosAlRadar(radarPolygon, radarBbox, municipiosGeoJson, cveEnt) {
    if (!municipiosGeoJson?.features?.length) return []

    const bboxesCacheados = getBboxesByEntidad(cveEnt) || []
    const recortados = []

    municipiosGeoJson.features.forEach((municipioFeature, index) => {
      const municipioBbox = bboxesCacheados[index] || turf.bbox(municipioFeature)

      if (!bboxSeSolapan(radarBbox, municipioBbox)) return

      try {
        if (!turf.booleanIntersects(radarPolygon, municipioFeature)) return

        const recorte = turf.intersect(turf.featureCollection([municipioFeature, radarPolygon]))

        if (recorte) {
          recorte.properties = {
            ...municipioFeature.properties,
            _radarRecortado: true,
          }
          recortados.push(recorte)
        }
      } catch (err) {
        console.warn(
          'Error recortando municipio:',
          municipioFeature.properties?.NOMGEO || `index-${index}`,
          err,
        )
      }
    })

    return recortados
  }

  /* ───────────────────────────────────────────────
     ORQUESTADOR — lista de municipios
     ─────────────────────────────────────────────── */
  async function calcularMunicipiosEnRadar(center, radiusMetros) {
    if (!entidadesBboxIndex) {
      console.warn('useMunicipiosRadar: llama inicializarConEntidades() primero')
      return
    }
    if (!center || !radiusMetros) {
      municipiosEnRadar.value = []
      return
    }

    const miToken = ++ultimoToken
    const radiusKm = radiusMetros / 1000

    const radarPolygon = turf.circle([center.lng, center.lat], radiusKm, {
      units: 'kilometers',
      steps: 64,
    })
    const radarBbox = turf.bbox(radarPolygon)

    const entidadesCandidatas = obtenerEntidadesCandidatas(radarBbox)

    if (!entidadesCandidatas.length) {
      municipiosEnRadar.value = []
      return
    }

    cargandoMunicipios.value = true

    try {
      const resultadosPorEntidad = await Promise.all(
        entidadesCandidatas.map(async (c) => ({
          cveEnt: c.cveEnt,
          municipiosGeoJson: await getMunicipiosByEntidad(c.feature),
        })),
      )

      if (miToken !== ultimoToken) return

      let resultado = []
      for (const { cveEnt, municipiosGeoJson } of resultadosPorEntidad) {
        resultado = resultado.concat(
          filtrarMunicipiosQueIntersectan(radarPolygon, radarBbox, municipiosGeoJson, cveEnt),
        )
      }

      municipiosEnRadar.value = resultado
      console.log(`🏘️ Municipios tocados por el radar: ${resultado.length}`)
    } catch (error) {
      console.error('Error calculando municipios en radar:', error)
    } finally {
      if (miToken === ultimoToken) cargandoMunicipios.value = false
    }
  }

  /* ───────────────────────────────────────────────
     ORQUESTADOR — FeatureCollection RECORTADA
     ─────────────────────────────────────────────── */
  async function calcularMunicipiosRecortadosEnRadar(center, radiusMetros) {
    if (!entidadesBboxIndex) {
      console.warn('useMunicipiosRadar: llama inicializarConEntidades() primero')
      municipiosRecortadosEnRadar.value = turf.featureCollection([])
      return
    }
    if (!center || !radiusMetros) {
      municipiosRecortadosEnRadar.value = turf.featureCollection([])
      return
    }

    const miToken = ++ultimoToken
    const radiusKm = radiusMetros / 1000

    const radarPolygon = turf.circle([center.lng, center.lat], radiusKm, {
      units: 'kilometers',
      steps: 64,
    })
    const radarBbox = turf.bbox(radarPolygon)

    const entidadesCandidatas = obtenerEntidadesCandidatas(radarBbox)

    if (!entidadesCandidatas.length) {
      municipiosRecortadosEnRadar.value = turf.featureCollection([])
      return
    }

    cargandoMunicipios.value = true

    try {
      const resultadosPorEntidad = await Promise.all(
        entidadesCandidatas.map(async (c) => ({
          cveEnt: c.cveEnt,
          municipiosGeoJson: await getMunicipiosByEntidad(c.feature),
        })),
      )

      if (miToken !== ultimoToken) return

      let recortados = []
      for (const { cveEnt, municipiosGeoJson } of resultadosPorEntidad) {
        recortados = recortados.concat(
          recortarMunicipiosAlRadar(radarPolygon, radarBbox, municipiosGeoJson, cveEnt),
        )
      }

      municipiosRecortadosEnRadar.value = turf.featureCollection(recortados)
      console.log(`✂️ Municipios recortados al radar: ${recortados.length}`)
    } catch (error) {
      console.error('Error recortando municipios al radar:', error)
      municipiosRecortadosEnRadar.value = turf.featureCollection([])
    } finally {
      if (miToken === ultimoToken) cargandoMunicipios.value = false
    }
  }

  /* ───────────────────────────────────────────────
     DEBOUNCE
     ─────────────────────────────────────────────── */
  function actualizarMunicipiosEnRadar(center, radiusMetros, delay = 200) {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      calcularMunicipiosEnRadar(center, radiusMetros)
    }, delay)
  }

  function actualizarMunicipiosRecortadosEnRadar(center, radiusMetros, delay = 200) {
    clearTimeout(debounceTimerRecortados)
    debounceTimerRecortados = setTimeout(() => {
      calcularMunicipiosRecortadosEnRadar(center, radiusMetros)
    }, delay)
  }

  /* ───────────────────────────────────────────────
     NUEVO — resetRadar()
     ─────────────────────────────────────────────── */
  /**
   * Cancela por completo cualquier proceso del radar que pudiera seguir
   * corriendo "en segundo plano" y limpia los resultados guardados.
   * Se usa al DESACTIVAR el radar (ver MapView.vue -> desactivarRadar()).
   *
   * Qué resuelve exactamente:
   * 1. Cancela los timers de debounce pendientes (setTimeout) para que
   *    no disparen un cálculo nuevo momentos después de apagar el radar.
   * 2. Incrementa `ultimoToken`: cualquier llamada a
   *    getMunicipiosByEntidad() que siga "en vuelo" (esperando una
   *    respuesta de red) comparará su `miToken` contra el nuevo
   *    `ultimoToken` al resolver, no coincidirá, y su resultado será
   *    descartado — así una descarga lenta no puede "revivir" el radar
   *    después de apagado.
   * 3. Limpia inmediatamente (sin esperar ningún await) los resultados
   *    reactivos, para que la UI se vacíe al instante.
   */
  function resetRadar() {
    clearTimeout(debounceTimer)
    clearTimeout(debounceTimerRecortados)
    debounceTimer = null
    debounceTimerRecortados = null

    ultimoToken++

    municipiosEnRadar.value = []
    municipiosRecortadosEnRadar.value = turf.featureCollection([])
    cargandoMunicipios.value = false
  }

  return {
    municipiosEnRadar,
    municipiosRecortadosEnRadar,
    cargandoMunicipios,
    inicializarConEntidades,
    actualizarMunicipiosEnRadar,
    calcularMunicipiosEnRadar,
    actualizarMunicipiosRecortadosEnRadar,
    calcularMunicipiosRecortadosEnRadar,
    resetRadar, // NUEVO
  }
}
