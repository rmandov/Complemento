import { onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { createSpherePath } from '../utils/spherePath'

gsap.registerPlugin(ScrollTrigger)

export function useSphereScene() {
  let cleanup = () => {}

  function destroyScene() {
    cleanup()
    cleanup = () => {}
  }

  function initScene({ container, trigger, color = '#3075ed', size = 0.7,
    scrub = 0.65, showPath = true, onProgress = () => {}, onError = () => {} }) {
    destroyScene()
    if (!container || !trigger) return

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    } catch (error) {
      onError('No fue posible mostrar la esfera 3D. Revisa que tu navegador tenga WebGL activado.')
      console.error('ScrollSphere:', error)
      return
    }
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.domElement.setAttribute('aria-hidden', 'true')
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 30)
    camera.position.z = 8

    // Material brillante sin modelos, texturas ni archivos externos.
    const material = new THREE.MeshPhongMaterial({
      color, specular: '#dbeaff', shininess: 100,
    })
    const sphere = new THREE.Group()
    const radius = Math.max(0.05, size)
    sphere.add(new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 48), material))

    // Dos líneas muy delgadas permiten apreciar la rotación de la esfera.
    const seamMaterial = new THREE.MeshBasicMaterial({
      color: '#bedcff', transparent: true, opacity: 0.25,
    })
    for (const angle of [0, Math.PI / 2]) {
      const seam = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 1.002, radius * 0.003, 6, 128),
        seamMaterial,
      )
      seam.rotation.y = angle
      sphere.add(seam)
    }
    scene.add(sphere)
    scene.add(new THREE.AmbientLight('#b9d1ff', 0.8))
    const keyLight = new THREE.DirectionalLight('#ffffff', 2.4)
    keyLight.position.set(-3, 4, 5)
    scene.add(keyLight)
    const rimLight = new THREE.DirectionalLight('#718dff', 1.8)
    rimLight.position.set(4, -2, 1)
    scene.add(rimLight)

    const route = new THREE.Line(new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: '#6688b8', transparent: true, opacity: 0.25 }))
    route.visible = showPath
    scene.add(route)

    let path
    let disposed = false
    let refreshFrame = 0
    const point = new THREE.Vector3()
    const playhead = { progress: 0 }

    function render() {
      if (disposed || !path) return
      path.getPointAt(playhead.progress, point)
      sphere.position.copy(point)
      sphere.rotation.set(playhead.progress * Math.PI * 2,
        playhead.progress * Math.PI * 3, playhead.progress * 0.8)
      renderer.render(scene, camera)
      onProgress(playhead.progress)
    }

    function resize() {
      const { width, height } = container.getBoundingClientRect()
      if (!width || !height || disposed) return
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      const halfHeight = Math.tan(camera.fov * Math.PI / 360) * camera.position.z
      path = createSpherePath(halfHeight * camera.aspect, halfHeight, width < 640)
      sphere.scale.setScalar(width < 640 ? 0.54 : width < 1000 ? 0.8 : 1)
      route.geometry.dispose()
      route.geometry = new THREE.BufferGeometry().setFromPoints(path.getSpacedPoints(240))
      render()
    }

    function scheduleRefresh() {
      cancelAnimationFrame(refreshFrame)
      refreshFrame = requestAnimationFrame(() => {
        if (!disposed) ScrollTrigger.refresh()
      })
    }

    resize()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const animation = gsap.to(playhead, {
      progress: 1,
      ease: 'none',
      // Actualizar aquí hace que el suavizado continúe al detener el scroll.
      onUpdate: render,
      scrollTrigger: {
        trigger,
        start: 'top top',
        end: 'bottom bottom',
        scrub: reducedMotion.matches ? true : Math.max(0, scrub),
        invalidateOnRefresh: true,
      },
    })

    // Ocultar el canvas al salir de Home, aunque RouterView tenga más contenido.
    const visibility = ScrollTrigger.create({
      trigger, start: 'top bottom', end: 'bottom top',
      onToggle: (self) => { container.style.visibility = self.isActive ? 'visible' : 'hidden' },
      onRefresh: (self) => { container.style.visibility = self.isActive ? 'visible' : 'hidden' },
    })
    const viewportObserver = new ResizeObserver(resize)
    viewportObserver.observe(container)
    // Recalcular el rango cuando imágenes o datos cambien la altura de Home.
    const contentObserver = new ResizeObserver(scheduleRefresh)
    contentObserver.observe(trigger)
    trigger.addEventListener('load', scheduleRefresh, true)

    function updateMotionPreference() {
      animation.scrollTrigger.scrubDuration(reducedMotion.matches ? 0 : Math.max(0, scrub))
    }
    reducedMotion.addEventListener('change', updateMotionPreference)
    function handleContextLoss(event) {
      event.preventDefault()
      onError('La escena perdió la conexión con la tarjeta gráfica. Recarga la página para continuar.')
    }
    renderer.domElement.addEventListener('webglcontextlost', handleContextLoss)
    scheduleRefresh()

    cleanup = () => {
      disposed = true
      cancelAnimationFrame(refreshFrame)
      viewportObserver.disconnect()
      contentObserver.disconnect()
      trigger.removeEventListener('load', scheduleRefresh, true)
      reducedMotion.removeEventListener('change', updateMotionPreference)
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLoss)
      animation.scrollTrigger?.kill()
      animation.kill()
      visibility.kill()
      scene.traverse((object) => object.geometry?.dispose())
      material.dispose()
      seamMaterial.dispose()
      route.material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }

  onBeforeUnmount(destroyScene)
  return { initScene, destroyScene }
}
