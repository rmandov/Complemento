<script setup>
import {
  onMounted,
  onUnmounted,
  ref
} from 'vue'

import {
  Application,
  Particle,
  ParticleContainer,
  Texture
} from 'pixi.js'

import {
  geoIdentity,
  geoPath
} from 'd3-geo'

// ======================================================
// PROPS
// ======================================================

const props = defineProps({
  count: {
    type: Number,
    default: 5000
  },

  color: {
    type: Number,
    default: 0x2563eb
  },

  geojsonFiles: {
    type: Array,
    required: true
  },

  repulsionRadius: {
    type: Number,
    default: 140
  },

  repulsionStrength: {
    type: Number,
    default: 130
  }
})

// ======================================================
// VARIABLES
// ======================================================

const containerRef = ref(null)

let app = null
let particleContainer = null
let dotTexture = null
let resizeObserver = null
let resizeTimer = null

let mexicoGeoJson = null

const particles = []

const pointer = {
  active: false,
  x: 0,
  y: 0
}

// ======================================================
// TEXTURA DE LOS PUNTOS
// ======================================================

function createDotTexture() {
  const size = 16

  const canvas =
    document.createElement('canvas')

  canvas.width = size
  canvas.height = size

  const ctx =
    canvas.getContext('2d')

  ctx.clearRect(
    0,
    0,
    size,
    size
  )

  ctx.fillStyle = '#ffffff'

  ctx.beginPath()

  ctx.arc(
    size / 2,
    size / 2,
    size / 2,
    0,
    Math.PI * 2
  )

  ctx.fill()

  return Texture.from(canvas)
}

// ======================================================
// POSICIONES DEL CÍRCULO INICIAL
// ======================================================

function randomPointInsideCircle(
  centerX,
  centerY,
  radius
) {
  const angle =
    Math.random() *
    Math.PI *
    2

  /*
   * sqrt() hace que los puntos estén
   * distribuidos uniformemente.
   */
  const distance =
    Math.sqrt(
      Math.random()
    ) * radius

  return {
    x:
      centerX +
      Math.cos(angle) *
      distance,

    y:
      centerY +
      Math.sin(angle) *
      distance
  }
}

// ======================================================
// CREAR LAS 5,000 PARTÍCULAS
// ======================================================

function createParticles() {
  const width =
    app.screen.width

  const height =
    app.screen.height

  const centerX =
    width / 2

  const centerY =
    height / 2

  const radius =
    Math.min(
      width,
      height
    ) * 0.3

  for (
    let i = 0;
    i < props.count;
    i++
  ) {
    const start =
      randomPointInsideCircle(
        centerX,
        centerY,
        radius
      )

    const baseScale =
      0.09 +
      Math.random() * 0.1

    /*
     * IMPORTANTE:
     *
     * Cada partícula necesita
     * su propia dirección de escape.
     *
     * Tiene que declararse DENTRO
     * del for y ANTES de particles.push().
     */
    const escapeAngle =
      Math.random() *
      Math.PI *
      2

    const particle =
      new Particle({
        texture:
          dotTexture,

        x:
          start.x,

        y:
          start.y,

        anchorX:
          0.5,

        anchorY:
          0.5,

        scaleX:
          baseScale,

        scaleY:
          baseScale,

        tint:
          props.color
      })

    particles.push({
      particle,

      targetX:
        start.x,

      targetY:
        start.y,

      vx:
        0,

      vy:
        0,

      baseScale,

      phase:
        Math.random() *
        Math.PI *
        2,

      speed:
        0.8 +
        Math.random() *
        1.5,

      amplitude:
        0.15 +
        Math.random() *
        0.35,

      /*
       * Dirección aleatoria que usamos
       * sólo si el mouse queda exactamente
       * encima de la partícula.
       */
      escapeX:
        Math.cos(
          escapeAngle
        ),

      escapeY:
        Math.sin(
          escapeAngle
        )
    })

    particleContainer.addParticle(
      particle
    )
  }
}

// ======================================================
// CARGAR TODOS LOS GEOJSON
// ======================================================

