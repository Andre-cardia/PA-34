// Modelo do PA-34 para o hero "showroom" — geometria real (GLB FlightGear
// fgaddon PA34-200T, GPL-2.0) nas 9 camadas (mesmas do módulo /modelo-3d),
// que entram "montando" (assemble). Sistemas internos ausentes no GLB
// (estrutura, elétrico, vácuo, tanques) permanecem procedurais.

import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Edges, Html } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useGlbParts, GlbWrap } from '@/components/modelo3d/glb'
import type { GlbMesh } from '@/components/modelo3d/glb'

// Ordem = stagger da montagem (design home.md §1)
export const LAYERS = [
  'estrutura',
  'controles_voo',
  'motores',
  'combustivel',
  'eletrico',
  'vacuo_pitot',
  'trem_pouso',
  'avionics_cabine',
  'exterior',
] as const

type LayerId = (typeof LAYERS)[number]

// Direção explodida de cada camada (montagem inicial + leve separação no scroll)
const EXPLODE: Record<LayerId, [number, number, number]> = {
  estrutura: [0, 1.6, 0],
  controles_voo: [0, -1.2, 0],
  motores: [1.8, 0.4, 0],
  combustivel: [-1.4, 0.8, 0],
  eletrico: [0.8, -1.6, 0],
  vacuo_pitot: [-0.8, -1.0, 0],
  trem_pouso: [0, -2.0, 0],
  avionics_cabine: [0, 1.0, 0],
  exterior: [0, 2.2, 0],
}

const easeMech = (t: number) => 1 - Math.pow(1 - t, 3)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

interface ModelProps {
  scrollRef?: React.MutableRefObject<number>
  onSelect?: () => void
  reduced?: boolean
  /** atrasa o início da montagem (sincroniza com o fim do HUD boot) */
  assemblyDelay?: number
}

