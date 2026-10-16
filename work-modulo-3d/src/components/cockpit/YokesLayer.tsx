// Camada opcional dos manches em W (decisão 2026-10-15, Q2 → c). Desligada por
// padrão; quando ligada, sobrepõe o render dos manches (Blender, dia/noite) no
// mesmo <g> dos hotspots, sem capturar clique (pointer-events: none). Enquanto
// o render não existir, carregar ou falhar, usa o desenho vetorial equivalente.
import { useEffect, useState } from 'react'
import { YokesArt } from './artwork'
import { VB_W, VB_H } from './panel-data'

type LoadState = 'loading' | 'ready' | 'error'

function YokesIllumination({ night, active }: { night: boolean; active: boolean }) {
  const [state, setState] = useState<LoadState>('loading')
  const mode = night ? 'noite' : 'dia'
  const src = `${import.meta.env.BASE_URL}cockpit-render/manches-${mode}.webp`
  useEffect(() => {
    let alive = true
    const image = new Image()
    image.src = src
    image.decode().then(
      () => { if (alive) setState(image.naturalWidth === VB_W * 2 && image.naturalHeight === VB_H * 2 ? 'ready' : 'error') },
      () => { if (alive) setState('error') },
    )
    return () => { alive = false }
  }, [src])
  return (
    <g data-yokes-layer={mode} data-image-state={state} style={{ opacity: active ? 1 : 0 }} className="ck-render-illumination">
      {state !== 'ready' && <YokesArt night={night} />}
      {state === 'ready' && <image href={src} x={0} y={0} width={VB_W} height={VB_H} preserveAspectRatio="xMidYMid meet" />}
    </g>
  )
}

export default function YokesLayer({ night }: { night: boolean }) {
  return (
    <g aria-hidden="true" pointerEvents="none" style={{ pointerEvents: 'none' }} data-yokes="on">
      <YokesIllumination night={false} active={!night} />
      <YokesIllumination night={true} active={night} />
    </g>
  )
}
