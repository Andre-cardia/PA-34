// Canvas do hero — R3F, um único <Canvas> na página (design.md §11).
// Pausa o frameloop fora do viewport; DPR clamp 1.75; luzes simples.

import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import SenecaModel from './SenecaModel'

interface Props {
  scrollRef?: React.MutableRefObject<number>
  onSelect?: () => void
  assemblyDelay?: number
}

export default function HeroCanvas({ scrollRef, onSelect, assemblyDelay = 0 }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(true)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const el = wrap.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { threshold: 0.05 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={wrap} className="absolute inset-0" aria-hidden="true">
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={[1, 1.75]}
        camera={{ position: [7.5, 2.6, 8.5], fov: 34 }}
        gl={{ antialias: true, alpha: true }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <ambientLight intensity={0.55} color="#93A6BB" />
        <directionalLight position={[6, 8, 4]} intensity={1.6} color="#E8F0F7" />
        <directionalLight position={[-6, 3, -4]} intensity={0.35} color="#3FE0FF" />
        <Suspense fallback={null}>
          <SenecaModel scrollRef={scrollRef} onSelect={onSelect} reduced={reduced} assemblyDelay={assemblyDelay} />
        </Suspense>
      </Canvas>
    </div>
  )
}
