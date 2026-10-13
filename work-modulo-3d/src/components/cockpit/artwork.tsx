// artwork — desenho vetorial (SVG) dos 49 instrumentos do painel (cockpit.md §2).
// Estilo: painel frontal clássico do Seneca I, com chapa grafite curva, faixa
// inferior bege, aros metálicos e arcos conforme `operacao` de cada instrumento.
// Modo NOITE: mostradores apagados com marcações retroiluminadas âmbar e
// anunciadores acesos. Nenhuma imagem raster é usada.

import { useEffect, useId, useState } from 'react'
import type { ReactNode } from 'react'
import { PANEL_MAP } from './panel-data'
import type { HotspotCircle, HotspotRect } from './panel-data'

export interface ArtCtx {
  night: boolean
  sweep: boolean // agulhas varrem do zero ao regime (miniatura do drawer / seções)
}

const MONO = "'IBM Plex Mono', ui-monospace, monospace"

// ---------------------------------------------------------------------------
// Paleta dia/noite
// ---------------------------------------------------------------------------

interface Pal {
  face: string
  mark: string
  sub: string
  plate: string
  raised: string
  hair: string
  display: string
  dispText: string
  screw: string
  trimRaised: string
  edge: string
}

export function pal(night: boolean): Pal {
  return night
    ? {
        face: '#080908',
        mark: '#F1DDB7',
        sub: '#A99B82',
        plate: '#0C0D0D',
        raised: '#151718',
        hair: '#3B3A36',
        display: '#030403',
        dispText: '#F4A742',
        screw: '#817B6E',
        trimRaised: '#77684E',
        edge: '#9A8767',
      }
    : {
        face: '#111210',
        mark: '#EFE9DB',
        sub: '#9D988D',
        plate: '#1A1B1A',
        raised: '#272826',
        hair: '#4C4D48',
        display: '#070806',
        dispText: '#FFBA55',
        screw: '#8F8B80',
        trimRaised: '#C6B490',
        edge: '#6F624C',
      }
}

export const ARC = {
  green: '#3DDC97',
  amber: '#FFB020',
  red: '#FF4D4D',
  blue: '#5B9DFF',
  white: '#E9E4D8',
}

// ---------------------------------------------------------------------------
// Helpers geométricos
// ---------------------------------------------------------------------------

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p0 = polar(cx, cy, r, a0)
  const p1 = polar(cx, cy, r, a1)
  const large = a1 - a0 > 180 ? 1 : 0
  return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`
}

// ---------------------------------------------------------------------------
// Tween p/ gauge sweep (agulha 0 → regime, 0.9s, ease mecânico)
// ---------------------------------------------------------------------------

function useTweenAngle(from: number, to: number, active: boolean, duration = 900): number {
  const [v, setV] = useState(active ? from : to)
  useEffect(() => {
    if (!active) {
      setV(to)
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setV(to)
      return
    }
    let raf = 0
    let t0: number | null = null
    const tick = (now: number) => {
      if (t0 === null) t0 = now
      const t = Math.min(1, (now - t0) / duration)
      // ease mecânico aproximado cubic-bezier(0.7, 0, 0.2, 1)
      const e = 1 - Math.pow(1 - t, 3) * (1 - 0.3 * t)
      setV(from + (to - from) * e)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [from, to, active, duration])
  return v
}

// ---------------------------------------------------------------------------
// Primitivas de mostrador redondo
// ---------------------------------------------------------------------------

function Bezel({ cx, cy, r, p }: { cx: number; cy: number; r: number; p: Pal }) {
  return (
    <g aria-hidden="true">
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="url(#ck-bezel)"
        stroke={p.hair}
        strokeWidth={1.2}
        filter="url(#ck-bezel-shadow)"
      />
      <circle cx={cx} cy={cy} r={r - 2.6} fill="none" stroke={p.edge} strokeOpacity={0.5} strokeWidth={0.9} />
      <path
        d={arcPath(cx, cy, r - 1.6, -68, 58)}
        fill="none"
        stroke="#E0D7C4"
        strokeOpacity={0.2}
        strokeWidth={Math.max(0.65, r * 0.014)}
        strokeLinecap="round"
      />
      <path
        d={arcPath(cx, cy, r - 2.2, 110, 250)}
        fill="none"
        stroke="#000000"
        strokeOpacity={0.42}
        strokeWidth={1.1}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={r - 5} fill="none" stroke="#000" strokeOpacity={0.72} strokeWidth={1.2} />
      {/* parafusos do aro */}
      {[45, 135, 225, 315].map((a) => {
        const pt = polar(cx, cy, r - 2, a)
        return <circle key={a} cx={pt.x} cy={pt.y} r={Math.max(1.1, r * 0.022)} fill={p.screw} opacity={0.85} />
      })}
    </g>
  )
}

function Face({ cx, cy, r, p }: { cx: number; cy: number; r: number; p: Pal }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r - 5} fill={p.face} stroke="#000" strokeOpacity={0.78} strokeWidth={0.9} />
      {/* reflexo de vidro contido no mostrador */}
      <path
        d={arcPath(cx, cy, (r - 5) * 0.72, -165, -105)}
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity={0.07}
        strokeWidth={(r - 5) * 0.23}
        strokeLinecap="round"
      />
      <path
        d={arcPath(cx, cy, (r - 8) * 0.78, -68, 58)}
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity={0.045}
        strokeWidth={Math.max(1, (r - 5) * 0.1)}
        strokeLinecap="round"
      />
    </>
  )
}

interface ScaleCfg {
  min: number
  max: number
  start?: number // ângulo do mínimo (graus, 0 = topo, horário)
  end?: number
}

function angleOf(v: number, s: ScaleCfg) {
  const start = s.start ?? -225
  const end = s.end ?? 45
  return start + ((v - s.min) / (s.max - s.min)) * (end - start)
}

function Ticks({
  cx,
  cy,
  r,
  s,
  majors,
  minors = [],
  fmt = (v) => String(v),
  p,
}: {
  cx: number
  cy: number
  r: number
  s: ScaleCfg
  majors: number[]
  minors?: number[]
  fmt?: (v: number) => string
  p: Pal
}) {
  const ri = r - 8
  const fontN = Math.max(6, r * 0.155)
  return (
    <g aria-hidden="true">
      {minors.map((v) => {
        const a = angleOf(v, s)
        const p1 = polar(cx, cy, ri, a)
        const p2 = polar(cx, cy, ri - r * 0.07, a)
        return <line key={`m${v}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={p.sub} strokeWidth={0.8} opacity={0.8} />
      })}
      {majors.map((v) => {
        const a = angleOf(v, s)
        const p1 = polar(cx, cy, ri, a)
        const p2 = polar(cx, cy, ri - r * 0.12, a)
        const pt = polar(cx, cy, ri - r * 0.26, a)
        return (
          <g key={`M${v}`}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={p.mark} strokeWidth={Math.max(1, r * 0.02)} />
            <text
              x={pt.x}
              y={pt.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill={p.mark}
              fontSize={fontN}
              fontFamily={MONO}
            >
              {fmt(v)}
            </text>
          </g>
        )
      })}
    </g>
  )
}

function ArcBand({
  cx,
  cy,
  r,
  s,
  v0,
  v1,
  color,
  w,
}: {
  cx: number
  cy: number
  r: number
  s: ScaleCfg
  v0: number
  v1: number
  color: string
  w?: number
}) {
  const rr = r - 8
  return (
    <path
      d={arcPath(cx, cy, rr, angleOf(v0, s), angleOf(v1, s))}
      fill="none"
      stroke={color}
      strokeWidth={w ?? Math.max(2.5, r * 0.075)}
    />
  )
}

function RadialMark({
  cx,
  cy,
  r,
  s,
  v,
  color,
  w,
  len,
}: {
  cx: number
  cy: number
  r: number
  s: ScaleCfg
  v: number
  color: string
  w?: number
  len?: number
}) {
  const a = angleOf(v, s)
  const p1 = polar(cx, cy, r - 5, a)
  const p2 = polar(cx, cy, r - 5 - (len ?? r * 0.24), a)
  return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={color} strokeWidth={w ?? Math.max(2, r * 0.05)} />
}

function Needle({
  cx,
  cy,
  r,
  angle,
  fromAngle,
  color = '#E8F0F7',
  sweep,
  tail = true,
  width,
}: {
  cx: number
  cy: number
  r: number
  angle: number
  fromAngle?: number
  color?: string
  sweep: boolean
  tail?: boolean
  width?: number
}) {
  const a = useTweenAngle(fromAngle ?? angle, angle, sweep)
  const tip = polar(cx, cy, r - 10, a)
  const back = polar(cx, cy, r * 0.18, a + 180)
  return (
    <g aria-hidden="true">
      {tail && <line x1={cx} y1={cy} x2={back.x} y2={back.y} stroke={color} strokeWidth={(width ?? 2.2) + 1.2} strokeLinecap="round" />}
      <line x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke={color} strokeWidth={width ?? 2.2} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={Math.max(2.4, r * 0.055)} fill="#0A1018" stroke="#54687E" strokeWidth={1} />
    </g>
  )
}

function GaugeLabel({ cx, cy, r, label, sub, p }: { cx: number; cy: number; r: number; label: string; sub?: string; p: Pal }) {
  return (
    <g aria-hidden="true">
      <text x={cx} y={cy + r * 0.44} textAnchor="middle" fill={p.sub} fontSize={Math.max(6, r * 0.125)} fontFamily={MONO} letterSpacing={0.5}>
        {label}
      </text>
      {sub && (
        <text x={cx} y={cy + r * 0.62} textAnchor="middle" fill={p.sub} fontSize={Math.max(5, r * 0.1)} fontFamily={MONO} opacity={0.85}>
          {sub}
        </text>
      )}
    </g>
  )
}