export default function SenecaModel({ scrollRef, onSelect, reduced = false, assemblyDelay = 0 }: ModelProps) {
  const root = useRef<THREE.Group>(null)
  const layerRefs = useRef<Record<LayerId, THREE.Group | null>>({
    estrutura: null,
    controles_voo: null,
    motores: null,
    combustivel: null,
    eletrico: null,
    vacuo_pitot: null,
    trem_pouso: null,
    avionics_cabine: null,
    exterior: null,
  })
  const clock = useRef(0)
  const [hoveredEngine, setHoveredEngine] = useState<null | 'esq' | 'dir'>(null)
  const [pointerOn, setPointerOn] = useState(false)

  // ---- materiais por camada (fade de montagem) ----
  const mats = useMemo(() => {
    const mk = (color: string, extra?: Partial<THREE.MeshStandardMaterialParameters>) =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.62,
        metalness: 0.28,
        transparent: true,
        opacity: reduced ? 1 : 0,
        ...extra,
      })
    return {
      exterior: mk('#AEBED0', { roughness: 0.44, metalness: 0.32 }),
      estrutura: mk('#2A3A4E'),
      motores: mk('#32445A'),
      combustivel: mk('#2A3A4E'),
      eletrico: mk('#2A3A4E'),
      vacuo_pitot: mk('#2A3A4E'),
      trem_pouso: mk('#222F3F'),
      avionics_cabine: mk('#222F3F'),
      canopy: new THREE.MeshStandardMaterial({
        color: '#1C4658',
        roughness: 0.14,
        metalness: 0.55,
        transparent: true,
        opacity: reduced ? 0.92 : 0,
      }),
      engineHot: new THREE.MeshStandardMaterial({
        color: '#16222F',
        roughness: 0.5,
        metalness: 0.3,
        emissive: new THREE.Color('#3FE0FF'),
        emissiveIntensity: 0,
        transparent: true,
        opacity: reduced ? 1 : 0,
      }),
    }
  }, [reduced])

  // ---- meshes do GLB (modelo real) por camada ----
  const glb = useGlbParts()
  const matFor = (camada: LayerId, comp: string): THREE.Material => {
    if (comp === 'para_brisa_janelas') return mats.canopy
    if (camada === 'controles_voo') return mats.exterior
    return mats[camada as Exclude<LayerId, 'controles_voo'>]
  }
  const GP = (camada: LayerId) =>
    (glb[camada] ?? []).map((m: GlbMesh) => (
      <mesh
        key={m.name}
        geometry={m.geometry}
        material={matFor(camada, m.comp)}
        position={m.position}
        quaternion={m.quaternion}
        scale={m.scale}
      />
    ))
  // exterior com hotspots nas naceles (tooltip do motor)
  const GPexterior = () =>
    (glb.exterior ?? []).map((m: GlbMesh) => {
      if (m.comp === 'naceles_carenagens') {
        const side = m.side === 'centro' ? 'dir' : m.side
        return (
          <mesh
            key={m.name}
            geometry={m.geometry}
            material={mats.exterior}
            position={m.position}
            quaternion={m.quaternion}
            scale={m.scale}
            onPointerOver={engineOver(side as 'esq' | 'dir')}
            onPointerOut={engineOut}
          />
        )
      }
      return (
        <mesh
          key={m.name}
          geometry={m.geometry}
          material={matFor('exterior', m.comp)}
          position={m.position}
          quaternion={m.quaternion}
          scale={m.scale}
        />
      )
    })

  // ---- geometrias ----
  const geo = useMemo(() => {
    // fuselagem (lathe ao longo de Y → rotacionada para X no grupo)
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

    // asa trapezoidal (extrude): shape x = envergadura, y = corda, z = espessura.
    // rotateX(π/2) → espessura em Y; rotateY(±π/2) → envergadura em ∓Z, corda em X.
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

    const box = new THREE.BoxGeometry(1, 1, 1)
    const cyl = new THREE.CylinderGeometry(1, 1, 1, 14)
    const cone = new THREE.ConeGeometry(1, 1, 14)
    const torus = new THREE.TorusGeometry(1, 0.28, 8, 18)
    const sphere = new THREE.SphereGeometry(1, 18, 12)
    const ring = new THREE.TorusGeometry(1, 0.02, 6, 24)

    return { fuselage, wingL, wingR, box, cyl, cone, torus, sphere, ring }
  }, [])

  // plataforma de hangar: anel de cotas + ticks angulares (1 draw call)
  const platformGeo = useMemo(() => {
    const verts: number[] = []
    const R1 = 4.6
    const R2 = 5.3
    const seg = 96
    for (let i = 0; i < seg; i++) {
      const a1 = (i / seg) * Math.PI * 2
      const a2 = ((i + 1) / seg) * Math.PI * 2
      // anel externo tracejado (segmentos alternados)
      if (i % 2 === 0) {
        verts.push(Math.cos(a1) * R2, 0, Math.sin(a1) * R2, Math.cos(a2) * R2, 0, Math.sin(a2) * R2)
      }
      verts.push(Math.cos(a1) * R1, 0, Math.sin(a1) * R1, Math.cos(a2) * R1, 0, Math.sin(a2) * R1)
      // ticks a cada ~18°
      if (i % 5 === 0) {
        verts.push(Math.cos(a1) * R1, 0, Math.sin(a1) * R1, Math.cos(a1) * (R1 + 0.22), 0, Math.sin(a1) * (R1 + 0.22))
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    return g
  }, [])

  useFrame((state, delta) => {
    const r = root.current
    if (!r) return
    if (!reduced) clock.current += delta
    const t = clock.current

    // montagem: cada camada voa do ponto explodido (1.4s, stagger 0.08s)
    LAYERS.forEach((id, i) => {
      const g = layerRefs.current[id]
      if (!g) return
      const local = reduced ? 1 : clamp01((t - assemblyDelay - 0.35 - i * 0.08) / 1.4)
      const e = easeMech(local)
      const dir = EXPLODE[id]
      // separação sutil por scroll (carenagem sobe, motores avançam)
      const s = scrollRef?.current ?? 0
      const pushExterior = id === 'exterior' ? s * 0.55 : id === 'estrutura' ? s * 0.12 : 0
      const pushMotores = id === 'motores' ? s * 0.4 : 0
      const pushTrem = id === 'trem_pouso' ? s * -0.3 : 0
      g.position.set(dir[0] * (1 - e) + pushMotores, dir[1] * (1 - e) + pushExterior + pushTrem, dir[2] * (1 - e))
    })
    // fade dos materiais
    const fade = reduced ? 1 : easeMech(clamp01((t - assemblyDelay - 0.35) / 1.6))
    Object.values(mats).forEach((m) => {
      m.opacity = (m === mats.canopy ? 0.92 : 1) * fade
    })

    // auto-rotação lenta + flutuação ±6px + parallax do mouse
    const targetY = reduced ? 0.5 : t * 0.05
    r.rotation.y += (targetY + state.pointer.x * 0.16 - r.rotation.y) * 0.06
    r.rotation.x += (state.pointer.y * -0.08 - r.rotation.x) * 0.06
    r.position.y = reduced ? 0 : Math.sin(t * 0.8) * 0.09

    // emissive do motor em hover
    mats.engineHot.emissiveIntensity += ((hoveredEngine ? 0.55 : 0) - mats.engineHot.emissiveIntensity) * 0.15
  })

  const engineOver = (side: 'esq' | 'dir') => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHoveredEngine(side)
    setPointerOn(true)
    document.body.style.cursor = 'pointer'
  }
  const engineOut = () => {
    setHoveredEngine(null)
    setPointerOn(false)
    document.body.style.cursor = ''
  }

  const setLayer = (id: LayerId) => (g: THREE.Group | null) => {
    layerRefs.current[id] = g
  }

  return (
    <group
      ref={root}
      rotation={[0, 0.5, 0]}
      onClick={(e) => {
        e.stopPropagation()
        onSelect?.()
      }}
      onPointerOver={() => setPointerOn(true)}
      onPointerOut={() => setPointerOn(false)}
      scale={0.62}
    >
      {/* ================= ESTRUTURA ================= */}
      <group ref={setLayer('estrutura')}>
        {/* longarinas das asas */}
        <mesh geometry={geo.box} material={mats.estrutura} position={[0.42, -0.32, 2.3]} scale={[0.1, 0.1, 4.4]} />
        <mesh geometry={geo.box} material={mats.estrutura} position={[0.42, -0.32, -2.3]} scale={[0.1, 0.1, 4.4]} />
        {/* anéis da fuselagem */}
        {[-2.4, -1.2, 0, 1.2, 2.4].map((x) => (
          <mesh key={x} geometry={geo.ring} material={mats.estrutura} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]} scale={[0.36, 0.36, 0.36]} />
        ))}
      </group>

      {/* ================= CONTROLES DE VOO (GLB) ================= */}
      <group ref={setLayer('controles_voo')}>
        <GlbWrap>{GP('controles_voo')}</GlbWrap>
      </group>

      {/* ================= MOTORES (GLB: hélices, spinners, escapamentos) ================= */}
      <group ref={setLayer('motores')}>
        <GlbWrap>{GP('motores')}</GlbWrap>
        {/* blocos dos motores (proxies, dentro das naceles reais) */}
        {([1, -1] as const).map((s) => (
          <mesh key={s} geometry={geo.box} material={mats.engineHot} position={[1.61, -0.17, 1.48 * s]} scale={[0.88, 0.5, 0.55]} />
        ))}
        {/* tooltips dos motores (âncoras nas naceles — hover vem do exterior) */}
        {hoveredEngine && (
          <Html position={[1.61, 0.5, hoveredEngine === 'dir' ? 1.48 : -1.48]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
            <div className="whitespace-nowrap border border-cyan-dim bg-abyss/90 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan">
              LYCOMING {hoveredEngine === 'dir' ? 'LIO-360 · CONTRA-ROTATIVO' : 'IO-360'} · 200 HP
            </div>
          </Html>
        )}
      </group>

      {/* ================= COMBUSTÍVEL ================= */}
      <group ref={setLayer('combustivel')}>
        {([1, -1] as const).map((s) =>
          [1.35, 3.1].map((z) => (
            <mesh key={`${s}-${z}`} geometry={geo.box} material={mats.combustivel} position={[0.32, -0.3, z * s]} scale={[0.8, 0.09, 0.9]}>
              <Edges color="#1B4B5C" />
            </mesh>
          )),
        )}
        <GlbWrap>{GP('combustivel')}</GlbWrap>
      </group>

      {/* ================= ELÉTRICO ================= */}
      <group ref={setLayer('eletrico')}>
        <mesh geometry={geo.box} material={mats.eletrico} position={[2.6, -0.15, 0]} scale={[0.4, 0.3, 0.3]}>
          <Edges color="#1B4B5C" />
        </mesh>
        {/* alternadores */}
        {([1, -1] as const).map((s) => (
          <mesh key={s} geometry={geo.cyl} material={mats.eletrico} position={[0.3, -0.42, 2.05 * s]} rotation={[Math.PI / 2, 0, 0]} scale={[0.12, 0.3, 0.12]} />
        ))}
      </group>

      {/* ================= VÁCUO / PITOT ================= */}
      <group ref={setLayer('vacuo_pitot')}>
        <mesh geometry={geo.cyl} material={mats.vacuo_pitot} position={[0.42, 0.12, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.1, 0.5, 0.1]} />
        {/* tubo de pitot sob a asa esquerda */}
        <mesh geometry={geo.cyl} material={mats.vacuo_pitot} position={[0.9, -0.5, -1.6]} rotation={[0, 0, Math.PI / 2]} scale={[0.03, 0.5, 0.03]} />
      </group>

      {/* ================= TREM DE POUSO (GLB) ================= */}
      <group ref={setLayer('trem_pouso')}>
        <GlbWrap>{GP('trem_pouso')}</GlbWrap>
      </group>

      {/* ================= AVIÔNICA / CABINE (GLB) ================= */}
      <group ref={setLayer('avionics_cabine')}>
        <GlbWrap>{GP('avionics_cabine')}</GlbWrap>
      </group>

      {/* ================= EXTERIOR (GLB — célula real, hotspots nas naceles) ================= */}
      <group ref={setLayer('exterior')}>
        <GlbWrap>{GPexterior()}</GlbWrap>
      </group>

      {/* plataforma de hangar */}
      <lineSegments geometry={platformGeo} position={[0, -1.7, 0]}>
        <lineBasicMaterial color="#1B4B5C" transparent opacity={0.8} />
      </lineSegments>
      {/* luz de ponto sob o avião */}
      <pointLight position={[0, -1.4, 0]} intensity={pointerOn ? 6 : 3} color="#3FE0FF" distance={6} />
    </group>
  )
}
