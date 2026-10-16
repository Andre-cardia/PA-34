// ModelCanvas — único <Canvas> do módulo (guardrail §11): frameloop="demand",
// DPR ≤ 1.75, 1 directional + ambient, sem pós-processamento. Grid blueprint,
// contact shadow, OrbitControls (auto-rot pausável), rótulos com leader lines,
// crosshair técnico customizado e HUD de leitura.

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Grid, Html, Line, OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import SenecaTechModel, { anchorBounds } from './SenecaTechModel'
import { objectBounds } from './glb-runtime'
type CameraMotion = { tween: boolean; generation: number }
import type { AnchorEntry, LabelInfo } from './SenecaTechModel'
import { camadas3d } from '@/data'
import { AUTOROT_IDLE_MS, DEFAULT_VIEW, LAYERS, ZOOM_MAX, ZOOM_MIN } from './config'
import type { LayerId, ViewPreset } from './config'
import { asset } from '@/lib/asset'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface ViewRequest {
  preset: ViewPreset
  key: number
}

export interface FocusRequest {
  compId: string
  key: number
}

interface CanvasProps {
  visible: Record<LayerId, boolean>
  explode: number
  xray: boolean
  isolate: LayerId | null
  selectedId: string | null
  pulse: { layer: LayerId; key: number } | null
  introDur: number
  showLabels: boolean
  autoRotate: boolean
  viewRequest: ViewRequest | null
  focusRequest: FocusRequest | null
  onSelectComponent: (camada: LayerId, compId: string) => void
  onClearSelection: () => void
  hud: { visibleCount: number; explodePct: number }
}

// nomes/camadas p/ hover label
const COMP_LOOKUP: Record<string, { nome: string; camada: LayerId }> = {}
for (const c of camadas3d) for (const comp of c.componentes) COMP_LOOKUP[comp.id] = { nome: comp.nome, camada: c.id as LayerId }

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))

// ---------------------------------------------------------------------------
// CameraRig — tweens de câmera (presets / focus move) + keep-alive do auto-rot
// ---------------------------------------------------------------------------

interface CameraGoal {
  startPos: THREE.Vector3
  endPos: THREE.Vector3
  startTgt: THREE.Vector3
  endTgt: THREE.Vector3
  t: number
  dur: number
  follow?: AnchorEntry
  stableFor: number
}

