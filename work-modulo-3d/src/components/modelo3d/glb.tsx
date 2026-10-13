// Geometria exclusivamente Blender; contrato explícito em extras glTF.
import { useMemo, useContext, createContext, useLayoutEffect, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { camadas3d } from '@/data'
import { LAYER_ORDER } from './config'
import type { LayerId } from './config'
import { collectGlbParts, materialsOf } from './glb-runtime'
import type { GlbMesh } from './glb-runtime'
export { materialsOf, styleMaterial } from './glb-runtime'
export type { GlbMesh } from './glb-runtime'
export const GLB_URL = `${import.meta.env.BASE_URL}models/pa34-camadas.glb`
export const GLB_SCALE = 4.7 / 5.93994
export const GLB_Y = -1.1
const catalog = new Map(camadas3d.flatMap(l => l.componentes.map(c => [c.id, l.id] as const)))
export function useGlbParts(): Record<LayerId, GlbMesh[]> {
  const gltf = useGLTF(GLB_URL, false)
  // collectGlbParts resolve userData.componentId herdado e clona materiais por instância.
  const parts = useMemo(() => collectGlbParts(gltf.scene, catalog, LAYER_ORDER), [gltf])
  useEffect(() => () => {
    for (const layer of Object.values(parts)) for (const part of layer) for (const m of materialsOf(part)) m.dispose()
  }, [parts])
  return parts
}
export interface PartHandlers {
  reg: (compId: string, camada: LayerId, obj: THREE.Object3D, mounted: boolean) => void
  hov: (e: ThreeEvent<PointerEvent>, compId: string | null, camada: LayerId | null) => void
  sel: (e: ThreeEvent<MouseEvent>, camada: LayerId, compId: string) => void
}
export const ModelPartCtx = createContext<PartHandlers>({ reg: () => undefined, hov: () => undefined, sel: () => undefined })
export function GlbPart({ mesh, camada, noRay }: { mesh: GlbMesh; camada: LayerId; noRay?: boolean }) {
  const { reg, hov, sel } = useContext(ModelPartCtx)
  const ref = useRef<THREE.Mesh>(null)
  useLayoutEffect(() => {
    const o = ref.current
    if (!o) return
    reg(mesh.comp, camada, o, true)
    return () => reg(mesh.comp, camada, o, false)
  }, [reg, mesh, camada])
  return <mesh ref={ref} geometry={mesh.geometry} material={mesh.material} position={mesh.position}
    quaternion={mesh.quaternion} scale={mesh.scale} dispose={null}
    userData={{ componenteId: mesh.comp, camada }} raycast={noRay ? () => null : THREE.Mesh.prototype.raycast}
    onPointerOver={e => hov(e, mesh.comp, camada)} onPointerOut={e => hov(e, null, null)}
    onClick={e => sel(e, camada, mesh.comp)} />
}
export function GlbWrap({ children }: { children: React.ReactNode }) {
  return <group rotation={[0, Math.PI, 0]} scale={GLB_SCALE} position={[0, GLB_Y, 0]}>{children}</group>
}
useGLTF.preload(GLB_URL, false)
