/**
 * Configuración central de la experiencia 3D.
 * El modelo GLB vive en public/models/, no en src/assets/.
 * BASE_URL permite desplegar Vite en una subruta de producción.
 */
export const JOURNEY_CONFIG = {
  model: {
    // MODIFICAR AQUÍ PARA CAMBIAR EL MODELO: sphere.glb -> train.glb
    path: `${import.meta.env.BASE_URL}models/esfera_ornamental_calada.glb`,
    // MODIFICAR AQUÍ PARA CAMBIAR EL TAMAÑO (escala tras normalizar el GLB)
    scale: 0.5,
    mobileScale: 0.77,
    tabletScale: 0.88,
    // MODIFICAR AQUÍ PARA DESACTIVAR LA ROTACIÓN PROPIA DE LA ESFERA
    rotate: false,
    rotationSpeed: 0.42, // radianes / segundo; independiente del scroll
    // Al usar un tren, poner true (y rotate: false).
    followTangent: false,
    // El eje frontal del GLB: por defecto, +Z. Ajustar para otro modelo.
    forwardAxis: [0, 0, 1],
    // Si el GLB apunta en otra dirección, corregir los grados aquí.
    rotationOffsetDegrees: [0, 0, 0],
  },

  // MODIFICAR AQUÍ PARA CAMBIAR LA CÁMARA
  camera: {
    fov: 42,
    distance: 9,
    near: 0.1,
    far: 100,
    background: null,
  },

  // MODIFICAR AQUÍ PARA CAMBIAR EL RECORRIDO y la experiencia de scroll
  journey: {
    closed: true,
    scrollVhPerStage: 115, // altura de scroll entre etapas, en svh
    smoothingSeconds: 0.3, // suavizado del modelo; no retrasa el texto
    jumpDurationSeconds: 1.1, // salto desde la navegación lateral
    showPath: true, // útil para pruebas; false oculta la curva
  },

  layout: {
    // MODIFICAR AQUÍ SI CAMBIA LA ALTURA DEL NAVBAR DE TU SITIO
    navbarDesktopPx: 80,
    navbarTabletPx: 72,
    navbarMobilePx: 64,
    // ID de la sección que YA contiene el botón hacia el mapa.
    mapTarget: "#map-section",
  },

  performance: {
    maxPixelRatio: 1.6,
    maxPixelRatioMobile: 1.25,
  },
};
