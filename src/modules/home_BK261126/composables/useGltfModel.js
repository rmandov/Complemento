import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { Box3, Group, Vector3 } from 'three'

/** No se crea SphereGeometry: todo el modelo proviene del archivo .glb. */
export function useGltfModel() {
  const loader = new GLTFLoader()

  async function loadModel(path) {
    const gltf = await loader.loadAsync(path)
    const root = new Group()
    const normalizer = new Group()
    root.add(normalizer)
    normalizer.add(gltf.scene)

    // Centrar el GLB y normalizarlo al diámetro aproximado de 1.8 unidades.
    // Así se puede sustituir esfera por tren sin reajustar todo el render.
    const bbox = new Box3().setFromObject(gltf.scene)
    const size = bbox.getSize(new Vector3())
    const center = bbox.getCenter(new Vector3())
    const maxDimension = Math.max(size.x, size.y, size.z)
    if (maxDimension > 0) {
      gltf.scene.position.sub(center)
      normalizer.scale.setScalar(1.8 / maxDimension)
    }
    return { root, animations: gltf.animations }
  }

  return { loadModel }
}

/** Libera recursos de un GLB sin duplicar la liberación de recursos compartidos. */
export function disposeModel(root) {
  const geometries = new Set()
  const materials = new Set()
  const textures = new Set()
  root?.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry)
    const objectMaterials = object.material
      ? (Array.isArray(object.material) ? object.material : [object.material])
      : []
    objectMaterials.forEach((material) => {
      materials.add(material)
      Object.values(material).forEach((value) => {
        if (value?.isTexture) textures.add(value)
      })
    })
  })
  geometries.forEach((geometry) => geometry.dispose())
  textures.forEach((texture) => texture.dispose())
  materials.forEach((material) => material.dispose())
}