function CameraRig({
  viewRequest,
  focusRequest,
  autoRotateActive,
  anchorsRef,
  motion,
}: {
  motion: CameraMotion
  viewRequest: ViewRequest | null
  focusRequest: FocusRequest | null
  autoRotateActive: boolean
  anchorsRef: React.MutableRefObject<Map<string, AnchorEntry>>
}) {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null
  const goal = useRef<CameraGoal | null>(null)
  const invalidate = useThree((s) => s.invalidate)

  const mkGoal = useCallback(
    (endPos: THREE.Vector3, endTgt: THREE.Vector3, dur = 1, follow?: AnchorEntry) => {
      if (!controls) return
      motion.tween = true
      goal.current = {
        startPos: camera.position.clone(),
        endPos,
        startTgt: controls.target.clone(),
        endTgt,
        t: 0,
        dur,
        follow,
        stableFor: 0,
      }
      invalidate()
    },
    [camera, controls, invalidate, motion],
  )

  // Limpar seleção cancela seu foco, mas um novo preset sem seleção não o cancela.
  useEffect(() => {
    if (focusRequest) return
    goal.current = null
    motion.tween = false
    motion.generation++
  }, [focusRequest, motion])

  // preset de vista
  useEffect(() => {
    if (!viewRequest) return
    motion.generation++ // invalida foco pendente de uma requisição anterior
    mkGoal(new THREE.Vector3(...viewRequest.preset.position), new THREE.Vector3(...viewRequest.preset.target), 1)
  }, [viewRequest, mkGoal, motion])

  // focus move: câmera tweena até o componente selecionado (1s, §5.2).
  // O GLB pode carregar depois do deep-link em redes lentas; aguarda a âncora.
  // A troca de seleção/desmontagem cancela a espera, sem prazo de frames arbitrário.
  useEffect(() => {
    // Dependências podem remontar quando OrbitControls fica pronto após o GLB.
    // Um foco antigo nunca deve substituir um preset solicitado mais recentemente.
    if (!focusRequest || (viewRequest && viewRequest.key > focusRequest.key)) return
    goal.current = null
    motion.tween = false
    const generation = ++motion.generation
    let rafId = 0
    const focusWhenReady = () => {
      if (generation !== motion.generation) return
      const entry = anchorsRef.current.get(focusRequest.compId)
      if (!entry) {
        rafId = requestAnimationFrame(focusWhenReady)
        return
      }
      const bounds = anchorBounds(entry)
      const anchor = bounds.getCenter(new THREE.Vector3())
      if (bounds.isEmpty()) {
        rafId = requestAnimationFrame(focusWhenReady)
        return
      }
      // Centro dos limites geométricos, nunca média de pivôs.
      const dir = anchor.clone().sub(new THREE.Vector3(0, 0, 0))
      if (dir.lengthSq() < 0.4) dir.set(1, 0.45, 0.8)
      dir.normalize()
      const pc = camera as THREE.PerspectiveCamera
      const angle = Math.min(THREE.MathUtils.degToRad(pc.fov) / 2, Math.atan(Math.tan(THREE.MathUtils.degToRad(pc.fov) / 2) * pc.aspect))
      const dist = Math.max(1.5, bounds.getBoundingSphere(new THREE.Sphere()).radius / Math.sin(angle) * 1.15)
      const endPos = anchor.clone().add(dir.multiplyScalar(dist)).add(new THREE.Vector3(0, 0.55, 0))
      mkGoal(endPos, anchor, 1, entry)
    }
    rafId = requestAnimationFrame(focusWhenReady)
    return () => cancelAnimationFrame(rafId)
  }, [focusRequest, viewRequest, anchorsRef, mkGoal, motion])

  // interação do usuário cancela tween em andamento
  useEffect(() => {
    if (!controls) return
    const cancel = () => {
      goal.current = null
      motion.tween = false
      motion.generation++
    }
    controls.addEventListener('start', cancel)
    return () => controls.removeEventListener('start', cancel)
  }, [controls, motion])

  useFrame((_, dt) => {
    const g = goal.current
    if (g && controls) {
      // A explosão ainda pode mover a peça enquanto o foco interpola.
      // Só acompanhar durante este goal: gesto/preset limpa/substitui a referência.
      if (g.follow) {
        const bounds = anchorBounds(g.follow)
        if (!bounds.isEmpty()) {
          const center = bounds.getCenter(new THREE.Vector3())
          const delta = center.clone().sub(g.endTgt)
          g.stableFor = delta.lengthSq() < 1e-8 ? g.stableFor + dt : 0
          g.endPos.add(delta)
          g.endTgt.copy(center)
        }
      }
      g.t = Math.min(1, g.t + dt / g.dur)
      const e = easeOutExpo(g.t)
      camera.position.lerpVectors(g.startPos, g.endPos, e)
      controls.target.lerpVectors(g.startTgt, g.endTgt, e)
      controls.update()
      if (g.t >= 1 && (!g.follow || g.stableFor >= .15)) { goal.current = null; motion.tween = false }
      invalidate()
    }
    // auto-rotação: mantém o frameloop demand vivo enquanto ativa
    if (autoRotateActive) invalidate()
  })

  return null
}

