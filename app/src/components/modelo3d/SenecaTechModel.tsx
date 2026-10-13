// SenecaTechModel — maquete técnica do PA-34 Seneca I.
// Geometria fiel: modelo real PA34-200T (FlightGear fgaddon, GPL-2.0) em GLB,
// com nós nomeados mapeados para as 9 camadas / 68 componentes clicáveis
// (componentes_3d.json). Componentes internos ausentes no GLB (estrutura,
// elétrico, vácuo, blocos de motor, linhas de combustível) permanecem
// procedurais, posicionados no referencial do GLB. Tweens (presença de camada,
// explosão, raio-x, isolado, pulsos) rodam no useFrame com frameloop="demand".

import { useContext, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import { camadas3d } from '@/data'
import { LAYERS, LAYER_ORDER, EXPLODE_LERP, MAX_LABELS } from './config'
import type { LayerId } from './config'
import { useGlbParts, GlbPart, GlbWrap, ModelPartCtx } from './glb'
import type { GlbMesh } from './glb'

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

export interface AnchorEntry {
  camada: LayerId
  compId: string
  objects: THREE.Object3D[]
}

export interface LabelInfo {
  compId: string
  camada: LayerId
  nome: string
  pos: [number, number, number]
}

interface ModelProps {
  visible: Record<LayerId, boolean>
  explode: number // 0..1 (alvo; o modelo faz lerp 12%/frame)
  xray: boolean
  isolate: LayerId | null
  hoveredId: string | null
  selectedId: string | null
  /** pulso de emissive disparado pelo hover do rail (key muda a cada hover) */
  pulse: { layer: LayerId; key: number } | null
  /** duração da montagem inicial ("montagem de prancheta", §7) */
  introDur: number
  showLabels: boolean
  onHover: (compId: string | null, camada: LayerId | null) => void
  onSelect: (camada: LayerId, compId: string) => void
  onLabels: (labels: LabelInfo[]) => void
  anchorsRef: React.MutableRefObject<Map<string, AnchorEntry>>
}

// ---------------------------------------------------------------------------
// Part — mesh clicável registrada como âncora de componente
// ---------------------------------------------------------------------------

interface PartProps {
  geo: THREE.BufferGeometry
  mat: THREE.Material
  p?: [number, number, number]
  r?: [number, number, number]
  s?: [number, number, number]
  camada: LayerId
  comp: string
  edge?: string
  eth?: number
  noRay?: boolean
}

function Part({ geo, mat, p, r, s, camada, comp, edge, eth, noRay }: PartProps) {
  const { reg, hov, sel } = useContext(ModelPartCtx)
  return (
    <mesh
      geometry={geo}
      material={mat}
      position={p}
      rotation={r}
      scale={s}
      userData={{ componenteId: comp, camada }}
      ref={(o: THREE.Mesh | null) => reg(comp, camada, o)}
      raycast={noRay ? () => null : undefined}
      onPointerOver={(e) => hov(e, comp, camada)}
      onPointerOut={(e) => hov(e, null, null)}
      onClick={(e) => sel(e, camada, comp)}
    >
      {edge ? <Edges color={edge} threshold={eth ?? 25} /> : null}
    </mesh>
  )
}

// ---------------------------------------------------------------------------
// Geometrias procedurais (low-poly)
// Eixo X = longitudinal (nariz +X), Y = vertical, Z = lateral (+Z = direita)
// ---------------------------------------------------------------------------

function useGeometries() {
  return useMemo(() => {
    // fuselagem — perfil lathe (mesmas proporções da versão hero)
    const pts: THREE.Vector2[] = [
      new THREE.Vector2(0.001, -3.6),
      new THREE.Vector2(0.12, -3.2),
      new THREE.Vector2(0.22, -2.2),
      new THREE.Vector2(0.34, -1.0),
      new THREE.Vector2(0.42, 0.2),
      new THREE.Vector2(0.42, 1.0),
      new THREE.Vector2(0.34, 2.0),
      new THREE.Vector2(0.22, 2.8),
      new THREE.Vector2(0.1, 3.4),
      new THREE.Vector2(0.001, 3.6),
    ]
    const fuselage = new THREE.LatheGeometry(pts, 20)

    // asa trapezoidal (extrude) — semi-envergadura 4.7, corda raiz 1.5
    const wingShape = new THREE.Shape()
    wingShape.moveTo(0, -0.78)
    wingShape.lineTo(0, 0.72)
    wingShape.lineTo(4.55, 0.42)
    wingShape.lineTo(4.7, 0.3)
    wingShape.lineTo(4.7, -0.4)
    wingShape.lineTo(4.55, -0.5)
    wingShape.closePath()
    const wingL = new THREE.ExtrudeGeometry(wingShape, { depth: 0.09, bevelEnabled: false })
    wingL.rotateX(Math.PI / 2)
    wingL.rotateY(Math.PI / 2) // semi-asa esquerda (envergadura -Z)
    const wingR = new THREE.ExtrudeGeometry(wingShape, { depth: 0.09, bevelEnabled: false })
    wingR.rotateX(Math.PI / 2)
    wingR.rotateY(-Math.PI / 2) // semi-asa direita (envergadura +Z)

    // deriva (estabilizador vertical) — perfil de barbatana extrudado
    const finShape = new THREE.Shape()
    finShape.moveTo(0, 0)
    finShape.lineTo(-0.95, 0.08)
    finShape.lineTo(-0.8, 0.95)
    finShape.lineTo(-0.5, 1.0)
    finShape.lineTo(0.12, 0.12)
    finShape.closePath()
    const fin = new THREE.ExtrudeGeometry(finShape, { depth: 0.07, bevelEnabled: false })

    const box = new THREE.BoxGeometry(1, 1, 1)
    const cyl = new THREE.CylinderGeometry(1, 1, 1, 14)
    const cone = new THREE.ConeGeometry(1, 1, 14)
    const sphere = new THREE.SphereGeometry(1, 18, 12)
    const ball = new THREE.SphereGeometry(1, 10, 8)
    const torus = new THREE.TorusGeometry(1, 0.28, 8, 18)
    const ring = new THREE.TorusGeometry(1, 0.02, 6, 24)
    const disc = new THREE.CircleGeometry(1, 24)

    return { fuselage, wingL, wingR, fin, box, cyl, cone, sphere, ball, torus, ring, disc }
  }, [])
}

// ---------------------------------------------------------------------------
// Materiais — um MeshStandardMaterial por componente (highlight individual),
// tingido ~16% pela cor-chave da camada sobre base grafite (maquete fosca).
// rec.mats também guarda materiais de arestas (Edges) para sincronizar fade.
// ---------------------------------------------------------------------------

interface MatRec {
  camada: LayerId
  compId: string
  mats: THREE.Material[]
}

const BASE = new THREE.Color('#182434')
const ALUM = new THREE.Color('#AEBED0') // alumínio claro — célula da maquete
const GLASS = new THREE.Color('#1C4658')

function mixColor(layerColor: string, amt = 0.16, base: THREE.Color = BASE) {
  return base.clone().lerp(new THREE.Color(layerColor), amt)
}

function useCompMaterials() {
  return useMemo(() => {
    const map = new Map<string, MatRec>()
    for (const camada of camadas3d) {
      const meta = LAYERS[camada.id as LayerId]
      if (!meta) continue
      for (const comp of camada.componentes) {
        const isGlassy = comp.id === 'para_brisa_janelas'
        const isExt = camada.id === 'exterior'
        const mat = new THREE.MeshStandardMaterial({
          color: isGlassy ? mixColor(meta.color, 0.22, GLASS) : isExt ? mixColor(meta.color, 0.09, ALUM) : mixColor(meta.color),
          roughness: isGlassy ? 0.14 : isExt ? 0.44 : 0.62,
          metalness: isGlassy ? 0.55 : isExt ? 0.32 : 0.3,
          emissive: new THREE.Color(meta.color),
          emissiveIntensity: 0,
          transparent: true,
          opacity: 0,
        })
        if (isGlassy) mat.userData.opacityMul = 0.88
        map.set(comp.id, { camada: camada.id as LayerId, compId: comp.id, mats: [mat] })
      }
    }
    // luzes com emissive constante (nav lights / 3-green do trem)
    const glow = (compId: string, color: string) => {
      const m = new THREE.MeshStandardMaterial({
        color: '#0A1018',
        roughness: 0.4,
        metalness: 0.1,
        emissive: new THREE.Color(color),
        emissiveIntensity: 1.4,
        transparent: true,
        opacity: 0,
      })
      m.userData.glow = true
      map.get(compId)?.mats.push(m)
      return m
    }
    const navRed = glow('pontas_asa_nariz_fibra', '#FF4D4D')
    const navGreen = glow('pontas_asa_nariz_fibra', '#3DDC97')
    const gearGreen = glow('indicacao_aviso_trem', '#3DDC97')
    // discos de hélice: quase invisíveis (rotor disc do desenho técnico)
    const disc = (compId: string) => {
      const meta = LAYERS.motores
      const m = new THREE.MeshStandardMaterial({
        color: mixColor(meta.color, 0.3),
        roughness: 0.7,
        metalness: 0.1,
        emissive: new THREE.Color(meta.color),
        emissiveIntensity: 0,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      })
      m.userData.opacityMul = 0.08
      map.get(compId)?.mats.push(m)
      return m
    }
    const discEsq = disc('helice_esquerda')
    const discDir = disc('helice_direita')
    return { map, navRed, navGreen, gearGreen, discEsq, discDir }
  }, [])
}

// ---------------------------------------------------------------------------
// Modelo
// ---------------------------------------------------------------------------

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeMech = (t: number) => 1 - Math.pow(1 - t, 3)

// nomes dos componentes (para rótulos) — dos dados
const NOMES: Record<string, string> = {}
for (const c of camadas3d) for (const comp of c.componentes) NOMES[comp.id] = comp.nome

export default function SenecaTechModel(props: ModelProps) {
  const { visible, xray, isolate, introDur, anchorsRef } = props
  const geo = useGeometries()
  const mats = useCompMaterials()

  // props acessíveis no loop sem re-subscrever
  const propsRef = useRef(props)
  propsRef.current = props
  const matsRef = useRef(mats)
  matsRef.current = mats

  const layerGroups = useRef<Partial<Record<LayerId, THREE.Group | null>>>({})
  const spreadXGroups = useRef<{ esq: THREE.Group | null; dir: THREE.Group | null }>({ esq: null, dir: null })
  const spreadZGroups = useRef<{ esq: THREE.Group | null; dir: THREE.Group | null }>({ esq: null, dir: null })

  // estado animado interno
  const anim = useRef({
    introT: 0,
    introDone: introDur <= 0,
    presence: {} as Record<LayerId, number>,
    explodeCur: 0,
    xrayCur: 0,
    isolateCur: 0,
    pulseT0: -1,
    pulseLayer: null as LayerId | null,
    pulseKey: -1,
    selPulseT0: -1,
    selKey: '',
    labelClock: 0,
    lastLabels: '',
  })
  // presença inicial: 0 (tudo nasce "fora" e voa para dentro na montagem)
  if (Object.keys(anim.current.presence).length === 0) {
    for (const id of LAYER_ORDER) anim.current.presence[id] = introDur <= 0 ? (visible[id] ? 1 : 0) : 0
  }

  // registro de âncoras (posições-mundo dos componentes p/ rótulos e câmera)
  const reg = useRef((compId: string, camada: LayerId, obj: THREE.Object3D | null) => {
    if (!obj) return
    const map = anchorsRef.current
    let entry = map.get(compId)
    if (!entry) {
      entry = { camada, compId, objects: [] }
      map.set(compId, entry)
    }
    if (!entry.objects.includes(obj)) entry.objects.push(obj)
    // arestas (Edges) entram no sync de fade como materiais do componente
    const rec = matsRef.current.map.get(compId)
    obj.traverse((o) => {
      const line = o as THREE.LineSegments
      if (line.isLineSegments) {
        const lm = line.material as THREE.Material
        lm.transparent = true
        if (rec && !rec.mats.includes(lm)) rec.mats.push(lm)
      }
    })
  }).current

  const hov = useRef((e: ThreeEvent<PointerEvent>, compId: string | null, camada: LayerId | null) => {
    e.stopPropagation()
    if (compId && !propsRef.current.visible[camada as LayerId]) return
    propsRef.current.onHover(compId, camada)
  }).current

  const sel = useRef((e: ThreeEvent<MouseEvent>, camada: LayerId, compId: string) => {
    e.stopPropagation()
    if (!propsRef.current.visible[camada]) return
    propsRef.current.onSelect(camada, compId)
  }).current

  // -------------------------------------------------------------------------
  // Loop principal (demand): tweens + materiais + rótulos
  // -------------------------------------------------------------------------
  const tmpV = useRef(new THREE.Vector3())

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const a = anim.current
    const P = propsRef.current
    let active = false

    // ---- intro: fade-in de prancheta (só camadas visíveis; aeronave sempre montada) ----
    if (!a.introDone) {
      a.introT += dt
      const stagger = introDur > 1 ? 0.08 : 0.03
      LAYER_ORDER.forEach((id, i) => {
        if (!P.visible[id]) {
          a.presence[id] = 0
          return
        }
        const local = clamp01((a.introT - i * stagger) / introDur)
        a.presence[id] = easeMech(local)
      })
      if (a.introT >= (LAYER_ORDER.length - 1) * stagger + introDur) a.introDone = true
      active = true
    }

    // ---- presença por camada (toggle = tween ~0.8s) ----
    for (const id of LAYER_ORDER) {
      const target = P.visible[id] ? 1 : 0
      const cur = a.presence[id]
      if (Math.abs(target - cur) > 0.001) {
        a.presence[id] = cur + (target - cur) * Math.min(1, dt * 4.5)
        active = true
      } else if (cur !== target) {
        a.presence[id] = target
      }
    }

    // ---- explosão (scrub ao vivo, lerp 12%/frame) ----
    if (Math.abs(a.explodeCur - P.explode) > 0.0005) {
      a.explodeCur += (P.explode - a.explodeCur) * EXPLODE_LERP
      active = true
    } else a.explodeCur = P.explode

    // ---- raio-x / isolado (fades) ----
    const xrayT = P.xray ? 1 : 0
    if (Math.abs(a.xrayCur - xrayT) > 0.004) {
      a.xrayCur += (xrayT - a.xrayCur) * Math.min(1, dt * 6)
      active = true
    } else a.xrayCur = xrayT
    const isoT = P.isolate ? 1 : 0
    if (Math.abs(a.isolateCur - isoT) > 0.004) {
      a.isolateCur += (isoT - a.isolateCur) * Math.min(1, dt * 6)
      active = true
    } else a.isolateCur = isoT

    // ---- pulso disparado pelo rail ----
    if (P.pulse && P.pulse.key !== a.pulseKey) {
      a.pulseKey = P.pulse.key
      a.pulseLayer = P.pulse.layer
      a.pulseT0 = state.clock.elapsedTime
    }
    const pulseAge = a.pulseT0 >= 0 ? state.clock.elapsedTime - a.pulseT0 : -1
    const pulseOn = pulseAge >= 0 && pulseAge < 1.2
    if (pulseOn) active = true

    // ---- pulso de seleção (2.5s, depois fixa em glow estático) ----
    if (P.selectedId && a.selKey !== P.selectedId) {
      a.selKey = P.selectedId
      a.selPulseT0 = state.clock.elapsedTime
    }
    if (!P.selectedId) {
      a.selKey = ''
      a.selPulseT0 = -1
    }
    const selAge = a.selPulseT0 >= 0 ? state.clock.elapsedTime - a.selPulseT0 : 99
    if (selAge < 2.5) active = true

    // ---- posiciona grupos de camada ----
    for (const id of LAYER_ORDER) {
      const g = layerGroups.current[id]
      if (!g) continue
      const meta = LAYERS[id]
      // posição = só explosão real (presença controla opacidade/visibilidade,
      // nunca desloca a camada — evita a aeronave "desmontada" no intro)
      const sep = a.explodeCur
      g.position.set(meta.explode[0] * sep, meta.explode[1] * sep, meta.explode[2] * sep)
      const show = a.presence[id] > 0.02 || (pulseOn && a.pulseLayer === id)
      if (g.visible !== show) g.visible = show
    }
    const mot = spreadXGroups.current
    const motSpread = (LAYERS.motores.spreadX ?? 0) * a.explodeCur
    if (mot.esq) mot.esq.position.x = -motSpread
    if (mot.dir) mot.dir.position.x = motSpread
    const ctl = spreadZGroups.current
    const ctlSpread = (LAYERS.controles_voo.spreadZ ?? 0) * a.explodeCur
    if (ctl.esq) ctl.esq.position.z = -ctlSpread
    if (ctl.dir) ctl.dir.position.z = ctlSpread

    // ---- sincroniza materiais ----
    const tNow = state.clock.elapsedTime
    for (const rec of mats.map.values()) {
      const presence = a.presence[rec.camada] ?? 0
      const isExt = rec.camada === 'exterior'
      // raio-x: exterior translúcido (0.12) com brilho cyan sutil
      const xrayMul = isExt ? 1 - a.xrayCur * 0.88 : 1
      // isolado: outras camadas viram ghost 10%
      const isoMul = P.isolate && rec.camada !== P.isolate ? 1 - a.isolateCur * 0.9 : 1
      // seleção: demais meshes esmaecem 15%
      const selMul = P.selectedId && rec.compId !== P.selectedId ? 0.85 : 1
      // pulso do rail revela camada oculta (mostra onde ela "moraria")
      const pulseReveal = pulseOn && a.pulseLayer === rec.camada && !P.visible[rec.camada] ? 0.22 * Math.sin((pulseAge / 1.2) * Math.PI) : 0

      let opacity = Math.max(presence, pulseReveal) * xrayMul * isoMul * selMul
      opacity = clamp01(opacity)

      let emissive = 0
      if (P.hoveredId === rec.compId) emissive = 0.55
      if (P.selectedId === rec.compId) {
        emissive = selAge < 2.5 ? 0.55 + 0.3 * Math.sin(tNow * 7) : 0.55
      }
      if (pulseOn && a.pulseLayer === rec.camada) {
        emissive = Math.max(emissive, 0.5 * Math.abs(Math.sin((pulseAge * Math.PI * 2) / 0.6)))
      }
      if (isExt && a.xrayCur > 0.02) emissive = Math.max(emissive, 0.18 * a.xrayCur)

      for (const m of rec.mats) {
        const mul = (m.userData.opacityMul as number | undefined) ?? 1
        m.opacity = opacity * mul
        const std = m as THREE.MeshStandardMaterial
        if (std.emissive) {
          std.depthWrite = mul >= 1 && opacity > 0.55
          if (!m.userData.glow) std.emissiveIntensity = emissive
        }
      }
    }

    // ---- rótulos (toggle RÓTULOS): os 12 mais próximos, atualiza ~3×/s ----
    a.labelClock += dt
    if (P.showLabels && a.labelClock > 0.33) {
      a.labelClock = 0
      const cam = state.camera.position
      const list: { d: number; info: LabelInfo }[] = []
      for (const [compId, entry] of anchorsRef.current) {
        if (!P.visible[entry.camada]) continue
        if (P.isolate && entry.camada !== P.isolate) continue
        if ((a.presence[entry.camada] ?? 0) < 0.6) continue
        tmpV.current.set(0, 0, 0)
        let n = 0
        for (const o of entry.objects) {
          if (!o.parent) continue
          tmpV.current.add(o.getWorldPosition(new THREE.Vector3()))
          n++
        }
        if (n === 0) continue
        tmpV.current.divideScalar(n)
        list.push({
          d: tmpV.current.distanceTo(cam),
          info: { compId, camada: entry.camada, nome: NOMES[compId] ?? compId, pos: [tmpV.current.x, tmpV.current.y, tmpV.current.z] },
        })
      }
      list.sort((x, y) => x.d - y.d)
      const top = list.slice(0, MAX_LABELS)
      const signature = top.map((l) => l.info.compId + l.info.pos.map((v) => v.toFixed(1)).join(',')).join('|')
      if (signature !== a.lastLabels) {
        a.lastLabels = signature
        P.onLabels(top.map((l) => l.info))
      }
    }
    if (!P.showLabels && a.lastLabels !== '') {
      a.lastLabels = ''
      P.onLabels([])
    }

    // demand: continua o loop só enquanto houver animação
    if (active) state.invalidate()
  })

  // helpers
  const M = (compId: string) => mats.map.get(compId)!.mats[0]
  const rayBlock = (camada: LayerId) => (xray && camada === 'exterior') || (!!isolate && isolate !== camada)
  const handlers = useMemo(() => ({ reg, hov, sel }), [reg, hov, sel])

  // ---- meshes do GLB (modelo real PA34-200T) agrupadas por camada ----
  const glb = useGlbParts()
  const GP = (camada: LayerId, side?: GlbMesh['side']) =>
    (glb[camada] ?? [])
      .filter((m) => !side || m.side === side)
      .map((m) => <GlbPart key={m.name} mesh={m} mat={M(m.comp)} camada={camada} noRay={rayBlock(camada)} />)

  return (
    <ModelPartCtx.Provider value={handlers}>
      <group>
      {/* ================= 1 · EXTERIOR (GLB — célula real) ================= */}
      <group ref={(g) => { layerGroups.current.exterior = g }}>
        <GlbWrap>{GP('exterior')}</GlbWrap>
        {/* luzes de navegação (glow) */}
        <Part geo={geo.ball} mat={mats.navGreen} p={[0.85, -0.01, 4.7]} s={[0.045, 0.045, 0.045]} camada="exterior" comp="pontas_asa_nariz_fibra" noRay={rayBlock('exterior')} />
        <Part geo={geo.ball} mat={mats.navRed} p={[0.85, -0.01, -4.7]} s={[0.045, 0.045, 0.045]} camada="exterior" comp="pontas_asa_nariz_fibra" noRay={rayBlock('exterior')} />
      </group>

      {/* ================= 2 · ESTRUTURA ================= */}
      <group ref={(g) => { layerGroups.current.estrutura = g }}>
        {/* longarina principal (~40% da corda) */}
        <Part geo={geo.box} mat={M('longarina_principal')} p={[0.42, -0.32, 2.3]} s={[0.12, 0.12, 4.4]} camada="estrutura" comp="longarina_principal" edge="#8FA3B8" noRay={rayBlock('estrutura')} />
        <Part geo={geo.box} mat={M('longarina_principal')} p={[0.42, -0.32, -2.3]} s={[0.12, 0.12, 4.4]} camada="estrutura" comp="longarina_principal" edge="#8FA3B8" noRay={rayBlock('estrutura')} />
        {/* caixão central (carry-through) */}
        <Part geo={geo.box} mat={M('caixao_central_asa')} p={[0.3, -0.36, 0]} s={[0.3, 0.16, 1.35]} camada="estrutura" comp="caixao_central_asa" edge="#8FA3B8" noRay={rayBlock('estrutura')} />
        {/* longarina traseira */}
        <Part geo={geo.box} mat={M('longarina_traseira')} p={[-0.42, -0.3, 2.3]} s={[0.08, 0.08, 4.2]} camada="estrutura" comp="longarina_traseira" noRay={rayBlock('estrutura')} />
        <Part geo={geo.box} mat={M('longarina_traseira')} p={[-0.42, -0.3, -2.3]} s={[0.08, 0.08, 4.2]} camada="estrutura" comp="longarina_traseira" noRay={rayBlock('estrutura')} />
        {/* caixilhos (frames) + longarinas da fuselagem */}
        {[-2.4, -1.2, 0, 1.2, 2.4].map((x) => (
          <Part key={`frame-${x}`} geo={geo.ring} mat={M('semimonocoque_caixilhos')} p={[x, 0, 0]} r={[0, Math.PI / 2, 0]} s={[0.36, 0.36, 0.36]} camada="estrutura" comp="semimonocoque_caixilhos" noRay={rayBlock('estrutura')} />
        ))}
        {([
          [0, 0.3, 0.3],
          [0, 0.3, -0.3],
          [0, -0.3, 0.3],
          [0, -0.3, -0.3],
        ] as [number, number, number][]).map((p, i) => (
          <Part key={`str-${i}`} geo={geo.box} mat={M('semimonocoque_caixilhos')} p={p} s={[5.6, 0.03, 0.03]} camada="estrutura" comp="semimonocoque_caixilhos" noRay={rayBlock('estrutura')} />
        ))}
        {/* berços dos motores (dynafocal) — no firewall das naceles reais */}
        {([1, -1] as const).map((s) => (
          <group key={`mount-${s}`}>
            <Part geo={geo.torus} mat={M('bercos_motor')} p={[1.0, -0.17, 1.48 * s]} r={[0, Math.PI / 2, 0]} s={[0.3, 0.3, 0.3]} camada="estrutura" comp="bercos_motor" noRay={rayBlock('estrutura')} />
            <Part geo={geo.cyl} mat={M('bercos_motor')} p={[1.25, -0.17, 1.48 * s]} r={[0.5 * s, 0, 0.7]} s={[0.03, 0.55, 0.03]} camada="estrutura" comp="bercos_motor" noRay={rayBlock('estrutura')} />
            <Part geo={geo.cyl} mat={M('bercos_motor')} p={[1.25, -0.17, 1.48 * s]} r={[-0.5 * s, 0, -0.7]} s={[0.03, 0.55, 0.03]} camada="estrutura" comp="bercos_motor" noRay={rayBlock('estrutura')} />
          </group>
        ))}
        {/* estrutura da empenagem */}
        <Part geo={geo.box} mat={M('estrutura_empenagem')} p={[-3.3, 0.5, 0]} s={[0.6, 0.7, 0.05]} camada="estrutura" comp="estrutura_empenagem" noRay={rayBlock('estrutura')} />
        <Part geo={geo.box} mat={M('estrutura_empenagem')} p={[-3.4, 0.12, 0]} s={[0.4, 0.05, 2.0]} camada="estrutura" comp="estrutura_empenagem" noRay={rayBlock('estrutura')} />
      </group>

      {/* ================= 3 · MOTORES (GLB: hélices/spinners/escapamentos/cowl flaps + proxies internos) ================= */}
      <group ref={(g) => { layerGroups.current.motores = g }}>
        {([1, -1] as const).map((s) => {
          const motorId = s === 1 ? 'motor_direito' : 'motor_esquerdo'
          const side = s === 1 ? 'dir' : 'esq'
          const zg = -1.842 * s // referencial GLB: esq = +Z
          return (
            <group key={`eng-${s}`} ref={(g) => { spreadXGroups.current[side] = g }}>
              <GlbWrap>
                {GP('motores', side)}
                {/* bloco Lycoming IO-360 + cilindros opostos (dentro da nacele) */}
                <Part geo={geo.box} mat={M(motorId)} p={[-2.0, 1.16, zg]} s={[1.1, 0.62, 0.68]} camada="motores" comp={motorId} edge="#FFB020" noRay={rayBlock('motores')} />
                {([1, -1] as const).map((c) =>
                  ([1, -1] as const).map((r) => (
                    <Part key={`cyl-${c}-${r}`} geo={geo.box} mat={M(motorId)} p={[-2.0 + 0.32 * r, 1.16, zg + 0.42 * c]} s={[0.26, 0.22, 0.16]} camada="motores" comp={motorId} noRay={rayBlock('motores')} />
                  )),
                )}
                {/* injeção Bendix (topo do motor) */}
                <Part geo={geo.box} mat={M('sistema_injecao')} p={[-2.0, 1.55, zg]} s={[0.44, 0.15, 0.36]} camada="motores" comp="sistema_injecao" noRay={rayBlock('motores')} />
                {/* admissão de ar (scoop inferior do capô) */}
                <Part geo={geo.box} mat={M('admissao_ar_alternativo')} p={[-2.55, 0.82, zg]} s={[0.32, 0.1, 0.18]} camada="motores" comp="admissao_ar_alternativo" noRay={rayBlock('motores')} />
                {/* radiador de óleo (face dianteira do firewall) */}
                <Part geo={geo.box} mat={M('radiador_oleo')} p={[-1.35, 1.42, zg]} s={[0.12, 0.28, 0.22]} camada="motores" comp="radiador_oleo" noRay={rayBlock('motores')} />
                {/* governador + magnetos */}
                <Part geo={geo.cyl} mat={M('governadores_magnetos')} p={[-2.42, 1.5, zg]} s={[0.1, 0.12, 0.1]} camada="motores" comp="governadores_magnetos" noRay={rayBlock('motores')} />
                <Part geo={geo.box} mat={M('governadores_magnetos')} p={[-1.5, 1.3, zg + 0.14]} s={[0.1, 0.12, 0.1]} camada="motores" comp="governadores_magnetos" noRay={rayBlock('motores')} />
                <Part geo={geo.box} mat={M('governadores_magnetos')} p={[-1.5, 1.3, zg - 0.14]} s={[0.1, 0.12, 0.1]} camada="motores" comp="governadores_magnetos" noRay={rayBlock('motores')} />
              </GlbWrap>
            </group>
          )
        })}
      </group>

      {/* ================= 4 · COMBUSTÍVEL ================= */}
      <group ref={(g) => { layerGroups.current.combustivel = g }}>
        {/* tanques inboard/outboard */}
        <Part geo={geo.box} mat={M('tanque_principal_esq')} p={[0.25, -0.28, -1.35]} s={[0.9, 0.1, 0.85]} camada="combustivel" comp="tanque_principal_esq" edge="#3DDC97" noRay={rayBlock('combustivel')} />
        <Part geo={geo.box} mat={M('tanque_principal_dir')} p={[0.25, -0.28, 1.35]} s={[0.9, 0.1, 0.85]} camada="combustivel" comp="tanque_principal_dir" edge="#3DDC97" noRay={rayBlock('combustivel')} />
        <Part geo={geo.box} mat={M('tanque_auxiliar_esq')} p={[0.3, -0.28, -3.1]} s={[0.8, 0.09, 0.8]} camada="combustivel" comp="tanque_auxiliar_esq" edge="#3DDC97" noRay={rayBlock('combustivel')} />
        <Part geo={geo.box} mat={M('tanque_auxiliar_dir')} p={[0.3, -0.28, 3.1]} s={[0.8, 0.09, 0.8]} camada="combustivel" comp="tanque_auxiliar_dir" edge="#3DDC97" noRay={rayBlock('combustivel')} />
        {/* bombas mecânicas (nos motores) */}
        {([1, -1] as const).map((s) => (
          <Part key={`bpmech-${s}`} geo={geo.cyl} mat={M('bombas_mecanicas')} p={[0.9, -0.4, 1.48 * s]} s={[0.09, 0.12, 0.09]} camada="combustivel" comp="bombas_mecanicas" noRay={rayBlock('combustivel')} />
        ))}
        {/* bombas elétricas (face traseira dos firewalls) */}
        {([1, -1] as const).map((s) => (
          <Part key={`bpele-${s}`} geo={geo.box} mat={M('bombas_eletricas')} p={[0.55, -0.42, 1.42 * s]} s={[0.1, 0.14, 0.1]} camada="combustivel" comp="bombas_eletricas" edge="#3DDC97" noRay={rayBlock('combustivel')} />
        ))}
        {/* seletoras (console central) */}
        <Part geo={geo.box} mat={M('seletoras_valvulas')} p={[0.5, -0.18, 0]} s={[0.25, 0.08, 0.15]} camada="combustivel" comp="seletoras_valvulas" noRay={rayBlock('combustivel')} />
        <Part geo={geo.cyl} mat={M('seletoras_valvulas')} p={[0.5, -0.08, 0.04]} r={[0, 0, 0.15]} s={[0.03, 0.14, 0.03]} camada="combustivel" comp="seletoras_valvulas" noRay={rayBlock('combustivel')} />
        <Part geo={geo.cyl} mat={M('seletoras_valvulas')} p={[0.5, -0.08, -0.04]} r={[0, 0, -0.15]} s={[0.03, 0.14, 0.03]} camada="combustivel" comp="seletoras_valvulas" noRay={rayBlock('combustivel')} />
        {/* gascolators + drenos */}
        {([1, -1] as const).map((s) => (
          <Part key={`gasc-${s}`} geo={geo.cyl} mat={M('gascolators_drenos')} p={[0.7, -0.6, 1.3 * s]} s={[0.05, 0.12, 0.05]} camada="combustivel" comp="gascolators_drenos" noRay={rayBlock('combustivel')} />
        ))}
        {([1, -1] as const).map((s) =>
          [1.35, 3.1].map((z) => (
            <Part key={`drain-${s}-${z}`} geo={geo.ball} mat={M('gascolators_drenos')} p={[0.3, -0.36, z * s]} s={[0.02, 0.02, 0.02]} camada="combustivel" comp="gascolators_drenos" noRay={rayBlock('combustivel')} />
          )),
        )}
        {/* linha de crossfeed + interligação dos tanques */}
        <Part geo={geo.cyl} mat={M('linhas_crossfeed')} p={[0.3, -0.44, 0]} r={[Math.PI / 2, 0, 0]} s={[0.025, 4.2, 0.025]} camada="combustivel" comp="linhas_crossfeed" edge="#3DDC97" noRay={rayBlock('combustivel')} />
        {([1, -1] as const).map((s) => (
          <Part key={`xline-${s}`} geo={geo.cyl} mat={M('linhas_crossfeed')} p={[0.3, -0.3, 2.2 * s]} r={[Math.PI / 2, 0, 0]} s={[0.02, 1.6, 0.02]} camada="combustivel" comp="linhas_crossfeed" noRay={rayBlock('combustivel')} />
        ))}
        {/* sensores de quantidade (1 por tanque) */}
        {([1, -1] as const).map((s) =>
          [1.35, 3.1].map((z) => (
            <Part key={`sens-${s}-${z}`} geo={geo.cyl} mat={M('sensores_quantidade')} p={[0.25, -0.2, z * s]} s={[0.03, 0.06, 0.03]} camada="combustivel" comp="sensores_quantidade" noRay={rayBlock('combustivel')} />
          )),
        )}
        {/* GLB: tampas dos tanques, placas AVGAS, seletoras e etiquetas */}
        <GlbWrap>{GP('combustivel')}</GlbWrap>
      </group>

      {/* ================= 5 · ELÉTRICO ================= */}
      <group ref={(g) => { layerGroups.current.eletrico = g }}>
        {/* bateria no nariz */}
        <Part geo={geo.box} mat={M('bateria')} p={[2.5, -0.12, 0]} s={[0.32, 0.26, 0.28]} camada="eletrico" comp="bateria" edge="#5B9DFF" noRay={rayBlock('eletrico')} />
        {/* alternadores (um por motor) */}
        {([1, -1] as const).map((s) => (
          <Part key={`alt-${s}`} geo={geo.cyl} mat={M('alternadores')} p={[0.95, -0.42, 1.48 * s]} r={[Math.PI / 2, 0, 0]} s={[0.11, 0.22, 0.11]} camada="eletrico" comp="alternadores" edge="#5B9DFF" noRay={rayBlock('eletrico')} />
        ))}
        {/* reguladores + relés de sobretensão (estação 49,5) */}
        <Part geo={geo.box} mat={M('reguladores_ov')} p={[2.0, 0.12, 0.12]} s={[0.18, 0.14, 0.12]} camada="eletrico" comp="reguladores_ov" noRay={rayBlock('eletrico')} />
        {/* relés de partida + master */}
        <Part geo={geo.box} mat={M('reles_partida_master')} p={[2.15, -0.25, 0.18]} s={[0.1, 0.08, 0.1]} camada="eletrico" comp="reles_partida_master" noRay={rayBlock('eletrico')} />
        <Part geo={geo.box} mat={M('reles_partida_master')} p={[2.15, -0.25, -0.12]} s={[0.08, 0.08, 0.08]} camada="eletrico" comp="reles_partida_master" noRay={rayBlock('eletrico')} />
        {/* barramento + disjuntores (inferior direito do painel) */}
        <Part geo={geo.box} mat={M('barramento_disjuntores')} p={[1.02, 0.02, -0.22]} s={[0.06, 0.08, 0.28]} camada="eletrico" comp="barramento_disjuntores" edge="#5B9DFF" noRay={rayBlock('eletrico')} />
        {/* amperímetros duplos */}
        <Part geo={geo.cyl} mat={M('amperimetros_comp')} p={[1.07, 0.16, -0.12]} r={[0, 0, Math.PI / 2]} s={[0.045, 0.02, 0.045]} camada="eletrico" comp="amperimetros_comp" noRay={rayBlock('eletrico')} />
        <Part geo={geo.cyl} mat={M('amperimetros_comp')} p={[1.07, 0.16, -0.26]} r={[0, 0, Math.PI / 2]} s={[0.045, 0.02, 0.045]} camada="eletrico" comp="amperimetros_comp" noRay={rayBlock('eletrico')} />
        {/* motor elétrico da bomba hidráulica do trem */}
        <Part geo={geo.box} mat={M('motor_bomba_trem')} p={[2.3, -0.32, 0]} s={[0.22, 0.16, 0.16]} camada="eletrico" comp="motor_bomba_trem" noRay={rayBlock('eletrico')} />
        <Part geo={geo.cyl} mat={M('motor_bomba_trem')} p={[2.3, -0.18, 0]} s={[0.08, 0.1, 0.08]} camada="eletrico" comp="motor_bomba_trem" noRay={rayBlock('eletrico')} />
      </group>

      {/* ================= 6 · VÁCUO & PITOT-ESTÁTICO ================= */}
      <group ref={(g) => { layerGroups.current.vacuo_pitot = g }}>
        {/* bombas de vácuo (uma por motor) */}
        {([1, -1] as const).map((s) => (
          <Part key={`vac-${s}`} geo={geo.cyl} mat={M('bombas_vacuo')} p={[0.8, -0.35, 1.45 * s]} s={[0.08, 0.14, 0.08]} camada="vacuo_pitot" comp="bombas_vacuo" edge="#B78CFF" noRay={rayBlock('vacuo_pitot')} />
        ))}
        {/* reguladores de vácuo */}
        {([1, -1] as const).map((s) => (
          <Part key={`vreg-${s}`} geo={geo.box} mat={M('reguladores_vacuo')} p={[0.6, -0.28, 1.38 * s]} s={[0.07, 0.1, 0.07]} camada="vacuo_pitot" comp="reguladores_vacuo" noRay={rayBlock('vacuo_pitot')} />
        ))}
        {/* válvula de retenção + filtros (atrás do painel) */}
        <Part geo={geo.cyl} mat={M('valvula_retencao_filtros')} p={[0.95, 0.38, 0.18]} s={[0.04, 0.08, 0.04]} camada="vacuo_pitot" comp="valvula_retencao_filtros" noRay={rayBlock('vacuo_pitot')} />
        <Part geo={geo.cyl} mat={M('valvula_retencao_filtros')} p={[0.95, 0.38, -0.18]} s={[0.04, 0.08, 0.04]} camada="vacuo_pitot" comp="valvula_retencao_filtros" noRay={rayBlock('vacuo_pitot')} />
        {/* tubo de pitot (ventre da asa esquerda) */}
        <Part geo={geo.cyl} mat={M('tubo_pitot')} p={[0.9, -0.6, -1.6]} s={[0.022, 0.3, 0.022]} camada="vacuo_pitot" comp="tubo_pitot" edge="#B78CFF" noRay={rayBlock('vacuo_pitot')} />
        <Part geo={geo.cyl} mat={M('tubo_pitot')} p={[1.0, -0.75, -1.6]} r={[0, 0, Math.PI / 2]} s={[0.018, 0.2, 0.018]} camada="vacuo_pitot" comp="tubo_pitot" noRay={rayBlock('vacuo_pitot')} />
        {/* tomadas estáticas (laterais da fuselagem traseira) */}
        <Part geo={geo.ball} mat={M('tomadas_estaticas')} p={[-1.8, -0.08, 0.4]} s={[0.03, 0.03, 0.03]} camada="vacuo_pitot" comp="tomadas_estaticas" noRay={rayBlock('vacuo_pitot')} />
        <Part geo={geo.ball} mat={M('tomadas_estaticas')} p={[-1.8, -0.08, -0.4]} s={[0.03, 0.03, 0.03]} camada="vacuo_pitot" comp="tomadas_estaticas" noRay={rayBlock('vacuo_pitot')} />
        {/* fonte estática alternada */}
        <Part geo={geo.box} mat={M('estatica_alternada_comp')} p={[1.0, -0.08, -0.12]} s={[0.05, 0.07, 0.05]} camada="vacuo_pitot" comp="estatica_alternada_comp" noRay={rayBlock('vacuo_pitot')} />
        {/* indicador de sucção */}
        <Part geo={geo.cyl} mat={M('indicador_succao_comp')} p={[1.07, 0.24, -0.2]} r={[0, 0, Math.PI / 2]} s={[0.04, 0.02, 0.04]} camada="vacuo_pitot" comp="indicador_succao_comp" noRay={rayBlock('vacuo_pitot')} />
      </group>

      {/* ================= 7 · TREM DE POUSO ================= */}
      <group ref={(g) => { layerGroups.current.trem_pouso = g }}>
        {/* bomba hidráulica reversível + reservatório (nariz) */}
        <Part geo={geo.box} mat={M('bomba_hidraulica_trem')} p={[2.32, -0.35, 0.1]} s={[0.2, 0.14, 0.14]} camada="trem_pouso" comp="bomba_hidraulica_trem" edge="#FF4D4D" noRay={rayBlock('trem_pouso')} />
        <Part geo={geo.ball} mat={M('bomba_hidraulica_trem')} p={[2.32, -0.22, 0.1]} s={[0.07, 0.07, 0.07]} camada="trem_pouso" comp="bomba_hidraulica_trem" noRay={rayBlock('trem_pouso')} />
        {/* GLB: pernas, rodas, portas e poços (geometria real) */}
        <GlbWrap>{GP('trem_pouso')}</GlbWrap>
        {/* freios de disco (rodas principais reais) */}
        {([1, -1] as const).map((s) => (
          <Part key={`brake-${s}`} geo={geo.cyl} mat={M('freios')} p={[0.67, -0.94, 1.22 * s]} r={[Math.PI / 2, 0, 0]} s={[0.1, 0.04, 0.1]} camada="trem_pouso" comp="freios" noRay={rayBlock('trem_pouso')} />
        ))}
        {/* indicação 3-green no painel + espelho da nacele esquerda */}
        {[0, 1, 2].map((i) => (
          <Part key={`gl-${i}`} geo={geo.ball} mat={mats.gearGreen} p={[1.6, -0.05, -0.3 - i * 0.06]} s={[0.02, 0.02, 0.02]} camada="trem_pouso" comp="indicacao_aviso_trem" noRay={rayBlock('trem_pouso')} />
        ))}
        <Part geo={geo.ball} mat={M('indicacao_aviso_trem')} p={[0.4, -0.02, -1.85]} s={[0.035, 0.035, 0.035]} camada="trem_pouso" comp="indicacao_aviso_trem" noRay={rayBlock('trem_pouso')} />
        {/* squat switch (perna principal esquerda) */}
        <Part geo={geo.box} mat={M('squat_switch')} p={[0.67, -0.7, -1.22]} s={[0.05, 0.07, 0.05]} camada="trem_pouso" comp="squat_switch" edge="#FF4D4D" noRay={rayBlock('trem_pouso')} />
      </group>

      {/* ================= 8 · CONTROLES DE VOO (GLB — superfícies reais) ================= */}
      <group ref={(g) => { layerGroups.current.controles_voo = g }}>
        {([1, -1] as const).map((s) => (
          <group key={`ctl-${s}`} ref={(g) => { spreadZGroups.current[s === 1 ? 'dir' : 'esq'] = g }}>
            <GlbWrap>{GP('controles_voo', s === 1 ? 'dir' : 'esq')}</GlbWrap>
          </group>
        ))}
        {/* leme, stabilator e compensadores (centro) */}
        <GlbWrap>{GP('controles_voo', 'centro')}</GlbWrap>
        {/* cabos e polias */}
        <Part geo={geo.cyl} mat={M('cabos_polias')} p={[-1.2, -0.05, 0.08]} r={[0, 0, Math.PI / 2]} s={[0.015, 4.2, 0.015]} camada="controles_voo" comp="cabos_polias" noRay={rayBlock('controles_voo')} />
        <Part geo={geo.cyl} mat={M('cabos_polias')} p={[-1.2, -0.05, -0.08]} r={[0, 0, Math.PI / 2]} s={[0.015, 4.2, 0.015]} camada="controles_voo" comp="cabos_polias" noRay={rayBlock('controles_voo')} />
        {([1, -1] as const).map((s) => (
          <Part key={`cable-${s}`} geo={geo.cyl} mat={M('cabos_polias')} p={[0.3, -0.24, 2.0 * s]} r={[Math.PI / 2, 0, 0]} s={[0.012, 3.4, 0.012]} camada="controles_voo" comp="cabos_polias" noRay={rayBlock('controles_voo')} />
        ))}
        <Part geo={geo.torus} mat={M('cabos_polias')} p={[0.8, -0.05, 0]} r={[0, Math.PI / 2, 0]} s={[0.05, 0.05, 0.05]} camada="controles_voo" comp="cabos_polias" noRay={rayBlock('controles_voo')} />
      </group>

      {/* ================= 9 · CABINE & AVIÔNICOS (GLB — painel, assentos, console, antenas) ================= */}
      <group ref={(g) => { layerGroups.current.avionics_cabine = g }}>
        <GlbWrap>{GP('avionics_cabine')}</GlbWrap>
        {/* antenas complementares na deriva */}
        <Part geo={geo.cyl} mat={M('antenas')} p={[-3.3, 1.05, 0.08]} r={[0.5, 0, 0]} s={[0.01, 0.3, 0.01]} camada="avionics_cabine" comp="antenas" noRay={rayBlock('avionics_cabine')} />
        <Part geo={geo.cyl} mat={M('antenas')} p={[-3.3, 1.05, -0.08]} r={[-0.5, 0, 0]} s={[0.01, 0.3, 0.01]} camada="avionics_cabine" comp="antenas" noRay={rayBlock('avionics_cabine')} />
      </group>
      </group>
    </ModelPartCtx.Provider>
  )
}
