// Canvas do hero — R3F, um único <Canvas> na página (design.md §11).
// Pausa o frameloop fora do viewport; DPR clamp 1.75; luzes simples.

import { Suspense, useEffect, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import { Canvas } from '@react-three/fiber'
import SenecaModel from './SenecaModel'
import HeroStaticFallback from './HeroStaticFallback'

interface Props {
  scrollRef?: MutableRefObject<number>
  onSelect?: () => void
  assemblyDelay?: number
}

function canUseWebGL() {
  if (typeof document === 'undefined') return true
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export default function HeroCanvas({ scrollRef, onSelect, assemblyDelay = 0 }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(true)
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [webgl] = useState(() => canUseWebGL())
  const [canObserve] = useState(() => typeof IntersectionObserver !== 'undefined')

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(media.matches)
    media.addEventListener?.('change', onChange)
    return () => media.removeEventListener?.('change', onChange)
  }, [])

  useEffect(() => {
    const el = wrap.current
    if (!el || !canObserve) return
    const obs = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { threshold: 0.05 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [canObserve])

  if (!webgl || reduced || !canObserve) {
    return <HeroStaticFallback reason={reduced ? 'motion' : canObserve ? 'webgl' : 'runtime'} />
  }

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
