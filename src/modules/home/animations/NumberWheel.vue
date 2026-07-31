<script setup>
/**
 * OdometerNumber.vue
 * ----------------------------------------------------------------
 * Componente "odómetro / slot machine" reutilizable.
 *
 * Anima cada dígito de un número (o cadena con separadores, ej: "3,456")
 * simulando el giro de una ruleta mecánica: números aleatorios se
 * desplazan verticalmente de abajo hacia arriba hasta detenerse
 * exactamente en el dígito final.
 *
 * - Toda la temporización la maneja GSAP (sin setInterval).
 * - Cada dígito arranca en un orden aleatorio, con ~1ms de diferencia
 *   respecto al siguiente.
 * - La animación completa dura ~`duration` segundos.
 * - Caracteres no numéricos (comas, puntos, %, etc.) se muestran
 *   estáticos, sin animar, para poder pasarle valores ya formateados.
 */
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import gsap from 'gsap'

const props = defineProps({
  // Valor final a mostrar. Number o String (admite separadores: "3,456").
  value: { type: [Number, String], required: true, default: 0 },
  // Duración total aproximada de la animación (segundos).
  duration: { type: Number, default: 3 },
  // Altura de cada fila/dígito en px. Si es 0 (default), se calcula
  // automáticamente en base al font-size heredado -> soporta font-size fluido.
  digitHeight: { type: Number, default: 0 },
  // Multiplicador para calcular la altura de fila cuando digitHeight = 0.
  lineHeightRatio: { type: Number, default: 1.15 },
  // Easing de GSAP (desaceleración final, como una ruleta real).
  easing: { type: String, default: 'power3.out' },
  // Cantidad de dígitos aleatorios que "pasan" antes de llegar al valor final.
  spins: { type: Number, default: 24 },
  // Reproducir automáticamente al montar el componente.
  autoplay: { type: Boolean, default: true }
})

const emit = defineEmits(['start', 'complete'])

const wrapperRef = ref(null)
const stripRefs = ref([])
const rowHeight = ref(40) // se recalcula justo antes de cada animación

const chars = computed(() => String(props.value ?? '').split(''))
const isDigit = (ch) => /\d/.test(ch)

// Secuencia de números por columna (solo para caracteres numéricos)
const sequences = ref(chars.value.map((ch) => (isDigit(ch) ? [Number(ch)] : null)))

function buildSequences() {
  sequences.value = chars.value.map((ch) => {
    if (!isDigit(ch)) return null
    const seq = []
    for (let i = 0; i < props.spins; i++) {
      seq.push(Math.floor(Math.random() * 10))
    }
    seq.push(Number(ch)) // último elemento = dígito final real
    return seq
  })
}

function setStripRef(el, index) {
  if (el) stripRefs.value[index] = el
}

// Calcula la altura de fila según el font-size actual (soporta clamp()/vw)
function updateRowHeight() {
  if (props.digitHeight > 0) {
    rowHeight.value = props.digitHeight
    return
  }
  if (!wrapperRef.value) return
  const fontSize = parseFloat(getComputedStyle(wrapperRef.value).fontSize) || 16
  rowHeight.value = Math.round(fontSize * props.lineHeightRatio)
}

let resizeTimeout = null
function handleResize() {
  clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(updateRowHeight, 120)
}

let timeline = null

async function play() {
  buildSequences()
  await nextTick()
  updateRowHeight()

  // Reinicia todas las columnas a su posición inicial
  stripRefs.value.forEach((el) => el && gsap.set(el, { y: 0 }))

  const numericIndices = chars.value
    .map((ch, i) => (isDigit(ch) ? i : null))
    .filter((i) => i !== null)

  // Orden aleatorio de inicio, distinto en cada ejecución
  const shuffled = [...numericIndices].sort(() => Math.random() - 0.5)

  if (timeline) timeline.kill()
  timeline = gsap.timeline({
    onStart: () => emit('start'),
    onComplete: () => emit('complete')
  })

  shuffled.forEach((digitIndex, order) => {
    const el = stripRefs.value[digitIndex]
    const seq = sequences.value[digitIndex]
    if (!el || !seq) return

    const finalY = -(seq.length - 1) * rowHeight.value

    // Cada dígito arranca ~1ms después que el anterior
    timeline.to(
      el,
      { y: finalY, duration: props.duration, ease: props.easing },
      order * 0.1
    )
  })
}

onMounted(() => {
  buildSequences()
  updateRowHeight()
  window.addEventListener('resize', handleResize)
  if (props.autoplay) play()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  clearTimeout(resizeTimeout)
  if (timeline) timeline.kill()
})

// Si el valor final cambia dinámicamente, se reproduce de nuevo
watch(
  () => props.value,
  (newVal, oldVal) => {
    if (String(newVal) !== String(oldVal)) play()
  }
)

defineExpose({ play })
</script>

<template>
  <span ref="wrapperRef" class="odometer">
    <span v-for="(ch, i) in chars" :key="i" class="odometer-char"
      :style="isDigit(ch) ? { height: rowHeight + 'px', width: rowHeight * 0.66 + 'px' } : {}">
      <span v-if="isDigit(ch)" class="odometer-window" :style="{ height: rowHeight + 'px' }">
        <span class="odometer-strip" :ref="(el) => setStripRef(el, i)">
          <span v-for="(num, ni) in sequences[i] || [Number(ch)]" :key="ni" class="odometer-digit"
            :style="{ height: rowHeight + 'px', lineHeight: rowHeight + 'px' }">{{ num }}</span>
        </span>
      </span>
      <span v-else class="odometer-static">{{ ch }}</span>
    </span>
  </span>
</template>

<style scoped>
.odometer {
  display: inline-flex;
  align-items: baseline;
  font-variant-numeric: tabular-nums;
  /* evita "jitter" horizontal entre dígitos */
  font-feature-settings: 'tnum' 1;
}

.odometer-char {
  display: inline-block;
  overflow: hidden;
  vertical-align: bottom;
}

.odometer-window {
  display: block;
  overflow: hidden;
  position: relative;
  width: 100%;
}

.odometer-strip {
  display: flex;
  flex-direction: column;
  will-change: transform;
}

.odometer-digit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  text-align: center;
}

.odometer-static {
  display: inline-block;
}
</style>
