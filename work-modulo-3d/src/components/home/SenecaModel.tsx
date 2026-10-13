// Hero reutiliza as nove coleções e materiais Blender, sem proxies locais.
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useGlbParts, GlbWrap, materialsOf, styleMaterial } from '@/components/modelo3d/glb'
export const LAYERS = ['estrutura','controles_voo','motores','combustivel','eletrico','vacuo_pitot','trem_pouso','avionics_cabine','exterior'] as const
type LayerId = (typeof LAYERS)[number]
const EXPLODE: Record<LayerId, [number, number, number]> = {
  estrutura:[0,1.6,0], controles_voo:[0,-1.2,0], motores:[1.8,.4,0], combustivel:[-1.4,.8,0],
  eletrico:[.8,-1.6,0], vacuo_pitot:[-.8,-1,0], trem_pouso:[0,-2,0], avionics_cabine:[0,1,0], exterior:[0,2.2,0],
}
const ease = (t:number) => 1-Math.pow(1-Math.min(1,Math.max(0,t)),3)
interface ModelProps { scrollRef?: React.MutableRefObject<number>; onSelect?: () => void; reduced?: boolean; assemblyDelay?: number }
export default function SenecaModel({ scrollRef, onSelect, reduced=false, assemblyDelay=0 }: ModelProps) {
  const root=useRef<THREE.Group>(null)
  const refs=useRef<Partial<Record<LayerId,THREE.Group|null>>>({})
  const clock=useRef(0)
  const [hoveredEngine,setHoveredEngine]=useState<'esq'|'dir'|null>(null)
  const [pointerOn,setPointerOn]=useState(false)
  const parts=useGlbParts()
  const platform=useMemo(() => {
    const verts:number[]=[]
    for(let i=0;i<96;i++) {
      const a=i*Math.PI*2/96,b=(i+1)*Math.PI*2/96
      for(const r of i%2===0?[5,5.6]:[5]) verts.push(Math.cos(a)*r,0,Math.sin(a)*r,Math.cos(b)*r,0,Math.sin(b)*r)
    }
    return new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(verts,3))
  },[])
  useEffect(() => () => { platform.dispose(); document.body.style.cursor='' },[platform])
  useFrame((state,delta) => {
    if(!root.current) return
    if(!reduced) clock.current+=delta
    const t=clock.current
    LAYERS.forEach((id,i) => {
      const e=reduced?1:ease((t-assemblyDelay-.35-i*.08)/1.4)
      const g=refs.current[id], d=EXPLODE[id], s=reduced?0:scrollRef?.current??0
      if(g) g.position.set(d[0]*(1-e)+(id==='motores'?s*.4:0),d[1]*(1-e)+(id==='exterior'?s*.55:id==='estrutura'?s*.12:id==='trem_pouso'?s*-.3:0),d[2]*(1-e))
      for(const part of parts[id]) for(const m of materialsOf(part)) styleMaterial(m,reduced?1:ease((t-assemblyDelay-.35)/1.6),part.comp==='naceles_carenagens'&&part.side===hoveredEngine ? .35 : 0)
    })
    if(reduced) { root.current.rotation.set(0,.5,0); root.current.position.y=0; return }
    root.current.rotation.y+=(t*.05+state.pointer.x*.16-root.current.rotation.y)*.06
    root.current.rotation.x+=(state.pointer.y*-.08-root.current.rotation.x)*.06
    root.current.position.y=Math.sin(t*.8)*.09
  })
  return <group ref={root} rotation={[0,.5,0]} scale={.62} onClick={e => {e.stopPropagation();onSelect?.()}}
    onPointerOver={() => setPointerOn(true)} onPointerOut={() => setPointerOn(false)}>
    {LAYERS.map(id => <group key={id} ref={g => {refs.current[id]=g}}><GlbWrap>
      {parts[id].map(p => <mesh key={p.name} geometry={p.geometry} material={p.material} position={p.position} quaternion={p.quaternion} scale={p.scale} dispose={null}
        onPointerOver={p.comp==='naceles_carenagens'?e => {e.stopPropagation();setHoveredEngine(p.side==='esq'?'esq':'dir');document.body.style.cursor='pointer'}:undefined}
        onPointerOut={p.comp==='naceles_carenagens'?() => {setHoveredEngine(null);document.body.style.cursor=''}:undefined} />)}
    </GlbWrap></group>)}
    {hoveredEngine&&<Html position={[1.61,.5,hoveredEngine==='dir'?1.48:-1.48]} center distanceFactor={9} style={{pointerEvents:'none'}}>
      <div className="whitespace-nowrap border border-cyan-dim bg-abyss/90 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan">
        LYCOMING {hoveredEngine==='dir'?'LIO-360 · CONTRA-ROTATIVO':'IO-360'} · 200 HP
      </div></Html>}
    <lineSegments geometry={platform} position={[0,-1.7,0]}><lineBasicMaterial color="#1B4B5C" transparent opacity={.8}/></lineSegments>
    <pointLight position={[0,-1.4,0]} intensity={pointerOn?6:3} color="#3FE0FF" distance={6}/>
  </group>
}
