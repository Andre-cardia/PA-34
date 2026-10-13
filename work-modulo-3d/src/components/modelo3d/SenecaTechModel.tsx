// Nove coleções Blender, sem geometria aeronáutica criada no navegador.
import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { objectBounds } from './glb-runtime'
import type { ThreeEvent } from '@react-three/fiber'
import { camadas3d } from '@/data'
import { LAYERS, LAYER_ORDER, MAX_LABELS } from './config'
import type { LayerId } from './config'
import { useGlbParts, GlbPart, GlbWrap, ModelPartCtx, materialsOf, styleMaterial } from './glb'

export interface AnchorEntry { camada: LayerId; compId: string; objects: THREE.Object3D[] }
export interface LabelInfo { compId: string; camada: LayerId; nome: string; pos: [number, number, number] }
export function anchorBounds(entry: AnchorEntry, target = new THREE.Box3()) {
  target.makeEmpty()
  for (const obj of entry.objects) {
    if (!obj.parent) continue
    target.union(objectBounds(obj))
  }
  return target
}
interface ModelProps {
  visible: Record<LayerId, boolean>; explode: number; xray: boolean; isolate: LayerId | null
  hoveredId: string | null; selectedId: string | null; pulse: { layer: LayerId; key: number } | null
  introDur: number; showLabels: boolean
  onHover: (compId: string | null, camada: LayerId | null) => void
  onSelect: (camada: LayerId, compId: string) => void
  onLabels: (labels: LabelInfo[]) => void
  anchorsRef: React.MutableRefObject<Map<string, AnchorEntry>>
}
const names = new Map(camadas3d.flatMap(l => l.componentes.map(c => [c.id, c.nome] as const)))
export default function SenecaTechModel(props: ModelProps) {
  const parts = useGlbParts()
  const latest = useRef(props); latest.current = props
  const layers = useRef<Partial<Record<LayerId, THREE.Group | null>>>({})
  const sides = useRef<Record<string, THREE.Group | null>>({})
  const clock = useRef({ intro: 0, explode: 0, xray: 0, pulseKey: -1, pulseAge: 99,
    presence: Object.fromEntries(LAYER_ORDER.map(id => [id, props.introDur <= 0 && props.visible[id] ? 1 : 0])) as Record<LayerId, number>, label: 0, signature: '' })
  const invalidate = useThree(s => s.invalidate)
  useEffect(() => {
    // Novo toggle recebe um tick imediato, mesmo quando o canvas demand está parado.
    clock.current.label = .16
    invalidate()
  }, [props.showLabels, invalidate])
  const handlers = useMemo(() => ({
    reg(compId: string, camada: LayerId, obj: THREE.Object3D, mounted: boolean) {
      const map = latest.current.anchorsRef.current
      const entry = map.get(compId) ?? { camada, compId, objects: [] }
      if (mounted) { if (!entry.objects.includes(obj)) entry.objects.push(obj); map.set(compId, entry) }
      else { entry.objects = entry.objects.filter(o => o !== obj); if (!entry.objects.length) map.delete(compId) }
    },
    hov(e: ThreeEvent<PointerEvent>, compId: string | null, camada: LayerId | null) {
      e.stopPropagation()
      if (!compId || (camada && latest.current.visible[camada])) latest.current.onHover(compId, camada)
    },
    sel(e: ThreeEvent<MouseEvent>, camada: LayerId, compId: string) {
      e.stopPropagation()
      if (latest.current.visible[camada]) latest.current.onSelect(camada, compId)
    },
  }), [])
  useFrame((state, raw) => {
    const p = latest.current, a = clock.current, dt = Math.min(raw, .05)
    let active = false
    const approach = (current: number, target: number, speed: number) => {
      if (Math.abs(current - target) < .001) return target
      active = true; return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-speed * dt))
    }
    a.intro += dt
    a.explode = approach(a.explode, p.explode, 8)
    a.xray = approach(a.xray, p.xray ? 1 : 0, 6)
    if (p.pulse && p.pulse.key !== a.pulseKey) { a.pulseKey = p.pulse.key; a.pulseAge = 0 }
    a.pulseAge += dt
    const pulse = a.pulseAge < 1.2 ? Math.sin(a.pulseAge / 1.2 * Math.PI) : 0
    if (pulse) active = true
    for (const id of LAYER_ORDER) {
      const meta = LAYERS[id]
      const intro = p.introDur > 0 ? Math.min(1, a.intro / p.introDur) : 1
      a.presence[id] = approach(a.presence[id], p.visible[id] ? intro : 0, 6)
      const reveal = p.pulse?.layer === id ? pulse : 0
      const g = layers.current[id]
      if (g) {
        g.position.set(...meta.explode.map(v => v * a.explode) as [number, number, number])
        g.visible = a.presence[id] > .005 || reveal > .01
      }
      for (const side of ['esq', 'dir', 'centro']) {
        const group = sides.current[id + side]
        if (group) {
          const sign = side === 'esq' ? -1 : side === 'dir' ? 1 : 0
          group.position.set(id === 'motores' ? (meta.spreadX ?? 0) * sign * a.explode : 0, 0,
            id === 'controles_voo' ? (meta.spreadZ ?? 0) * sign * a.explode : 0)
        }
      }
      const opacity = Math.max(a.presence[id], reveal * .22) * (id === 'exterior' ? 1 - a.xray * .88 : 1) *
        (p.isolate && p.isolate !== id ? .06 : 1)
      for (const part of parts[id]) {
        const highlight = Math.max(p.selectedId === part.comp ? .55 : p.hoveredId === part.comp ? .4 : 0, reveal * .5)
        for (const m of materialsOf(part)) styleMaterial(m, opacity, highlight, meta.color)
      }
    }
    a.label += dt
    if (p.showLabels && a.label > .15) {
      a.label = 0
      const labels: { info: LabelInfo; d: number }[] = []
      for (const [compId, entry] of p.anchorsRef.current) {
        if (!p.visible[entry.camada] || (p.isolate && p.isolate !== entry.camada)) continue
        const box = anchorBounds(entry)
        if (box.isEmpty()) continue
        const pos = box.getCenter(new THREE.Vector3())
        labels.push({ d: pos.distanceTo(state.camera.position), info: { compId, camada: entry.camada,
          nome: names.get(compId) ?? compId, pos: pos.toArray() } })
      }
      const top = labels.sort((a,b) => a.d-b.d).slice(0,MAX_LABELS).map(l => l.info)
      const signature = JSON.stringify(top)
      if (a.signature !== signature) { a.signature = signature; p.onLabels(top) }
    }
    if (!p.showLabels && a.signature) { a.signature = ''; p.onLabels([]) }
    if (active || (p.introDur > a.intro)) state.invalidate()
  })
  return <ModelPartCtx.Provider value={handlers}>
    {LAYER_ORDER.map(id => <group key={id} ref={g => { layers.current[id] = g }}>
      {(['esq','dir','centro'] as const).map(side => <group key={side} ref={g => { sides.current[id + side] = g }}>
        <GlbWrap>{parts[id].filter(p => p.side === side).map(part => <GlbPart key={part.name} mesh={part} camada={id}
          noRay={!props.visible[id] || (!!props.isolate && props.isolate !== id) || (props.xray && id === 'exterior')} />)}</GlbWrap>
      </group>)}
    </group>)}
  </ModelPartCtx.Provider>
}
