import { CatmullRomCurve3, Vector3 } from 'three'

// Edita estos puntos para cambiar el recorrido.
// X: izquierda / derecha. Y: abajo / arriba. Z: profundidad.
// X e Y son proporciones del espacio visible, no píxeles.
export const SPHERE_PATH_POINTS = [
  [0.52, 0.24, 0],
  [0.60, 0.04, 0.25],
  [0.08, -0.32, 0.60],
  [-0.48, 0.18, 0.20],
  [-0.55, -0.06, -0.40],
  [0.38, -0.28, 0.15],
  [0.50, -0.52, 0.80],
  [0.08, -0.58, 0.35],
]

export function createSpherePath(halfWidth, halfHeight, mobile = false) {
  return new CatmullRomCurve3(
    SPHERE_PATH_POINTS.map(([x, y, z]) => new Vector3(
      x * halfWidth,
      (mobile ? y * 0.4 - 0.3 : y) * halfHeight,
      z,
    )),
    false,
    'centripetal',
  )
}