// Reenquadramento conservador durante explosão/retorno e resize, sem cortar peças.
function FitCurrentBounds({ anchorsRef, visible, explode, isolate, viewRequest, focusRequest, motion }: {
  motion: CameraMotion
  anchorsRef: React.MutableRefObject<Map<string, AnchorEntry>>
  visible: Record<LayerId, boolean>; explode: number; isolate: LayerId | null
  viewRequest: ViewRequest | null; focusRequest: FocusRequest | null
}) {
  const { camera, controls, size, invalidate } = useThree()
  const remaining = useRef(3)
  const focused = useRef(false)
  const generation = useRef(0)
  useEffect(() => {
    remaining.current = Object.values(visible).some(Boolean) ? 2 : 0
    focused.current = false; generation.current = motion.generation
    invalidate()
  }, [visible, explode, isolate, viewRequest, size.width, size.height, invalidate, motion])
  useEffect(() => { if (focusRequest) { focused.current = true; remaining.current = 0 } }, [focusRequest])
  useFrame((_, dt) => {
    const orbit = controls as OrbitControlsImpl | null
    if (generation.current !== motion.generation) remaining.current = 0
    if (!orbit || focused.current || remaining.current <= 0 || motion.tween) return
    if (!Object.values(visible).some(Boolean)) { remaining.current = 0; return }
    const bounds = new THREE.Box3(), boxes: THREE.Box3[] = []
    for (const entry of anchorsRef.current.values()) {
      if (!visible[entry.camada]) continue
      for (const obj of entry.objects) {
        if (!obj.parent) continue
        const box = objectBounds(obj)
        if (!box.isEmpty()) { bounds.union(box); boxes.push(box) }
      }
    }
    // O commit do GLB invalida a cena quando suas âncoras ficam disponíveis.
    if (bounds.isEmpty()) return
    remaining.current -= Math.min(dt, .1)
    const center = bounds.getCenter(new THREE.Vector3())
    const pc = camera as THREE.PerspectiveCamera
    const tanV = Math.tan(THREE.MathUtils.degToRad(pc.fov) / 2)
    const dir = camera.position.clone().sub(orbit.target).normalize()
    const right = new THREE.Vector3().crossVectors(camera.up, dir).normalize()
    const up = new THREE.Vector3().crossVectors(dir, right).normalize()
    let distance = 2
    // Limites por mesh projetados na orientação atual; esfera global desperdiça área.
    for (const box of boxes) {
      for (const x of [box.min.x,box.max.x]) for (const y of [box.min.y,box.max.y]) for (const z of [box.min.z,box.max.z]) {
        const offset = new THREE.Vector3(x,y,z).sub(center)
        distance = Math.max(distance, offset.dot(dir) + Math.max(Math.abs(offset.dot(right)) / (tanV * pc.aspect), Math.abs(offset.dot(up)) / tanV) * 1.2)
      }
    }
    camera.position.copy(center).addScaledVector(dir, distance)
    orbit.target.copy(center); orbit.update(); invalidate()
  })
  return null
}

// ---------------------------------------------------------------------------
// Rótulos — projeção em pixels: tamanho constante ao orbitar/aproximar a câmera.
// Não usar transform/distanceFactor: escalavam as etiquetas junto com a cena.
// ---------------------------------------------------------------------------