async function loadMexicoGeoJson() {
  const requests = props.geojsonFiles.map(async (url) => {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`No se pudo cargar: ${url}`)
    }

    return response.json()
  })

  const estados = await Promise.all(requests)

  const features = estados.flatMap(
    estado => estado.features || []
  )

  mexicoGeoJson = {
    type: 'FeatureCollection',
    features
  }

  console.log('Estados cargados:', estados.length)
  console.log('Municipios cargados:', features.length)
}

// ======================================================
// CREAR MÁSCARA DE MÉXICO
// ======================================================

function createMexicoMask(width, height) {
  if (!mexicoGeoJson) {
    return null
  }

  const canvas = document.createElement('canvas')

  canvas.width = Math.floor(width)
  canvas.height = Math.floor(height)

  const ctx = canvas.getContext('2d', {
    willReadFrequently: true
  })

  const padding =
    Math.min(width, height) * 0.08

  /*
   * IMPORTANTE:
   *
   * No usamos geoMercator.
   *
   * Los GeoJSON municipales ya tienen:
   *
   * [longitud, latitud]
   *
   * Por ejemplo:
   *
   * [-102.09, 22.02]
   *
   * geoIdentity los trata directamente
   * como coordenadas XY.
   */
  const projection = geoIdentity()
    /*
     * En coordenadas geográficas:
     *
     * norte = Y positivo
     *
     * En Canvas:
     *
     * abajo = Y positivo
     *
     * Por eso volteamos Y.
     */
    .reflectY(true)

    /*
     * Ajustamos automáticamente México
     * al tamaño del canvas.
     */
    .fitExtent(
      [
        [
          padding,
          padding
        ],
        [
          width - padding,
          height - padding
        ]
      ],
      mexicoGeoJson
    )

  const path = geoPath(
    projection,
    ctx
  )

  // Limpiar completamente
  ctx.clearRect(
    0,
    0,
    width,
    height
  )

  /*
   * México será blanco.
   *
   * El resto permanece transparente.
   */
  ctx.fillStyle = '#ffffff'

  ctx.beginPath()

  path(mexicoGeoJson)

  /*
   * evenodd es conveniente porque tus
   * datos contienen Polygon y MultiPolygon.
   */
  ctx.fill('evenodd')

  return {
    canvas,
    ctx
  }
}

// ======================================================
// EXTRAER 5,000 PUNTOS DE MÉXICO
// ======================================================

function getMexicoPoints(
  width,
  height,
  amount
) {
  const mask =
    createMexicoMask(
      width,
      height
    )

  if (!mask) {
    return []
  }

  const {
    ctx
  } = mask

  const imageData =
    ctx.getImageData(
      0,
      0,
      width,
      height
    )

  const pixels =
    imageData.data

  const points = []

  /*
   * Evitamos un loop infinito
   * en caso de que el GeoJSON
   * tenga algún problema.
   */
  const maxAttempts =
    amount * 100

  let attempts = 0

  while (
    points.length < amount &&
    attempts < maxAttempts
  ) {
    attempts++

    const x =
      Math.floor(
        Math.random() *
        width
      )

    const y =
      Math.floor(
        Math.random() *
        height
      )

    /*
     * Cada pixel tiene:
     *
     * R
     * G
     * B
     * A
     *
     * Por eso multiplicamos por 4.
     */
    const index =
      (
        y * width +
        x
      ) * 4

    const alpha =
      pixels[
      index + 3
      ]

    /*
     * Si alpha > 0,
     * ese pixel pertenece
     * a México.
     */
    if (
      alpha > 128
    ) {
      points.push({
        x,
        y
      })
    }
  }

  return points
}

// ======================================================
// CONVERTIR EL CÍRCULO EN MÉXICO
// ======================================================

