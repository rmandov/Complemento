import { CatmullRomCurve3, Vector3 } from 'three'

// Coordenadas de la trayectoria. X e Y se adaptan al tamaño de la pantalla.
// Z controla la profundidad: un valor mayor acerca la esfera a la cámara.
export const PATH_POINTS = [
  [0.52, 0.24, 0],
  [0.60, 0.04, 0.25],
  [0.08, -0.32, 0.60],
  [-0.48, 0.18, 0.20],
  [-0.55, -0.06, -0.40],
  [0.38, -0.28, 0.15],
  [0.50, -0.52, 0.80],
  [0.08, -0.58, 0.35],
]

export function createSpherePath(width, height, mobile = false) {
  return new CatmullRomCurve3(
    PATH_POINTS.map(([x, y, z]) => new Vector3(x * width, (mobile ? y * 0.4 - 0.3 : y) * height, z)),
    false,
    'centripetal',
  )
}