function Labels({ labels }: { labels: LabelInfo[] }) {
  const elements = useRef(new Map<string, HTMLDivElement>())
  const { gl } = useThree()
  // Etiquetas próximas disputam espaço: priorizar a ordem de proximidade,
  // em vez de empilhar caixas sobre o mesmo trecho da aeronave.
  useFrame(() => {
    const canvas = gl.domElement.getBoundingClientRect()
    const occupied: DOMRect[] = []
    for (const label of labels) {
      const element = elements.current.get(label.compId)
      if (!element) continue
      const rect = element.getBoundingClientRect()
      const fits = rect.left >= canvas.left && rect.right <= canvas.right &&
        rect.top >= canvas.top && rect.bottom <= canvas.bottom
      const overlaps = occupied.some(other => rect.left < other.right + 6 && rect.right + 6 > other.left &&
        rect.top < other.bottom + 6 && rect.bottom + 6 > other.top)
      const show = fits && !overlaps
      element.style.visibility = show ? 'visible' : 'hidden'
      element.setAttribute('aria-hidden', String(!show))
      if (show) occupied.push(rect)
    }
  })
  if (labels.length === 0) return null
  return (
    <group>
      {labels.map((l) => {
        const top: [number, number, number] = [l.pos[0], l.pos[1] + 0.5, l.pos[2]]
        const color = LAYERS[l.camada].color
        return (
          <group key={l.compId}>
            <Line points={[l.pos, top]} color="#3FE0FF" transparent opacity={0.6} lineWidth={1} />
            <Html position={top} center style={{ pointerEvents: 'none' }} zIndexRange={[30, 10]}>
              <div
                data-model-label={l.compId}
                ref={element => { if (element) elements.current.set(l.compId, element); else elements.current.delete(l.compId) }}
                className="w-max max-w-[156px] whitespace-normal break-words rounded-sm border bg-abyss/90 px-1.5 py-1 font-mono text-[10px] leading-[13px] uppercase tracking-[0.04em] text-center"
                style={{ borderColor: color, color }}
              >
                {l.nome}
              </div>
            </Html>
          </group>
        )
      })}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Plataforma de cotas (anel decorativo sob o avião — traço blueprint)
// ---------------------------------------------------------------------------

function usePlatformGeo() {
  return useMemo(() => {
    const verts: number[] = []
    const R1 = 5.0
    const R2 = 5.6
    const seg = 96
    for (let i = 0; i < seg; i++) {
      const a1 = (i / seg) * Math.PI * 2
      const a2 = ((i + 1) / seg) * Math.PI * 2
      if (i % 2 === 0) verts.push(Math.cos(a1) * R2, 0, Math.sin(a1) * R2, Math.cos(a2) * R2, 0, Math.sin(a2) * R2)
      verts.push(Math.cos(a1) * R1, 0, Math.sin(a1) * R1, Math.cos(a2) * R1, 0, Math.sin(a2) * R1)
      if (i % 6 === 0) verts.push(Math.cos(a1) * R1, 0, Math.sin(a1) * R1, Math.cos(a1) * (R1 + 0.25), 0, Math.sin(a1) * (R1 + 0.25))
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    return g
  }, [])
}

// ---------------------------------------------------------------------------
// Canvas
// ---------------------------------------------------------------------------

export default function ModelCanvas(props: CanvasProps) {
  const { visible, explode, xray, isolate, selectedId, pulse, introDur, showLabels, autoRotate, viewRequest, focusRequest, onSelectComponent, onClearSelection, hud } = props

  const [hovered, setHovered] = useState<{ id: string; camada: LayerId } | null>(null)
  const [labels, setLabels] = useState<LabelInfo[]>([])
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  const [interacting, setInteracting] = useState(false)
  const anchorsRef = useRef<Map<string, AnchorEntry>>(new Map())
  const motion = useMemo<CameraMotion>(() => ({ tween: false, generation: 0 }), [])
  const idleTimer = useRef<number | null>(null)
  const wrap = useRef<HTMLDivElement>(null)

  const onHover = useCallback((compId: string | null, camada: LayerId | null) => {
    setHovered(compId && camada ? { id: compId, camada } : null)
  }, [])
  const onSelect = useCallback(
    (camada: LayerId, compId: string) => onSelectComponent(camada, compId),
    [onSelectComponent],
  )
  const onLabels = useCallback((l: LabelInfo[]) => setLabels(l), [])

  // auto-rot: pausa ao interagir, retoma 6s depois (§7)
  const handleStart = useCallback(() => {
    setInteracting(true)
    if (idleTimer.current) window.clearTimeout(idleTimer.current)
  }, [])
  const handleEnd = useCallback(() => {
    if (idleTimer.current) window.clearTimeout(idleTimer.current)
    idleTimer.current = window.setTimeout(() => setInteracting(false), AUTOROT_IDLE_MS)
  }, [])
  useEffect(() => () => {
    if (idleTimer.current) window.clearTimeout(idleTimer.current)
  }, [])

  const autoRotateActive = autoRotate && !interacting
  const hoverInfo = hovered ? COMP_LOOKUP[hovered.id] : null
  const platformGeo = usePlatformGeo()

  const mode = isolate ? 'ISOLADO' : xray ? 'RAIO-X' : hud.explodePct > 2 ? `EXPLODIDO ${hud.explodePct}%` : 'MONTADO'

  return (
    <div
      ref={wrap}
      className="relative h-full w-full overflow-hidden bg-abyss [@media(pointer:fine)]:cursor-none"
      onPointerMove={(e) => {
        const r = wrap.current?.getBoundingClientRect()
        if (r) setCursor({ x: e.clientX - r.left, y: e.clientY - r.top })
      }}
      onPointerLeave={() => setCursor(null)}
    >
      {/* hangar-ambience a 8% sob o canvas (§1) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.08]"
        style={{ backgroundImage: `url(${asset('/hangar-ambience.jpg')})` }}
      />
      <Canvas
        frameloop="demand"
        dpr={[1, 1.75]}
        camera={{ position: DEFAULT_VIEW.position, fov: 34, near: 0.1, far: 120 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ position: 'absolute', inset: 0 }}
        onPointerMissed={(e) => {
          if (e.type === 'dblclick') onClearSelection()
        }}
      >
        {/* guardrail §11: key + fill + ambient + contact shadow (sem pós) */}
        <hemisphereLight args={['#edf3f9', '#566474', 1.5]} />
        <directionalLight position={[6, 8, 4]} intensity={2.5} color="#ffffff" />
        <directionalLight position={[-7, 2.5, -5]} intensity={1.2} color="#dce7f2" />
        <Suspense fallback={<Html center><div role="status" className="whitespace-nowrap bg-abyss/95 p-4 font-mono text-xs text-cyan">CARREGANDO MALHA…</div></Html>}>
          <SenecaTechModel
            visible={visible}
            explode={explode}
            xray={xray}
            isolate={isolate}
            hoveredId={hovered?.id ?? null}
            selectedId={selectedId}
            pulse={pulse}
            introDur={introDur}
            showLabels={showLabels}
            onHover={onHover}
            onSelect={onSelect}
            onLabels={onLabels}
            anchorsRef={anchorsRef}
          />
          <Labels labels={labels} />
        </Suspense>
        {/* grid blueprint infinito no "chão" */}
        <Grid
          position={[0, -1.78, 0]}
          args={[40, 40]}
          cellSize={0.5}
          cellThickness={0.6}
          cellColor="#1B4B5C"
          sectionSize={2.5}
          sectionThickness={1}
          sectionColor="#3FE0FF"
          fadeDistance={26}
          fadeStrength={1.4}
          infiniteGrid
        />
        <lineSegments geometry={platformGeo} position={[0, -1.77, 0]}>
          <lineBasicMaterial color="#1B4B5C" transparent opacity={0.9} />
        </lineSegments>
        <ContactShadows position={[0, -1.76, 0]} opacity={0.55} scale={16} blur={2.2} far={4} resolution={512} color="#02040A" frames={Infinity} />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={ZOOM_MIN}
          maxDistance={ZOOM_MAX}
          minPolarAngle={THREE.MathUtils.degToRad(15)}
          maxPolarAngle={THREE.MathUtils.degToRad(165)}
          autoRotate={autoRotateActive}
          autoRotateSpeed={0.5}
          onStart={handleStart}
          onEnd={handleEnd}
        />
        <CameraRig motion={motion} viewRequest={viewRequest} focusRequest={focusRequest} autoRotateActive={autoRotateActive} anchorsRef={anchorsRef} />
        <FitCurrentBounds motion={motion} anchorsRef={anchorsRef} visible={visible} explode={explode} isolate={isolate} viewRequest={viewRequest} focusRequest={focusRequest} />
      </Canvas>

      {/* HUD: leitura de modo (canto superior esquerdo) */}
      <div className="pointer-events-none absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
        <span className="text-cyan">VISTA: {mode}</span>
        <span className="mx-2 text-hairline">|</span>
        CAMADAS {hud.visibleCount}/9
        <span className="mx-2 text-hairline">|</span>
        EXPLOSÃO {hud.explodePct}%
        <div className="mt-1 max-w-[260px] text-[9px] tracking-normal">Representação didática · interiores esquemáticos · não certificado</div>
      </div>

      {/* crosshair técnico customizado (mira cyan 20px + ponto; anel no hover) */}
      {cursor && (
        <div className="pointer-events-none absolute inset-0 hidden [@media(pointer:fine)]:block" aria-hidden="true">
          <div className="absolute" style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}>
            <svg width="40" height="40" viewBox="0 0 40 40" className="-translate-x-1/2 -translate-y-1/2 overflow-visible">
              <line x1="20" y1="10" x2="20" y2="17" stroke="#3FE0FF" strokeWidth="1.2" />
              <line x1="20" y1="23" x2="20" y2="30" stroke="#3FE0FF" strokeWidth="1.2" />
              <line x1="10" y1="20" x2="17" y2="20" stroke="#3FE0FF" strokeWidth="1.2" />
              <line x1="23" y1="20" x2="30" y2="20" stroke="#3FE0FF" strokeWidth="1.2" />
              <circle cx="20" cy="20" r="1.4" fill="#3FE0FF" />
              {hovered && <circle cx="20" cy="20" r="9" fill="none" stroke={LAYERS[hovered.camada].color} strokeWidth="1.2" />}
            </svg>
          </div>
          {/* label mono flutuante do componente sob o cursor */}
          {hovered && hoverInfo && (
            <div
              className="absolute translate-x-4 translate-y-4 whitespace-nowrap border bg-abyss/95 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]"
              style={{
                transform: `translate(${cursor.x + 16}px, ${cursor.y + 14}px)`,
                borderColor: LAYERS[hovered.camada].color,
                color: LAYERS[hovered.camada].color,
              }}
            >
              {hoverInfo.nome}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
