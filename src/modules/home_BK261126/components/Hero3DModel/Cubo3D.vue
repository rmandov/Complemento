<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
  Box3,
  Vector3,
  Clock,
  SRGBColorSpace
} from 'three'

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const container = ref(null)
const errorCarga = ref('')

let scene
let camera
let renderer
let controls
let cubo
let animationId
let resizeObserver

const clock = new Clock()

onMounted(() => {
  // ==========================================
  // 1. ESCENA
  // ==========================================
  scene = new Scene()

  const width = container.value.clientWidth
  const height = container.value.clientHeight

  // ==========================================
  // 2. CÁMARA
  // ==========================================
  camera = new PerspectiveCamera(
    60,
    width / height,
    0.01,
    1000
  )

  camera.position.set(4, 3, 6)

  // ==========================================
  // 3. RENDERIZADOR
  // ==========================================
  renderer = new WebGLRenderer({
    antialias: true,
    alpha: true
  })

  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = SRGBColorSpace

  container.value.appendChild(renderer.domElement)

  // ==========================================
  // 4. ILUMINACIÓN
  // ==========================================
  const ambientLight = new AmbientLight(0xffffff, 1.5)
  scene.add(ambientLight)

  const directionalLight = new DirectionalLight(0xffffff, 3)
  directionalLight.position.set(5, 8, 5)
  scene.add(directionalLight)

  // ==========================================
  // 5. CONTROLES DEL MOUSE
  // ==========================================
  controls = new OrbitControls(camera, renderer.domElement)

  controls.enableDamping = true
  controls.dampingFactor = 0.05

  controls.enableZoom = true
  controls.enableRotate = true

  controls.target.set(0, 0, 0)
  controls.update()

  // ==========================================
  // 6. CARGAR MODELO BLENDER
  // ==========================================
  const loader = new GLTFLoader()

  const rutaModelo = `${import.meta.env.BASE_URL}models/paisaje_montanas_y_rio.glb`

  console.log('Cargando modelo desde:', rutaModelo)

  loader.load(
    rutaModelo,

    (gltf) => {
      console.log('Modelo cargado correctamente:', gltf)

      cubo = gltf.scene

      // Calcular dimensiones
      const box = new Box3().setFromObject(cubo)

      if (box.isEmpty()) {
        errorCarga.value = 'El modelo no contiene geometría visible.'
        return
      }

      const center = box.getCenter(new Vector3())
      const size = box.getSize(new Vector3())

      // Centrar modelo
      cubo.position.sub(center)

      // Escalar para visualizarlo correctamente
      const maxDimension = Math.max(size.x, size.y, size.z)

      if (maxDimension > 0) {
        const escala = 3 / maxDimension

        cubo.scale.setScalar(escala)
        cubo.position.multiplyScalar(escala)
      }

      scene.add(cubo)

      console.log('Cubo agregado a la escena')
    },

    (progress) => {
      if (progress.total > 0) {
        const porcentaje = (
          (progress.loaded / progress.total) * 100
        ).toFixed(0)

        console.log(`Cargando: ${porcentaje}%`)
      }
    },

    (error) => {
      console.error('Error al cargar el GLB:', error)
      errorCarga.value = `No se pudo cargar el modelo: ${rutaModelo}`
    }
  )

  // ==========================================
  // 7. RESPONSIVE
  // ==========================================
  resizeObserver = new ResizeObserver(() => {
    if (!container.value) return

    const width = container.value.clientWidth
    const height = container.value.clientHeight

    if (!width || !height) return

    camera.aspect = width / height
    camera.updateProjectionMatrix()

    renderer.setSize(width, height)
  })

  resizeObserver.observe(container.value)

  // ==========================================
  // 8. ANIMACIÓN
  // ==========================================
  const animate = () => {
    animationId = requestAnimationFrame(animate)

    /* const delta = clock.getDelta()

    if (cubo) {
      cubo.rotation.y += delta * 0.2
    } */

    controls.update()
    renderer.render(scene, camera)
  }

  animate()
})

// ==========================================
// 9. LIMPIEZA
// ==========================================
onUnmounted(() => {
  cancelAnimationFrame(animationId)

  resizeObserver?.disconnect()
  controls?.dispose()

  scene?.traverse((object) => {
    if (object.isMesh) {
      object.geometry?.dispose()

      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material]

      materials.forEach((material) => material?.dispose())
    }
  })

  renderer?.dispose()
  renderer?.domElement.remove()
})
</script>

<template>
  <div class="cubo-wrapper">
    <div ref="container" class="cubo-container"></div>

    <p v-if="errorCarga" class="error">
      {{ errorCarga }}
    </p>
  </div>
</template>

<style scoped>
.cubo-wrapper {
  width: 100%;
  position: relative;
}

.cubo-container {
  width: 100%;
  height: 600px;
  overflow: hidden;
  touch-action: none;
}

.error {
  color: #dc2626;
  text-align: center;
  padding: 1rem;
}
</style>
