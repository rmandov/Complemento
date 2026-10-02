import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { createSpherePath } from '../utils/spherePath'

gsap.registerPlugin(ScrollTrigger)

export function createSphereScene({ container, trigger, onProgress, onError }) {
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  } catch {
    onError('No se pudo iniciar la escena 3D. Prueba con un navegador que tenga WebGL y aceleración gráfica activados.')
    return () => {}
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.domElement.setAttribute('aria-hidden', 'true')
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 30)
  camera.position.set(0, 0, 8)
  const pmrem = new THREE.PMREMGenerator(renderer)
  const room = new RoomEnvironment()
  const environment = pmrem.fromScene(room, 0.04)
  scene.environment = environment.texture
  room.dispose()
  pmrem.dispose()

  const sphere = new THREE.Group()
  const material = new THREE.MeshPhysicalMaterial({
    color: '#3075ed', metalness: 0.82, roughness: 0.23,
    clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.4,
  })
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.70, 64, 48), material)
  sphere.add(globe)
  const seamMaterial = new THREE.MeshBasicMaterial({ color: '#a9d2ff', transparent: true, opacity: 0.25 })
  for (const rotation of [0, Math.PI / 2]) {
    const seam = new THREE.Mesh(new THREE.TorusGeometry(0.701, 0.0022, 6, 160), seamMaterial)
    seam.rotation.y = rotation
    sphere.add(seam)
  }
  scene.add(sphere)
  scene.add(new THREE.AmbientLight('#9bbcff', 0.6))
  const key = new THREE.DirectionalLight('#eff7ff', 5)
  key.position.set(-3, 4, 5)
  scene.add(key)
  const rim = new THREE.PointLight('#4b68ff', 50, 20)
  rim.position.set(4, -2, 3)
  scene.add(rim)

  const routeMaterial = new THREE.LineBasicMaterial({ color: '#709edb', transparent: true, opacity: 0.16 })
  const route = new THREE.Line(new THREE.BufferGeometry(), routeMaterial)
  scene.add(route)
  let path
  const playhead = { progress: 0 }
  const point = new THREE.Vector3()
  let disposed = false

  // La esfera se actualiza con el progreso de la animación, no con onUpdate
  // de ScrollTrigger: así el suavizado de scrub también funciona al soltar el scroll.
  function render() {
    if (disposed || !path) return
    path.getPointAt(playhead.progress, point)
    sphere.position.copy(point)
    sphere.rotation.set(playhead.progress * Math.PI * 2, playhead.progress * Math.PI * 3, playhead.progress * 0.8)
    renderer.render(scene, camera)
    onProgress(playhead.progress)
  }
  function resize() {
    const { width, height } = container.getBoundingClientRect()
    if (!width || !height) return
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
    const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z
    path = createSpherePath(halfHeight * camera.aspect, halfHeight, width < 640)
    sphere.scale.setScalar(width < 640 ? 0.54 : width < 1000 ? 0.8 : 1)
    route.geometry.dispose()
    route.geometry = new THREE.BufferGeometry().setFromPoints(path.getSpacedPoints(240))
    render()
  }
  resize()
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const animation = gsap.to(playhead, {
    progress: 1,
    ease: 'none',
    onUpdate: render,
    scrollTrigger: {
      trigger,
      start: 'top top',
      end: 'bottom bottom',
      scrub: reducedMotion.matches ? true : 0.65,
      invalidateOnRefresh: true,
    },
  })
  const observer = new ResizeObserver(resize)
  observer.observe(container)
  function changeMotionPreference() {
    animation.scrollTrigger?.kill()
    animation.scrollTrigger = ScrollTrigger.create({
      trigger, start: 'top top', end: 'bottom bottom',
      animation, scrub: reducedMotion.matches ? true : 0.65,
    })
    ScrollTrigger.refresh()
  }
  reducedMotion.addEventListener('change', changeMotionPreference)
  function contextLost(event) {
    event.preventDefault()
    onError('La escena 3D perdió la conexión con la tarjeta gráfica. Recarga la página para continuar.')
  }
  renderer.domElement.addEventListener('webglcontextlost', contextLost)
  ScrollTrigger.refresh()
  render()

  return () => {
    disposed = true
    observer.disconnect()
    reducedMotion.removeEventListener('change', changeMotionPreference)
    renderer.domElement.removeEventListener('webglcontextlost', contextLost)
    animation.scrollTrigger?.kill()
    animation.kill()
    scene.traverse((object) => object.geometry?.dispose())
    material.dispose()
    seamMaterial.dispose()
    routeMaterial.dispose()
    environment.dispose()
    renderer.dispose()
    renderer.domElement.remove()
  }
}
