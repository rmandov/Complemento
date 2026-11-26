import { onMounted, onBeforeUnmount, ref, watch } from "vue";

import {
  ACESFilmicToneMapping,
  AmbientLight,
  BufferGeometry,
  Color,
  DirectionalLight,
  Group,
  Line,
  LineBasicMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  Quaternion,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";

// Entorno de estudio que produce reflejos metálicos
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

import { useGltfModel, disposeModel } from "./useGltfModel";
import { createJourneyPath, journeyCurveProgress } from "../utils/journeyPath";
import { JOURNEY_CONFIG } from "../config/journeyConfig";

/**
 * Una escena, un renderer y un GLB durante toda la experiencia.
 * scrollProgress es la única fuente de verdad; el render lo interpola visualmente.
 */
export function useJourneyScene(containerRef, scrollProgress, stageCount) {
  const error = ref("");
  const { loadModel } = useGltfModel();
  const config = JOURNEY_CONFIG;
  let renderer;
  let scene;
  let camera;
  let route;
  let track;
  let facing;
  let spin;
  let modelRoot;
  let path;
  let resizeObserver;
  let intersectionObserver;
  let motionQuery;
  let rafId = 0;
  let lastFrameTime = 0;
  let visible = false;
  let destroyed = false;
  let spinningAngle = 0;
  let currentProgress = 0;
  let targetProgress = 0;
  let environmentTarget;
  let elapsedSeconds = 0;
  const point = new Vector3();
  const tangent = new Vector3();
  const forward = new Vector3(...config.model.forwardAxis).normalize();
  const orientation = new Quaternion();
  const rotationCorrection = new Quaternion();
  const mobileQuery = "(max-width: 767px)";

  function getSizeFactor(width) {
    if (width < 768) return config.model.mobileScale;
    if (width < 1024) return config.model.tabletScale;
    return config.model.scale;
  }

  // ==========================================
  // REFLEJOS METÁLICOS DE ESTUDIO
  // ==========================================
  function makeReflectionEnvironment() {
    const pmrem = new PMREMGenerator(renderer);
    const room = new RoomEnvironment();

    try {
      // Genera un entorno de iluminación de estudio
      environmentTarget = pmrem.fromScene(room, 0.04);

      // El entorno se refleja en los materiales
      scene.environment = environmentTarget.texture;

      // Controla la iluminación ambiental de reflejos
      scene.environmentIntensity = config.lighting.environmentIntensity;
    } finally {
      room.dispose();
      pmrem.dispose();
    }
  }

  // ==========================================
  // MATERIAL METÁLICO PERSONALIZADO
  // ==========================================
  function applyMetalPreset(root) {
    // Permite desactivar el efecto cuando
    // sustituyamos la esfera por un tren.
    if (config.model.materialPreset !== "studio-metal") {
      return;
    }

    root.traverse((object) => {
      if (!object.isMesh) return;

      const materials = Array.isArray(object.material) ? object.material : [object.material];

      materials.filter(Boolean).forEach((material) => {
        if (!material.isMeshStandardMaterial && !material.isMeshPhysicalMaterial) {
          return;
        }

        // Identificar partes plateadas del GLB
        const silver = /platead|silver|detail|contorno/i.test(material.name || "");

        // Intensidad de metal
        material.metalness = config.material.metalness;

        // Control de rugosidad por material
        material.roughness = silver
          ? config.material.silverRoughness
          : config.material.champagneRoughness;

        // Intensidad de reflejos
        material.envMapIntensity = config.material.envMapIntensity;

        material.needsUpdate = true;
      });
    });
  }

  function createScene() {
    scene = new Scene();

    // Fondo transparente si no hay color configurado
    scene.background = config.camera.background ? new Color(config.camera.background) : null;
    camera = new PerspectiveCamera(config.camera.fov, 1, config.camera.near, config.camera.far);
    camera.position.set(0, 0, config.camera.distance);
    camera.lookAt(0, 0, 0);

    track = new Group();
    facing = new Group();
    spin = new Group();
    track.add(facing);
    facing.add(spin);
    scene.add(track);

    // ==========================================
    // ILUMINACIÓN CINEMATOGRÁFICA
    // ==========================================

    // Luz ambiental tenue
    scene.add(new AmbientLight(0xffffff, 0.35));

    // Luz principal frontal
    const key = new DirectionalLight(0xffffff, config.lighting.keyIntensity);

    key.position.set(-4, 5, 7);
    scene.add(key);

    // Luz secundaria azulada
    const fill = new DirectionalLight(0xc9ddff, config.lighting.fillIntensity);

    fill.position.set(5, -2, 3);
    scene.add(fill);

    // Contraluz cálido
    const rim = new DirectionalLight(0xffdab3, config.lighting.rimIntensity);

    rim.position.set(1, 3, -5);
    scene.add(rim);

    route = new Line(
      new BufferGeometry(),
      new LineBasicMaterial({ color: "#7f9cdb", opacity: 0.28, transparent: true }),
    );
    route.visible = config.journey.showPath;
    scene.add(route);

    // ==========================================
    // RENDERER DE ALTA CALIDAD
    // ==========================================

    renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });

    // Canvas transparente
    renderer.setClearColor(0x000000, 0);

    // Espacio de color
    renderer.outputColorSpace = SRGBColorSpace;

    // Tone mapping cinematográfico
    renderer.toneMapping = ACESFilmicToneMapping;

    renderer.toneMappingExposure = config.lighting.toneMappingExposure;

    renderer.domElement.setAttribute("aria-hidden", "true");

    containerRef.value.appendChild(renderer.domElement);

    renderer.domElement.addEventListener("webglcontextlost", onContextLost);

    // Crear reflejos después de inicializar renderer
    makeReflectionEnvironment();

    motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    motionQuery.addEventListener("change", onPreferenceChange);

    const angles = config.model.rotationOffsetDegrees.map((a) => (a * Math.PI) / 180);
    // Corrección local: se compone tras orientar el modelo según la tangente.
    const euler = { x: angles[0], y: angles[1], z: angles[2] };
    const qx = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), euler.x);
    const qy = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), euler.y);
    const qz = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), euler.z);
    rotationCorrection.copy(qx).multiply(qy).multiply(qz);
  }

  function onContextLost(event) {
    event.preventDefault();
    error.value = "La escena 3D perdió su contexto WebGL. Recarga la página para restaurarla.";
    visible = false;
    stopLoop();
  }

  function onPreferenceChange() {
    currentProgress = targetProgress;
    updateObjectPosition();
    renderOnce();
    requestLoop();
  }

  function resize() {
    if (destroyed || !renderer || !containerRef.value) return;
    const { width, height } = containerRef.value.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    const isMobile = width < 768;
    const pixelRatioLimit = isMobile
      ? config.performance.maxPixelRatioMobile
      : config.performance.maxPixelRatio;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioLimit));
    renderer.setSize(Math.floor(width), Math.floor(height), false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    const halfHeight = Math.tan((camera.fov * Math.PI) / 360) * config.camera.distance;
    path = createJourneyPath({
      halfWidth: halfHeight * camera.aspect,
      halfHeight,
      mobile: window.matchMedia(mobileQuery).matches || isMobile,
      closed: config.journey.closed,
    });
    route.geometry.dispose();
    route.geometry = new BufferGeometry().setFromPoints(path.getSpacedPoints(180));
    if (modelRoot) modelRoot.scale.setScalar(getSizeFactor(width));
    updateObjectPosition();
    updateCamera();
    renderOnce();
  }

  function updateObjectPosition() {
    if (!path || !track) return;
    const t = journeyCurveProgress(currentProgress, stageCount);
    path.getPointAt(t, point);
    track.position.copy(point);
    if (config.model.followTangent) {
      path.getTangentAt(t, tangent).normalize();
      orientation.setFromUnitVectors(forward, tangent);
      facing.quaternion.copy(orientation).multiply(rotationCorrection);
    } else {
      facing.quaternion.copy(rotationCorrection);
    }
  }

  // ==========================================
  // MOVIMIENTO CINEMATOGRÁFICO DE CÁMARA
  // ==========================================
  function updateCamera() {
    if (!camera) return;

    const reducedMotion = Boolean(motionQuery?.matches);

    const cameraMovement = !reducedMotion && config.model.rotate ? config.motion.cameraDrift : 0;

    const cameraDepth = !reducedMotion && config.model.rotate ? config.motion.cameraDepth : 0;

    const p = currentProgress * Math.PI * 2;

    // Movimiento lateral y vertical
    const x = Math.sin(p) * cameraMovement;

    const y = Math.sin(p * 0.65) * cameraMovement * 0.45;

    // Acercamiento y alejamiento suaves
    const z = config.camera.distance + Math.sin(p * 1.25) * cameraDepth;

    camera.position.set(x, y, z);

    camera.lookAt(0, 0, 0);
  }

  function renderOnce() {
    if (renderer && scene && camera && !destroyed && visible) renderer.render(scene, camera);
  }

  function stopLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    lastFrameTime = 0;
  }

  function requestLoop() {
    if (visible && !rafId && !destroyed && renderer) rafId = requestAnimationFrame(frame);
  }

  function frame(now) {
    rafId = 0;

    if (!visible || destroyed || !renderer) return;

    // Tiempo transcurrido entre fotogramas
    const deltaSeconds = lastFrameTime ? Math.min(0.05, (now - lastFrameTime) / 1000) : 0.016;

    lastFrameTime = now;

    const reducedMotion = Boolean(motionQuery?.matches);

    // ==========================================
    // SUAVIZADO DEL SCROLL
    // ==========================================

    if (reducedMotion || Math.abs(targetProgress - currentProgress) < 0.00005) {
      currentProgress = targetProgress;
    } else {
      const seconds = Math.max(0.001, config.journey.smoothingSeconds);

      currentProgress +=
        (targetProgress - currentProgress) * (1 - Math.exp(-deltaSeconds / seconds));
    }

    // ==========================================
    // ANIMACIÓN CINEMATOGRÁFICA
    // ==========================================

    const isAnimating = config.model.rotate && !reducedMotion && Boolean(modelRoot);

    if (isAnimating) {
      elapsedSeconds += deltaSeconds;

      // Rotación principal
      spinningAngle += deltaSeconds * config.model.rotationSpeed;

      spin.rotation.y = spinningAngle;

      // Inclinación suave en X
      spin.rotation.x = Math.sin(elapsedSeconds * 0.52) * config.motion.tiltAmplitude;

      // Inclinación suave en Z
      spin.rotation.z = Math.sin(elapsedSeconds * 0.43) * config.motion.tiltAmplitude * 0.6;

      // Flotación vertical
      spin.position.y =
        Math.sin(elapsedSeconds * config.motion.floatSpeed) * config.motion.floatAmplitude;
    } else {
      // Sin movimientos propios para el futuro tren
      // o cuando se solicita movimiento reducido.
      spin.rotation.set(0, config.model.rotate ? spinningAngle : 0, 0);

      spin.position.set(0, 0, 0);
    }

    // ==========================================
    // ACTUALIZAR RECORRIDO Y CÁMARA
    // ==========================================

    updateObjectPosition();
    updateCamera();

    // Renderizar escena
    renderer.render(scene, camera);

    // Mantener animación solo cuando sea necesario
    if (Math.abs(targetProgress - currentProgress) > 0.00001 || isAnimating) {
      requestLoop();
    } else {
      lastFrameTime = 0;
    }
  }

  watch(
    scrollProgress,
    (next) => {
      targetProgress = Number(next) || 0;
      if (motionQuery?.matches) currentProgress = targetProgress;
      requestLoop();
    },
    { immediate: true },
  );

  onMounted(async () => {
    if (!containerRef.value) return;
    try {
      createScene();
      // Cargar primero la escena; el texto funciona incluso si el GLB falla.
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(containerRef.value);
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          visible = entries[0]?.isIntersecting || false;
          if (visible) {
            lastFrameTime = 0;
            requestLoop();
          } else stopLoop();
        },
        { threshold: 0 },
      );
      intersectionObserver.observe(containerRef.value);
      resize();

      const { root } = await loadModel(config.model.path);
      if (destroyed) {
        disposeModel(root);
        return;
      }
      modelRoot = root;
      // Aplicar materiales metálicos al GLB cargado
      applyMetalPreset(root);
      spin.add(root);
      modelRoot.scale.setScalar(getSizeFactor(containerRef.value.clientWidth));
      updateObjectPosition();
      requestLoop();
    } catch (loadError) {
      if (destroyed) return;
      console.error("SphereJourney: no se pudo inicializar el modelo 3D", loadError);
      error.value = `No fue posible cargar el modelo 3D (${config.model.path}). Revisa el archivo en public/models/.`;
    }
  });

  onBeforeUnmount(() => {
    destroyed = true;

    // Detener animaciones
    stopLoop();

    // Desconectar observadores
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();

    motionQuery?.removeEventListener("change", onPreferenceChange);

    // Liberar modelo 3D
    if (modelRoot) {
      disposeModel(modelRoot);
      modelRoot = null;
    }

    // Liberar línea del recorrido
    if (route) {
      route.geometry.dispose();
      route.material.dispose();
    }

    // Limpiar escena
    if (scene) {
      scene.environment = null;
      scene.clear();
    }

    // Liberar entorno metálico
    environmentTarget?.dispose();
    environmentTarget = null;

    // Liberar renderer
    if (renderer) {
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);

      renderer.dispose();
      renderer.domElement.remove();
      renderer = null;
    }
  });

  return { error };
}
