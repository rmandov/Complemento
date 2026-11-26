export const JOURNEY_CONFIG = {
  model: {
    // MODELO 3D
    // Debe existir en public/models/
    path: `${import.meta.env.BASE_URL}models/esfera_ornamental_calada.glb`,

    // TAMAÑO DEL MODELO
    scale: 1,
    mobileScale: 0.77,
    tabletScale: 0.88,

    // ROTACIÓN AUTOMÁTICA
    rotate: true,
    rotationSpeed: 0.26,

    // Preparación para sustituir la esfera por un tren
    followTangent: false,
    forwardAxis: [0, 0, 1],
    rotationOffsetDegrees: [0, 0, 0],

    // Material metálico de estudio
    // Cambiar a 'original' al utilizar otro modelo
    materialPreset: "studio-metal",
  },

  // ==========================================
  // MATERIAL METÁLICO
  // ==========================================
  material: {
    // 1 = metal completamente metálico
    metalness: 0.88,

    // Menor roughness = reflejos más definidos
    champagneRoughness: 0.59,
    silverRoughness: 0.54,

    // Intensidad de los reflejos del material
    envMapIntensity: 0.5,
  },

  // ==========================================
  // ILUMINACIÓN CINEMATOGRÁFICA
  // ==========================================
  lighting: {
    // Reflejos generados por RoomEnvironment
    environmentIntensity: 0.4,

    // Exposición de la escena
    toneMappingExposure: 1.25,

    // Luz principal
    keyIntensity: 2.1,

    // Luz secundaria azulada
    fillIntensity: 1.15,

    // Contraluz cálido
    rimIntensity: 2.6,
  },

  // ==========================================
  // MOVIMIENTO CINEMATOGRÁFICO
  // ==========================================
  motion: {
    // Movimiento vertical sutil
    floatAmplitude: 0.045,
    floatSpeed: 0.8,

    // Inclinación durante el giro
    tiltAmplitude: 0.045,

    // Desplazamiento suave de cámara
    cameraDrift: 0.17,

    // Variación de profundidad
    cameraDepth: 0.16,
  },

  // ==========================================
  // CÁMARA
  // ==========================================
  camera: {
    fov: 42,
    distance: 9,
    near: 0.1,
    far: 100,

    // Canvas completamente transparente
    background: null,
  },

  // ==========================================
  // RECORRIDO Y SCROLL
  // ==========================================
  journey: {
    closed: true,
    scrollVhPerStage: 170,
    smoothingSeconds: 0.25,
    jumpDurationSeconds: 1.35,
    showPath: false,
  },

  // ==========================================
  // DISTRIBUCIÓN
  // ==========================================
  layout: {
    navbarDesktopPx: 80,
    navbarTabletPx: 72,
    navbarMobilePx: 64,
    mapTarget: "#map-section",
  },

  // ==========================================
  // RENDIMIENTO
  // ==========================================
  performance: {
    maxPixelRatio: 1.5,
    maxPixelRatioMobile: 1.1,
  },
};
