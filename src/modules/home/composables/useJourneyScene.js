import { onMounted, onBeforeUnmount, ref, watch } from "vue";
import {
  AmbientLight,
  BufferGeometry,
  Color,
  DirectionalLight,
  Group,
  Line,
  LineBasicMaterial,
  PerspectiveCamera,
  Quaternion,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
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

    scene.add(new AmbientLight("#ffffff", 1.25));
    const key = new DirectionalLight("#ffffff", 2.35);
    key.position.set(-3, 5, 6);
    scene.add(key);
    const fill = new DirectionalLight("#84a9fd", 1.35);
    fill.position.set(4, -3, 3);
    scene.add(fill);

    route = new Line(
      new BufferGeometry(),
      new LineBasicMaterial({ color: "#7f9cdb", opacity: 0.28, transparent: true }),
    );
    route.visible = config.journey.showPath;
    scene.add(route);

    renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });

    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.domElement.setAttribute("aria-hidden", "true");
    containerRef.value.appendChild(renderer.domElement);
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
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
    const deltaSeconds = lastFrameTime ? Math.min(0.05, (now - lastFrameTime) / 1000) : 0.016;
    lastFrameTime = now;
    const reducedMotion = motionQuery?.matches;
    const remaining = Math.abs(targetProgress - currentProgress);
    if (reducedMotion || remaining < 0.00005) {
      currentProgress = targetProgress;
    } else {
      const seconds = Math.max(0.001, config.journey.smoothingSeconds);
      currentProgress +=
        (targetProgress - currentProgress) * (1 - Math.exp(-deltaSeconds / seconds));
    }
    if (config.model.rotate && !reducedMotion && modelRoot) {
      spinningAngle += deltaSeconds * config.model.rotationSpeed;
      spin.rotation.y = spinningAngle;
    }
    updateObjectPosition();
    renderer.render(scene, camera);
    if (
      Math.abs(targetProgress - currentProgress) > 0.00001 ||
      (config.model.rotate && !reducedMotion && modelRoot)
    ) {
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
    stopLoop();
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    motionQuery?.removeEventListener("change", onPreferenceChange);
    if (renderer) {
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      renderer.dispose();
      renderer.domElement.remove();
      renderer = null;
    }
    if (modelRoot) {
      disposeModel(modelRoot);
      modelRoot = null;
    }
    if (route) {
      route.geometry.dispose();
      route.material.dispose();
    }
    scene?.clear();
  });

  return { error };
}
