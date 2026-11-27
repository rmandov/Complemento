export const JOURNEY_CONFIG = {
  model: {
    // La esfera azul se genera en código: no requiere descargar un GLB.
    // Para un modelo propio cambia type a 'glb' y configura path.
    type: 'sphere',
    path: `${import.meta.env.BASE_URL}models/esfera_ornamental_calada.glb`,
    color: '#3075ed',
    radius: 0.70,
    scale: 1,
    mobileScale: 0.67,
    tabletScale: 0.88,
    rotate: true,
    rotationMode: 'scroll', // 'scroll' o 'time'; rotate: false para un tren.
    rotationSpeed: 0.26,
    followTangent: false,
    forwardAxis: [0, 0, 1],
    rotationOffsetDegrees: [0, 0, 0],
    materialPreset: 'original',
  },
  material: {
    metalness: 0.82,
    roughness: 0.23,
    clearcoat: 1,
    clearcoatRoughness: 0.10,
    envMapIntensity: 1.4,
  },
  lighting: {
    environmentIntensity: 1,
    toneMappingExposure: 1.05,
    keyIntensity: 3,
    fillIntensity: 1.15,
    rimIntensity: 2,
  },
  motion: {
    floatAmplitude: 0,
    floatSpeed: 0.8,
    tiltAmplitude: 0,
    cameraDrift: 0,
    cameraDepth: 0,
  },
  camera: {
    fov: 42,
    distance: 9,
    near: 0.1,
    far: 100,
    // El canvas permanece transparente y la sección HTML tiene fondo blanco.
    background: null,
  },
  journey: {
    closed: true,
    scrollVhPerStage: 170,
    smoothingSeconds: 0.25,
    jumpDurationSeconds: 1.1,
    showPath: true,
  },
  layout: {
    navbarDesktopPx: 80,
    navbarTabletPx: 72,
    navbarMobilePx: 64,
    // RouterLink respeta el base del router del proyecto.
    mapRoute: '/mapa',
  },
  performance: {
    maxPixelRatio: 1.5,
    maxPixelRatioMobile: 1.25,
  },
}
