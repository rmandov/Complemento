import { CatmullRomCurve3, Vector3 } from "three";

/**
 * Puntos proporcionales al área visible de la cámara.
 * Un único circuito cerrado sirve para 1, 3, 5 o N etapas.
 * No se debe añadir un nodo a la curva por cada etapa del JSON.
 *
 * X e Y son factores de semiancho y semialto ([-1, 1]); Z está en unidades 3D.
 * Los puntos están mayoritariamente a la derecha para dejar espacio al texto.
 */
// MODIFICAR AQUÍ PARA CAMBIAR EL RECORRIDO
// MODIFICAR AQUÍ PARA CAMBIAR EL RECORRIDO

export const JOURNEY_PATH_POINTS = [
  // Primer tramo: subida y curva superior
  [0.7, 0.18, 0.35],
  [0.62, 0.48, -0.15],
  [0.18, 0.63, -0.5],
  [-0.2, 0.5, -0.18],

  // Segundo tramo: giro y descenso
  [-0.1, 0.12, 0.4],
  [0.25, -0.18, 0.48],
  [0.0, -0.46, 0.0],
  [-0.46, -0.5, -0.35],

  // Tercer tramo: extremo izquierdo
  [-0.73, -0.1, 0.25],
  [-0.62, 0.3, 0.48],
  [-0.25, 0.6, 0.04],
  [0.2, 0.48, -0.45],

  // Cuarto tramo: curva central
  [0.35, 0.03, -0.1],
  [0.03, -0.24, 0.5],
  [-0.15, -0.54, 0.0],
  [0.36, -0.47, -0.45],

  // Quinto tramo: regreso a la derecha
  [0.7, -0.12, 0.3],
  [0.49, 0.28, 0.55],
  [0.07, 0.53, 0.14],
  [-0.37, 0.31, -0.4],

  // Sexto tramo: último giro y cierre
  [-0.5, -0.1, -0.05],
  [-0.19, -0.43, 0.5],
  [0.24, -0.56, 0.05],
  [0.64, -0.3, -0.4],
];

export function createJourneyPath({ halfWidth, halfHeight, mobile = false, closed = true }) {
  const points = JOURNEY_PATH_POINTS.map(([x, y, z]) => {
    return new Vector3(
      (mobile ? x * 0.35 : x) * halfWidth,
      (mobile ? y * 0.35 + 0.52 : y) * halfHeight,
      mobile ? z * 0.55 : z,
    );
  });

  return new CatmullRomCurve3(points, closed, "centripetal", 0.5);
}

/**
 * Distribuye todas las etapas a intervalos equidistantes del circuito.
 * El último punto se sitúa ANTES de 1, para evitar un salto al punto inicial.
 */
export function journeyCurveProgress(scrollProgress, stageCount) {
  if (stageCount <= 1) return 0;
  const normalized = Math.max(0, Math.min(1, scrollProgress));
  return (normalized * (stageCount - 1)) / stageCount;
}

export function stageScrollProgress(index, stageCount) {
  if (stageCount <= 1) return 0;
  return Math.max(0, Math.min(stageCount - 1, index)) / (stageCount - 1);
}

export function stageIndexAtProgress(scrollProgress, stageCount) {
  if (stageCount <= 1) return 0;
  return Math.max(0, Math.min(stageCount - 1, Math.round(scrollProgress * (stageCount - 1))));
}
