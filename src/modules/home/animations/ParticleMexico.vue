<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { Application, Particle, ParticleContainer, Texture } from 'pixi.js'
import { geoIdentity, geoPath } from 'd3-geo'

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

function createDotTexture() {
  const size = 12
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.fill()

  return Texture.from(canvas)
}

async function loadMexicoGeoJson() {
  const requests = props.geojsonFiles.map(async (url) => {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`No se pudo cargar: ${url}`)
    }
    return response.json()
  })

  const estados = await Promise.all(requests)
  const features = estados.flatMap((estado) => estado.features || [])

  mexicoGeoJson = {
    type: 'FeatureCollection',
    features
  }
}

function createMexicoMask(width, height) {
  if (!mexicoGeoJson) return null

  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(width)
  canvas.height = Math.floor(height)

  const ctx = canvas.getContext('2d', {
    willReadFrequently: true
  })

  const padding = Math.min(width, height) * 0.08

  const projection = geoIdentity()
    .reflectY(true)
    .fitExtent(
      [
        [padding, padding],
        [width - padding, height - padding]
      ],
      mexicoGeoJson
    )

  const path = geoPath(projection, ctx)

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  path(mexicoGeoJson)
  ctx.fill('evenodd')

  return { canvas, ctx }
}

function getMexicoPoints(width, height, amount) {
  const mask = createMexicoMask(width, height)
  if (!mask) return []

  const { ctx } = mask
  const imageData = ctx.getImageData(0, 0, width, height)
  const pixels = imageData.data

  const points = []
  const maxAttempts = amount * 100
  let attempts = 0

  while (points.length < amount && attempts < maxAttempts) {
    attempts++

    const x = Math.floor(Math.random() * width)
    const y = Math.floor(Math.random() * height)
    const index = (y * width + x) * 4
    const alpha = pixels[index + 3]

    if (alpha > 128) {
      points.push({ x, y })
    }
  }

  return points
}

function createParticlesInMexico() {
  if (!app || !mexicoGeoJson) return

  const width = Math.floor(app.screen.width)
  const height = Math.floor(app.screen.height)

  const mexicoPoints = getMexicoPoints(width, height, props.count)

  if (!mexicoPoints.length) {
    console.warn('No se pudieron generar puntos dentro de México.')
    return
  }

  for (let i = 0; i < mexicoPoints.length; i++) {
    const point = mexicoPoints[i]
    const baseScale = 0.09 + Math.random() * 0.1
    const escapeAngle = Math.random() * Math.PI * 2

    const particle = new Particle({
      texture: dotTexture,
      x: point.x,
      y: point.y,
      anchorX: 0.5,
      anchorY: 0.5,
      scaleX: baseScale,
      scaleY: baseScale,
      tint: props.color
    })

    particles.push({
      particle,
      targetX: point.x,
      targetY: point.y,
      vx: 0,
      vy: 0,
      baseScale,
      phase: Math.random() * Math.PI * 2,
      speed: 0.8 + Math.random() * 1.5,
      amplitude: 0.15 + Math.random() * 0.35,
      escapeX: Math.cos(escapeAngle),
      escapeY: Math.sin(escapeAngle)
    })

    particleContainer.addParticle(particle)
  }
}

function updateMexicoTargets(immediate = false) {
  if (!app || !mexicoGeoJson || !particles.length) return

  const width = Math.floor(app.screen.width)
  const height = Math.floor(app.screen.height)

  const mexicoPoints = getMexicoPoints(width, height, particles.length)

  if (mexicoPoints.length !== particles.length) {
    console.warn('No se generaron suficientes puntos para reacomodar México.')
    return
  }

  for (let i = 0; i < particles.length; i++) {
    const item = particles[i]
    const point = mexicoPoints[i]

    item.targetX = point.x
    item.targetY = point.y

    if (immediate) {
      item.particle.x = point.x
      item.particle.y = point.y
      item.vx = 0
      item.vy = 0
    }
  }
}

function handleResize() {
  if (!app || !containerRef.value) return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  app.renderer.resize(width, height)

  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    updateMexicoTargets(true)
  }, 150)
}

function handlePointerMove(event) {
  if (!app || !containerRef.value) return

  const rect = containerRef.value.getBoundingClientRect()

  pointer.x = (event.clientX - rect.left) * (app.screen.width / rect.width)
  pointer.y = (event.clientY - rect.top) * (app.screen.height / rect.height)
  pointer.active = true
}

function handlePointerLeave() {
  pointer.active = false
}

onMounted(async () => {
  const element = containerRef.value
  if (!element) return

  app = new Application()

  await app.init({
    width: element.clientWidth,
    height: element.clientHeight,
    backgroundAlpha: 0,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true
  })

  element.appendChild(app.canvas)

  dotTexture = createDotTexture()

  particleContainer = new ParticleContainer({
    dynamicProperties: {
      position: true,
      rotation: false,
      vertex: true,
      color: false
    }
  })

  app.stage.addChild(particleContainer)

  element.addEventListener('pointermove', handlePointerMove)
  element.addEventListener('pointerleave', handlePointerLeave)

  app.ticker.add((ticker) => {
    const dt = Math.min(ticker.deltaMS / 16.6667, 2)
    const time = performance.now() * 0.001

    const SPRING = 0.06
    const DAMPING = 0.82
    const damping = Math.pow(DAMPING, dt)
    const radiusSquared = props.repulsionRadius * props.repulsionRadius

    for (let i = 0; i < particles.length; i++) {
      const data = particles[i]
      const particle = data.particle

      let targetX = data.targetX
      let targetY = data.targetY

      if (pointer.active) {
        const dx = particle.x - pointer.x
        const dy = particle.y - pointer.y
        const distanceSquared = dx * dx + dy * dy

        if (distanceSquared < radiusSquared) {
          const distance = Math.sqrt(distanceSquared)
          const normalized = 1 - distance / props.repulsionRadius
          const force = normalized * normalized

          let directionX
          let directionY

          if (distance > 0.001) {
            directionX = dx / distance
            directionY = dy / distance
          } else {
            directionX = data.escapeX
            directionY = data.escapeY
          }

          targetX += directionX * props.repulsionStrength * force
          targetY += directionY * props.repulsionStrength * force
        }
      }

      data.vx += (targetX - particle.x) * SPRING * dt
      data.vy += (targetY - particle.y) * SPRING * dt

      data.vx *= damping
      data.vy *= damping

      particle.x += data.vx * dt
      particle.y += data.vy * dt

      const wave = Math.sin(time * data.speed + data.phase)
      const pulse = 1 + wave * data.amplitude
      const scale = data.baseScale * pulse

      particle.scaleX = scale
      particle.scaleY = scale
    }
  })

  resizeObserver = new ResizeObserver(handleResize)
  resizeObserver.observe(element)

  try {
    await loadMexicoGeoJson()
    createParticlesInMexico()
  } catch (error) {
    console.error('Error cargando GeoJSON de México:', error)
  }
})

onUnmounted(() => {
  const element = containerRef.value

  if (element) {
    element.removeEventListener('pointermove', handlePointerMove)
    element.removeEventListener('pointerleave', handlePointerLeave)
  }

  clearTimeout(resizeTimer)
  resizeObserver?.disconnect()

  particles.length = 0

  if (dotTexture) {
    dotTexture.destroy(true)
  }

  if (app) {
    app.destroy(true, {
      children: true
    })
  }

  app = null
  particleContainer = null
  dotTexture = null
  mexicoGeoJson = null
})
</script>

<template>
  <div ref="containerRef" class="particle-mexico"></div>
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
