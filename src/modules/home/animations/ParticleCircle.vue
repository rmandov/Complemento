<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import {
  Application,
  Particle,
  ParticleContainer,
  Texture
} from 'pixi.js'

const props = defineProps({
  count: {
    type: Number,
    default: 5000
  },

  color: {
    type: Number,
    default: 0x2563eb
  },

  // Radio visual de influencia del mouse, en píxeles.
  repulsionRadius: {
    type: Number,
    default: 120
  },

  // Qué tanto pueden alejarse los puntos.
  repulsionStrength: {
    type: Number,
    default: 100
  }
})

const containerRef = ref(null)

let app = null
let particleContainer = null
let resizeObserver = null
let dotTexture = null

let containerScale = 1

const particles = []

const BASE_RADIUS = 250

// ======================================================
// CURSOR
// ======================================================

const pointer = {
  active: false,

  // Coordenadas de pantalla dentro del canvas.
  x: 0,
  y: 0
}

// ======================================================
// TEXTURA DE CADA PUNTO
// ======================================================

function createDotTexture() {
  const size = 16

  const canvas = document.createElement('canvas')

  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, size, size)

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
// PUNTO ALEATORIO DENTRO DEL CÍRCULO
// ======================================================

function randomPointInsideCircle(radius) {
  const angle =
    Math.random() * Math.PI * 2

  /*
   * sqrt evita que los puntos se concentren
   * demasiado en el centro.
   */
  const distance =
    Math.sqrt(Math.random()) * radius

  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance
  }
}

// ======================================================
// CREACIÓN DE PARTÍCULAS
// ======================================================

function createParticles() {
  for (let i = 0; i < props.count; i++) {
    const position =
      randomPointInsideCircle(BASE_RADIUS)

    const baseScale =
      0.1 + Math.random() * 0.17

    const escapeAngle =
      Math.random() * Math.PI * 2

    const particle =
      new Particle({
        texture: dotTexture,

        x: position.x,
        y: position.y,

        anchorX: 0.5,
        anchorY: 0.5,

        scaleX: baseScale,
        scaleY: baseScale,

        tint: props.color
      })

    particles.push({
      particle,

      /*
       * Posición a la que siempre
       * debe intentar regresar.
       */
      homeX: position.x,
      homeY: position.y,

      /*
       * Velocidad para el efecto
       * elástico.
       */
      vx: 0,
      vy: 0,

      baseScale,

      /*
       * Pulsación independiente.
       */
      phase:
        Math.random() * Math.PI * 2,

      speed:
        1 + Math.random() * 2,

      amplitude:
        0.2 + Math.random() * 0.5,

      /*
       * Si el mouse coincide exactamente
       * con la partícula, le damos una
       * dirección de escape.
       */
      escapeX:
        Math.cos(escapeAngle),

      escapeY:
        Math.sin(escapeAngle)
    })

    particleContainer.addParticle(particle)
  }
}

// ======================================================
// RESPONSIVE
// ======================================================

function resizeCircle() {
  if (!app || !particleContainer) return

  const width =
    app.screen.width

  const height =
    app.screen.height

  const availableSize =
    Math.min(width, height)

  const desiredRadius =
    availableSize * 0.42

  containerScale =
    desiredRadius / BASE_RADIUS

  particleContainer.position.set(
    width / 2,
    height / 2
  )

  particleContainer.scale.set(
    containerScale
  )
}

// ======================================================
// POINTER
// ======================================================