// Config-driven generic round gauge
interface GenericCfg extends ScaleCfg {
  majors: number[]
  minors?: number[]
  fmt?: (v: number) => string
  arcs?: { v0: number; v1: number; color: string; w?: number }[]
  marks?: { v: number; color: string; w?: number }[]
  needles: { v: number; color?: string }[]
  label: string
  sub?: string
}

function GenericGauge({ sh, p, ctx, cfg }: { sh: HotspotCircle; p: Pal; ctx: ArtCtx; cfg: GenericCfg }) {
  const { cx, cy, r } = sh
  return (
    <g>
      <Bezel cx={cx} cy={cy} r={r} p={p} />
      <Face cx={cx} cy={cy} r={r} p={p} />
      {cfg.arcs?.map((a, i) => (
        <ArcBand key={i} cx={cx} cy={cy} r={r} s={cfg} v0={a.v0} v1={a.v1} color={a.color} w={a.w} />
      ))}
      <Ticks cx={cx} cy={cy} r={r} s={cfg} majors={cfg.majors} minors={cfg.minors} fmt={cfg.fmt} p={p} />
      {cfg.marks?.map((m, i) => (
        <RadialMark key={i} cx={cx} cy={cy} r={r} s={cfg} v={m.v} color={m.color} w={m.w} />
      ))}
      {cfg.needles.map((n, i) => (
        <Needle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          angle={angleOf(n.v, cfg)}
          fromAngle={angleOf(cfg.min, cfg)}
          color={n.color}
          sweep={ctx.sweep}
          width={cfg.needles.length > 1 ? Math.max(1.6, r * 0.035) : undefined}
        />
      ))}
      <GaugeLabel cx={cx} cy={cy} r={r} label={cfg.label} sub={cfg.sub} p={p} />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Módulos retangulares (rádios, interruptores, luzes, comandos)
// ---------------------------------------------------------------------------

function ModuleShell({ s, p, label }: { s: HotspotRect; p: Pal; label?: string }) {
  return (
    <g aria-hidden="true">
      <rect
        x={s.x}
        y={s.y}
        width={s.w}
        height={s.h}
        rx={3}
        fill={p.raised}
        stroke={p.hair}
        strokeOpacity={0.48}
        strokeWidth={0.75}
        filter="url(#ck-module-shadow)"
      />
      <path
        d={`M ${s.x + 5} ${s.y + 3} H ${s.x + s.w - 5}`}
        fill="none"
        stroke={p.edge}
        strokeOpacity={0.18}
        strokeWidth={0.65}
      />
      {label && (
        <text x={s.x + 10} y={s.y + 13} fill={p.sub} fontSize={7} fontFamily={MONO} letterSpacing={0.8}>
          {label}
        </text>
      )}
    </g>
  )
}

function Lamp({
  x,
  y,
  size,
  color,
  on,
  label,
  round,
}: {
  x: number
  y: number
  size: number
  color: string
  on: boolean
  label?: string
  round?: boolean
}) {
  const body = round ? (
    <circle cx={x + size / 2} cy={y + size / 2} r={size / 2} fill={color} fillOpacity={on ? 1 : 0.22} stroke="#000" strokeOpacity={0.6} strokeWidth={1} />
  ) : (
    <rect x={x} y={y} width={size} height={size} rx={2} fill={color} fillOpacity={on ? 1 : 0.22} stroke="#000" strokeOpacity={0.6} strokeWidth={1} />
  )
  return (
    <g
      aria-hidden="true"
      style={on ? { filter: `drop-shadow(0 0 ${size * 0.35}px ${color})` } : undefined}
    >
      {body}
      {label && (
        <text x={x + size / 2} y={y + size / 2 + 2.5} textAnchor="middle" fontSize={6} fontFamily={MONO} fill={on ? '#05080D' : '#93A6BB'} fontWeight={600}>
          {label}
        </text>
      )}
    </g>
  )
}

function DisplayWin({ x, y, w, h, lines, p, fontSize = 12 }: { x: number; y: number; w: number; h: number; lines: string[]; p: Pal; fontSize?: number }) {
  return (
    <g aria-hidden="true">
      <rect x={x} y={y} width={w} height={h} rx={2} fill={p.display} stroke="#000" strokeOpacity={0.7} strokeWidth={1} />
      {lines.map((t, i) => (
        <text
          key={i}
          x={x + 6}
          y={y + h / 2 + (i - (lines.length - 1) / 2) * (fontSize + 2) + fontSize * 0.35}
          fill={p.dispText}
          fontSize={fontSize}
          fontFamily={MONO}
          style={{ filter: 'drop-shadow(0 0 3px rgba(255,176,32,0.5))' }}
        >
          {t}
        </text>
      ))}
    </g>
  )
}

function Rocker({ x, y, w = 14, h = 24, up = true, p }: { x: number; y: number; w?: number; h?: number; up?: boolean; p: Pal }) {
  return (
    <g aria-hidden="true">
      <rect x={x} y={y} width={w} height={h} rx={2} fill="#0B1220" stroke={p.hair} strokeWidth={1} />
      <rect x={x + 1.5} y={up ? y + 1.5 : y + h / 2} width={w - 3} height={h / 2 - 1.5} rx={1.5} fill="#D7E4F0" opacity={0.85} />
    </g>
  )
}

function Knob({ cx, cy, r, p, angle = 0, color = '#1B222C' }: { cx: number; cy: number; r: number; p: Pal; angle?: number; color?: string }) {
  const pt = polar(cx, cy, r * 0.62, angle)
  return (
    <g aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} fill={color} stroke={p.screw} strokeWidth={1} />
      <line x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#D7E4F0" strokeWidth={1.4} />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Instrumentos redondos especiais
// ---------------------------------------------------------------------------

function Altimetro({ sh, p, ctx }: { sh: HotspotCircle; p: Pal; ctx: ArtCtx }) {
  const { cx, cy, r } = sh
  const s: ScaleCfg = { min: 0, max: 10, start: -90, end: 270 }
  const alt = 1500 // indicação estática de referência
  const n100 = (alt % 1000) / 100 // 0–10
  const n1000 = (alt % 10000) / 1000
  const n10000 = alt / 10000
  return (
    <g>
      <Bezel cx={cx} cy={cy} r={r} p={p} />
      <Face cx={cx} cy={cy} r={r} p={p} />
      {/* o "3" cede lugar à janela Kollsman, como no instrumento real */}
      <Ticks cx={cx} cy={cy} r={r} s={s} majors={[0, 1, 2, 4, 5, 6, 7, 8, 9]} p={p} />
      {/* janela Kollsman */}
      <rect x={cx + r * 0.18} y={cy - r * 0.1} width={r * 0.5} height={r * 0.2} rx={1.5} fill={p.display} stroke={p.hair} strokeWidth={0.75} />
      <text x={cx + r * 0.43} y={cy + r * 0.04} textAnchor="middle" fontSize={r * 0.13} fontFamily={MONO} fill={p.dispText}>
        29.92
      </text>
      {/* agulha 10.000 ft (curta/larga) */}
      <Needle cx={cx} cy={cy} r={r * 0.52} angle={angleOf(n10000, s)} color="#93A6BB" sweep={ctx.sweep} tail={false} width={r * 0.07} />
      {/* agulha 1.000 ft (média) */}
      <Needle cx={cx} cy={cy} r={r * 0.72} angle={angleOf(n1000, s)} color="#D7E4F0" sweep={ctx.sweep} tail={false} width={r * 0.045} />
      {/* agulha 100 ft (longa/fina) */}
      <Needle cx={cx} cy={cy} r={r} angle={angleOf(n100, s)} color="#E8F0F7" sweep={ctx.sweep} width={Math.max(1.6, r * 0.028)} />
      <GaugeLabel cx={cx} cy={cy + r * 0.28} r={r} label="ALT" sub="FT ×100" p={p} />
    </g>
  )
}

// Bisel plano preto (plástico), não o cromado das agulhas mecânicas — os
// dois instrumentos abaixo representam telas eletrônicas Garmin G5 reais,
// não giroscópios a vácuo/elétricos clássicos.
function G5Bezel({ cx, cy, r, p }: { cx: number; cy: number; r: number; p: Pal }) {
  return (
    <g aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} fill="#0B0C0D" stroke={p.hair} strokeOpacity={0.55} strokeWidth={1} />
      <circle cx={cx} cy={cy} r={r - 3.5} fill="none" stroke="#000" strokeOpacity={0.6} strokeWidth={1.2} />
      <text x={cx} y={cy + r - 4.5} textAnchor="middle" fill="#8FD6FF" fillOpacity={0.55} fontSize={r * 0.1} fontFamily={MONO}>
        G5
      </text>
    </g>
  )
}

function Horizonte({ sh, p }: { sh: HotspotCircle; p: Pal }) {
  const { cx, cy, r } = sh
  const ri = r - 7
  const clipId = useId()
  return (
    <g>
      <G5Bezel cx={cx} cy={cy} r={r} p={p} />
      <clipPath id={clipId}>
        <circle cx={cx} cy={cy} r={ri} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect x={cx - ri} y={cy - ri} width={ri * 2} height={ri} fill="#1C4A6E" />
        <rect x={cx - ri} y={cy} width={ri * 2} height={ri} fill="#6B4A24" />
        <line x1={cx - ri} y1={cy} x2={cx + ri} y2={cy} stroke="#F2F7FB" strokeWidth={1.2} />
        {/* escada de arfagem fina, estilo tela digital */}
        {[-20, -10, 10, 20].map((d) => (
          <g key={d}>
            <line
              x1={cx - r * (Math.abs(d) === 10 ? 0.24 : 0.14)}
              y1={cy + d * (r / 60)}
              x2={cx + r * (Math.abs(d) === 10 ? 0.24 : 0.14)}
              y2={cy + d * (r / 60)}
              stroke="#F2F7FB"
              strokeWidth={0.7}
              opacity={0.9}
            />
            {Math.abs(d) === 20 && (
              <text x={cx - r * 0.32} y={cy + d * (r / 60) + 2} fill="#F2F7FB" fontSize={r * 0.09} fontFamily={MONO} opacity={0.85}>
                {Math.abs(d)}
              </text>
            )}
          </g>
        ))}
      </g>
      {/* escala de inclinação — traços finos, sem massa de agulha mecânica */}
      {[0, 10, 20, 30, 60].flatMap((d) => (d === 0 ? [0] : [d, -d])).map((d) => {
        const p1 = polar(cx, cy, ri, d)
        const p2 = polar(cx, cy, ri - (d === 0 ? r * 0.12 : r * 0.06), d)
        return <line key={d} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#F2F7FB" strokeWidth={0.9} />
      })}
      {/* aviãozinho fixo, laranja digital */}
      <g stroke="#FFB020" strokeWidth={2} strokeLinecap="round">
        <line x1={cx - r * 0.3} y1={cy} x2={cx - r * 0.08} y2={cy} />
        <line x1={cx + r * 0.08} y1={cy} x2={cx + r * 0.3} y2={cy} />
      </g>
      <circle cx={cx} cy={cy} r={1.5} fill="#FFB020" />
      {(() => {
        const p1 = polar(cx, cy, ri - 3, 0)
        return <path d={`M ${cx} ${p1.y - 3} L ${cx - 3} ${p1.y + 2.5} L ${cx + 3} ${p1.y + 2.5} Z`} fill="#FFB020" />
      })()}
      {/* faixa de proa digital na base, característica do G5 */}
      <rect x={cx - r * 0.22} y={cy + ri - r * 0.13} width={r * 0.44} height={r * 0.16} rx={1.5} fill="#000" fillOpacity={0.55} />
      <text x={cx} y={cy + ri - r * 0.02} textAnchor="middle" fill="#F2F7FB" fontSize={r * 0.13} fontFamily={MONO}>
        360
      </text>
      <text x={cx} y={cy + r - 2} textAnchor="middle" fill="#8FD6FF" fillOpacity={0.7} fontSize={r * 0.1} fontFamily={MONO}>
        LVL
      </text>
    </g>
  )
}

function GiroDirecional({ sh, p }: { sh: HotspotCircle; p: Pal }) {
  const { cx, cy, r } = sh
  const ri = r - 7
  const card: { a: number; t: string; big?: boolean }[] = [
    { a: 0, t: 'N', big: true },
    { a: 30, t: '3' },
    { a: 60, t: '6' },
    { a: 90, t: 'E', big: true },
    { a: 120, t: '12' },
    { a: 150, t: '15' },
    { a: 180, t: 'S', big: true },
    { a: 210, t: '21' },
    { a: 240, t: '24' },
    { a: 270, t: 'W', big: true },
    { a: 300, t: '30' },
    { a: 330, t: '33' },
  ]
  return (
    <g>
      <G5Bezel cx={cx} cy={cy} r={r} p={p} />
      <circle cx={cx} cy={cy} r={ri} fill="#0C1B24" />
      <circle cx={cx} cy={cy} r={ri - 4} fill="none" stroke="#3A6E86" strokeOpacity={0.7} strokeWidth={0.8} />
      {card.map((c) => {
        const pt = polar(cx, cy, ri - r * 0.2, c.a)
        const t1 = polar(cx, cy, ri - 4, c.a)
        const t2 = polar(cx, cy, ri - r * 0.11, c.a)
        return (
          <g key={c.a}>
            <line x1={t1.x} y1={t1.y} x2={t2.x} y2={t2.y} stroke="#F2F7FB" strokeWidth={0.8} />
            <text x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="central" fill="#F2F7FB" fontSize={c.big ? r * 0.18 : r * 0.13} fontFamily={MONO}>
              {c.t}
            </text>
          </g>
        )
      })}
      {/* linha de fé (lubber) */}
      {(() => {
        const pt = polar(cx, cy, ri - 1, 0)
        return <path d={`M ${cx} ${pt.y + 2} L ${cx - 4} ${pt.y + 10} L ${cx + 4} ${pt.y + 10} Z`} fill="#FFB020" />
      })()}
      {/* agulha de curso magenta, característica de HSI digital */}
      {(() => {
        const p1 = polar(cx, cy, ri - 2, 35)
        const p2 = polar(cx, cy, ri - 2, 215)
        return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#E85DD6" strokeWidth={1.3} />
      })()}
      {(() => {
        const pt = polar(cx, cy, ri + 1, 35)
        return <circle cx={pt.x} cy={pt.y} r={2.6} fill="none" stroke="#5B9DFF" strokeWidth={1.2} />
      })()}
      {/* aviãozinho */}
      <g stroke="#F2F7FB" strokeWidth={1.4} strokeLinecap="round">
        <line x1={cx} y1={cy - r * 0.16} x2={cx} y2={cy + r * 0.12} />
        <line x1={cx - r * 0.16} y1={cy} x2={cx + r * 0.16} y2={cy} />
        <line x1={cx - r * 0.07} y1={cy + r * 0.12} x2={cx + r * 0.07} y2={cy + r * 0.12} />
      </g>
      {/* caixa digital de proa no topo, característica do G5 em modo HSI */}
      <rect x={cx - r * 0.22} y={cy - r * 0.86} width={r * 0.44} height={r * 0.18} rx={1.5} fill="#000" fillOpacity={0.6} />
      <text x={cx} y={cy - r * 0.73} textAnchor="middle" fill="#F2F7FB" fontSize={r * 0.14} fontFamily={MONO}>
        035
      </text>
    </g>
  )
}

function Coordenador({ sh, p }: { sh: HotspotCircle; p: Pal }) {
  const { cx, cy, r } = sh
  return (
    <g>
      <Bezel cx={cx} cy={cy} r={r} p={p} />
      <Face cx={cx} cy={cy} r={r} p={p} />
      {/* marcas L/R */}
      <text x={cx - r * 0.52} y={cy - r * 0.05} fill={p.mark} fontSize={r * 0.14} fontFamily={MONO} textAnchor="middle">
        L
      </text>
      <text x={cx + r * 0.52} y={cy - r * 0.05} fill={p.mark} fontSize={r * 0.14} fontFamily={MONO} textAnchor="middle">
        R
      </text>
      {[cx - r * 0.3, cx + r * 0.3].map((x, i) => (
        <line key={i} x1={x} y1={cy - r * 0.14} x2={x} y2={cy - r * 0.02} stroke={p.mark} strokeWidth={1.2} />
      ))}
      {/* aviãozinho (vista de popa) */}
      <g stroke="#E8F0F7" strokeWidth={2.2} strokeLinecap="round">
        <line x1={cx - r * 0.3} y1={cy + r * 0.06} x2={cx + r * 0.3} y2={cy + r * 0.06} />
        <line x1={cx} y1={cy + r * 0.06} x2={cx} y2={cy + r * 0.26} />
      </g>
      <text x={cx} y={cy - r * 0.32} textAnchor="middle" fill={p.sub} fontSize={r * 0.11} fontFamily={MONO}>
        2 MIN
      </text>
      {/* inclinômetro (bolinha) */}
      <rect x={cx - r * 0.4} y={cy + r * 0.42} width={r * 0.8} height={r * 0.18} rx={r * 0.09} fill="#0A1220" stroke={p.hair} strokeWidth={1} />
      <line x1={cx - r * 0.1} y1={cy + r * 0.44} x2={cx - r * 0.1} y2={cy + r * 0.58} stroke={p.mark} strokeWidth={1} />
      <line x1={cx + r * 0.1} y1={cy + r * 0.44} x2={cx + r * 0.1} y2={cy + r * 0.58} stroke={p.mark} strokeWidth={1} />
      <circle cx={cx} cy={cy + r * 0.51} r={r * 0.06} fill="#0A1018" stroke="#D7E4F0" strokeWidth={1.2} />
      <GaugeLabel cx={cx} cy={cy + r * 0.8} r={r} label="TURN" p={p} />
    </g>
  )
}

function Cdi({ sh, p, gs }: { sh: HotspotCircle; p: Pal; gs?: boolean }) {
  const { cx, cy, r } = sh
  return (
    <g>
      <Bezel cx={cx} cy={cy} r={r} p={p} />
      <Face cx={cx} cy={cy} r={r} p={p} />
      {/* seta de curso */}
      <g stroke={p.mark} strokeWidth={1.2}>
        <line x1={cx} y1={cy - r * 0.62} x2={cx} y2={cy + r * 0.62} opacity={0.4} />
        <line x1={cx - r * 0.62} y1={cy} x2={cx + r * 0.62} y2={cy} opacity={0.4} />
      </g>
      <path d={`M ${cx} ${cy - r * 0.68} L ${cx - r * 0.07} ${cy - r * 0.52} L ${cx + r * 0.07} ${cy - r * 0.52} Z`} fill={p.mark} />
      {/* pontos de desvio */}
      {[-2, -1, 1, 2].map((d) => (
        <circle key={d} cx={cx + d * r * 0.18} cy={cy} r={r * 0.035} fill={p.mark} />
      ))}
      {gs &&
        [-2, -1, 1, 2].map((d) => <circle key={d} cx={cx} cy={cy + d * r * 0.18} r={r * 0.035} fill={p.mark} />)}
      {/* agulha de desvio */}
      <line x1={cx + r * 0.18} y1={cy - r * 0.5} x2={cx + r * 0.18} y2={cy + r * 0.5} stroke={ARC.amber} strokeWidth={2.2} />
      {gs && <line x1={cx - r * 0.5} y1={cy - r * 0.18} x2={cx + r * 0.5} y2={cy - r * 0.18} stroke={ARC.amber} strokeWidth={2.2} />}
      {/* bandeira TO */}
      <rect x={cx + r * 0.3} y={cy + r * 0.3} width={r * 0.26} height={r * 0.16} rx={1} fill={p.display} stroke={p.hair} strokeWidth={0.75} />
      <text x={cx + r * 0.43} y={cy + r * 0.41} textAnchor="middle" fontSize={r * 0.11} fontFamily={MONO} fill={p.dispText}>
        TO
      </text>
      <GaugeLabel cx={cx} cy={cy - r * 0.3} r={r} label={gs ? 'NAV 2 · GS' : 'NAV 1'} p={p} />
    </g>
  )
}

function Adf({ sh, p }: { sh: HotspotCircle; p: Pal }) {
  const { cx, cy, r } = sh
  const card = [
    { a: 0, t: 'N' },
    { a: 90, t: '3' },
    { a: 180, t: '6' },
    { a: 270, t: '9' },
  ]
  const tip = polar(cx, cy, r - 9, 30)
  const tail = polar(cx, cy, r * 0.35, 210)
  return (
    <g>
      <Bezel cx={cx} cy={cy} r={r} p={p} />
      <Face cx={cx} cy={cy} r={r} p={p} />
      {card.map((c) => {
        const pt = polar(cx, cy, r - r * 0.22, c.a)
        return (
          <text key={c.a} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="central" fill={p.mark} fontSize={r * 0.15} fontFamily={MONO}>
            {c.t}
          </text>
        )
      })}
      {Array.from({ length: 12 }).map((_, i) => {
        const p1 = polar(cx, cy, r - 6, i * 30)
        const p2 = polar(cx, cy, r - 6 - r * 0.08, i * 30)
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={p.sub} strokeWidth={0.9} />
      })}
      <line x1={tail.x} y1={tail.y} x2={tip.x} y2={tip.y} stroke={ARC.blue} strokeWidth={2.4} strokeLinecap="round" />
      <path d={`M ${tip.x} ${tip.y} l -5 -2 l 2 6 Z`} fill={ARC.blue} />
      <circle cx={cx} cy={cy} r={2.6} fill="#0A1018" stroke="#54687E" strokeWidth={1} />
      <GaugeLabel cx={cx} cy={cy + r * 0.52} r={r} label="ADF" p={p} />
    </g>
  )
}

function Relogio({ sh, p }: { sh: HotspotCircle; p: Pal }) {
  const { cx, cy, r } = sh
  const s: ScaleCfg = { min: 0, max: 12, start: -90, end: 270 }
  return (
    <g>
      <Bezel cx={cx} cy={cy} r={r} p={p} />
      <Face cx={cx} cy={cy} r={r} p={p} />
      <Ticks cx={cx} cy={cy} r={r} s={s} majors={[12, 3, 6, 9]} minors={[1, 2, 4, 5, 7, 8, 10, 11]} p={p} />
      {/* 10:09 — posição clássica de mostrador */}
      <Needle cx={cx} cy={cy} r={r * 0.55} angle={angleOf(10.15, s)} color="#D7E4F0" sweep={false} tail={false} width={2.6} />
      <Needle cx={cx} cy={cy} r={r * 0.8} angle={angleOf(1.8, s)} color="#E8F0F7" sweep={false} tail={false} width={1.8} />
      <GaugeLabel cx={cx} cy={cy + r * 0.42} r={r} label="CLOCK" p={p} />
    </g>
  )
}

function Bussola({ s, p }: { s: HotspotRect; p: Pal }) {
  const cx = s.x + s.w / 2
  return (
    <g>
      <ModuleShell s={s} p={p} />
      <rect x={s.x + 10} y={s.y + 7} width={s.w - 20} height={s.h - 14} rx={3} fill={p.display} stroke={p.hair} strokeWidth={0.75} />
      {/* cartão: N ao centro sob a linha de fé */}
      <text x={cx} y={s.y + s.h / 2 + 3.5} textAnchor="middle" fontSize={11} fontFamily={MONO} fill={p.mark}>
        N
      </text>
      <text x={cx - 26} y={s.y + s.h / 2 + 2.5} textAnchor="middle" fontSize={8} fontFamily={MONO} fill={p.sub}>
        33
      </text>
      <text x={cx + 26} y={s.y + s.h / 2 + 2.5} textAnchor="middle" fontSize={8} fontFamily={MONO} fill={p.sub}>
        3
      </text>
      <path d={`M ${cx} ${s.y + 5} L ${cx - 3.5} ${s.y + 10} L ${cx + 3.5} ${s.y + 10} Z`} fill={ARC.amber} />
      <line x1={cx} y1={s.y + s.h - 7} x2={cx} y2={s.y + s.h - 11} stroke={p.mark} strokeWidth={1} />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Módulos específicos — rádios, interruptores, luzes, trem, pedestal
// ---------------------------------------------------------------------------

function caption(s: HotspotRect, p: Pal, text: string, dy = 0) {
  return (
    <text
      x={s.x + s.w / 2}
      y={s.y + s.h - 7 + dy}
      textAnchor="middle"
      fill={p.sub}
      fontSize={6.5}
      fontFamily={MONO}
      letterSpacing={0.8}
      aria-hidden="true"
    >
      {text}
    </text>
  )
}

// Tela única de MFD/GPS moderno (Garmin GNS 530W), substituindo a pilha
// vintage de NAV/COM+ADF+DME por um único vidro — mesmos IDs/hotspots/dados,
// só a representação visual muda (navcom_2/adf_receptor/dme não desenham mais
// caixa própria, ver renderArt). A geometria 3D real do bisel/vidro do GNS
// 530W fica em build_panel.py; este SVG só fornece a serigrafia/tela impressa.
// Garmin GNS 530W real: bisel ~6,30x2,65in (≈2,38:1) — mapa móvel à esquerda
// (maior parte da largura), coluna de dados COM/NAV empilhada à direita,
// softkeys só sob a tela de mapa, knob de volume/tune nos cantos. `s` é o
// próprio retângulo de navcom_1 (não mais uma união com navcom_2/adf/dme).
function Mfd({ s, p }: { s: HotspotRect; p: Pal }) {
  const bezel = 5
  const innerW = s.w - bezel * 2
  const innerH = s.h - bezel * 2
  const mapW = innerW * 0.58
  const dataX = s.x + bezel + mapW + 4
  const dataW = innerW - mapW - 4
  const softkeyH = Math.max(4, innerH * 0.09)
  const mapH = innerH - softkeyH - 3
  const mapY = s.y + bezel
  const glow = { filter: 'drop-shadow(0 0 2px rgba(143,214,255,0.5))' }
  return (
    <g>
      <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={4} fill="#0A0A0C" stroke={p.hair} strokeOpacity={0.6} strokeWidth={1} />
      {/* tela de mapa móvel */}
      <rect x={s.x + bezel} y={mapY} width={mapW} height={mapH} rx={2} fill="#0C1B24" />
      <g opacity={0.35} stroke="#3A6E86" strokeWidth={0.7}>
        <line x1={s.x + bezel + 4} y1={mapY + mapH * 0.3} x2={s.x + bezel + mapW - 4} y2={mapY + mapH * 0.3} />
        <line x1={s.x + bezel + 4} y1={mapY + mapH * 0.62} x2={s.x + bezel + mapW - 4} y2={mapY + mapH * 0.62} />
        <circle cx={s.x + bezel + mapW * 0.5} cy={mapY + mapH * 0.52} r={mapH * 0.3} fill="none" />
      </g>
      <text x={s.x + bezel + 4} y={mapY + 9} fill="#8FD6FF" fillOpacity={0.7} fontSize={4.6} fontFamily={MONO}>
        GPS MAP
      </text>
      {/* knob de volume/squelch, canto superior-esquerdo, sobre a borda */}
      <circle cx={s.x + bezel + 6} cy={s.y + bezel + 1} r={4.2} fill="#151515" stroke={p.screw} strokeWidth={0.8} />
      {/* coluna de dados: COM ativo/standby acima, NAV ativo/standby abaixo */}
      <rect x={dataX} y={mapY} width={dataW} height={mapH * 0.46} rx={2} fill="#050608" stroke={p.hair} strokeOpacity={0.4} strokeWidth={0.6} />
      <text x={dataX + dataW / 2} y={mapY + mapH * 0.13} textAnchor="middle" fill={p.sub} fillOpacity={0.6} fontSize={3.8} fontFamily={MONO}>
        COM
      </text>
      <text x={dataX + dataW / 2} y={mapY + mapH * 0.29} textAnchor="middle" fill="#8FD6FF" fontSize={5.6} fontFamily={MONO} style={glow}>
        118.00
      </text>
      <text x={dataX + dataW / 2} y={mapY + mapH * 0.4} textAnchor="middle" fill="#8FD6FF" fillOpacity={0.55} fontSize={4.2} fontFamily={MONO}>
        121.50
      </text>
      <rect x={dataX} y={mapY + mapH * 0.5} width={dataW} height={mapH * 0.46} rx={2} fill="#050608" stroke={p.hair} strokeOpacity={0.4} strokeWidth={0.6} />
      <text x={dataX + dataW / 2} y={mapY + mapH * 0.63} textAnchor="middle" fill={p.sub} fillOpacity={0.6} fontSize={3.8} fontFamily={MONO}>
        NAV
      </text>
      <text x={dataX + dataW / 2} y={mapY + mapH * 0.79} textAnchor="middle" fill="#8FD6FF" fontSize={5.6} fontFamily={MONO} style={glow}>
        0200
      </text>
      <text x={dataX + dataW / 2} y={mapY + mapH * 0.9} textAnchor="middle" fill="#8FD6FF" fillOpacity={0.55} fontSize={4.2} fontFamily={MONO}>
        001.0NM
      </text>
      {/* botão duplo concêntrico de sintonia, canto inferior-direito da coluna */}
      <circle cx={dataX + dataW * 0.72} cy={mapY + mapH - 6} r={5} fill="#151515" stroke={p.screw} strokeWidth={0.8} />
      <circle cx={dataX + dataW * 0.72} cy={mapY + mapH - 6} r={2.1} fill="#0A0A0C" stroke={p.screw} strokeWidth={0.5} />
      {/* softkeys — só sob a tela de mapa, a coluna de dados não tem softkeys no unit real */}
      {Array.from({ length: 12 }).map((_, i) => {
        const tabW = mapW / 12
        return (
          <rect
            key={i}
            x={s.x + bezel + i * tabW}
            y={s.y + s.h - bezel - softkeyH}
            width={tabW - 1}
            height={softkeyH}
            rx={0.8}
            fill="#1B222C"
            stroke={p.hair}
            strokeOpacity={0.3}
            strokeWidth={0.4}
          />
        )
      })}
    </g>
  )
}

// Segundo rádio (NAV/COM analógico, display âmbar) — unidade física separada
// visível ao lado do GNS 530W na foto de referência, não integrada ao GPS.
function Navcom2({ s, p }: { s: HotspotRect; p: Pal }) {
  const knobR = Math.min(7, s.h * 0.28)
  return (
    <g>
      <ModuleShell s={s} p={p} />
      <DisplayWin x={s.x + 6} y={s.y + s.h * 0.14} w={s.w * 0.62} h={s.h * 0.72} lines={['118.00', '115.50']} p={p} fontSize={7.5} />
      <Knob cx={s.x + s.w - 22} cy={s.y + s.h / 2} r={knobR} p={p} angle={-40} />
      <Knob cx={s.x + s.w - 8} cy={s.y + s.h / 2} r={knobR} p={p} angle={30} />
    </g>
  )
}

// VOR/LOC/GS e DME/RNAV são internos ao GNS 530W (não caixas físicas
// separadas) — mantidos como faixa fina clicável, não totalmente invisíveis.
function IntegradoGns({ s, p, label }: { s: HotspotRect; p: Pal; label: string }) {
  return (
    <g aria-hidden="true">
      <rect x={s.x} y={s.y} width={s.w} height={s.h} fill="none" stroke={p.hair} strokeOpacity={0.25} strokeWidth={0.5} />
      <text x={s.x + s.w / 2} y={s.y + s.h / 2 + 2} textAnchor="middle" fill={p.sub} fillOpacity={0.4} fontSize={4} fontFamily={MONO}>
        {label} — integrado ao GNS 530W
      </text>
    </g>
  )
}

function SwitchBank({ s, p, items, label }: { s: HotspotRect; p: Pal; items: string[]; label: string }) {
  const n = items.length
  const bw = 16
  const gap = (s.w - 24 - n * bw) / Math.max(1, n - 1)
  return (
    <g>
      <ModuleShell s={s} p={p} />
      {items.map((it, i) => {
        const x = s.x + 12 + i * (bw + gap)
        return (
          <g key={it}>
            <Rocker x={x} y={s.y + 10} w={bw} h={Math.min(26, s.h - 38)} p={p} />
            <text x={x + bw / 2} y={s.y + s.h - 16} textAnchor="middle" fill={p.sub} fontSize={5.5} fontFamily={MONO}>
              {it}
            </text>
          </g>
        )
      })}
      {caption(s, p, label)}
    </g>
  )
}

function Magnetos({ s, p }: { s: HotspotRect; p: Pal }) {
  return (
    <g>
      <ModuleShell s={s} p={p} />
      {['L', 'R'].map((m, i) => {
        const x = s.x + 26 + i * 32
        const cy = s.y + 26
        return (
          <g key={m}>
            <Knob cx={x} cy={cy} r={11} p={p} angle={-90} />
            {['O', 'L', 'R', 'B'].map((t, j) => {
              const pt = polar(x, cy, 16.5, -135 + j * 55)
              return (
                <text key={t} x={pt.x} y={pt.y + 2} textAnchor="middle" fontSize={5} fontFamily={MONO} fill={p.sub}>
                  {t}
                </text>
              )
            })}
            <text x={x} y={s.y + s.h - 16} textAnchor="middle" fill={p.sub} fontSize={5.5} fontFamily={MONO}>
              {m}
            </text>
          </g>
        )
      })}
      {caption(s, p, 'MAGNETOS / PARTIDA')}
    </g>
  )
}

function FreioEstacionamento({ s, p }: { s: HotspotRect; p: Pal }) {
  const cx = s.x + s.w / 2
  return (
    <g>
      <ModuleShell s={s} p={p} />
      {/* manete em T + botão */}
      <rect x={cx - 4} y={s.y + 30} width={8} height={s.h - 52} rx={3} fill="#1B222C" stroke={p.screw} strokeWidth={1} />
      <rect x={cx - 18} y={s.y + 18} width={36} height={12} rx={4} fill="#1B222C" stroke={p.screw} strokeWidth={1} />
      <circle cx={s.x + 16} cy={s.y + s.h - 30} r={6} fill="#D7E4F0" opacity={0.85} stroke="#000" strokeOpacity={0.5} />
      {caption(s, p, 'FREIO ESTACIONAMENTO')}
    </g>
  )
}

// Luz redonda pequena embutida no painel (não um cartão) — confirmado na foto,
// bem menor que qualquer mostrador do six-pack.
function AvisoEstol({ sh, p, night }: { sh: HotspotCircle; p: Pal; night: boolean }) {
  const { cx, cy, r } = sh
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#0B0C0D" stroke={p.hair} strokeOpacity={0.6} strokeWidth={0.75} />
      <Lamp x={cx - r * 0.72} y={cy - r * 0.72} size={r * 1.44} color={ARC.red} on={night} round label="STALL" />
    </g>
  )
}

function AvisosEletricosVacuo({ s, p, night }: { s: HotspotRect; p: Pal; night: boolean }) {
  return (
    <g>
      <ModuleShell s={s} p={p} label="SOBRETENSÃO / VÁCUO" />
      <Lamp x={s.x + 14} y={s.y + 20} size={20} color={ARC.red} on={night} label="ALT" />
      <Lamp x={s.x + 42} y={s.y + 20} size={20} color={ARC.red} on={night} label="ALT" />
      <text x={s.x + 24} y={s.y + 50} textAnchor="middle" fill={p.sub} fontSize={5.5} fontFamily={MONO}>
        L
      </text>
      <text x={s.x + 52} y={s.y + 50} textAnchor="middle" fill={p.sub} fontSize={5.5} fontFamily={MONO}>
        R
      </text>
      {/* botões vermelhos de falha de vácuo */}
      <Lamp x={s.x + 82} y={s.y + 20} size={20} color={ARC.red} on={night} round />
      <Lamp x={s.x + 108} y={s.y + 20} size={20} color={ARC.red} on={night} round />
      <text x={s.x + 92} y={s.y + 50} textAnchor="middle" fill={p.sub} fontSize={5.5} fontFamily={MONO}>
        VAC
      </text>
      <text x={s.x + 118} y={s.y + 50} textAnchor="middle" fill={p.sub} fontSize={5.5} fontFamily={MONO}>
        VAC
      </text>
      {caption(s, p, 'RELÉ OV / BOTÕES VÁCUO')}
    </g>
  )
}

// Painel anunciador — consolida em uma grade sinais hoje dispersos (o SOP
// cita "Caution Lights" perto do trem de pouso); não substitui os hotspots
// originais (avisos_eletricos_vacuo, luz_trem_vermelha), só apresenta o
// conjunto visualmente, como no avião real.
function PainelAnunciador({ s, p, night }: { s: HotspotRect; p: Pal; night: boolean }) {
  const legends = ['L ALT', 'R ALT', 'GEAR', 'L VAC', 'R VAC', 'DOOR']
  const cols = 3
  const cellW = s.w / cols
  const cellH = s.h / 2
  const pad = 3
  return (
    <g>
      <ModuleShell s={s} p={p} />
      {legends.map((label, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        const size = Math.min(cellW - pad * 2, cellH - pad * 2)
        const color = label === 'GEAR' || label === 'L ALT' || label === 'R ALT' ? ARC.red : ARC.amber
        return (
          <Lamp
            key={label}
            x={s.x + col * cellW + (cellW - size) / 2}
            y={s.y + row * cellH + (cellH - size) / 2}
            size={size}
            color={color}
            on={night}
            label={label}
          />
        )
      })}
    </g>
  )
}

function LuzesMarker({ s, p, night }: { s: HotspotRect; p: Pal; night: boolean }) {
  const lamps = [
    { c: ARC.blue, t: 'O' },
    { c: ARC.amber, t: 'M' },
    { c: ARC.white, t: 'I' },
  ]
  return (
    <g>
      <ModuleShell s={s} p={p} label="MARKER" />
      {lamps.map((l, i) => (
        <Lamp key={l.t} x={s.x + 12 + i * 26} y={s.y + 18} size={18} color={l.c} on={night} round label={l.t} />
      ))}
    </g>
  )
}

function PilotoAutomatico({ s, p }: { s: HotspotRect; p: Pal }) {
  return (
    <g>
      <ModuleShell s={s} p={p} label="ALTIMATIC IIIB" />
      {['HDG', 'NAV', 'ALT'].map((m, i) => (
        <g key={m}>
          <rect x={s.x + s.w * (0.06 + i * 0.28)} y={s.y + s.h * 0.32} width={s.w * 0.24} height={s.h * 0.32} rx={2} fill="#0B1220" stroke={p.hair} strokeWidth={1} />
          <text x={s.x + s.w * (0.18 + i * 0.28)} y={s.y + s.h * 0.53} textAnchor="middle" fill={p.mark} fontSize={5.5} fontFamily={MONO}>
            {m}
          </text>
        </g>
      ))}
      <Rocker x={s.x + s.w * 0.88} y={s.y + s.h * 0.28} w={s.w * 0.08} h={s.h * 0.5} p={p} />
      {caption(s, p, 'PILOTO AUTOM.')}
    </g>
  )
}

function PainelAudio({ s, p }: { s: HotspotRect; p: Pal }) {
  return (
    <g>
      <ModuleShell s={s} p={p} label="PAINEL DE ÁUDIO" />
      {Array.from({ length: 6 }).map((_, i) => (
        <rect
          key={i}
          x={s.x + 10 + i * 24}
          y={s.y + 17}
          width={16}
          height={14}
          rx={2}
          fill={i === 0 ? '#16283A' : '#0B1220'}
          stroke={i === 0 ? '#3FE0FF' : p.hair}
          strokeWidth={1}
        />
      ))}
      <text x={s.x + 18} y={s.y + 27.5} textAnchor="middle" fill="#3FE0FF" fontSize={5.5} fontFamily={MONO}>
        C1
      </text>
      <DisplayWin x={s.x + 160} y={s.y + 17} w={90} h={s.h - 25} lines={['COM 1 TX']} p={p} fontSize={8} />
    </g>
  )
}


function Transponder({ s, p, night }: { s: HotspotRect; p: Pal; night: boolean }) {
  return (
    <g>
      <ModuleShell s={s} p={p} label="TRANSPONDER" />
      <DisplayWin x={s.x + 8} y={s.y + 14} w={92} h={s.h - 20} lines={['1200']} p={p} fontSize={11} />
      {['SBY', 'ON', 'ALT'].map((m, i) => (
        <text key={m} x={s.x + 112 + i * 26} y={s.y + s.h / 2 + 3} fill={p.sub} fontSize={5.5} fontFamily={MONO}>
          {m}
        </text>
      ))}
      <Lamp x={s.x + 200} y={s.y + s.h / 2 - 5} size={10} color={ARC.green} on={night} round />
      <text x={s.x + 205} y={s.y + s.h - 6} textAnchor="middle" fill={p.sub} fontSize={5} fontFamily={MONO}>
        RPLY
      </text>
    </g>
  )
}

function SeletorTrem({ s, p }: { s: HotspotRect; p: Pal }) {
  const cx = s.x + s.w / 2
  const cy = s.y + s.h / 2
  return (
    <g>
      <ModuleShell s={s} p={p} label="TREM DE POUSO" />
      <line x1={cx} y1={s.y + 24} x2={cx} y2={s.y + s.h - 24} stroke="#000" strokeWidth={7} strokeLinecap="round" opacity={0.6} />
      <text x={cx + 22} y={s.y + 28} fill={p.sub} fontSize={6.5} fontFamily={MONO}>
        UP
      </text>
      <text x={cx + 22} y={s.y + s.h - 22} fill={p.sub} fontSize={6.5} fontFamily={MONO}>
        DOWN
      </text>
      {/* manípulo-roda */}
      <circle cx={cx} cy={cy} r={16} fill="#14181D" stroke={p.screw} strokeWidth={2.5} />
      <circle cx={cx} cy={cy} r={7} fill="#0A1018" stroke={p.screw} strokeWidth={1.2} />
      {[0, 120, 240].map((a) => {
        const pt = polar(cx, cy, 14, a)
        return <line key={a} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke={p.screw} strokeWidth={2} />
      })}
    </g>
  )
}

function LuzesTrem({ s, p, night }: { s: HotspotRect; p: Pal; night: boolean }) {
  return (
    <g>
      <ModuleShell s={s} p={p} label="TREM BAIXADO" />
      {[0, 1, 2].map((i) => (
        <Lamp key={i} x={s.x + 14 + i * 34} y={s.y + 18} size={24} color={ARC.green} on={night} />
      ))}
      {caption(s, p, '3 GREEN — N · L · R')}
    </g>
  )
}

function LuzTremVermelha({ s, p, night }: { s: HotspotRect; p: Pal; night: boolean }) {
  return (
    <g>
      <ModuleShell s={s} p={p} label="AVISO DO TREM" />
      <Lamp x={s.x + 14} y={s.y + 18} size={24} color={ARC.red} on={night} round />
      {caption(s, p, 'EM TRÂNSITO / RECOLHIDO')}
    </g>
  )
}

function ExtensaoEmergencia({ s, p }: { s: HotspotRect; p: Pal }) {
  const cx = s.x + s.w / 2
  return (
    <g>
      <ModuleShell s={s} p={p} />
      {/* guarda */}
      <rect x={s.x + 8} y={s.y + 8} width={s.w - 16} height={s.h - 16} rx={3} fill="none" stroke={ARC.amber} strokeWidth={1} strokeDasharray="5 4" opacity={0.7} />
      {/* manípulo T */}
      <rect x={cx - 3} y={s.y + 16} width={6} height={s.h - 32} rx={2.5} fill="#1B222C" stroke={p.screw} strokeWidth={1} />
      <rect x={cx - 20} y={s.y + 12} width={40} height={10} rx={4} fill="#1B222C" stroke={p.screw} strokeWidth={1} />
      <text x={s.x + 26} y={s.y + s.h / 2 + 3} fill={p.sub} fontSize={6.5} fontFamily={MONO}>
        EMERG
      </text>
      <text x={s.x + s.w - 26} y={s.y + s.h / 2 + 3} textAnchor="end" fill={p.sub} fontSize={6.5} fontFamily={MONO}>
        PUXAR
      </text>
    </g>
  )
}

// Segundo jogo de voo do copiloto: na aeronave real os seis mostradores têm o
// mesmo porte dos do piloto, com a mesma arte — não miniaturas esquemáticas.
function CopilotoPack({ s, p, ctx }: { s: HotspotRect; p: Pal; ctx: ArtCtx }) {
  const rr = 54
  const cols = [s.x + 4 + rr, s.x + s.w / 2, s.x + s.w - 4 - rr]
  const rows = [s.y + 4 + rr, s.y + s.h - 4 - rr]
  const cell = (i: number): HotspotCircle => ({ kind: 'circle', cx: cols[i % 3], cy: rows[Math.floor(i / 3)], r: rr })
  return (
    <g>
      {[
        <GenericGauge key="asi" sh={cell(0)} p={p} ctx={ctx} cfg={{ ...genericCfg('velocimetro'), label: 'ASI', sub: undefined }} />,
        <Horizonte key="ai" sh={cell(1)} p={p} />,
        <Altimetro key="alt" sh={cell(2)} p={p} ctx={ctx} />,
        <Coordenador key="tc" sh={cell(3)} p={p} />,
        <GiroDirecional key="dg" sh={cell(4)} p={p} />,
        <GenericGauge key="vsi" sh={cell(5)} p={p} ctx={ctx} cfg={{ ...genericCfg('variometro'), label: 'VSI', sub: undefined }} />,
      ]}
    </g>
  )
}

function RelogioCopiloto({ s, p }: { s: HotspotRect; p: Pal }) {
  const cx = s.x + 40
  const cy = s.y + s.h / 2 + 2
  return (
    <g>
      <ModuleShell s={s} p={p} label="COPILOTO" />
      <circle cx={cx} cy={cy} r={24} fill="url(#ck-bezel)" stroke={p.hair} strokeWidth={0.75} />
      <circle cx={cx} cy={cy} r={21} fill={p.face} />
      {Array.from({ length: 12 }).map((_, i) => {
        const p1 = polar(cx, cy, 19, i * 30)
        const p2 = polar(cx, cy, 16, i * 30)
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={p.sub} strokeWidth={0.8} />
      })}
      <line x1={cx} y1={cy} x2={polar(cx, cy, 11, 305).x} y2={polar(cx, cy, 11, 305).y} stroke="#D7E4F0" strokeWidth={1.6} />
      <line x1={cx} y1={cy} x2={polar(cx, cy, 17, 55).x} y2={polar(cx, cy, 17, 55).y} stroke="#E8F0F7" strokeWidth={1.1} />
      {/* acendedor 12V */}
      <circle cx={s.x + s.w - 52} cy={cy} r={12} fill="#0B1220" stroke={p.screw} strokeWidth={1.2} />
      <circle cx={s.x + s.w - 52} cy={cy} r={5} fill="none" stroke={p.sub} strokeWidth={1} />
      <text x={s.x + s.w - 52} y={cy + 22} textAnchor="middle" fill={p.sub} fontSize={5.5} fontFamily={MONO}>
        12V
      </text>
    </g>
  )
}

function Disjuntores({ s, p }: { s: HotspotRect; p: Pal }) {
  return (
    <g>
      <ModuleShell s={s} p={p} label="DISJUNTORES" />
      {Array.from({ length: 12 }).map((_, i) => {
        const x = s.x + 22 + (i % 4) * 40
        const y = s.y + 26 + Math.floor(i / 4) * 24
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={6} fill="#0B1220" stroke={p.screw} strokeWidth={1} />
            <circle cx={x} cy={y} r={2.4} fill="#D7E4F0" opacity={0.8} />
          </g>
        )
      })}
    </g>
  )
}

function EstaticaAlternada({ s, p }: { s: HotspotRect; p: Pal }) {
  const cx = s.x + s.w / 2
  const cy = s.y + 38
  return (
    <g>
      <ModuleShell s={s} p={p} label="FONTE ESTÁTICA" />
      <Knob cx={cx} cy={cy} r={14} p={p} angle={-90} />
      <text x={cx - 24} y={cy - 8} textAnchor="middle" fill={p.sub} fontSize={5.5} fontFamily={MONO}>
        NORM
      </text>
      <text x={cx + 26} y={cy - 8} textAnchor="middle" fill={p.sub} fontSize={5.5} fontFamily={MONO}>
        ALT
      </text>
      {caption(s, p, 'VÁLVULA ESTÁTICA ALT.')}
    </g>
  )
}

function Aquecimento({ s, p }: { s: HotspotRect; p: Pal }) {
  return (
    <g>
      <ModuleShell s={s} p={p} label="AQUEC./DESEMB." />
      {['CALOR', 'DESEMB'].map((t, i) => {
        const y = s.y + 26 + i * 24
        return (
          <g key={t}>
            <line x1={s.x + 14} y1={y} x2={s.x + s.w - 14} y2={y} stroke={p.hair} strokeWidth={3} strokeLinecap="round" />
            <rect x={s.x + 20 + i * 30} y={y - 5} width={12} height={10} rx={2} fill="#1B222C" stroke={p.screw} strokeWidth={1} />
            <text x={s.x + 14} y={y + 13} fill={p.sub} fontSize={5.5} fontFamily={MONO}>
              {t}
            </text>
          </g>
        )
      })}
    </g>
  )
}

// ---------------------------------------------------------------------------
// Configuração dos mostadores genéricos (arcos fiéis a `operacao` / SOP)
// ---------------------------------------------------------------------------

function genericCfg(id: string): GenericCfg {
  switch (id) {
    case 'velocimetro':
      // ASI (MPH): branco 69–125, verde 76–190, amarelo 190–217, Vne 217,
      // radial vermelho 80 (Vmc), linha azul 105 (Vyse)
      return {
        min: 40, max: 240,
        majors: [40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240],
        minors: [50, 70, 90, 110, 130, 150, 170, 190, 210, 230],
        arcs: [
          { v0: 69, v1: 125, color: ARC.white },
          { v0: 76, v1: 190, color: ARC.green },
          { v0: 190, v1: 217, color: ARC.amber },
        ],
        marks: [
          { v: 217, color: ARC.red },
          { v: 80, color: ARC.red },
          { v: 105, color: ARC.blue, w: 3.5 },
        ],
        needles: [{ v: 95 }],
        label: 'AIRSPEED',
        sub: 'MPH',
      }
    case 'tacometro_duplo':
    case 'tacometro_direito':
      // RPM: verde 500–2200 e 2400–2700; vermelho 2200–2400; linha 2700.
      // Dois mostradores redondos separados (1 agulha cada) — motor esquerdo
      // e direito — não um único mostrador com 2 agulhas (confirmado na foto).
      return {
        min: 0, max: 28,
        majors: [0, 5, 10, 15, 20, 25],
        minors: [1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24, 26, 27],
        fmt: (v) => String(v),
        arcs: [
          { v0: 5, v1: 22, color: ARC.green },
          { v0: 22, v1: 24, color: ARC.red },
          { v0: 24, v1: 27, color: ARC.green },
        ],
        marks: [{ v: 27, color: ARC.red }],
        needles: [{ v: 24 }],
        label: 'RPM ×100',
        sub: id === 'tacometro_duplo' ? 'L' : 'R',
      }
    case 'pressao_admissao':
      return {
        min: 10, max: 30,
        majors: [10, 15, 20, 25, 30],
        minors: [11, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24, 26, 27, 28, 29],
        needles: [{ v: 25 }, { v: 25, color: '#93A6BB' }],
        label: 'MANIFOLD',
        sub: 'IN HG · L R',
      }
    case 'fluxo_combustivel_pressao':
      // Fluxo: linha vermelha 19,2 GPH; pressão: verde 14–35 PSI
      return {
        min: 0, max: 20,
        majors: [0, 5, 10, 15, 20],
        minors: [1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19],
        arcs: [{ v0: 2.8, v1: 7, color: ARC.green, w: 3 }], // faixa PSI 14–35 (escala interna)
        marks: [{ v: 19.2, color: ARC.red }],
        needles: [{ v: 10.3 }, { v: 9.2, color: '#93A6BB' }],
        label: 'FUEL FLOW',
        sub: 'GPH · PSI',
      }
    case 'egt':
      return {
        min: 8, max: 18,
        majors: [8, 10, 12, 14, 16, 18],
        minors: [9, 11, 13, 15, 17],
        needles: [{ v: 13.5 }, { v: 13.2, color: '#93A6BB' }],
        label: 'EGT',
        sub: '°F ×100',
      }
    case 'pressao_oleo':
      // Óleo P: verde 60–90, amarelo 25–60, vermelhas 25 e 90 PSI
      return {
        min: 0, max: 100,
        majors: [0, 25, 60, 90],
        minors: [10, 20, 30, 40, 50, 70, 80, 100],
        arcs: [
          { v0: 25, v1: 60, color: ARC.amber, w: 3 },
          { v0: 60, v1: 90, color: ARC.green, w: 3 },
        ],
        marks: [
          { v: 25, color: ARC.red, w: 2.5 },
          { v: 90, color: ARC.red, w: 2.5 },
        ],
        needles: [{ v: 72 }, { v: 72, color: '#93A6BB' }],
        label: 'OIL P',
        sub: 'PSI',
      }
    case 'temperatura_oleo':
      // Óleo T: verde 75–245 °F, vermelha 245
      return {
        min: 50, max: 260,
        majors: [50, 100, 150, 200, 250],
        minors: [75, 125, 175, 225],
        arcs: [{ v0: 75, v1: 245, color: ARC.green, w: 3 }],
        marks: [{ v: 245, color: ARC.red, w: 2.5 }],
        needles: [{ v: 160 }, { v: 160, color: '#93A6BB' }],
        label: 'OIL T',
        sub: '°F',
      }
    case 'cht':
      // CHT: verde 200–475 °F, vermelha 475
      return {
        min: 150, max: 500,
        majors: [200, 300, 400, 475],
        minors: [250, 350, 450],
        arcs: [{ v0: 200, v1: 475, color: ARC.green, w: 3 }],
        marks: [{ v: 475, color: ARC.red, w: 2.5 }],
        needles: [{ v: 380 }, { v: 365, color: '#93A6BB' }],
        label: 'CHT',
        sub: '°F',
      }
    case 'quantidade_combustivel':
      // Combustível: cada lado lê o total da asa (49 gal)
      return {
        min: 0, max: 50,
        majors: [0, 10, 20, 30, 40, 50],
        minors: [5, 15, 25, 35, 45],
        needles: [{ v: 37 }, { v: 33, color: '#93A6BB' }],
        label: 'FUEL QTY',
        sub: 'GAL · L R',
      }
    case 'amperimetros':
      // Loadmeters 0–60 A (alternadores de 60 A)
      return {
        min: 0, max: 60,
        majors: [0, 20, 40, 60],
        minors: [10, 30, 50],
        marks: [{ v: 60, color: ARC.red, w: 2.5 }],
        needles: [{ v: 22 }, { v: 22, color: '#93A6BB' }],
        label: 'AMPS',
        sub: 'L · R',
      }
    case 'indicador_vacuo':
      // Sucção: verde 4,5–5,5 inHg (normal 5,0 ± 0,1)
      return {
        min: 3, max: 7,
        majors: [3, 4, 5, 6, 7],
        minors: [3.5, 4.5, 5.5, 6.5],
        fmt: (v) => String(v),
        arcs: [{ v0: 4.5, v1: 5.5, color: ARC.green, w: 3 }],
        marks: [{ v: 4.5, color: ARC.red, w: 2 }],
        needles: [{ v: 5.0 }],
        label: 'SUCÇÃO',
        sub: 'IN HG',
      }
    case 'variometro':
      // VSI: ±2000 ft/min, zero à esquerda
      return {
        min: -20, max: 20,
        majors: [-20, -10, 0, 10, 20],
        minors: [-15, -5, 5, 15],
        fmt: (v) => String(Math.abs(v / 10)),
        needles: [{ v: 5 }],
        label: 'VSI',
        sub: 'FT/MIN ×100',
      }
    case 'termometro_oat':
      return {
        min: -50, max: 50,
        majors: [-50, -25, 0, 25, 50],
        minors: [],
        needles: [{ v: 15 }],
        label: 'OAT',
        sub: '°C',
      }
    default:
      return { min: 0, max: 100, majors: [0, 50, 100], needles: [{ v: 50 }], label: id.toUpperCase() }
  }
}

// ---------------------------------------------------------------------------
// renderArt — dispatcher por id
// ---------------------------------------------------------------------------

export function renderArt(id: string, ctx: ArtCtx): ReactNode {
  const e = PANEL_MAP[id]
  if (!e) return null
  const p = pal(ctx.night)
  const s = e.shape

  if (s.kind === 'circle') {
    switch (id) {
      case 'altimetro':
        return <Altimetro sh={s} p={p} ctx={ctx} />
      case 'horizonte_artificial':
        return <Horizonte sh={s} p={p} />
      case 'giro_direcional':
        return <GiroDirecional sh={s} p={p} />
      case 'coordenador_curva':
        return <Coordenador sh={s} p={p} />
      case 'indicador_vor_1':
        return <Cdi sh={s} p={p} />
      case 'indicador_vor_2_gs':
        return <Cdi sh={s} p={p} gs />
      case 'adf_indicador':
        return <Adf sh={s} p={p} />
      case 'relogio':
        return <Relogio sh={s} p={p} />
      case 'aviso_estol':
        return <AvisoEstol sh={s} p={p} night={ctx.night} />
      default:
        return <GenericGauge sh={s} p={p} ctx={ctx} cfg={genericCfg(id)} />
    }
  }

  switch (id) {
    case 'bussola_magnetica':
      return <Bussola s={s} p={p} />
    case 'painel_audio':
      return <PainelAudio s={s} p={p} />
    case 'navcom_1':
      return <Mfd s={s} p={p} />
    case 'navcom_2':
      return <Navcom2 s={s} p={p} />
    case 'adf_receptor':
      return <IntegradoGns s={s} p={p} label="VOR/LOC · GS" />
    case 'dme':
      return <IntegradoGns s={s} p={p} label="DME/RNAV" />
    case 'transponder':
      return <Transponder s={s} p={p} night={ctx.night} />
    case 'piloto_automatico':
      return <PilotoAutomatico s={s} p={p} />
    case 'luzes_marker':
      return <LuzesMarker s={s} p={p} night={ctx.night} />
    case 'avisos_eletricos_vacuo':
      return <AvisosEletricosVacuo s={s} p={p} night={ctx.night} />
    case 'luzes_trem_verdes':
      return <LuzesTrem s={s} p={p} night={ctx.night} />
    case 'luz_trem_vermelha':
      return <LuzTremVermelha s={s} p={p} night={ctx.night} />
    case 'seletor_trem':
      return <SeletorTrem s={s} p={p} />
    case 'extensao_emergencia_trem':
      return <ExtensaoEmergencia s={s} p={p} />
    case 'painel_anunciador':
      return <PainelAnunciador s={s} p={p} night={ctx.night} />
    case 'chave_master':
      return <SwitchBank s={s} p={p} items={['BAT']} label="CHAVE MASTER" />
    case 'chaves_alternadores':
      return <SwitchBank s={s} p={p} items={['L', 'R']} label="ALTERNADORES" />
    case 'chaves_magnetos_partida':
      return <Magnetos s={s} p={p} />
    case 'bombas_combustivel_eletricas':
      return <SwitchBank s={s} p={p} items={['L', 'R']} label="BOMBAS ELÉTRICAS" />
    case 'pitot_heat_luzes':
      return <SwitchBank s={s} p={p} items={['PHT', 'NAV', 'PNL']} label="PITOT HEAT / LUZES" />
    case 'freio_estacionamento':
      return <FreioEstacionamento s={s} p={p} />
    case 'instrumentos_copiloto':
      return <CopilotoPack s={s} p={p} ctx={ctx} />
    case 'relogio_copiloto_acendedor':
      return <RelogioCopiloto s={s} p={p} />
    case 'disjuntores':
      return <Disjuntores s={s} p={p} />
    case 'estatica_alternada':
      return <EstaticaAlternada s={s} p={p} />
    case 'aquecimento_desembacador':
      return <Aquecimento s={s} p={p} />
    default:
      return <ModuleShell s={s} p={p} label={e.tag} />
  }
}

// ---------------------------------------------------------------------------
// Chapas do painel (glareshield, chapa principal, pedestal, placa de dados)
// ---------------------------------------------------------------------------

export function ArtDefs() {
  return (
    <defs>
      <radialGradient id="ck-bezel" cx="34%" cy="26%" r="82%">
        <stop offset="0%" stopColor="#77746C" />
        <stop offset="32%" stopColor="#4B4B47" />
        <stop offset="72%" stopColor="#252724" />
        <stop offset="100%" stopColor="#111210" />
      </radialGradient>
      <linearGradient id="ck-panel-day" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#242523" />
        <stop offset="48%" stopColor="#191A19" />
        <stop offset="100%" stopColor="#111210" />
      </linearGradient>
      <linearGradient id="ck-panel-night" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#121312" />
        <stop offset="50%" stopColor="#0A0B0A" />
        <stop offset="100%" stopColor="#060706" />
      </linearGradient>
      <radialGradient id="ck-panel-sheen" cx="48%" cy="8%" r="94%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.09" />
        <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.025" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="ck-tan-day" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#CCB995" />
        <stop offset="55%" stopColor="#B39D78" />
        <stop offset="100%" stopColor="#8E7B5C" />
      </linearGradient>
      <linearGradient id="ck-tan-night" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7B6B50" />
        <stop offset="58%" stopColor="#62543F" />
        <stop offset="100%" stopColor="#473C2D" />
      </linearGradient>
      <linearGradient id="ck-padding" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#383633" />
        <stop offset="42%" stopColor="#161715" />
        <stop offset="100%" stopColor="#070807" />
      </linearGradient>
      <pattern id="ck-panel-grain" width="13" height="13" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="3" r="0.55" fill="#FFFFFF" opacity="0.06" />
        <circle cx="10" cy="8" r="0.45" fill="#000000" opacity="0.2" />
        <path d="M 4 11 l 2 -1" stroke="#FFFFFF" strokeOpacity="0.035" strokeWidth="0.6" />
      </pattern>
      <filter id="ck-panel-shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#000000" floodOpacity="0.78" />
      </filter>
      <filter id="ck-bezel-shadow" x="-20%" y="-20%" width="140%" height="145%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor="#000000" floodOpacity="0.7" />
      </filter>
      <filter id="ck-module-shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.4" floodColor="#000000" floodOpacity="0.55" />
      </filter>
    </defs>
  )
}

function plateScrews(x: number, y: number, w: number, h: number, p: Pal) {
  const pts = [
    [x + 10, y + 10],
    [x + w - 10, y + 10],
    [x + 10, y + h - 10],
    [x + w - 10, y + h - 10],
  ]
  return (
    <g aria-hidden="true">
      {pts.map(([sx, sy], i) => (
        <g key={i}>
          <circle cx={sx} cy={sy} r={3} fill="none" stroke={p.screw} strokeWidth={1} />
          <line x1={sx - 2} y1={sy} x2={sx + 2} y2={sy} stroke={p.screw} strokeWidth={0.9} transform={`rotate(${i * 35 + 20} ${sx} ${sy})`} />
        </g>
      ))}
    </g>
  )
}

export function PanelPlates({ night }: { night: boolean }) {
  const p = pal(night)
  const panelPath =
    'M 52 638 L 52 188 Q 52 150 86 126 Q 200 50 430 34 Q 800 8 1170 34 Q 1400 50 1514 126 Q 1548 150 1548 188 L 1548 638 Z'
  const upperPadding =
    'M 61 178 Q 61 151 93 130 Q 211 61 438 45 Q 800 20 1162 45 Q 1389 61 1507 130 Q 1539 151 1539 178'
  const tanFill = night ? 'url(#ck-tan-night)' : 'url(#ck-tan-day)'
  const panelFill = night ? 'url(#ck-panel-night)' : 'url(#ck-panel-day)'
  const rivets = [
    [72, 192], [1528, 192], [72, 620], [1528, 620],
    [624, 126], [976, 126], [624, 618], [976, 618],
  ]

  return (
    <g aria-hidden="true">
      {/* Silhueta frontal: chapa superior curva e borda acolchoada. */}
      <path data-panel-shape="curved-shell" d={panelPath} fill={panelFill} stroke={p.hair} strokeWidth={1.5} filter="url(#ck-panel-shadow)" />
      <path d={panelPath} fill="url(#ck-panel-grain)" opacity={night ? 0.22 : 0.34} />
      <path d={panelPath} fill="url(#ck-panel-sheen)" opacity={night ? 0.72 : 1} />
      <path d={upperPadding} fill="none" stroke="#020302" strokeWidth={25} strokeLinecap="round" />
      <path d={upperPadding} fill="none" stroke="url(#ck-padding)" strokeWidth={19} strokeLinecap="round" />
      <path d={upperPadding} fill="none" stroke="#8C887E" strokeOpacity={night ? 0.16 : 0.3} strokeWidth={1.5} />
      <path d="M 73 185 Q 73 158 103 139" fill="none" stroke="#8C887E" strokeOpacity={0.2} strokeWidth={1} />
      <path d="M 1527 185 Q 1527 158 1497 139" fill="none" stroke="#8C887E" strokeOpacity={0.2} strokeWidth={1} />

      {/* Rebaixos de montagem mantêm os grupos compactos sem divisórias rígidas. */}
      <rect x={176} y={230} width={400} height={290} rx={20} fill={p.raised} fillOpacity={0.18} stroke={p.hair} strokeOpacity={0.62} strokeWidth={0.8} />
      {plateScrews(176, 230, 400, 290, p)}
      <rect x={580} y={432} width={342} height={198} rx={12} fill={p.raised} fillOpacity={0.32} stroke={p.hair} strokeOpacity={0.7} strokeWidth={0.8} />
      {plateScrews(580, 432, 342, 198, p)}
      <path d="M 990 126 H 1540 V 616 H 990 Z" fill={p.raised} fillOpacity={0.07} stroke={p.hair} strokeOpacity={0.24} strokeWidth={0.8} />

      {/* Faixa inferior bege, contínua como na referência frontal. */}
      <path data-panel-surface="tan-strip" d="M 52 616 H 1548 V 686 Q 1548 696 1538 696 H 62 Q 52 696 52 686 Z" fill={tanFill} stroke={p.edge} strokeWidth={1.1} />
      <path d="M 52 616 H 1548 V 686 Q 1548 696 1538 696 H 62 Q 52 696 52 686 Z" fill="url(#ck-panel-grain)" opacity={0.18} />
      <line x1={62} y1={621} x2={1538} y2={621} stroke="#FFFFFF" strokeOpacity={night ? 0.08 : 0.24} strokeWidth={1.2} />
      <line x1={62} y1={690} x2={1538} y2={690} stroke="#211C15" strokeOpacity={0.7} strokeWidth={1.2} />

      {/* Fixadores e costuras, sempre atrás dos instrumentos/hotspots. */}
      {rivets.map(([x, y], i) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r={3} fill="#181916" stroke={p.screw} strokeWidth={1} />
          <line x1={x - 1.7} y1={y} x2={x + 1.7} y2={y} stroke={p.screw} strokeWidth={0.8} transform={`rotate(${18 + i * 23} ${x} ${y})`} />
        </g>
      ))}
      <path d="M 56 634 H 1544" stroke="#000000" strokeOpacity={0.35} strokeWidth={2} />
    </g>
  )
}

// ---------------------------------------------------------------------------
// MiniArt — re-render isolado do instrumento (miniatura do drawer / seções)
// ---------------------------------------------------------------------------

export function MiniArt({
  id,
  night,
  sweep,
  className,
  pad = 8,
}: {
  id: string
  night: boolean
  sweep: boolean
  className?: string
  pad?: number
}) {
  const e = PANEL_MAP[id]
  if (!e) return null
  const s = e.shape
  const bb =
    s.kind === 'circle'
      ? { x: s.cx - s.r, y: s.cy - s.r, w: s.r * 2, h: s.r * 2 }
      : { x: s.x, y: s.y, w: s.w, h: s.h }
  // viewBox quadrado centrado no instrumento
  const side = Math.max(bb.w, bb.h) + pad * 2
  const vx = bb.x + bb.w / 2 - side / 2
  const vy = bb.y + bb.h / 2 - side / 2
  return (
    <svg viewBox={`${vx} ${vy} ${side} ${side}`} className={className} aria-hidden="true">
      <ArtDefs />
      {renderArt(id, { night, sweep })}
    </svg>
  )
}
