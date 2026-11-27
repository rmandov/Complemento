import { CatmullRomCurve3, Vector3 } from 'three'

// Curvas suaves en forma de S, con regreso continuo al primer punto.
// X e Y son proporciones del semiancho/semialto visible; Z es profundidad.
// No repitas el primer punto al final: closed conecta ambos automáticamente.
export const JOURNEY_PATH_POINTS = [
  [0.52, 0.05, 0],
  [0.64, -0.15, 0.25],
  [0.28, -0.42, 0.60],
  [-0.30, -0.35, 0.30],
  [-0.52, -0.08, 0],
  [-0.52, 0.14, -0.25],
  [-0.13, 0.32, -0.45],
  [0.28, 0.18, -0.10],
  [0.02, -0.08, 0.20],
  [-0.15, -0.32, 0.50],
  [0.30, -0.50, 0],
  [0.64, -0.25, -0.20],
]

export function createJourneyPath({ halfWidth, halfHeight, mobile = false, closed = true }) {
  const points = JOURNEY_PATH_POINTS.map(([x, y, z]) => new Vector3(
    // En móvil reservar el lateral izquierdo para navegación y la parte baja para texto.
    (mobile ? x * 0.65 + 0.12 : x * 0.90 + 0.06) * halfWidth,
    (mobile ? y * 0.36 + 0.43 : y) * halfHeight,
    mobile ? z * 0.55 : z,
  ))
  return new CatmullRomCurve3(points, closed, 'centripetal', 0.5)
}

/** Un circuito completo, independientemente de cuántas etapas tenga el JSON. */
export function journeyCurveProgress(scrollProgress, stageCount) {
  if (stageCount <= 1) return 0
  return Math.max(0, Math.min(1, scrollProgress))
}

export function stageScrollProgress(index, stageCount) {
  if (stageCount <= 1) return 0
  return Math.max(0, Math.min(stageCount - 1, index)) / (stageCount - 1)
}

export function stageIndexAtProgress(scrollProgress, stageCount) {
  if (stageCount <= 1) return 0
  return Math.max(0, Math.min(stageCount - 1, Math.round(scrollProgress * (stageCount - 1))))
}