function transformToMexico() {
  if (
    !app ||
    !mexicoGeoJson
  ) {
    return
  }

  const width =
    Math.floor(
      app.screen.width
    )

  const height =
    Math.floor(
      app.screen.height
    )

  const mexicoPoints =
    getMexicoPoints(
      width,
      height,
      particles.length
    )

  if (
    mexicoPoints.length !==
    particles.length
  ) {
    console.warn(
      'No se generaron suficientes puntos.'
    )

    return
  }

  /*
   * Cada partícula recibe
   * una coordenada de México.
   */
  for (
    let i = 0;
    i < particles.length;
    i++
  ) {
    particles[i].targetX =
      mexicoPoints[i].x

    particles[i].targetY =
      mexicoPoints[i].y
  }
}

// ======================================================
// RESIZE
// ======================================================

function handleResize() {
  if (
    !app ||
    !containerRef.value
  ) {
    return
  }

  const width =
    containerRef.value.clientWidth

  const height =
    containerRef.value.clientHeight

  app.renderer.resize(
    width,
    height
  )

  /*
   * No recalculamos los miles
   * de polígonos en cada pixel
   * mientras se cambia el tamaño.
   *
   * Esperamos un poco.
   */
  clearTimeout(
    resizeTimer
  )

  resizeTimer =
    setTimeout(
      () => {
        if (
          mexicoGeoJson
        ) {
          transformToMexico()
        }
      },
      150
    )
}

function handlePointerMove(event) {
  if (!app || !containerRef.value) {
    return
  }

  const rect =
    containerRef.value.getBoundingClientRect()

  /*
   * Convertimos la posición del mouse
   * a coordenadas internas de Pixi.
   */
  pointer.x =
    (event.clientX - rect.left) *
    (app.screen.width / rect.width)

  pointer.y =
    (event.clientY - rect.top) *
    (app.screen.height / rect.height)

  pointer.active = true
}

function handlePointerLeave() {
  pointer.active = false
}

// ======================================================
// INIT
// ======================================================

