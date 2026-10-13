// CockpitPanel — palco SVG do painel (cockpit.md §1–3): renders Blender dia/noite com
// crossfade, hotspots (pulse cyan, aria-label, teclado), rótulos com leader
// lines, spotlight do tour, scanline, cursor crosshair customizado + tooltip.

import { useMemo, useRef, useState } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { Maximize, ZoomIn, ZoomOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { instrumentosCockpit } from '@/data'
import { CornerScrews } from '@/components/assets/PanelScrews'
import { PANEL_MAP, PANEL_ORDER, SUGGESTED, catMeta, instrumentById } from './panel-data'
import type { HotspotShape, PanelEntry } from './panel-data'
import { ArtDefs } from './artwork'
import RenderedPanel from './RenderedPanel'
import type { usePanZoom } from './usePanZoom'

type PanZoom = ReturnType<typeof usePanZoom>

export interface PanelProps {
  pz: PanZoom
  night: boolean
  labelsOn: boolean
  filterCat: string | null
  selectedId: string | null
  suggestedActive: boolean
  tourTargetId: string | null
  scanlineKey: number // >0 dispara a varredura de entrada do tour
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
}

const MONO = "'IBM Plex Mono', ui-monospace, monospace"

// ---------------------------------------------------------------------------
// Hotspot
// ---------------------------------------------------------------------------

function hitShapeProps(shape: HotspotShape) {
  if (shape.kind === 'circle') {
    const grow = Math.min(8, Math.max(4, shape.r * 0.1))
    return { type: 'circle' as const, cx: shape.cx, cy: shape.cy, r: shape.r + grow }
  }
  const growX = Math.min(8, Math.max(4, shape.w * 0.04))
  const growY = Math.min(7, Math.max(4, shape.h * 0.04))
  return {
    type: 'rect' as const,
    x: shape.x - growX,
    y: shape.y - growY,
    w: shape.w + growX * 2,
    h: shape.h + growY * 2,
  }
}

function Hotspot({
  id,
  entry,
  hovered,
  selected,
  catMatch,
  dimmed,
  pulseDelay,
  onHover,
  onSelect,
}: {
  id: string
  entry: PanelEntry
  hovered: boolean
  selected: boolean
  catMatch: string | null // cor da categoria quando o filtro casa
  dimmed: boolean
  pulseDelay: number | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
}) {
  const inst = instrumentById[id]
  const s = entry.shape
  const hit = hitShapeProps(s)
  const active = hovered || selected
  const ringColor = selected ? '#3FE0FF' : (catMatch ?? '#3FE0FF')
  const ringVisible = active || catMatch !== null

  const ringStyle = selected
    ? { animation: 'ckSelPulse 2.6s ease-in-out infinite' }
    : { transition: 'opacity 0.2s' }
  const ring =
    s.kind === 'circle' ? (
      <circle
        cx={s.cx}
        cy={s.cy}
        r={s.r + 6}
        fill="none"
        stroke={ringColor}
        strokeWidth={selected ? 2 : 1.5}
        opacity={dimmed && !selected ? 0 : ringVisible ? 1 : 0}
        style={ringStyle}
      />
    ) : (
      <rect
        x={s.x - 5}
        y={s.y - 5}
        width={s.w + 10}
        height={s.h + 10}
        rx={4}
        fill="none"
        stroke={ringColor}
        strokeWidth={selected ? 2 : 1.5}
        opacity={dimmed && !selected ? 0 : ringVisible ? 1 : 0}
        style={ringStyle}
      />
    )

  // ticks de canto estilo mira
  const ticks =
    s.kind === 'circle' ? (
      [45, 135, 225, 315].map((a) => {
        const rad = ((a - 90) * Math.PI) / 180
        const x1 = s.cx + (s.r + 3) * Math.cos(rad)
        const y1 = s.cy + (s.r + 3) * Math.sin(rad)
        const x2 = s.cx + (s.r + 10) * Math.cos(rad)
        const y2 = s.cy + (s.r + 10) * Math.sin(rad)
        return (
          <line
            key={a}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={ringColor}
            strokeWidth={1.5}
            opacity={dimmed && !selected ? 0 : active ? 1 : 0}
            style={{ transition: 'opacity 0.2s' }}
          />
        )
      })
    ) : (
      (() => {
        const x0 = s.x - 5
        const y0 = s.y - 5
        const x1 = s.x + s.w + 5
        const y1 = s.y + s.h + 5
        const L = 9
        const paths = [
          `M ${x0} ${y0 + L} L ${x0} ${y0} L ${x0 + L} ${y0}`,
          `M ${x1 - L} ${y0} L ${x1} ${y0} L ${x1} ${y0 + L}`,
          `M ${x1} ${y1 - L} L ${x1} ${y1} L ${x1 - L} ${y1}`,
          `M ${x0 + L} ${y1} L ${x0} ${y1} L ${x0} ${y1 - L}`,
        ]
        return paths.map((d) => (
          <path
            key={d}
            d={d}
            fill="none"
            stroke={ringColor}
            strokeWidth={1.5}
            opacity={dimmed && !selected ? 0 : active ? 1 : 0}
            style={{ transition: 'opacity 0.2s' }}
          />
        ))
      })()
    )

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${inst?.nome ?? id} — ${catMeta(inst?.categoria ?? '').label}`}
      data-hotspot={id}
      className="cursor-pointer outline-none"
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(id)
        }
      }}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(id)}
      onBlur={() => onHover(null)}
    >
      {/* área clicável invisível, ampliada sem invadir o comando vizinho */}
      {hit.type === 'circle' ? (
        <circle cx={hit.cx} cy={hit.cy} r={hit.r} fill="#3FE0FF" fillOpacity={0} />
      ) : (
        <rect x={hit.x} y={hit.y} width={hit.w} height={hit.h} rx={4} fill="#3FE0FF" fillOpacity={0} />
      )}
      {/* pulse sutil cyan (hotspots sugeridos), respeitando a forma real */}
      {pulseDelay !== null && !dimmed &&
        (s.kind === 'circle' ? (
          <circle
            cx={s.cx}
            cy={s.cy}
            r={s.r + 7}
            fill="none"
            stroke="#3FE0FF"
            strokeWidth={1.5}
            pointerEvents="none"
            className="animate-hotspot-pulse"
            style={{ animationDelay: `${pulseDelay}s`, transformBox: 'fill-box', transformOrigin: 'center' }}
          />
        ) : (
          <rect
            x={s.x - 7}
            y={s.y - 7}
            width={s.w + 14}
            height={s.h + 14}
            rx={7}
            fill="none"
            stroke="#3FE0FF"
            strokeWidth={1.5}
            pointerEvents="none"
            className="animate-hotspot-pulse"
            style={{ animationDelay: `${pulseDelay}s`, transformBox: 'fill-box', transformOrigin: 'center' }}
          />
        ))}
      {ring}
      {ticks}
    </g>
  )
}

// ---------------------------------------------------------------------------
// Camada de rótulos (tags mono + leader lines)
// ---------------------------------------------------------------------------

function edgePoint(shape: HotspotShape, lx: number, ly: number) {
  const c = shape.kind === 'circle' ? { x: shape.cx, y: shape.cy } : { x: shape.x + shape.w / 2, y: shape.y + shape.h / 2 }
  const dx = lx - c.x
  const dy = ly - c.y
  const len = Math.hypot(dx, dy) || 1
  if (shape.kind === 'circle') {
    return { x: c.x + (dx / len) * (shape.r + 2), y: c.y + (dy / len) * (shape.r + 2) }
  }
  // clamp ao retângulo expandido
  const hw = shape.w / 2 + 2
  const hh = shape.h / 2 + 2
  const t = Math.min(hw / Math.max(1e-6, Math.abs(dx)), hh / Math.max(1e-6, Math.abs(dy)), 1)
  return { x: c.x + dx * t, y: c.y + dy * t }
}

function LabelsLayer({ night, showAll, activeId }: { night: boolean; showAll: boolean; activeId: string | null }) {
  const ids = showAll ? PANEL_ORDER : activeId ? [activeId] : []
  return (
    <g aria-hidden="true" pointerEvents="none">
      {ids.map((id) => {
        const e = PANEL_MAP[id]
        const p = edgePoint(e.shape, e.label.x, e.label.y)
        const overTan = e.label.y >= 612 && e.label.y <= 700
        const color = !night && overTan ? '#15343D' : '#3FE0FF'
        const textOpacity = !night && overTan ? 1 : 0.85
        return (
          <g key={id} data-cockpit-label={id}>
            <line x1={e.label.x} y1={e.label.y - 2} x2={p.x} y2={p.y} stroke={color} strokeOpacity={0.45} strokeWidth={0.6} />
            <circle cx={p.x} cy={p.y} r={1.4} fill={color} fillOpacity={0.7} />
            <text
              x={e.label.x}
              y={e.label.y}
              textAnchor={e.label.anchor}
              fill={color}
              fillOpacity={textOpacity}
              fontSize={8.5}
              fontFamily={MONO}
              letterSpacing={1}
            >
              {e.tag}
            </text>
          </g>
        )
      })}
    </g>
  )
}

// ---------------------------------------------------------------------------
// Cursor crosshair customizado (design.md §6)
// ---------------------------------------------------------------------------

function CursorNode({
  x,
  y,
  hoverName,
  visible,
}: {
  x: ReturnType<typeof useMotionValue<number>>
  y: ReturnType<typeof useMotionValue<number>>
  hoverName: string | null
  visible: boolean
}) {
  return (
    <motion.div
      aria-hidden="true"
      className={cn('pointer-events-none fixed left-0 top-0 z-[62] transition-opacity duration-150', visible ? 'opacity-100' : 'opacity-0')}
      style={{ x, y }}
    >
      <div className="relative -translate-x-1/2 -translate-y-1/2">
        <svg width="40" height="40" viewBox="0 0 40 40" className="overflow-visible">
          <line x1="20" y1="0" x2="20" y2="13" stroke="#3FE0FF" strokeWidth="1.2" />
          <line x1="20" y1="27" x2="20" y2="40" stroke="#3FE0FF" strokeWidth="1.2" />
          <line x1="0" y1="20" x2="13" y2="20" stroke="#3FE0FF" strokeWidth="1.2" />
          <line x1="27" y1="20" x2="40" y2="20" stroke="#3FE0FF" strokeWidth="1.2" />
          <circle cx="20" cy="20" r="1.6" fill="#3FE0FF" />
          <circle
            cx="20"
            cy="20"
            r="13"
            fill="none"
            stroke="#3FE0FF"
            strokeWidth="1.2"
            style={{ transition: 'opacity 0.15s, transform 0.15s', opacity: hoverName ? 1 : 0, transformBox: 'fill-box', transformOrigin: 'center' }}
          />
        </svg>
        {hoverName && (
          <div className="absolute left-6 top-6 whitespace-nowrap border border-cyan-dim bg-panel/95 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-cyan">
            {hoverName} — clique para detalhes
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Palco
// ---------------------------------------------------------------------------

export default function CockpitPanel({
  pz,
  night,
  labelsOn,
  filterCat,
  selectedId,
  suggestedActive,
  tourTargetId,
  scanlineKey,
  onHover,
  onSelect,
}: PanelProps) {
  const { view, base } = pz
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [cursorIn, setCursorIn] = useState(false)
  const finePointer = useRef(true)
  const cursorX = useMotionValue(-200)
  const cursorY = useMotionValue(-200)

  const hover = (id: string | null) => {
    setHoveredId(id)
    onHover(id)
  }

  const catOf = useMemo(() => Object.fromEntries(instrumentosCockpit.map((i) => [i.id, i.categoria])), [])

  const showAllLabels = labelsOn
  const tourShape = tourTargetId ? PANEL_MAP[tourTargetId]?.shape : null

  const hoverName = hoveredId ? (instrumentById[hoveredId]?.nome ?? null) : null

  return (
    <div
      ref={pz.ref}
      className="relative h-full w-full touch-none overflow-hidden bg-abyss select-none"
      style={{
        cursor: 'none',
        background: 'radial-gradient(ellipse at 50% 46%, #17191a 0%, #0d1011 58%, #070909 100%)',
      }}
      role="group"
      aria-label={`Painel renderizado interativo do PA-34-200 Seneca I — ${PANEL_ORDER.length} instrumentos`}
      {...pz.handlers}
      onMouseMove={(e) => {
        if (!finePointer.current) return
        cursorX.set(e.clientX)
        cursorY.set(e.clientY)
        if (!cursorIn) setCursorIn(true)
      }}
      onMouseEnter={() => {
        finePointer.current = window.matchMedia('(pointer: fine)').matches
        setCursorIn(true)
      }}
      onMouseLeave={() => {
        setCursorIn(false)
        hover(null)
      }}
    >
      <svg className="absolute inset-0 h-full w-full" style={{ display: 'block' }}>
        {/* pulso lento do anel de seleção (neutralizado por prefers-reduced-motion) */}
        <style>{`@keyframes ckSelPulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
        <ArtDefs />
        <g transform={`translate(${view.x} ${view.y}) scale(${view.k * base || 0.0001})`}>
          <RenderedPanel night={night} filterCat={filterCat} selectedId={selectedId} />
          {/* rótulos */}
          {(showAllLabels || hoveredId || selectedId) && (
            <LabelsLayer night={night} showAll={showAllLabels} activeId={hoveredId ?? selectedId} />
          )}
          {/* spotlight do tour */}
          {tourShape && (
            <g pointerEvents="none">
              <mask id="ck-spot">
                <rect x={-4000} y={-4000} width={12000} height={12000} fill="white" />
                {tourShape.kind === 'circle' ? (
                  <circle cx={tourShape.cx} cy={tourShape.cy} r={tourShape.r + 26} fill="black" />
                ) : (
                  <rect
                    x={tourShape.x - 20}
                    y={tourShape.y - 20}
                    width={tourShape.w + 40}
                    height={tourShape.h + 40}
                    rx={10}
                    fill="black"
                  />
                )}
              </mask>
              <rect x={-4000} y={-4000} width={12000} height={12000} fill="#05080D" opacity={0.62} mask="url(#ck-spot)" />
              {tourShape.kind === 'circle' ? (
                <circle cx={tourShape.cx} cy={tourShape.cy} r={tourShape.r + 26} fill="none" stroke="#3FE0FF" strokeWidth={1.5} strokeDasharray="6 5" opacity={0.8} />
              ) : (
                <rect
                  x={tourShape.x - 20}
                  y={tourShape.y - 20}
                  width={tourShape.w + 40}
                  height={tourShape.h + 40}
                  rx={10}
                  fill="none"
                  stroke="#3FE0FF"
                  strokeWidth={1.5}
                  strokeDasharray="6 5"
                  opacity={0.8}
                />
              )}
            </g>
          )}
          {/* hotspots (sempre por cima) */}
          <g>
            {PANEL_ORDER.map((id) => {
              const e = PANEL_MAP[id]
              const dim = filterCat !== null && catOf[id] !== filterCat
              const match = filterCat !== null && catOf[id] === filterCat
              const pulseIdx = suggestedActive ? SUGGESTED.indexOf(id) : -1
              return (
                <Hotspot
                  key={id}
                  id={id}
                  entry={e}
                  hovered={hoveredId === id}
                  selected={selectedId === id}
                  catMatch={match ? catMeta(filterCat).color : null}
                  dimmed={dim}
                  pulseDelay={pulseIdx >= 0 ? pulseIdx * 0.45 : null}
                  onHover={hover}
                  onSelect={onSelect}
                />
              )
            })}
          </g>
        </g>
      </svg>

      {/* parafusos de canto do palco (componente compartilhado PanelScrews) */}
      <div className="pointer-events-none absolute inset-0 z-20" aria-hidden="true">
        <CornerScrews size={12} />
      </div>

      {/* scanline de entrada do tour */}
      {scanlineKey > 0 && (
        <motion.div
          key={scanlineKey}
          aria-hidden="true"
          initial={{ top: '-2%', opacity: 0.9 }}
          animate={{ top: '102%', opacity: [0.9, 0.9, 0] }}
          transition={{ duration: 0.8, ease: 'linear' }}
          className="pointer-events-none absolute inset-x-0 z-30 h-[3px]"
          style={{ background: 'linear-gradient(90deg, transparent, #3FE0FF, transparent)', boxShadow: '0 0 18px rgba(63,224,255,0.7)' }}
        />
      )}

      {/* botões de zoom */}
      <div
        className="absolute bottom-4 right-4 z-20 flex gap-2"
        style={{ cursor: 'default' }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => pz.zoomAt(pz.size.w / 2, pz.size.h / 2, 1.35, true)}
          className="flex h-9 w-9 items-center justify-center border border-hairline bg-panel/85 text-ink backdrop-blur transition-colors hover:border-cyan-dim hover:text-cyan"
          aria-label="Aproximar (zoom +)"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => pz.zoomAt(pz.size.w / 2, pz.size.h / 2, 1 / 1.35, true)}
          className="flex h-9 w-9 items-center justify-center border border-hairline bg-panel/85 text-ink backdrop-blur transition-colors hover:border-cyan-dim hover:text-cyan"
          aria-label="Afastar (zoom −)"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => pz.reset()}
          className="flex h-9 items-center gap-1.5 border border-hairline bg-panel/85 px-2.5 font-mono text-[10px] tracking-[0.14em] text-ink backdrop-blur transition-colors hover:border-cyan-dim hover:text-cyan"
          aria-label="Recentrar o painel"
        >
          <Maximize className="h-3.5 w-3.5" /> RESET
        </button>
      </div>

      {/* indicador de zoom */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-20 border border-hairline bg-panel/85 px-2 py-1 font-mono text-[10px] tracking-[0.14em] text-faint backdrop-blur" aria-hidden="true">
        ZOOM {(view.k * 100).toFixed(0)}%
      </div>

      {/* cursor crosshair */}
      {typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches && (
        <CursorNode x={cursorX} y={cursorY} hoverName={hoverName} visible={cursorIn} />
      )}
    </div>
  )
}
