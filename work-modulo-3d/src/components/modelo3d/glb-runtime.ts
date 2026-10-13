// Helpers de produção sem React, exercitados também pelo GLTFLoader nos testes.
import * as THREE from 'three'
export interface GlbMesh {
  name: string; geometry: THREE.BufferGeometry; material: THREE.Material | THREE.Material[]
  position: THREE.Vector3; quaternion: THREE.Quaternion; scale: THREE.Vector3
  comp: string; side: 'esq' | 'dir' | 'centro'
}
export const materialsOf = (part: GlbMesh) => Array.isArray(part.material) ? part.material : [part.material]
export function collectGlbParts(scene: THREE.Object3D, catalog: ReadonlyMap<string,string>, layers: readonly string[]) {
  const out = Object.fromEntries(layers.map(id => [id, []])) as Record<string, GlbMesh[]>
  const covered = new Set<string>()
  scene.updateMatrixWorld(true)
  scene.traverse(o => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    let owner: THREE.Object3D | null = mesh
    while (owner && !owner.userData.componentId) owner = owner.parent
    const meta = owner?.userData
    if (!meta || !layers.includes(meta.layerId) || catalog.get(meta.componentId) !== meta.layerId ||
      !['esq','dir','centro'].includes(meta.side) || !Array.isArray(meta.anchor) ||
      meta.anchor.length !== 3 || !meta.anchor.every(Number.isFinite)) {
      throw new Error(`Ativo PA-34 inválido: metadados ausentes ou desconhecidos em ${mesh.name}`)
    }
    const clone = (source: THREE.Material) => {
      const m = source.clone(), std = source as THREE.MeshStandardMaterial
      m.userData = { baseOpacity: source.opacity, baseTransparent: source.transparent,
        baseDepthWrite: source.depthWrite, baseEmissive: std.emissive?.clone(), baseEmissiveIntensity: std.emissiveIntensity ?? 0 }
      return m
    }
    const position = new THREE.Vector3(), quaternion = new THREE.Quaternion(), scale = new THREE.Vector3()
    mesh.matrixWorld.decompose(position,quaternion,scale)
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
    out[meta.layerId].push({ name: mesh.uuid, geometry: mesh.geometry,
      material: Array.isArray(mesh.material) ? mesh.material.map(clone) : clone(mesh.material),
      position, quaternion, scale, comp: meta.componentId, side: meta.side })
    covered.add(meta.componentId)
  })
  if (covered.size !== catalog.size) throw new Error('Ativo PA-34 incompleto: cobertura dos componentes inválida')
  return out
}
export function styleMaterial(m: THREE.Material, opacity: number, highlight=0, color='#3FE0FF') {
  m.opacity = m.userData.baseOpacity * opacity
  const transparent = m.userData.baseTransparent || opacity < .999
  if (m.transparent !== transparent) { m.transparent=transparent; m.needsUpdate=true }
  m.depthWrite = m.userData.baseDepthWrite && opacity > .98
  const std = m as THREE.MeshStandardMaterial
  if (std.emissive && m.userData.baseEmissive) {
    std.emissive.copy(m.userData.baseEmissive)
    if (highlight>0) std.emissive.lerp(new THREE.Color(color),highlight)
    std.emissiveIntensity=m.userData.baseEmissiveIntensity+highlight
  }
}
/** Só transforma oito cantos por mesh; os vértices são lidos uma vez no cache local. */
export function objectBounds(obj: THREE.Object3D, target=new THREE.Box3()) {
  target.makeEmpty(); obj.updateWorldMatrix(true,true)
  obj.traverse(o => {
    const mesh=o as THREE.Mesh
    if (!mesh.isMesh) return
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
    if (mesh.geometry.boundingBox) target.union(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld))
  })
  return target
}
