<script setup>
import { computed } from 'vue'

const props = defineProps({
  eyebrow: {
    type: String,
    default: '',
  },
  // Radio por defecto, usado cuando una esquina se marca como "true"
  radius: {
    type: [String, Number],
    default: 10,
  },
  // Cuánto se solapan las líneas entre sí (negativo = se pisan)
  overlap: {
    type: [String, Number],
    default: -10,
  },
  /**
   * Cada línea puede ser:
   * - un string simple: 'Texto de la línea'
   * - un objeto con opciones:
   *   {
   *     text: 'Texto de la línea',
   *     indent: 24,              // margen izquierdo en px (opcional)
   *     padding: '4px 24px',     // padding CSS libre (opcional)
   *     rounded: 'right',        // atajo: 'all' | 'top' | 'bottom' | 'left' | 'right' | 'none'
   *     corners: {               // control fino, tiene prioridad sobre "rounded"
   *       topLeft: true,         // true = usa "radius" global
   *       topRight: 12,          // número/string = radio propio para esa esquina
   *       bottomRight: false,    // false = esquina recta (0)
   *       bottomLeft: 0,
   *     }
   *   }
   * Si no se especifica "rounded" ni "corners", se calcula automáticamente:
   *   - primera línea -> 'top'
   *   - última línea  -> 'bottom'
   *   - líneas intermedias -> 'right'
   */
  lines: {
    type: Array,
    required: true,
  },
})

// Convierte 'top' | 'bottom' | 'left' | 'right' | 'all' | 'none'
// a un objeto { topLeft, topRight, bottomRight, bottomLeft } de booleanos
function roundedShorthandToCorners(mode) {
  switch (mode) {
    case 'all':
      return { topLeft: true, topRight: true, bottomRight: true, bottomLeft: true }
    case 'top':
      return { topLeft: true, topRight: true, bottomRight: false, bottomLeft: false }
    case 'bottom':
      return { topLeft: false, topRight: false, bottomRight: true, bottomLeft: true }
    case 'left':
      return { topLeft: true, topRight: false, bottomRight: false, bottomLeft: true }
    case 'right':
      return { topLeft: false, topRight: true, bottomRight: true, bottomLeft: false }
    case 'none':
    default:
      return { topLeft: false, topRight: false, bottomRight: false, bottomLeft: false }
  }
}

// Normaliza cada línea a un objeto { text, indent, padding, corners }
const normalizedLines = computed(() =>
  props.lines.map((line, index) => {
    const isFirst = index === 0
    const isLast = index === props.lines.length - 1
    const defaultRounded = isFirst ? 'top' : isLast ? 'bottom' : 'right'
    const baseCorners = roundedShorthandToCorners(defaultRounded)

    if (typeof line === 'string') {
      return {
        text: line,
        indent: 0,
        padding: '0.15em 0.6em',
        corners: baseCorners,
      }
    }

    // Si el usuario pasó "rounded", se usa como base en vez del default automático
    const shorthandCorners = line.rounded
      ? roundedShorthandToCorners(line.rounded)
      : baseCorners

    // "corners" individual, si existe, sobrescribe corner por corner
    const finalCorners = {
      ...shorthandCorners,
      ...(line.corners || {}),
    }

    return {
      text: line.text,
      indent: line.indent || 0,
      padding: line.padding || '0.15em 0.6em',
      corners: finalCorners,
    }
  }),
)

// Traduce un valor de esquina (true/false/número/string) a un valor CSS
function resolveCornerValue(value) {
  if (value === true) {
    return typeof props.radius === 'number' ? `${props.radius}px` : props.radius
  }
  if (value === false || value === undefined || value === null) {
    return '0px'
  }
  return typeof value === 'number' ? `${value}px` : value
}

// Arma el border-radius final: top-left top-right bottom-right bottom-left
function getBorderRadius(corners) {
  const tl = resolveCornerValue(corners.topLeft)
  const tr = resolveCornerValue(corners.topRight)
  const br = resolveCornerValue(corners.bottomRight)
  const bl = resolveCornerValue(corners.bottomLeft)
  return `${tl} ${tr} ${br} ${bl}`
}

const overlapValue = computed(() =>
  typeof props.overlap === 'number' ? `${props.overlap}px` : props.overlap,
)
</script>

<template>
  <div class="stacked-paper">
    <div v-if="eyebrow" class="stacked-paper__eyebrow">
      <span>{{ eyebrow }}</span>
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" />
        <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" />
      </svg>
    </div>

    <div class="stacked-paper__lines">
      <div v-for="(line, i) in normalizedLines" :key="i" class="stacked-paper__line" :style="{
        marginLeft: line.indent + 'px',
        padding: line.padding,
        borderRadius: getBorderRadius(line.corners),
        marginTop: i === 0 ? 0 : overlapValue,
      }">
        {{ line.text }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.stacked-paper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stacked-paper__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 0.95rem;
  background: #fff;
  border-radius: 999px;
  padding: 6px 14px;
  margin-bottom: 8px;
  width: max-content;
}

.stacked-paper__lines {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stacked-paper__line {
  position: relative;
  width: max-content;
  max-width: 100%;
  background: #fff;
  font-weight: 800;
  font-size: 2.25rem;
  line-height: 1.25;
  white-space: nowrap;
}
</style>
