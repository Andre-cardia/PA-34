// Fundo Blender e fallback compartilham as coordenadas/transformação dos hotspots.
// Esta camada é estritamente decorativa: nenhum handler de seleção é duplicado.
import { useEffect, useState } from 'react'
import { PanelPlates, renderArt } from './artwork'
import { PANEL_MAP, PANEL_ORDER, VB_W, VB_H, catMeta, instrumentById } from './panel-data'

interface Props {
  night: boolean
  filterCat: string | null
  selectedId: string | null
}

type LoadState = 'loading' | 'ready' | 'error'

// O raster Blender (painel-{dia,noite}.webp) foi renderizado sobre a disposição
// didática anterior; até ser re-renderizado sobre a geometria real (fase 2,
// fora desta entrega), ele fica desativado e a camada vetorial abaixo — já
// atualizada com as posições reais — é o que fica visível.
const USE_BLENDER_RENDER = false

function Illumination({ night, active, filterCat, selectedId }: Props & { active: boolean }) {
  const [state, setState] = useState<LoadState>(USE_BLENDER_RENDER ? 'loading' : 'error')
  const mode = night ? 'noite' : 'dia'
  const src = `${import.meta.env.BASE_URL}cockpit-render/painel-${mode}.webp`
  useEffect(() => {
    if (!USE_BLENDER_RENDER) return
    // SVG <image> pode não repetir load ao voltar pela SPA com o recurso em cache.
    // decode() cobre também esse caminho, sem deixar o fallback preso em loading.
    let active = true
    const image = new Image()
    image.src = src
    image.decode().then(
      () => { if (active) setState('ready') },
      () => { if (active) setState('error') },
    )
    return () => { active = false }
  }, [src])
  return (
    <g
      data-rendered-panel={mode}
      data-image-state={state}
      className="ck-render-illumination"
      style={{ opacity: active ? 1 : 0 }}
    >
      {/* Sempre utilizável enquanto carrega ou se ESTE arquivo falhar. */}
      {state !== 'ready' && (
        <g data-vector-fallback={mode}>
          <PanelPlates night={night} />
          {PANEL_ORDER.map(id => {
            const dim = filterCat !== null && instrumentById[id]?.categoria !== filterCat
            const match = filterCat !== null && !dim
            return (
              <g key={id} opacity={dim && selectedId !== id ? 0.35 : 1}
                style={{ filter: selectedId === id
                  ? 'drop-shadow(0 0 10px rgba(63,224,255,0.55))'
                  : match ? `drop-shadow(0 0 7px ${catMeta(filterCat).color}55)` : undefined }}>
                {renderArt(id, { night, sweep: false })}
              </g>
            )
          })}
          {/* Vinheta geral: simula a luz direcional única do render 3D anterior. */}
          <rect x={0} y={0} width={VB_W} height={VB_H} fill="url(#ck-vignette)" pointerEvents="none" />
        </g>
      )}
      {USE_BLENDER_RENDER && (
      <image
        href={src}
        x={0} y={0} width={VB_W} height={VB_H}
        preserveAspectRatio="xMidYMid meet"
        visibility={state === 'ready' ? 'visible' : 'hidden'}
        onLoad={() => setState('ready')}
        onError={() => setState('error')}
      />
      )}
      {/* Atenuação por forma, não um filtro que escurece a imagem inteira. */}
      {state === 'ready' && filterCat !== null && (
        <g data-category-dimming={mode} fill="#05080D" fillOpacity={0.65}>
          {PANEL_ORDER.filter(id => instrumentById[id]?.categoria !== filterCat && id !== selectedId).map(id => {
            const s = PANEL_MAP[id].shape
            return s.kind === 'circle'
              ? <circle key={id} data-dimmed-instrument={id} cx={s.cx} cy={s.cy} r={s.r} />
              : <rect key={id} data-dimmed-instrument={id} x={s.x} y={s.y} width={s.w} height={s.h} rx={3} />
          })}
        </g>
      )}
    </g>
  )
}

export default function RenderedPanel(props: Props) {
  return (
    <g aria-hidden="true" pointerEvents="none" data-panel-art="blender-with-vector-fallback">
      <style>{`.ck-render-illumination{transition:opacity .6s}@media(prefers-reduced-motion:reduce){.ck-render-illumination{transition:none}}`}</style>
      <Illumination {...props} night={false} active={!props.night} />
      <Illumination {...props} night={true} active={props.night} />
    </g>
  )
}