function handlePointerMove(event) {
  if (!app || !containerRef.value) return

  const rect =
    containerRef.value.getBoundingClientRect()

  /*
   * Convertimos coordenadas DOM
   * a coordenadas de Pixi.
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
// MONTAJE
// ======================================================

onMounted(async () => {
  const element =
    containerRef.value

  if (!element) return

  // ----------------------------------------------------
  // PIXI APPLICATION
  // ----------------------------------------------------

  app =
    new Application()

  await app.init({
    width:
      element.clientWidth,

    height:
      element.clientHeight,

    backgroundAlpha: 0,

    antialias: true,

    resolution:
      Math.min(
        window.devicePixelRatio || 1,
        2
      ),

    autoDensity: true
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
         * Ahora SÍ modificamos x / y
         * constantemente.
         */
        position: true,

        rotation: false,

        /*
         * Necesario porque modificamos
         * scaleX / scaleY.
         */
        vertex: true,

        color: false
      }
    })

  app.stage.addChild(
    particleContainer
  )

  createParticles()

  resizeCircle()

  // ----------------------------------------------------
  // POINTER EVENTS
  // ----------------------------------------------------

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

  const startTime =
    performance.now()

  app.ticker.add((ticker) => {
    const now =
      performance.now()

    const time =
      now * 0.001

    /*
     * Normalizamos contra ~60 FPS.
     */
    const dt =
      Math.min(
        ticker.deltaMS / 16.6667,
        2
      )

    // ==================================================
    // ANIMACIÓN DE ENTRADA
    // ==================================================

    const elapsed =
      (now - startTime) / 1200

    const intro =
      Math.min(elapsed, 1)

    const introEase =
      1 -
      Math.pow(
        1 - intro,
        3
      )

    // ==================================================
    // CURSOR EN COORDENADAS DEL CÍRCULO
    // ==================================================

    /*
     * Las partículas viven en coordenadas locales
     * porque ParticleContainer está centrado
     * y escalado.
     */

    let mouseX = 0
    let mouseY = 0

    if (pointer.active) {
      mouseX =
        (
          pointer.x -
          app.screen.width / 2
        ) /
        containerScale

      mouseY =
        (
          pointer.y -
          app.screen.height / 2
        ) /
        containerScale
    }

    /*
     * Convertimos radio visual de pantalla
     * a coordenadas locales.
     *
     * Así la repulsión conserva aproximadamente
     * el mismo tamaño aunque cambie el responsive.
     */
    const repulsionRadius =
      props.repulsionRadius /
      containerScale

    const repulsionStrength =
      props.repulsionStrength /
      containerScale

    const radiusSquared =
      repulsionRadius *
      repulsionRadius

    // ==================================================
    // FÍSICA
    // ==================================================

    const SPRING = 0.085

    const DAMPING = 0.82

    // ==================================================
    // ACTUALIZAR 5,000 PARTÍCULAS
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

      // -----------------------------------------------
      // DESTINO NORMAL
      // -----------------------------------------------

      let targetX =
        data.homeX

      let targetY =
        data.homeY

      // -----------------------------------------------
      // REPULSIÓN
      // -----------------------------------------------

      if (pointer.active) {
        const dx =
          particle.x -
          mouseX

        const dy =
          particle.y -
          mouseY

        const distanceSquared =
          dx * dx +
          dy * dy

        /*
         * Sólo hacemos sqrt cuando el punto
         * realmente está dentro del radio.
         *
         * Esto evita 5,000 sqrt innecesarios
         * por frame.
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
           * 1 cerca del cursor.
           * 0 en el borde.
           */
          const normalized =
            1 -
            distance /
            repulsionRadius

          /*
           * Curva cuadrática:
           *
           * cerca = empuje fuerte
           * lejos = empuje suave
           */
          const force =
            normalized *
            normalized

          let directionX
          let directionY

          if (distance > 0.001) {
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

          targetX +=
            directionX *
            repulsionStrength *
            force

          targetY +=
            directionY *
            repulsionStrength *
            force
        }
      }

      // -----------------------------------------------
      // SPRING
      // -----------------------------------------------

      /*
       * La partícula intenta ir al target.
       */

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

      // -----------------------------------------------
      // DAMPING
      // -----------------------------------------------

      /*
       * Reduce progresivamente la velocidad.
       *
       * Sin esto las partículas oscilarían
       * eternamente.
       */

      const damping =
        Math.pow(
          DAMPING,
          dt
        )

      data.vx *= damping
      data.vy *= damping

      // -----------------------------------------------
      // ACTUALIZAR POSICIÓN
      // -----------------------------------------------

      particle.x +=
        data.vx * dt

      particle.y +=
        data.vy * dt

      // ==================================================
      // PULSACIÓN
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
        pulse *
        introEase

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
    new ResizeObserver(() => {
      if (!containerRef.value) {
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

      resizeCircle()
    })

  resizeObserver.observe(
    element
  )
})

// ======================================================
// DESTRUCCIÓN
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
})
</script>

<template>
  <div ref="containerRef" class="particle-circle" />
</template>

<style scoped>
.particle-circle {
  width: 100%;
  height: 650px;

  position: relative;
  overflow: hidden;

  cursor: crosshair;
  touch-action: none;
}

.particle-circle :deep(canvas) {
  display: block;

  width: 100%;
  height: 100%;
}
</style>
