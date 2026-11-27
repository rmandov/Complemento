import {
  Group, Mesh, SphereGeometry, MeshPhysicalMaterial,
  MeshBasicMaterial, TorusGeometry,
} from 'three'

/** La esfera azul del prototipo; no tiene dependencias de archivos externos. */
export function createBlueSphere(config) {
  const sphere = new Group()
  const radius = config.model.radius
  const material = new MeshPhysicalMaterial({
    color: config.model.color,
    metalness: config.material.metalness,
    roughness: config.material.roughness,
    clearcoat: config.material.clearcoat,
    clearcoatRoughness: config.material.clearcoatRoughness,
    envMapIntensity: config.material.envMapIntensity,
  })
  sphere.add(new Mesh(new SphereGeometry(radius, 64, 48), material))

  // Detalles discretos para que se perciba la rotación con el scroll.
  const seamMaterial = new MeshBasicMaterial({
    color: '#a9d2ff', transparent: true, opacity: 0.25,
  })
  for (const angle of [0, Math.PI / 2]) {
    const seam = new Mesh(
      new TorusGeometry(radius * 1.002, radius * 0.003, 6, 160),
      seamMaterial,
    )
    seam.rotation.y = angle
    sphere.add(seam)
  }
  return sphere
}