onMounted(async () => {
  const element =
    containerRef.value

  if (!element) {
    return
  }

  // ----------------------------------------------------
  // PIXI
  // ----------------------------------------------------

  app =
    new Application()

  await app.init({
    width:
      element.clientWidth,

    height:
      element.clientHeight,

    backgroundAlpha:
      0,

    antialias:
      true,

    resolution:
      Math.min(
        window.devicePixelRatio ||
        1,

        2
      ),

    autoDensity:
      true
  })

  element.appendChild(
    app.canvas
  )

  // ----------------------------------------------------
  // TEXTURA
  // ----------------------------------------------------

  dotTexture =
    createDotTexture()

  // ----------------------------------------------------
  // PARTICLE CONTAINER
  // ----------------------------------------------------

  particleContainer =
    new ParticleContainer({
      dynamicProperties: {
        /*
         * x/y cambian mientras
         * viajan hacia México.
         */
        position:
          true,

        rotation:
          false,

        /*
         * Necesario porque las
         * partículas pulsan.
         */
        vertex:
          true,

        color:
          false
      }
    })

  app.stage.addChild(
    particleContainer
  )

  // ----------------------------------------------------
  // PRIMERO CÍRCULO
  // ----------------------------------------------------

  createParticles()

  element.addEventListener(
    'pointermove',
    handlePointerMove
  )

  element.addEventListener(
    'pointerleave',
    handlePointerLeave
  )

  // ----------------------------------------------------
  // ANIMACIÓN
  // ----------------------------------------------------

  app.ticker.add(ticker => {
    const dt =
      Math.min(
        ticker.deltaMS / 16.6667,
        2
      )

    const time =
      performance.now() * 0.001

    // ==================================================
    // FÍSICA
    // ==================================================

    const SPRING = 0.06
    const DAMPING = 0.82

    const damping =
      Math.pow(
        DAMPING,
        dt
      )

    const radiusSquared =
      props.repulsionRadius *
      props.repulsionRadius

    // ==================================================
    // PARTÍCULAS
    // ==================================================

    for (
      let i = 0;
      i < particles.length;
      i++
    ) {
      const data =
        particles[i]

      const particle =
        data.particle

      /*
       * Normalmente el destino de la partícula
       * es su posición dentro de México.
       */
      let targetX =
        data.targetX

      let targetY =
        data.targetY

      // ==================================================
      // REPULSIÓN DEL MOUSE
      // ==================================================

      if (pointer.active) {
        const dx =
          particle.x -
          pointer.x

        const dy =
          particle.y -
          pointer.y

        const distanceSquared =
          dx * dx +
          dy * dy

        /*
         * Primero comprobamos usando distancia al cuadrado
         * para evitar hacer sqrt en las 5,000 partículas.
         */
        if (
          distanceSquared <
          radiusSquared
        ) {
          const distance =
            Math.sqrt(
              distanceSquared
            )

          /*
           * 1 = justo debajo del mouse
           * 0 = borde del radio
           */
          const normalized =
            1 -
            distance /
            props.repulsionRadius

          /*
           * Fuerza cuadrática.
           *
           * Cerca del mouse:
           * fuerte.
           *
           * Cerca del borde:
           * suave.
           */
          const force =
            normalized *
            normalized

          let directionX
          let directionY

          if (
            distance >
            0.001
          ) {
            directionX =
              dx / distance

            directionY =
              dy / distance
          } else {
            directionX =
              data.escapeX

            directionY =
              data.escapeY
          }

          /*
           * Modificamos temporalmente
           * el destino.
           *
           * data.targetX / data.targetY
           * NO cambian.
           *
           * Por eso siempre puede regresar
           * a formar México.
           */
          targetX +=
            directionX *
            props.repulsionStrength *
            force

          targetY +=
            directionY *
            props.repulsionStrength *
            force
        }
      }

      // ==================================================
      // SPRING
      // ==================================================

      data.vx +=
        (
          targetX -
          particle.x
        ) *
        SPRING *
        dt

      data.vy +=
        (
          targetY -
          particle.y
        ) *
        SPRING *
        dt

      // ==================================================
      // DAMPING
      // ==================================================

      data.vx *=
        damping

      data.vy *=
        damping

      // ==================================================
      // POSICIÓN
      // ==================================================

      particle.x +=
        data.vx *
        dt

      particle.y +=
        data.vy *
        dt

      // ==================================================
      // PULSACIÓN DE TAMAÑO
      // ==================================================

      const wave =
        Math.sin(
          time *
          data.speed +
          data.phase
        )

      const pulse =
        1 +
        wave *
        data.amplitude

      const scale =
        data.baseScale *
        pulse

      particle.scaleX =
        scale

      particle.scaleY =
        scale
    }
  })

  // ----------------------------------------------------
  // RESIZE
  // ----------------------------------------------------

  resizeObserver =
    new ResizeObserver(
      handleResize
    )

  resizeObserver.observe(
    element
  )

  // ----------------------------------------------------
  // CARGAMOS MÉXICO
  // ----------------------------------------------------

  try {
    await loadMexicoGeoJson()

    transformToMexico()
  } catch (error) {
    console.error(
      'Error cargando GeoJSON de México:',
      error
    )
  }
})

// ======================================================
// DESTROY
// ======================================================

onUnmounted(() => {
  const element =
    containerRef.value

  if (element) {
    element.removeEventListener(
      'pointermove',
      handlePointerMove
    )

    element.removeEventListener(
      'pointerleave',
      handlePointerLeave
    )
  }

  clearTimeout(
    resizeTimer
  )

  resizeObserver?.disconnect()

  particles.length = 0

  if (dotTexture) {
    dotTexture.destroy(true)
  }

  if (app) {
    app.destroy(
      true,
      {
        children: true
      }
    )
  }

  app = null
  particleContainer = null
  dotTexture = null
  mexicoGeoJson = null
})
</script>

<template>
  <div ref="containerRef" class="particle-mexico" />
</template>

<style scoped>
.particle-mexico {
  width: 100%;
  height: 700px;

  position: relative;
  overflow: hidden;

  touch-action: none;
}

.particle-mexico :deep(canvas) {
  display: block;

  width: 100%;
  height: 100%;
}
</style>
