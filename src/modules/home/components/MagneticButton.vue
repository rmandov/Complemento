<script setup>
import { RouterLink } from 'vue-router'
import gsap from 'gsap'

/**
 * Props para controlar en qué partes se aplica el efecto magnético.
 * Por defecto: solo la imagen se mueve magnéticamente.
 * Puedes habilitar el botón completo y/o el texto según necesites.
 */
const props = defineProps({
  magneticImage: { type: Boolean, default: true },
  magneticButton: { type: Boolean, default: false },
  magneticText: { type: Boolean, default: false },
  // Qué tanto se mueve cada elemento respecto al cursor (a mayor valor, más desplazamiento)
  strengthImage: { type: Number, default: 0.10 },
  strengthButton: { type: Number, default: 0.15 },
  strengthText: { type: Number, default: 0.2 },
})

const botones = [
  {
    to: '/fichas',
    img: new URL('../../../assets/img/img_circle.png', import.meta.url).href,
    label: 'Categoría',
    description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit.!',
  },
  {
    to: '/mapa',
    img: new URL('../../../assets/img/Mexico.png', import.meta.url).href,
    label: 'Territorio',
    description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit.!',
  },
]

// Recolecta, según los flags activos, qué elementos deben moverse y con qué fuerza
function getMagneticTargets(zone) {
  const targets = []

  if (props.magneticImage) {
    const img = zone.querySelector('.boton-icono')
    if (img) targets.push({ el: img, strength: props.strengthImage })
  }
  if (props.magneticButton) {
    const btn = zone.querySelector('.boton-card')
    if (btn) targets.push({ el: btn, strength: props.strengthButton })
  }
  if (props.magneticText) {
    const text = zone.querySelector('.boton-info')
    if (text) targets.push({ el: text, strength: props.strengthText })
  }

  return targets
}

const handleMouseMove = (e) => {
  const zone = e.currentTarget
  const targets = getMagneticTargets(zone)
  if (!targets.length) return

  const rect = zone.getBoundingClientRect()
  const x = gsap.utils.mapRange(rect.left, rect.right, -rect.width / 2, rect.width / 2, e.clientX)
  const y = gsap.utils.mapRange(rect.top, rect.bottom, -rect.height / 2, rect.height / 2, e.clientY)

  targets.forEach(({ el, strength }) => {
    gsap.to(el, {
      x: x * strength,
      y: y * strength,
      duration: 0.4,
      ease: 'power2.out',
      overwrite: true,
    })
  })
}

const handleMouseLeave = (e) => {
  const zone = e.currentTarget
  const targets = getMagneticTargets(zone)
  if (!targets.length) return

  gsap.to(
    targets.map((t) => t.el),
    {
      x: 0,
      y: 0,
      duration: 0.7,
      ease: 'elastic.out(1, 0.4)',
      overwrite: true,
    }
  )
}
</script>

<template>
  <section class="boton-section">
    <div v-for="(btn, index) in botones" :key="index" class="magnetic-zone" @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave">
      <RouterLink class="boton-card" :to="btn.to">
        <div class="boton-icono">
          <img :src="btn.img" :alt="btn.label" />
        </div>

        <div class="boton-info">
          <h3 class="boton-titulo">{{ btn.label }}</h3>
          <p class="boton-descripcion">{{ btn.description }}</p>
        </div>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.boton-section {
  display: flex;
  gap: 24px;
}

.magnetic-zone {
  flex: 1;
  display: flex;
}

.boton-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 32px;
  border-radius: 24px;
  background-color: rgb(224, 224, 224);
  text-decoration: none;
  color: inherit;
  /* ===== necesario para el efecto magnético en el botón completo ===== */
  position: relative;
  will-change: transform;
}

.boton-icono {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  /* ===== necesario para el efecto magnético en la imagen ===== */
  will-change: transform;
}

.boton-icono img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.boton-info {
  min-width: 0;
  /* ===== necesario para el efecto magnético en el texto ===== */
  will-change: transform;
}

.boton-titulo {
  font-family: NotoSansBold;
  font-size: 1.5rem;
  margin: 0 0 8px 0;
}

.boton-descripcion {
  margin: 0;
  font-size: 0.95rem;
  color: #333;
}

@media (max-width: 768px) {
  .boton-section {
    flex-direction: column;
  }
}
</style>
