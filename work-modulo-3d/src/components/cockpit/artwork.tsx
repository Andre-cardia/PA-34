// artwork — desenho vetorial (SVG) dos 54 comandos do painel (cockpit.md §2),
// fiel à foto PR-FLM: chapa preta acetinada, faixa de anunciadores entre frisos
// cromados, faixa inferior creme com instrumentos de motor de face clara, stack
// de rádios com GNS colorido e transponder laranja, pedestal de 6 manetes.
// Escalas e arcos seguem `operacao` de cada instrumento (sem valores novos).
// Modo NOITE: retroiluminação âmbar e anunciadores acesos. Sem imagem raster.
// Sem rótulos didáticos impressos na chapa: só as inscrições da própria foto.

import { useEffect, useId, useState } from 'react'
import type { ReactNode } from 'react'
import { GLARE_CONTOUR, HORIMETRO, PANEL_MAP, PEDESTAL_BASE, PLATE_SCREWS, PLATES, PLACARDS, TRIMS } from './panel-data'
import type { Placard, Pt } from './panel-data'
import { YOKES, offsetLine, yokeGeometry } from './panel-geometry'
import type { Seg } from './panel-geometry'
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
  cream: string
  creamShade: string
  creamInk: string
  creamFace: string
  creamFaceMark: string
  chrome: string
}

export function pal(night: boolean): Pal {
  // Rodada 2: tons gastos medidos na foto PR-FLM (creme acinzentado, faces de
  // motor encardidas, preto levemente azulado); noite retroiluminada coerente.
  return night
    ? {
        face: '#0A0B0A',
        mark: '#E6D6B8',
        sub: '#9E937F',
        plate: '#0A0B0B',
        raised: '#131415',
        hair: '#33332F',
        display: '#040504',
        dispText: '#E3A04F',
        screw: '#67635A',
        trimRaised: '#6E6250',
        edge: '#8C7D64',
        cream: '#46423A',
        creamShade: '#302D28',
        creamInk: '#DCCBA8',
        creamFace: '#171613',
        creamFaceMark: '#E6D6B8',
        chrome: '#66655F',
      }
    : {
        face: '#151615',
        mark: '#DEDAD0',
        sub: '#94918A',
        plate: '#222324',
        raised: '#2A2B2C',
        hair: '#4A4946',
        display: '#0A0B0A',
        dispText: '#E3A65A',
        screw: '#86837B',
        trimRaised: '#B3A68E',
        edge: '#6A604F',
        cream: '#A49C8C',
        creamShade: '#7E776A',
        creamInk: '#22201C',
        creamFace: '#C9C2B1',
        creamFaceMark: '#1C1B18',
        chrome: '#B4B3AD',
      }
}

// Arcos e lentes com saturação reduzida (tinta envelhecida da foto).
export const ARC = {
  green: '#6DAE86',
  amber: '#D6A048',
  red: '#C9493F',
  blue: '#6A93C9',
  white: '#D9D4C8',
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

function Face({ cx, cy, r, p, fill }: { cx: number; cy: number; r: number; p: Pal; fill?: string }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r - 5} fill={fill ?? p.face} stroke="#000" strokeOpacity={0.78} strokeWidth={0.9} />
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
  /** Face clara (creme) com marcações escuras — motor na faixa inferior (foto). */
  cream?: boolean
  /** Face verde-oliva do jogo do copiloto (foto). */
  olive?: boolean
}

// Face clara: troca só as cores do mostrador; escala e arcos idênticos.
function creamPal(p: Pal): Pal {
  return { ...p, face: p.creamFace, mark: p.creamFaceMark, sub: p.creamFaceMark }
}

function GenericGauge({ sh, p: p0, ctx, cfg }: { sh: HotspotCircle; p: Pal; ctx: ArtCtx; cfg: GenericCfg }) {
  const { cx, cy, r } = sh
  const p = cfg.cream ? creamPal(p0) : p0
  const faceFill = cfg.olive ? (ctx.night ? '#0D120B' : '#2E3A28') : undefined
  return (
    <g>
      <Bezel cx={cx} cy={cy} r={r} p={p0} />
      <Face cx={cx} cy={cy} r={r} p={p} fill={faceFill} />
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
          color={cfg.cream ? (n.color ? '#5C564A' : p.mark) : n.color}
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

function Altimetro({ sh, p, ctx, olive }: { sh: HotspotCircle; p: Pal; ctx: ArtCtx; olive?: boolean }) {
  const { cx, cy, r } = sh
  const s: ScaleCfg = { min: 0, max: 10, start: -90, end: 270 }
  const alt = 1500 // indicação estática de referência
  const n100 = (alt % 1000) / 100 // 0–10
  const n1000 = (alt % 10000) / 1000
  const n10000 = alt / 10000
  return (
    <g>
      <Bezel cx={cx} cy={cy} r={r} p={p} />
      <Face cx={cx} cy={cy} r={r} p={p} fill={olive ? (ctx.night ? '#0D120B' : '#2E3A28') : undefined} />
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

// HSI quadrado (King KI-525A da foto): caixa preta com cantos chanfrados,
// cartão de proa giratório e avião fixo. O hotspot é retangular, como a caixa.
function HsiQuadrado({ s, p }: { s: HotspotRect; p: Pal }) {
  const cx = s.x + s.w / 2
  const cy = s.y + s.h / 2
  const c = 12
  const r = Math.min(s.w, s.h) / 2 - 9
  const card = ['N', '3', '6', 'E', '12', '15', 'S', '21', '24', 'W', '30', '33']
  return (
    <g>
      <path
        d={`M ${s.x + c} ${s.y} H ${s.x + s.w - c} L ${s.x + s.w} ${s.y + c} V ${s.y + s.h - c} L ${s.x + s.w - c} ${s.y + s.h} H ${s.x + c} L ${s.x} ${s.y + s.h - c} V ${s.y + c} Z`}
        fill="#0C0D0E"
        stroke={p.chrome}
        strokeOpacity={0.45}
        strokeWidth={1.1}
        filter="url(#ck-module-shadow)"
      />
      <circle cx={cx} cy={cy} r={r + 3} fill={p.face} stroke="#000" strokeWidth={1} />
      {card.map((t, i) => {
        const a = i * 30
        const pt = polar(cx, cy, r - r * 0.2, a)
        const t1 = polar(cx, cy, r, a)
        const t2 = polar(cx, cy, r - r * 0.1, a)
        return (
          <g key={t}>
            <line x1={t1.x} y1={t1.y} x2={t2.x} y2={t2.y} stroke={p.mark} strokeWidth={0.9} />
            <text x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="central" fill={p.mark} fontSize={i % 3 === 0 ? r * 0.2 : r * 0.14} fontFamily={MONO}>
              {t}
            </text>
          </g>
        )
      })}
      {/* barra de desvio de curso e seta (amarelas, como no KI-525A) */}
      <line x1={cx} y1={cy - r * 0.62} x2={cx} y2={cy + r * 0.62} stroke="#E8C547" strokeWidth={1.8} />
      <path d={`M ${cx} ${cy - r * 0.78} l -4 7 h 8 Z`} fill="#E8C547" />
      <g stroke="#E9E4D8" strokeWidth={1.6} strokeLinecap="round">
        <line x1={cx - r * 0.3} y1={cy} x2={cx + r * 0.3} y2={cy} />
        <line x1={cx} y1={cy - r * 0.2} x2={cx} y2={cy + r * 0.24} />
        <line x1={cx - r * 0.1} y1={cy + r * 0.22} x2={cx + r * 0.1} y2={cy + r * 0.22} />
      </g>
      <path d={`M ${cx} ${s.y + 4} l -4 6 h 8 Z`} fill={ARC.amber} />
      <circle cx={s.x + 10} cy={s.y + s.h - 10} r={5} fill="#151515" stroke={p.screw} strokeWidth={0.8} />
      <circle cx={s.x + s.w - 10} cy={s.y + s.h - 10} r={5} fill="#151515" stroke={p.screw} strokeWidth={0.8} />
      <text x={cx} y={s.y + 9} textAnchor="middle" fill={p.sub} fontSize={4} fontFamily={MONO}>
        NAV 1
      </text>
    </g>
  )
}

function Bussola({ s, p }: { s: HotspotRect; p: Pal }) {
  const cx = s.x + s.w / 2
  const cy = s.y + s.h * 0.56
  return (
    <g>
      {/* suporte no arco do para-brisa e caixa redonda da bússola */}
      <rect x={cx - 6} y={s.y} width={12} height={s.h * 0.2} fill="#121212" stroke={p.hair} strokeWidth={0.7} />
      <rect x={s.x + 2} y={s.y + s.h * 0.18} width={s.w - 4} height={s.h * 0.8} rx={s.w * 0.28} fill="#121314" stroke={p.hair} strokeWidth={0.9} filter="url(#ck-module-shadow)" />
      <rect x={s.x + 10} y={cy - 9} width={s.w - 20} height={18} rx={4} fill="#E3DCC8" stroke="#000" strokeWidth={0.8} />
      <text x={cx} y={cy + 3.5} textAnchor="middle" fontSize={10} fontFamily={MONO} fill="#151412">
        N
      </text>
      <text x={cx - 15} y={cy + 3} textAnchor="middle" fontSize={7} fontFamily={MONO} fill="#151412">
        33
      </text>
      <text x={cx + 15} y={cy + 3} textAnchor="middle" fontSize={7} fontFamily={MONO} fill="#151412">
        3
      </text>
      <line x1={cx} y1={cy - 9} x2={cx} y2={cy + 9} stroke={ARC.red} strokeWidth={1} />
      <rect x={cx - 12} y={s.y + s.h - 9} width={24} height={6} rx={1} fill="#E9E4D8" opacity={0.85} />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Módulos — stack de rádios (foto: áudio, GNS colorido, NAV/COM 2, XPDR laranja)
// ---------------------------------------------------------------------------

function AvionicsShell({ s, p }: { s: HotspotRect; p: Pal }) {
  return (
    <g aria-hidden="true">
      <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={2} fill="#141516" stroke="#000" strokeWidth={1} filter="url(#ck-module-shadow)" />
      <rect x={s.x + 1.5} y={s.y + 1.5} width={s.w - 3} height={s.h - 3} rx={1.5} fill="none" stroke={p.chrome} strokeOpacity={0.22} strokeWidth={0.7} />
    </g>
  )
}

function SmallBtn({ x, y, w = 9, h = 6, lit }: { x: number; y: number; w?: number; h?: number; lit?: string }) {
  return <rect x={x} y={y} width={w} height={h} rx={1} fill={lit ?? '#C9CCD0'} fillOpacity={lit ? 0.9 : 0.75} stroke="#000" strokeWidth={0.5} />
}

function Mfd({ s, p, night }: { s: HotspotRect; p: Pal; night: boolean }) {
  // GNS 530W retrofit: tela colorida ao centro, botões laterais, dois botões
  // duplos nos cantos inferiores e fila de softkeys sob a tela (foto).
  const sx = s.x + 26
  const sy = s.y + 8
  const sw = s.w - 52
  const sh = s.h - 34
  const rows = [0, 1, 2, 3, 4, 5]
  return (
    <g>
      <AvionicsShell s={s} p={p} />
      <rect x={sx - 2} y={sy - 2} width={sw + 4} height={sh + 4} rx={2} fill="#050506" />
      {/* mapa móvel colorido */}
      <rect x={sx} y={sy} width={sw} height={sh} fill={night ? '#0B1630' : '#1B2B6A'} />
      <path d={`M ${sx} ${sy + sh * 0.62} C ${sx + sw * 0.3} ${sy + sh * 0.5}, ${sx + sw * 0.55} ${sy + sh * 0.78}, ${sx + sw} ${sy + sh * 0.6} V ${sy + sh} H ${sx} Z`} fill={night ? '#173018' : '#2F6B34'} opacity={0.85} />
      <path d={`M ${sx + sw * 0.15} ${sy + sh * 0.2} L ${sx + sw * 0.5} ${sy + sh * 0.5} L ${sx + sw * 0.82} ${sy + sh * 0.3}`} fill="none" stroke="#E85DD6" strokeWidth={1.6} />
      <circle cx={sx + sw * 0.5} cy={sy + sh * 0.5} r={sh * 0.28} fill="none" stroke="#9FC6FF" strokeOpacity={0.5} strokeWidth={0.6} />
      <path d={`M ${sx + sw * 0.5} ${sy + sh * 0.43} l -4 9 l 4 -2.5 l 4 2.5 Z`} fill="#F2F7FB" />
      <rect x={sx} y={sy} width={sw} height={9} fill="#000" fillOpacity={0.55} />
      <text x={sx + 3} y={sy + 6.5} fill="#7CFF7C" fontSize={5} fontFamily={MONO}>
        118.00 ↔ 121.50
      </text>
      <text x={sx + sw - 3} y={sy + 6.5} textAnchor="end" fill="#7CFF7C" fontSize={5} fontFamily={MONO}>
        DIS 12.4NM
      </text>
      {/* botões laterais */}
      {rows.map((i) => (
        <SmallBtn key={`r${i}`} x={s.x + s.w - 20} y={s.y + 12 + i * 13} w={13} h={8} />
      ))}
      {[0, 1, 2].map((i) => (
        <SmallBtn key={`l${i}`} x={s.x + 6} y={s.y + 14 + i * 22} w={12} h={10} />
      ))}
      {/* softkeys */}
      {Array.from({ length: 6 }).map((_, i) => (
        <SmallBtn key={`k${i}`} x={sx + 6 + i * ((sw - 12) / 6)} y={s.y + s.h - 22} w={(sw - 12) / 6 - 4} h={6} />
      ))}
      {[s.x + 13, s.x + s.w - 13].map((x) => (
        <g key={x}>
          <circle cx={x} cy={s.y + s.h - 13} r={9} fill="#1A1A1B" stroke={p.screw} strokeWidth={0.9} />
          <circle cx={x} cy={s.y + s.h - 13} r={4.5} fill="#0B0B0C" stroke={p.screw} strokeWidth={0.6} />
        </g>
      ))}
      <text x={s.x + 8} y={s.y + 8} fill={p.sub} fontSize={4} fontFamily={MONO}>
        GARMIN
      </text>
    </g>
  )
}

function Navcom2({ s, p }: { s: HotspotRect; p: Pal }) {
  // Duas janelas pretas (COM/NAV, ativo/standby) e botões de sintonia (foto).
  const w = (s.w - 18) / 2
  return (
    <g>
      <AvionicsShell s={s} p={p} />
      {[0, 1].map((i) => (
        <g key={i}>
          <rect x={s.x + 6 + i * (w + 6)} y={s.y + 6} width={w} height={s.h * 0.42} rx={1.5} fill={p.display} stroke={p.chrome} strokeOpacity={0.35} strokeWidth={0.7} />
          <text x={s.x + 12 + i * (w + 6)} y={s.y + 6 + s.h * 0.3} fill={p.dispText} fontSize={7} fontFamily={MONO} style={{ filter: 'drop-shadow(0 0 2px rgba(255,176,32,0.45))' }}>
            {i === 0 ? '118.00  121.50' : '115.50  110.30'}
          </text>
        </g>
      ))}
      {[0.12, 0.42, 0.62, 0.9].map((f, i) => (
        <circle key={f} cx={s.x + s.w * f} cy={s.y + s.h * 0.78} r={i % 3 === 0 ? 4 : 6} fill="#1A1A1B" stroke={p.screw} strokeWidth={0.8} />
      ))}
    </g>
  )
}

// VOR/LOC/GS e DME integrados ao GNS: régua fina clicável sob a tela, como os
// botões CDI/OBS da moldura real — não caixas físicas separadas.
function ReguaGns({ s, p, label }: { s: HotspotRect; p: Pal; label: string }) {
  return (
    <g aria-hidden="true">
      <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={1} fill="#101112" stroke="#000" strokeWidth={0.6} />
      <SmallBtn x={s.x + 4} y={s.y + s.h / 2 - 3} w={14} h={6} />
      <text x={s.x + 22} y={s.y + s.h / 2 + 2} fill={p.sub} fontSize={4.6} fontFamily={MONO}>
        {label}
      </text>
    </g>
  )
}

function PainelAudio({ s, p, night }: { s: HotspotRect; p: Pal; night: boolean }) {
  // Painel de áudio de duas fileiras de teclas brancas, como na foto.
  const keys = 9
  const kw = (s.w - 44) / keys
  return (
    <g>
      <AvionicsShell s={s} p={p} />
      <rect x={s.x + 5} y={s.y + 6} width={11} height={11} rx={1} fill={ARC.blue} fillOpacity={night ? 1 : 0.7} />
      <rect x={s.x + 5} y={s.y + 22} width={11} height={11} rx={1} fill={ARC.amber} fillOpacity={night ? 1 : 0.7} />
      {[0, 1].map((row) =>
        Array.from({ length: keys }).map((_, i) => (
          <SmallBtn key={`${row}-${i}`} x={s.x + 22 + i * kw} y={s.y + 7 + row * 16} w={kw - 4} h={8} />
        )),
      )}
      <circle cx={s.x + s.w - 12} cy={s.y + s.h / 2} r={7} fill="#1A1A1B" stroke={p.screw} strokeWidth={0.8} />
    </g>
  )
}

function LuzesMarker({ s, p, night }: { s: HotspotRect; p: Pal; night: boolean }) {
  // Módulo de luzes marker e testes acima do transponder (foto: três botões
  // brancos/âmbar e a chave RADIO MASTER).
  const lamps = [
    { c: ARC.blue, t: 'O' },
    { c: ARC.amber, t: 'M' },
    { c: ARC.white, t: 'I' },
  ]
  return (
    <g>
      <AvionicsShell s={s} p={p} />
      {lamps.map((l, i) => (
        <Lamp key={l.t} x={s.x + 52 + i * 30} y={s.y + 8} size={14} color={l.c} on={night} round label={l.t} />
      ))}
      <circle cx={s.x + s.w - 24} cy={s.y + 16} r={8} fill="#191919" stroke={p.chrome} strokeWidth={1.5} />
      <rect x={s.x + s.w - 52} y={s.y + s.h - 13} width={46} height={9} rx={1} fill="#E9E4D8" />
      <text x={s.x + s.w - 29} y={s.y + s.h - 6.5} textAnchor="middle" fontSize={4.6} fontFamily={MONO} fill="#151412">
        RADIO MASTER
      </text>
    </g>
  )
}

function Transponder({ s, p, night }: { s: HotspotRect; p: Pal; night: boolean }) {
  // Display digital laranja (KT 76C com display de gás) e botões brancos (foto).
  return (
    <g>
      <AvionicsShell s={s} p={p} />
      <rect x={s.x + 8} y={s.y + 6} width={s.w - 50} height={s.h * 0.42} rx={1.5} fill="#160B03" stroke={p.chrome} strokeOpacity={0.4} strokeWidth={0.8} />
      <text
        x={s.x + 16}
        y={s.y + 6 + s.h * 0.33}
        fill={night ? '#FF8A1F' : '#FF7A14'}
        fontSize={s.h * 0.3}
        fontFamily={MONO}
        style={{ filter: 'drop-shadow(0 0 3px rgba(255,122,20,0.65))' }}
      >
        ALT 1200
      </text>
      {Array.from({ length: 5 }).map((_, i) => (
        <SmallBtn key={i} x={s.x + 30 + i * 24} y={s.y + s.h - 15} w={18} h={8} />
      ))}
      <circle cx={s.x + s.w - 20} cy={s.y + s.h * 0.4} r={10} fill="#1A1A1B" stroke={p.screw} strokeWidth={0.9} />
      <circle cx={s.x + s.w - 20} cy={s.y + s.h * 0.4} r={5} fill="#0B0B0C" stroke={p.screw} strokeWidth={0.6} />
    </g>
  )
}

function AdfReceptor({ s, p }: { s: HotspotRect; p: Pal }) {
  // Receptor com seletor rotativo e janelas de frequência (foto: abaixo do XPDR).
  return (
    <g>
      <AvionicsShell s={s} p={p} />
      <circle cx={s.x + 22} cy={s.y + s.h / 2} r={13} fill="#1A1A1B" stroke={p.screw} strokeWidth={0.9} />
      {['OFF', 'ADF', 'ANT', 'BFO'].map((t, i) => {
        const pt = polar(s.x + 22, s.y + s.h / 2, 19, -60 + i * 40)
        return (
          <text key={t} x={pt.x} y={pt.y + 1.5} textAnchor="middle" fontSize={3.6} fontFamily={MONO} fill={p.sub}>
            {t}
          </text>
        )
      })}
      <rect x={s.x + 62} y={s.y + 8} width={s.w - 72} height={s.h * 0.36} rx={1} fill="#3A3B3D" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={s.x + 66 + i * ((s.w - 80) / 4)} y={s.y + 10} width={(s.w - 80) / 4 - 6} height={s.h * 0.36 - 4} fill="#D9D8D2" />
          <text x={s.x + 66 + i * ((s.w - 80) / 4) + ((s.w - 80) / 4 - 6) / 2} y={s.y + 8 + s.h * 0.27} textAnchor="middle" fontSize={8} fontFamily={MONO} fill="#151412">
            {['0', '3', '5', '0'][i]}
          </text>
          <circle cx={s.x + 66 + i * ((s.w - 80) / 4) + ((s.w - 80) / 4 - 6) / 2} cy={s.y + s.h - 12} r={4} fill="#1A1A1B" stroke={p.screw} strokeWidth={0.7} />
        </g>
      ))}
    </g>
  )
}

// ---------------------------------------------------------------------------
// Faixa escura de anunciadores e mini-mostradores
// ---------------------------------------------------------------------------

function MiniEdgewise({ s, p, night, labels, marks }: { s: HotspotRect; p: Pal; night: boolean; labels: string[]; marks: { v0: number; v1: number; color: string }[][] }) {
  // Mostradores "edgewise" de vidro claro da foto (pares L/R, agulha inclinada).
  const n = labels.length
  const w = s.w / n
  return (
    <g>
      {labels.map((t, i) => {
        const x = s.x + i * w
        return (
          <g key={t}>
            <rect x={x + 2} y={s.y + 3} width={w - 4} height={s.h - 6} rx={3} fill={night ? '#1C1A15' : '#B9B4A5'} stroke="#000" strokeWidth={0.8} />
            <rect x={x + 4} y={s.y + 5} width={w - 8} height={s.h * 0.34} fill="#000" fillOpacity={0.12} />
            {marks[i]?.map((m, k) => (
              <rect key={k} x={x + 4 + (w - 8) * m.v0} y={s.y + 6} width={(w - 8) * (m.v1 - m.v0)} height={2.4} fill={m.color} />
            ))}
            <line x1={x + w * 0.42} y1={s.y + 7} x2={x + w * 0.56} y2={s.y + s.h - 9} stroke={night ? p.mark : '#151412'} strokeWidth={1.4} />
            <text x={x + w / 2} y={s.y + s.h - 5} textAnchor="middle" fill={night ? p.sub : '#151412'} fontSize={4.4} fontFamily={MONO}>
              {t}
            </text>
          </g>
        )
      })}
    </g>
  )
}

function BlackPlacard({ x, y, w, h, lines, tone = 'black' }: Placard) {
  const bg = tone === 'white' ? '#ECEAE2' : tone === 'silver' ? '#9C9C98' : '#0D0D0D'
  const fg = tone === 'white' ? '#141414' : tone === 'silver' ? '#111' : tone === 'blackBright' ? '#F4F2EA' : '#D9D6CC'
  const fs = Math.min((h - 3) / lines.length, (w / Math.max(...lines.map((l) => l.length))) * 1.55)
  return (
    <g aria-hidden="true" data-placard={lines[0]}>
      <rect x={x} y={y} width={w} height={h} rx={1.2} fill={bg} stroke="#000" strokeOpacity={0.7} strokeWidth={0.6} />
      {lines.map((l, i) => (
        <text key={i} x={x + w / 2} y={y + 1.5 + fs * (i + 0.85)} textAnchor="middle" fill={fg} fontSize={fs} fontFamily={MONO}>
          {l}
        </text>
      ))}
    </g>
  )
}

function Lampada({ cx, cy, r, color, on }: { cx: number; cy: number; r: number; color: string; on: boolean }) {
  return (
    <g style={on ? { filter: `drop-shadow(0 0 ${r * 0.8}px ${color})` } : undefined}>
      <circle cx={cx} cy={cy} r={r + 2} fill="#0B0B0B" stroke="#555" strokeWidth={0.6} />
      <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={on ? 1 : 0.35} />
      <circle cx={cx - r * 0.3} cy={cy - r * 0.3} r={r * 0.3} fill="#FFF" fillOpacity={0.25} />
    </g>
  )
}

function LuzTremVermelha({ s, night }: { s: HotspotRect; night: boolean }) {
  return (
    <g>
      <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={2} fill="#7A1214" fillOpacity={night ? 1 : 0.85} stroke="#000" strokeWidth={0.8} style={night ? { filter: 'drop-shadow(0 0 5px #FF4D4D)' } : undefined} />
      <rect x={s.x + 3} y={s.y + 3} width={s.w - 6} height={s.h - 6} rx={1} fill={ARC.red} fillOpacity={night ? 0.95 : 0.55} />
    </g>
  )
}

function PainelAnunciador({ s, p, night }: { s: HotspotRect; p: Pal; night: boolean }) {
  // Bloco de luzes de aviso e teste ao lado do PR-FLM (foto): seis lentes.
  const legends = ['L ALT', 'R ALT', 'GEAR', 'L VAC', 'R VAC', 'DOOR']
  return (
    <g>
      <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={2} fill="#111" stroke={p.hair} strokeWidth={0.8} />
      {legends.map((l, i) => {
        const col = i % 3
        const row = Math.floor(i / 3)
        const red = i < 3
        const cw = (s.w - 8) / 3
        return (
          <g key={l}>
            <rect x={s.x + 4 + col * cw} y={s.y + 4 + row * ((s.h - 8) / 2)} width={cw - 3} height={(s.h - 8) / 2 - 3} rx={1} fill={red ? ARC.red : ARC.amber} fillOpacity={night ? 0.95 : 0.3} />
            <text x={s.x + 4 + col * cw + (cw - 3) / 2} y={s.y + 4 + row * ((s.h - 8) / 2) + ((s.h - 8) / 2 - 3) / 2 + 1.8} textAnchor="middle" fontSize={5} fontFamily={MONO} fill={night ? '#140A05' : '#E9E4D8'} fontWeight={600}>
              {l}
            </text>
          </g>
        )
      })}
    </g>
  )
}

function AvisoEstol({ sh, night }: { sh: HotspotCircle; night: boolean }) {
  return <Lampada cx={sh.cx} cy={sh.cy} r={sh.r - 2} color={ARC.red} on={night} />
}

function Amperimetros({ s, p, night }: { s: HotspotRect; p: Pal; night: boolean }) {
  // Dois mini-mostradores ALT AMPERES (um com face âmbar, foto) — 0–60 A.
  const r = Math.min(s.h / 2 - 3, s.w / 4 - 3)
  return (
    <g>
      {[0, 1].map((i) => {
        const cx = s.x + s.w * (0.25 + i * 0.5)
        const cy = s.y + s.h / 2
        const sc: ScaleCfg = { min: 0, max: 60, start: -60, end: 60 }
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={r} fill="#0C0C0C" stroke={p.hair} strokeWidth={1} />
            <circle cx={cx} cy={cy} r={r - 2.5} fill={i === 0 ? (night ? '#3A2508' : '#B07A2E') : p.face} />
            {[0, 20, 40, 60].map((v) => {
              const a = angleOf(v, sc)
              const p1 = polar(cx, cy + r * 0.35, r * 0.85, a)
              const p2 = polar(cx, cy + r * 0.35, r * 0.7, a)
              return <line key={v} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={p.mark} strokeWidth={0.8} />
            })}
            <RadialMark cx={cx} cy={cy + r * 0.35} r={r * 0.9} s={sc} v={60} color={ARC.red} w={1.2} len={r * 0.18} />
            <line x1={cx} y1={cy + r * 0.35} x2={polar(cx, cy + r * 0.35, r * 0.78, angleOf(22, sc)).x} y2={polar(cx, cy + r * 0.35, r * 0.78, angleOf(22, sc)).y} stroke={p.mark} strokeWidth={1.2} />
            <text x={cx} y={cy + r * 0.25} textAnchor="middle" fontSize={r * 0.2} fontFamily={MONO} fill={p.mark}>
              ALT AMP
            </text>
          </g>
        )
      })}
    </g>
  )
}

function Aquecimento({ s, p }: { s: HotspotRect; p: Pal }) {
  // Puxadores DEFROST / CABIN HEAT na faixa escura à direita (foto).
  return (
    <g>
      <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={2} fill="#121212" stroke={p.hair} strokeWidth={0.7} />
      {['CABIN HEAT', 'DEFROST'].map((t, i) => {
        const y = s.y + 16 + i * 24
        return (
          <g key={t}>
            <line x1={s.x + 10} y1={y} x2={s.x + s.w - 10} y2={y} stroke={p.chrome} strokeOpacity={0.6} strokeWidth={2} />
            <circle cx={s.x + 46 + i * 30} cy={y} r={5} fill="#4A2A1A" stroke={p.screw} strokeWidth={0.8} />
            <text x={s.x + s.w - 12} y={y - 4} textAnchor="end" fill={p.sub} fontSize={5} fontFamily={MONO}>
              {t}
            </text>
          </g>
        )
      })}
    </g>
  )
}

// ---------------------------------------------------------------------------
// Faixa creme — piloto automático, trem, pedestal e direita
// ---------------------------------------------------------------------------

function PilotoAutomatico({ s, p }: { s: HotspotRect; p: Pal }) {
  // Piper AutoControl III: placa preta, botão rotativo central e duas teclas
  // (foto: "PIPER AUTOCONTROL III" na base).
  return (
    <g>
      <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={2} fill="#121212" stroke="#000" strokeWidth={0.8} filter="url(#ck-module-shadow)" />
      <SmallBtn x={s.x + 8} y={s.y + 10} w={14} h={16} />
      <SmallBtn x={s.x + s.w - 22} y={s.y + 10} w={14} h={16} />
      <circle cx={s.x + s.w / 2} cy={s.y + s.h * 0.42} r={13} fill="#E9E7E0" stroke="#000" strokeWidth={0.8} />
      <rect x={s.x + s.w / 2 - 2} y={s.y + s.h * 0.42 - 13} width={4} height={10} fill="#333" />
      <text x={s.x + s.w / 2} y={s.y + s.h - 5} textAnchor="middle" fill="#D9D6CC" fontSize={5} fontFamily={MONO}>
        PIPER AUTOCONTROL III
      </text>
      <text x={s.x + 15} y={s.y + 8} textAnchor="middle" fill="#D9D6CC" fontSize={3.6} fontFamily={MONO}>
        ON/OFF
      </text>
      <text x={s.x + s.w - 15} y={s.y + 8} textAnchor="middle" fill="#D9D6CC" fontSize={3.6} fontFamily={MONO}>
        HDG
      </text>
      <text x={s.x + s.w / 2} y={s.y + 8} textAnchor="middle" fill={p.sub} fontSize={3.6} fontFamily={MONO}>
        L · R
      </text>
    </g>
  )
}

function AvisosEletricosVacuo({ s, p, night }: { s: HotspotRect; p: Pal; night: boolean }) {
  // Pequeno bloco de duas lentes vermelhas junto ao AP (foto: OV/VAC).
  return (
    <g>
      <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={2} fill="#111" stroke={p.hair} strokeWidth={0.6} />
      <Lampada cx={s.x + s.w / 2} cy={s.y + s.h * 0.3} r={4.5} color={ARC.red} on={night} />
      <Lampada cx={s.x + s.w / 2} cy={s.y + s.h * 0.72} r={4.5} color={ARC.red} on={night} />
    </g>
  )
}

function FreioEstacionamento({ s, p }: { s: HotspotRect; p: Pal }) {
  // Puxador em T sob a faixa creme (foto), com botão de trava à esquerda.
  const cx = s.x + s.w / 2
  return (
    <g>
      <rect x={s.x + 6} y={s.y + 4} width={s.w - 12} height={12} rx={2} fill="#151515" stroke={p.screw} strokeWidth={0.8} />
      <rect x={cx - 4} y={s.y + 16} width={8} height={s.h - 26} rx={2} fill="#2A2A2A" stroke={p.screw} strokeWidth={0.8} />
      <circle cx={s.x + 10} cy={s.y + s.h - 8} r={5} fill="#E9E4D8" stroke="#000" strokeWidth={0.6} />
      <rect x={s.x + 18} y={s.y + s.h - 10} width={s.w - 22} height={8} rx={1} fill="#0D0D0D" />
      <text x={s.x + 18 + (s.w - 22) / 2} y={s.y + s.h - 4.5} textAnchor="middle" fill="#D9D6CC" fontSize={4} fontFamily={MONO}>
        PARK BRAKE
      </text>
    </g>
  )
}

function LuzesTrem({ s, night }: { s: HotspotRect; night: boolean }) {
  // Três luzes verdes ao lado da manete de potência (foto e SOP).
  return (
    <g>
      <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={2} fill="#111" />
      {[0, 1, 2].map((i) => (
        <Lampada key={i} cx={s.x + s.w * (0.2 + i * 0.3)} cy={s.y + s.h / 2} r={5.5} color={ARC.green} on={night} />
      ))}
    </g>
  )
}

function SeletorTrem({ s, p }: { s: HotspotRect; p: Pal }) {
  // Seletor do trem com manípulo em roda (prata), trilho UP/DOWN.
  const cx = s.x + s.w / 2
  return (
    <g>
      <rect x={s.x + 4} y={s.y} width={s.w - 8} height={s.h} rx={3} fill="#121212" stroke={p.hair} strokeWidth={0.7} />
      <rect x={cx - 3} y={s.y + 8} width={6} height={s.h - 16} rx={3} fill="#000" />
      <text x={s.x + s.w - 7} y={s.y + 12} textAnchor="end" fill="#D9D6CC" fontSize={5} fontFamily={MONO}>
        UP
      </text>
      <text x={s.x + s.w - 7} y={s.y + s.h - 6} textAnchor="end" fill="#D9D6CC" fontSize={5} fontFamily={MONO}>
        DN
      </text>
      <rect x={cx - 9} y={s.y + s.h - 32} width={18} height={10} rx={3} fill="#2B2B2B" />
      <circle cx={cx} cy={s.y + s.h - 40} r={10} fill="#DCDAD3" stroke="#555" strokeWidth={1} />
      <circle cx={cx} cy={s.y + s.h - 40} r={4} fill="#9F9C95" />
    </g>
  )
}

function ExtensaoEmergencia({ s }: { s: HotspotRect }) {
  // Puxador redondo vinho com guarda prata (foto: abaixo do seletor).
  const cx = s.x + s.w / 2
  const cy = s.y + s.h * 0.48
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={s.w / 2 - 2} ry={s.h * 0.34} fill="#1A1A1A" />
      <ellipse cx={cx} cy={cy} rx={s.w / 2 - 7} ry={s.h * 0.27} fill="#6E2D24" stroke="#3A120D" strokeWidth={1} />
      <rect x={s.x + 3} y={cy - 2} width={s.w - 6} height={4} rx={1.5} fill="#C9C8C2" />
      <rect x={cx - 2} y={s.y + s.h - 8} width={4} height={6} fill={ARC.red} />
    </g>
  )
}

// Quadrante: duas manetes por função (L/R). Pretas = potência, azuis = hélice,
// vermelhas = mistura; trilhos serrilhados atrás (foto).
function Manetes({ s, p, color, knob }: { s: HotspotRect; p: Pal; color: string; knob: 'throttle' | 'square' }) {
  return (
    <g>
      <rect x={s.x} y={s.y} width={s.w} height={s.h} fill="#1A1A1A" />
      {[0, 1].map((i) => {
        const x = s.x + 6 + i * ((s.w - 12) / 2)
        const w = (s.w - 12) / 2 - 4
        return (
          <g key={i}>
            {/* trilho serrilhado */}
            {Array.from({ length: 14 }).map((_, k) => (
              <rect key={k} x={x + w / 2 - 4} y={s.y + 40 + k * 5.6} width={8} height={2.6} fill="#8D8B85" opacity={0.75} />
            ))}
            <rect x={x + w / 2 - 1.5} y={s.y + 20} width={3} height={s.h - 26} fill="#555" />
            {knob === 'throttle' ? (
              <rect x={x - 3} y={s.y + 4} width={w + 6} height={28} rx={8} fill={color} stroke="#000" strokeWidth={0.8} />
            ) : (
              <path
                d={`M ${x} ${s.y + 22} h ${w} v 16 h ${-w} Z M ${x + 2} ${s.y + 22} l ${w / 2 - 2} -6 l ${w / 2 - 2} 6`}
                fill={color}
                stroke="#000"
                strokeOpacity={0.55}
                strokeWidth={0.8}
              />
            )}
            {knob === 'throttle' && <rect x={x} y={s.y + 8} width={w} height={4} rx={2} fill="#FFF" opacity={0.12} />}
          </g>
        )
      })}
      <rect x={s.x} y={s.y + s.h - 6} width={s.w} height={6} fill={p.creamShade} />
    </g>
  )
}

function ArAlternativo({ s, p }: { s: HotspotRect; p: Pal }) {
  // ALT AIR OFF/ON entre dois puxadores prata (foto).
  const cx = s.x + s.w / 2
  return (
    <g>
      {[s.x + 26, s.x + s.w - 26].map((x) => (
        <g key={x}>
          <rect x={x - 3} y={s.y} width={6} height={18} fill="#2A2A2A" />
          <rect x={x - 13} y={s.y + 16} width={26} height={22} rx={6} fill="#C9C8C2" stroke="#555" strokeWidth={0.8} />
          <rect x={x - 11} y={s.y + 20} width={22} height={3} rx={1.5} fill="#FFF" opacity={0.5} />
        </g>
      ))}
      <rect x={cx - 18} y={s.y + 4} width={36} height={30} rx={2} fill="#101010" stroke={p.hair} strokeWidth={0.6} />
      <text x={cx} y={s.y + 13} textAnchor="middle" fill="#D9D6CC" fontSize={6} fontFamily={MONO}>
        ALT
      </text>
      <text x={cx} y={s.y + 21} textAnchor="middle" fill="#D9D6CC" fontSize={6} fontFamily={MONO}>
        AIR
      </text>
      <text x={cx} y={s.y + 29} textAnchor="middle" fill="#D9D6CC" fontSize={4} fontFamily={MONO}>
        OFF · ON
      </text>
    </g>
  )
}

function CowlFlaps({ s, p }: { s: HotspotRect; p: Pal }) {
  // Face vertical do pedestal: duas bolas pretas L/R e placa COWL FLAP (foto).
  const cx = s.x + s.w / 2
  return (
    <g>
      {[s.x + 26, s.x + s.w - 26].map((x) => (
        <g key={x}>
          <rect x={x - 2} y={s.y + 30} width={4} height={18} fill="#222" />
          <circle cx={x} cy={s.y + 22} r={17} fill="#121212" stroke="#000" strokeWidth={0.8} />
          <circle cx={x - 6} cy={s.y + 15} r={5} fill="#FFF" opacity={0.12} />
        </g>
      ))}
      <rect x={cx - 34} y={s.y + 54} width={68} height={30} rx={2} fill="#101010" stroke={p.hair} strokeWidth={0.6} />
      <text x={cx} y={s.y + 61} textAnchor="middle" fill="#D9D6CC" fontSize={3.8} fontFamily={MONO}>
        PULL - CLOSE
      </text>
      <text x={cx} y={s.y + 70} textAnchor="middle" fill="#D9D6CC" fontSize={7} fontFamily={MONO}>
        COWL
      </text>
      <text x={cx} y={s.y + 78} textAnchor="middle" fill="#D9D6CC" fontSize={7} fontFamily={MONO}>
        FLAP
      </text>
      <text x={cx - 27} y={s.y + 72} textAnchor="middle" fill="#D9D6CC" fontSize={5} fontFamily={MONO}>
        L
      </text>
      <text x={cx + 27} y={s.y + 72} textAnchor="middle" fill="#D9D6CC" fontSize={5} fontFamily={MONO}>
        R
      </text>
      <text x={cx} y={s.y + 82.5} textAnchor="middle" fill="#D9D6CC" fontSize={3.8} fontFamily={MONO}>
        PUSH - OPEN
      </text>
    </g>
  )
}

function EstaticaAlternada({ s, p }: { s: HotspotRect; p: Pal }) {
  // Placa ALTERNATE STATIC SOURCE + puxador e interruptor de luz do painel (foto).
  return (
    <g>
      <rect x={s.x} y={s.y} width={s.w} height={s.h * 0.4} rx={1.5} fill="#101010" />
      {['ALTERNATE STATIC', 'SOURCE', 'PULL ON TO OPEN'].map((t, i) => (
        <text key={t} x={s.x + s.w / 2} y={s.y + 9 + i * 10} textAnchor="middle" fill="#D9D6CC" fontSize={4.6} fontFamily={MONO}>
          {t}
        </text>
      ))}
      <rect x={s.x + 6} y={s.y + s.h * 0.48} width={22} height={s.h * 0.44} rx={2} fill="#101010" />
      <rect x={s.x + 14} y={s.y + s.h * 0.55} width={6} height={s.h * 0.3} rx={2} fill="#C9C8C2" />
      <rect x={s.x + s.w - 24} y={s.y + s.h * 0.48} width={16} height={s.h * 0.44} rx={3} fill={p.creamShade} stroke="#555" strokeWidth={0.6} />
      <rect x={s.x + s.w - 20} y={s.y + s.h * 0.52} width={8} height={s.h * 0.36} rx={2} fill="#E9E4D8" />
    </g>
  )
}

function Disjuntores({ s, p }: { s: HotspotRect; p: Pal }) {
  // Painel preto com duas fileiras de disjuntores de aro claro (foto).
  const cols = 16
  const dx = (s.w - 20) / cols
  return (
    <g>
      <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={2} fill="#121212" stroke="#000" strokeWidth={0.8} filter="url(#ck-module-shadow)" />
      {[0, 1].map((row) =>
        Array.from({ length: cols }).map((_, i) => {
          if (row === 0 && i >= 6 && i <= 8) return null // vão do manche (foto)
          const x = s.x + 10 + dx / 2 + i * dx
          const y = s.y + 18 + row * 38
          return (
            <g key={`${row}-${i}`}>
              <circle cx={x} cy={y} r={7.5} fill="#5C6A55" stroke="#000" strokeWidth={0.6} />
              <circle cx={x} cy={y} r={5.5} fill="#E5E2D8" />
              <circle cx={x} cy={y} r={2.6} fill="#8E8A80" />
            </g>
          )
        }),
      )}
      {[0, 1].map((row) => (
        <line key={row} x1={s.x + 8} y1={s.y + 32 + row * 38} x2={s.x + s.w - 8} y2={s.y + 32 + row * 38} stroke={p.chrome} strokeOpacity={0.15} strokeWidth={4} />
      ))}
    </g>
  )
}

// ---------------------------------------------------------------------------
// Console lateral esquerdo (interruptores junto à porta)
// ---------------------------------------------------------------------------

function Rockers({ s, items }: { s: HotspotRect; items: string[] }) {
  const n = items.length
  const bw = Math.min(18, (s.w - 12) / n - 4)
  return (
    <g>
      <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={3} fill="#141414" stroke="#000" strokeWidth={0.8} />
      {items.map((it, i) => {
        const x = s.x + 6 + i * ((s.w - 12) / n) + ((s.w - 12) / n - bw) / 2
        return (
          <g key={it}>
            <rect x={x} y={s.y + 6} width={bw} height={s.h - 22} rx={2} fill="#C9C8C2" stroke="#000" strokeWidth={0.6} />
            <rect x={x + 1.5} y={s.y + 7.5} width={bw - 3} height={(s.h - 22) / 2 - 1} rx={1.5} fill="#E9E8E2" />
            <text x={x + bw / 2} y={s.y + s.h - 6} textAnchor="middle" fill="#D9D6CC" fontSize={5} fontFamily={MONO}>
              {it}
            </text>
          </g>
        )
      })}
    </g>
  )
}

function Magnetos({ s, p }: { s: HotspotRect; p: Pal }) {
  return (
    <g>
      <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={3} fill="#141414" stroke="#000" strokeWidth={0.8} />
      {['L', 'R'].map((m, i) => {
        const x = s.x + s.w * (0.28 + i * 0.44)
        const cy = s.y + s.h * 0.42
        return (
          <g key={m}>
            <Knob cx={x} cy={cy} r={11} p={p} angle={-90} color="#2A2A2A" />
            <text x={x} y={s.y + s.h - 5} textAnchor="middle" fill="#D9D6CC" fontSize={5} fontFamily={MONO}>
              MAG {m}
            </text>
          </g>
        )
      })}
      <circle cx={s.x + s.w / 2} cy={s.y + 10} r={4} fill={ARC.red} fillOpacity={0.6} />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Copiloto — seis mostradores como na foto (faces verde-oliva no ALT/VSI,
// DG com avião laranja).
// ---------------------------------------------------------------------------

function GiroLaranja({ sh, p }: { sh: HotspotCircle; p: Pal }) {
  // DG do copiloto: cartão preto com avião laranja e marcas laranja (foto).
  const { cx, cy, r } = sh
  const ri = r - 6
  const card = ['N', '3', '6', 'E', '12', '15', 'S', '21', '24', 'W', '30', '33']
  return (
    <g>
      <Bezel cx={cx} cy={cy} r={r} p={p} />
      <circle cx={cx} cy={cy} r={ri} fill="#0E1210" />
      {Array.from({ length: 36 }).map((_, i) => {
        const p1 = polar(cx, cy, ri - 1, i * 10)
        const p2 = polar(cx, cy, ri - (i % 3 === 0 ? r * 0.12 : r * 0.07), i * 10)
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={i % 9 === 0 ? ARC.amber : p.mark} strokeWidth={0.8} />
      })}
      {card.map((t, i) => {
        const pt = polar(cx, cy, ri - r * 0.24, i * 30)
        return (
          <text key={t} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="central" fill={p.mark} fontSize={i % 3 === 0 ? r * 0.17 : r * 0.12} fontFamily={MONO}>
            {t}
          </text>
        )
      })}
      <path
        d={`M ${cx} ${cy - r * 0.42} L ${cx + r * 0.07} ${cy - r * 0.08} L ${cx + r * 0.42} ${cy + r * 0.02} L ${cx + r * 0.42} ${cy + r * 0.1} L ${cx + r * 0.07} ${cy + r * 0.08} L ${cx + r * 0.05} ${cy + r * 0.3} L ${cx + r * 0.16} ${cy + r * 0.38} L ${cx - r * 0.16} ${cy + r * 0.38} L ${cx - r * 0.05} ${cy + r * 0.3} L ${cx - r * 0.07} ${cy + r * 0.08} L ${cx - r * 0.42} ${cy + r * 0.1} L ${cx - r * 0.42} ${cy + r * 0.02} L ${cx - r * 0.07} ${cy - r * 0.08} Z`}
        fill="none"
        stroke="#FF7A1A"
        strokeWidth={1.6}
      />
      <path d={`M ${cx} ${cy - ri + 1} l -3.5 6 h 7 Z`} fill="#FF7A1A" />
    </g>
  )
}

function HorizonteAzul({ sh, p }: { sh: HotspotCircle; p: Pal }) {
  // AI do copiloto: céu azul-claro e terra verde (foto), aviãozinho branco.
  const { cx, cy, r } = sh
  const ri = r - 6
  const clipId = useId()
  return (
    <g>
      <Bezel cx={cx} cy={cy} r={r} p={p} />
      <clipPath id={clipId}>
        <circle cx={cx} cy={cy} r={ri} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect x={cx - ri} y={cy - ri} width={ri * 2} height={ri * 1.05} fill="#7FB5CF" />
        <rect x={cx - ri} y={cy + ri * 0.05} width={ri * 2} height={ri} fill="#4E6A3A" />
        <line x1={cx - ri} y1={cy + ri * 0.05} x2={cx + ri} y2={cy + ri * 0.05} stroke="#F2F7FB" strokeWidth={1.2} />
        {[-2, -1, 1, 2].map((d) => (
          <line key={d} x1={cx - r * 0.15} y1={cy + d * r * 0.14} x2={cx + r * 0.15} y2={cy + d * r * 0.14} stroke="#F2F7FB" strokeWidth={0.7} />
        ))}
      </g>
      {[0, 10, 20, 30, 60].flatMap((d) => (d === 0 ? [0] : [d, -d])).map((d) => {
        const p1 = polar(cx, cy, ri, d)
        const p2 = polar(cx, cy, ri - r * 0.1, d)
        return <line key={d} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#F2F7FB" strokeWidth={1} />
      })}
      <g stroke="#F2F2EC" strokeWidth={2} strokeLinecap="round">
        <line x1={cx - r * 0.34} y1={cy + r * 0.05} x2={cx - r * 0.1} y2={cy + r * 0.05} />
        <line x1={cx + r * 0.1} y1={cy + r * 0.05} x2={cx + r * 0.34} y2={cy + r * 0.05} />
      </g>
      <circle cx={cx} cy={cy + r * 0.05} r={1.8} fill="#F2F2EC" />
      <circle cx={cx} cy={cy + r * 0.8} r={r * 0.12} fill="#151515" stroke={p.screw} strokeWidth={0.6} />
    </g>
  )
}

function CopilotoPack({ s, p, ctx }: { s: HotspotRect; p: Pal; ctx: ArtCtx }) {
  const parts = PANEL_MAP.instrumentos_copiloto?.parts ?? []
  const [asi, ai, alt, tc, dg, vsi] = parts
  if (!vsi) return <rect x={s.x} y={s.y} width={s.w} height={s.h} fill="none" />
  return (
    <g>
      <GenericGauge sh={asi} p={p} ctx={ctx} cfg={{ ...genericCfg('velocimetro'), label: 'AIRSPEED', sub: 'MPH' }} />
      <HorizonteAzul sh={ai} p={p} />
      <Altimetro sh={alt} p={p} ctx={ctx} olive />
      <Coordenador sh={tc} p={p} />
      <GiroLaranja sh={dg} p={p} />
      <GenericGauge sh={vsi} p={p} ctx={ctx} cfg={{ ...genericCfg('variometro'), label: 'VERTICAL', sub: 'SPEED', olive: true }} />
    </g>
  )
}

function RelogioCopiloto({ s, p, night }: { s: HotspotRect; p: Pal; night: boolean }) {
  // Cronômetro digital redondo (foto: "CHRONOMETER", LCD verde e botão azul)
  // e tomada 12 V logo acima.
  const cx = s.x + s.w / 2
  const cy = s.y + s.h * 0.62
  const r = s.w / 2 - 4
  return (
    <g>
      <circle cx={cx} cy={s.y + 14} r={10} fill="#0B0B0B" stroke={p.chrome} strokeWidth={1.4} />
      <circle cx={cx} cy={s.y + 14} r={4} fill="none" stroke={p.sub} strokeWidth={0.8} />
      <text x={cx} y={s.y + 32} textAnchor="middle" fill={p.sub} fontSize={4.6} fontFamily={MONO}>
        12V
      </text>
      <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2 + 18} rx={r} fill="#131313" stroke={p.hair} strokeWidth={0.9} />
      <text x={cx} y={cy - r * 0.55} textAnchor="middle" fill={p.sub} fontSize={4.4} fontFamily={MONO}>
        CHRONOMETER
      </text>
      <rect x={cx - r * 0.7} y={cy - r * 0.38} width={r * 1.4} height={r * 0.62} rx={2} fill={night ? '#29401F' : '#9DB08A'} />
      <text x={cx} y={cy + r * 0.08} textAnchor="middle" fill="#14200F" fontSize={r * 0.36} fontFamily={MONO}>
        12:34
      </text>
      <circle cx={cx} cy={cy + r * 0.62} r={4} fill="#2F7BFF" />
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

// Instrumentos de motor da faixa creme: face clara com marcações escuras e
// faixas verdes no arco externo, bisel cromado (foto). Escalas inalteradas.
const CREAM_GAUGES = new Set(['pressao_admissao', 'tacometro_duplo', 'tacometro_direito', 'quantidade_combustivel'])

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
        return <HorizonteAzul sh={s} p={p} />
      case 'coordenador_curva':
        return <Coordenador sh={s} p={p} />
      case 'indicador_vor_1':
        return <Cdi sh={s} p={p} />
      case 'adf_indicador':
        return <Adf sh={s} p={p} />
      case 'relogio':
        return <Relogio sh={s} p={p} />
      case 'aviso_estol':
        return <AvisoEstol sh={s} night={ctx.night} />
      default: {
        const cfg = genericCfg(id)
        return <GenericGauge sh={s} p={p} ctx={ctx} cfg={CREAM_GAUGES.has(id) && !ctx.night ? { ...cfg, cream: true } : cfg} />
      }
    }
  }

  switch (id) {
    case 'bussola_magnetica':
      return <Bussola s={s} p={p} />
    case 'giro_direcional':
      return <HsiQuadrado s={s} p={p} />
    case 'painel_audio':
      return <PainelAudio s={s} p={p} night={ctx.night} />
    case 'navcom_1':
      return <Mfd s={s} p={p} night={ctx.night} />
    case 'navcom_2':
      return <Navcom2 s={s} p={p} />
    case 'indicador_vor_2_gs':
      return <ReguaGns s={s} p={p} label="CDI · VLOC/GS" />
    case 'dme':
      return <ReguaGns s={s} p={p} label="DME/RNAV" />
    case 'luzes_marker':
      return <LuzesMarker s={s} p={p} night={ctx.night} />
    case 'transponder':
      return <Transponder s={s} p={p} night={ctx.night} />
    case 'adf_receptor':
      return <AdfReceptor s={s} p={p} />
    case 'luz_trem_vermelha':
      return <LuzTremVermelha s={s} night={ctx.night} />
    case 'painel_anunciador':
      return <PainelAnunciador s={s} p={p} night={ctx.night} />
    case 'pressao_oleo':
      return <MiniEdgewise s={s} p={p} night={ctx.night} labels={['OIL P L', 'OIL P R']} marks={[[{ v0: 0.4, v1: 0.75, color: ARC.green }], [{ v0: 0.4, v1: 0.75, color: ARC.green }]]} />
    case 'temperatura_oleo':
      return <MiniEdgewise s={s} p={p} night={ctx.night} labels={['OIL T L', 'OIL T R']} marks={[[{ v0: 0.12, v1: 0.85, color: ARC.green }], [{ v0: 0.12, v1: 0.85, color: ARC.green }]]} />
    case 'fluxo_combustivel_pressao':
      return <MiniEdgewise s={s} p={p} night={ctx.night} labels={['FUEL PSI', 'FUEL GPH']} marks={[[{ v0: 0.3, v1: 0.7, color: ARC.green }], []]} />
    case 'cht':
      return <MiniEdgewise s={s} p={p} night={ctx.night} labels={['CHT L', 'CHT R']} marks={[[{ v0: 0.15, v1: 0.9, color: ARC.green }], [{ v0: 0.15, v1: 0.9, color: ARC.green }]]} />
    case 'amperimetros':
      return <Amperimetros s={s} p={p} night={ctx.night} />
    case 'aquecimento_desembacador':
      return <Aquecimento s={s} p={p} />
    case 'piloto_automatico':
      return <PilotoAutomatico s={s} p={p} />
    case 'avisos_eletricos_vacuo':
      return <AvisosEletricosVacuo s={s} p={p} night={ctx.night} />
    case 'freio_estacionamento':
      return <FreioEstacionamento s={s} p={p} />
    case 'luzes_trem_verdes':
      return <LuzesTrem s={s} night={ctx.night} />
    case 'seletor_trem':
      return <SeletorTrem s={s} p={p} />
    case 'extensao_emergencia_trem':
      return <ExtensaoEmergencia s={s} />
    case 'manetes_potencia':
      return <Manetes s={s} p={p} color="#141414" knob="throttle" />
    case 'manetes_helice':
      return <Manetes s={s} p={p} color="#3E7BE0" knob="square" />
    case 'manetes_mistura':
      return <Manetes s={s} p={p} color="#D81F26" knob="square" />
    case 'ar_alternativo':
      return <ArAlternativo s={s} p={p} />
    case 'cowl_flaps':
      return <CowlFlaps s={s} p={p} />
    case 'estatica_alternada':
      return <EstaticaAlternada s={s} p={p} />
    case 'disjuntores':
      return <Disjuntores s={s} p={p} />
    case 'chave_master':
      return <Rockers s={s} items={['BAT']} />
    case 'chaves_alternadores':
      return <Rockers s={s} items={['ALT L', 'ALT R']} />
    case 'chaves_magnetos_partida':
      return <Magnetos s={s} p={p} />
    case 'bombas_combustivel_eletricas':
      return <Rockers s={s} items={['PUMP L', 'PUMP R']} />
    case 'pitot_heat_luzes':
      return <Rockers s={s} items={['PITOT', 'NAV', 'LDG']} />
    case 'instrumentos_copiloto':
      return <CopilotoPack s={s} p={p} ctx={ctx} />
    case 'relogio_copiloto_acendedor':
      return <RelogioCopiloto s={s} p={p} night={ctx.night} />
    default:
      return <ModuleShell s={s} p={p} />
  }
}

// ---------------------------------------------------------------------------
// Chapas do painel (glareshield, chapa preta, faixa creme, pedestal, placas)
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
        <stop offset="0%" stopColor="#2A2B2C" />
        <stop offset="50%" stopColor="#222324" />
        <stop offset="100%" stopColor="#1A1B1C" />
      </linearGradient>
      <linearGradient id="ck-panel-night" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0E0E0E" />
        <stop offset="50%" stopColor="#090909" />
        <stop offset="100%" stopColor="#060606" />
      </linearGradient>
      <radialGradient id="ck-panel-sheen" cx="48%" cy="8%" r="94%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.08" />
        <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.02" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="ck-tan-day" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ABA392" />
        <stop offset="55%" stopColor="#9C9483" />
        <stop offset="100%" stopColor="#857E70" />
      </linearGradient>
      <linearGradient id="ck-tan-night" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4A453C" />
        <stop offset="58%" stopColor="#3E3A33" />
        <stop offset="100%" stopColor="#302D28" />
      </linearGradient>
      {/* Paredes laterais creme (forro), mais escuras para o fundo da cabine. */}
      <linearGradient id="ck-wall-day-l" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#B4AC9C" />
        <stop offset="70%" stopColor="#9A8E78" />
        <stop offset="100%" stopColor="#7E735F" />
      </linearGradient>
      <linearGradient id="ck-wall-day-r" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0%" stopColor="#B4AC9C" />
        <stop offset="70%" stopColor="#9A8E78" />
        <stop offset="100%" stopColor="#7E735F" />
      </linearGradient>
      <linearGradient id="ck-wall-night-l" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#3A362F" />
        <stop offset="100%" stopColor="#24221E" />
      </linearGradient>
      <linearGradient id="ck-wall-night-r" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0%" stopColor="#3A362F" />
        <stop offset="100%" stopColor="#24221E" />
      </linearGradient>
      <linearGradient id="ck-console-day" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#C2BBAC" />
        <stop offset="100%" stopColor="#A39A88" />
      </linearGradient>
      <linearGradient id="ck-console-night" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#47433B" />
        <stop offset="100%" stopColor="#36332D" />
      </linearGradient>
      <linearGradient id="ck-padding" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3A3937" />
        <stop offset="42%" stopColor="#161615" />
        <stop offset="100%" stopColor="#070707" />
      </linearGradient>
      <linearGradient id="ck-chrome" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F2F2EE" />
        <stop offset="45%" stopColor="#9C9B96" />
        <stop offset="100%" stopColor="#4C4B48" />
      </linearGradient>
      <linearGradient id="ck-yoke" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3A4558" />
        <stop offset="40%" stopColor="#121722" />
        <stop offset="100%" stopColor="#05070B" />
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

const poly = (pts: Pt[]) => `M ${pts.map(([x, y]) => `${x} ${y}`).join(' L ')} Z`
const open = (pts: Pt[]) => `M ${pts.map(([x, y]) => `${x} ${y}`).join(' L ')}`

function Screw({ x, y, p, a = 30 }: { x: number; y: number; p: Pal; a?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={3} fill="#151515" stroke={p.screw} strokeWidth={0.9} />
      <line x1={x - 1.8} y1={y} x2={x + 1.8} y2={y} stroke={p.screw} strokeWidth={0.8} transform={`rotate(${a} ${x} ${y})`} />
    </g>
  )
}


/** Placas impressas sobre a chapa (também exportadas para o atlas do Blender). */
export function Placards() {
  return (
    <>
      {PLACARDS.map((pl) => (
        <BlackPlacard key={pl.lines[0]} {...pl} />
      ))}
    </>
  )
}

/** Placa preta da base do pedestal (impressão; o Blender a aplica como decalque). */
export function PedestalBasePrint() {
  const { x, y, w, h } = PEDESTAL_BASE.placa
  return (
    <g data-art-only="placa-base-pedestal">
      <rect x={x} y={y} width={w} height={h} rx={1.2} fill="#121212" stroke="#000" strokeWidth={0.6} />
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={x + 6} y1={y + 5 + i * 4} x2={x + w - 6} y2={y + 5 + i * 4} stroke="#BDB9AF" strokeOpacity={0.55} strokeWidth={1} strokeDasharray="5 1.5" />
      ))}
    </g>
  )
}

/** Horímetro (Hobbs) do centro da faixa escura: só arte, sem hotspot. */
export function HorimetroArt({ night }: { night: boolean }) {
  return <Horimetro p={pal(night)} night={night} />
}

function Horimetro({ p, night }: { p: Pal; night: boolean }) {
  const { plate: pl, cx, cy, r } = HORIMETRO
  return (
    <g data-art-only="horimetro">
      <rect x={pl.x} y={pl.y} width={pl.w} height={pl.h} rx={3} fill={night ? '#0B0C0C' : '#1C1D1E'} stroke="#000" strokeWidth={1} />
      <rect x={pl.x + 2} y={pl.y + 2} width={pl.w - 4} height={pl.h - 4} rx={2} fill="none" stroke={p.chrome} strokeOpacity={0.12} strokeWidth={0.8} />
      <Screw x={pl.x + 26} y={cy - 4} p={p} a={40} />
      <Screw x={pl.x + pl.w - 26} y={cy - 4} p={p} a={-20} />
      <circle cx={cx} cy={cy} r={r + 3} fill="#000" fillOpacity={0.5} />
      <circle cx={cx} cy={cy} r={r} fill={night ? '#2A1416' : '#4A2426'} stroke="#160809" strokeWidth={1.2} />
      <circle cx={cx} cy={cy} r={r - 4} fill="#0D0D0E" />
      <path d={arcPath(cx, cy, r - 6, -150, -40)} fill="none" stroke="#FFFFFF" strokeOpacity={0.07} strokeWidth={5} strokeLinecap="round" />
      <rect x={cx - 17} y={cy - 4} width={34} height={9} rx={1} fill="#050505" stroke="#3A3A3A" strokeWidth={0.5} />
      {[0, 1, 2, 3, 4].map((i) => (
        <text key={i} x={cx - 13.6 + i * 6.8} y={cy + 3.2} textAnchor="middle" fontSize={6.4} fontFamily={MONO} fill={i === 4 ? '#C9493F' : '#D8D4CA'}>
          0
        </text>
      ))}
      <text x={cx} y={cy - 10} textAnchor="middle" fontSize={4.2} fontFamily={MONO} fill={p.sub}>
        HOURS
      </text>
      <rect x={cx - 3} y={cy + 13} width={6} height={4} rx={0.6} fill={p.sub} fillOpacity={0.6} />
    </g>
  )
}

export function PanelPlates({ night }: { night: boolean }) {
  const p = pal(night)
  const panelFill = night ? 'url(#ck-panel-night)' : 'url(#ck-panel-day)'
  const tanFill = night ? 'url(#ck-tan-night)' : 'url(#ck-tan-day)'
  const clipId = useId()
  // Acolchoado do glareshield: faixa alta (34) sobre o contorno, com cantos
  // descendo pelas laterais como na foto.
  const glare = GLARE_CONTOUR
  const padMid = offsetLine(glare, 14)
  return (
    <g aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <path d={poly(PLATES.painel)} />
        </clipPath>
      </defs>
      {/* Paredes laterais creme em perspectiva, atrás da chapa. */}
      <path data-panel-surface="side-wall-left" d={poly(PLATES.paredeEsq)} fill={night ? 'url(#ck-wall-night-l)' : 'url(#ck-wall-day-l)'} />
      <path d={poly(PLATES.paredeEsq)} fill="url(#ck-panel-grain)" opacity={0.25} />
      <path data-panel-surface="side-wall-right" d={poly(PLATES.paredeDir)} fill={night ? 'url(#ck-wall-night-r)' : 'url(#ck-wall-day-r)'} />
      <path d={poly(PLATES.paredeDir)} fill="url(#ck-panel-grain)" opacity={0.25} />

      {/* Chapa preta acetinada com o contorno do glareshield da foto. */}
      <path data-panel-shape="curved-shell" d={poly(PLATES.painel)} fill={panelFill} stroke={p.hair} strokeWidth={1.5} filter="url(#ck-panel-shadow)" />
      <path d={poly(PLATES.painel)} fill="url(#ck-panel-grain)" opacity={night ? 0.2 : 0.3} />
      <path d={poly(PLATES.painel)} fill="url(#ck-panel-sheen)" opacity={night ? 0.5 : 0.8} />

      {/* Subchapas rebaixadas: six-pack, copiloto, baia do stack (recortadas pela chapa). */}
      <g clipPath={`url(#${clipId})`}>
        <path d={poly(PLATES.sixpack)} fill="#000" fillOpacity={0.18} stroke={p.hair} strokeOpacity={0.5} strokeWidth={0.8} />
        <path d={poly(PLATES.copiloto)} fill="#000" fillOpacity={0.14} stroke={p.hair} strokeOpacity={0.5} strokeWidth={0.8} />
        <path d={poly(PLATES.stack)} fill={night ? '#0C0C0C' : '#262728'} stroke="#000" strokeWidth={1} />
      </g>

      {/* Acolchoado do glareshield: borda alta e arredondada (foto). */}
      <path d={open(padMid)} fill="none" stroke="#030303" strokeWidth={36} strokeLinecap="round" strokeLinejoin="round" />
      <path d={open(padMid)} fill="none" stroke="url(#ck-padding)" strokeWidth={30} strokeLinecap="round" strokeLinejoin="round" />
      <path d={open(offsetLine(glare, 4))} fill="none" stroke="#A4A6A8" strokeOpacity={night ? 0.1 : 0.3} strokeWidth={1.6} />
      <path d={open(offsetLine(glare, 27))} fill="none" stroke="#000" strokeOpacity={0.7} strokeWidth={2} />

      {/* Faixa escura de anunciadores entre frisos cromados. */}
      <path data-panel-surface="annunciator-strip" d={poly(PLATES.faixaEscura)} fill={night ? '#080809' : '#1C1D1F'} />
      {TRIMS.map(([x0, x1, y]) => (
        <rect key={y} x={x0} y={y - 2.5} width={x1 - x0} height={5} fill="url(#ck-chrome)" opacity={night ? 0.3 : 0.75} />
      ))}
      <Horimetro p={p} night={night} />

      {/* Faixa inferior creme em relevo e pedestal (foto). */}
      <path data-panel-surface="tan-strip" d={poly(PLATES.faixaCreme)} fill={tanFill} stroke={p.creamShade} strokeWidth={1.2} />
      <path d={poly(PLATES.faixaCreme)} fill="url(#ck-panel-grain)" opacity={0.22} />
      <line x1={102} y1={478} x2={1546} y2={478} stroke="#FFFFFF" strokeOpacity={night ? 0.05 : 0.16} strokeWidth={1.2} />
      <path data-panel-surface="pedestal" d={poly(PLATES.pedestal)} fill={tanFill} stroke={p.creamShade} strokeWidth={1.2} />
      <path d={poly(PLATES.pedestal)} fill="url(#ck-panel-grain)" opacity={0.2} />
      {/* faces laterais do pescoço do pedestal e degrau dos cowl flaps */}
      <path d={poly([[748, 600], [760, 606], [756, 700], [736, 692], [736, 640]])} fill="#000" fillOpacity={0.14} />
      <path d={poly([[944, 604], [944, 660], [920, 690], [918, 640]])} fill="#000" fillOpacity={0.1} />
      <path d={poly(PLATES.pedestalDegrau)} fill="#000" fillOpacity={night ? 0.25 : 0.16} />
      <line x1={742} y1={724} x2={904} y2={724} stroke="#FFFFFF" strokeOpacity={night ? 0.05 : 0.2} strokeWidth={1.2} />
      <line x1={746} y1={736} x2={746} y2={958} stroke="#000" strokeOpacity={0.18} strokeWidth={2} />
      <line x1={900} y1={736} x2={900} y2={958} stroke="#000" strokeOpacity={0.18} strokeWidth={2} />
      {/* placa preta pequena e alavanca na base do pedestal (foto, sem texto legível) */}
      <PedestalBasePrint />
      <rect x={PEDESTAL_BASE.alavanca.x} y={PEDESTAL_BASE.alavanca.y} width={PEDESTAL_BASE.alavanca.w} height={PEDESTAL_BASE.alavanca.h} rx={6} fill="#141414" stroke="#000" strokeWidth={0.8} />
      <rect x={PEDESTAL_BASE.punho.x} y={PEDESTAL_BASE.punho.y} width={PEDESTAL_BASE.punho.w} height={PEDESTAL_BASE.punho.h} rx={3} fill="#4A4A48" />

      {/* Console lateral esquerdo creme, inclinado (borda da porta mais alta). */}
      <path data-panel-surface="side-console" d={poly(PLATES.consoleLateral)} fill={night ? 'url(#ck-console-night)' : 'url(#ck-console-day)'} stroke={p.creamShade} strokeWidth={1} />
      <path d={poly([[100, 458], [112, 466], [118, 762], [106, 768]])} fill={night ? '#24221E' : '#7E776A'} />
      <path d={poly(PLATES.consoleLateral)} fill="url(#ck-panel-grain)" opacity={0.2} />
      <line x1={4} y1={448} x2={100} y2={462} stroke="#FFFFFF" strokeOpacity={night ? 0.05 : 0.3} strokeWidth={1.4} />

      {/* Placas impressas da foto. */}
      <Placards />

      {/* Fixadores e costuras, sempre atrás dos instrumentos/hotspots. */}
      {PLATE_SCREWS.map(([x, y], i) => (
        <Screw key={`${x}-${y}`} x={x} y={y} p={p} a={18 + i * 23} />
      ))}
    </g>
  )
}

// ---------------------------------------------------------------------------
// Manches em W com logo Piper (camada opcional "mostrar manches")
// Desenhados na posição da foto; nunca capturam clique (pointer-events none).
// ---------------------------------------------------------------------------

const segPath = (segs: Seg[]) =>
  segs.map(([k, ...pts]) => `${k} ${pts.map(([x, y]) => `${x} ${y}`).join(', ')}`).join(' ') + ' Z'


function Yoke(y: (typeof YOKES)[number]) {
  const g = yokeGeometry(y)
  const { hub } = g
  return (
    <g data-yoke={hub.x}>
      {/* coluna */}
      <rect x={g.column.x} y={g.column.y} width={g.column.w} height={g.column.h} fill="url(#ck-chrome)" opacity={0.85} />
      {/* braços em W */}
      {g.arms.map((a, i) => (
        <path key={i} d={segPath(a)} fill="url(#ck-yoke)" stroke="#000" strokeWidth={1} />
      ))}
      {/* punhos cromados */}
      {g.grips.map((pts, i) => (
        <path key={i} d={poly(pts)} fill="url(#ck-chrome)" opacity={0.9} />
      ))}
      {/* cubo com logo Piper */}
      <rect x={g.hubBox.x} y={g.hubBox.y} width={g.hubBox.w} height={g.hubBox.h} rx={g.hubBox.rx} fill="#0D1220" stroke="#000" strokeWidth={1.2} />
      {g.rings.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx={r.rx} fill="none" stroke="#C9CED8" strokeWidth={1.4} />
      ))}
      <rect x={g.logo.x} y={g.logo.y} width={g.logo.w} height={g.logo.h} rx={g.logo.rx} fill="#22336B" />
      <path d={poly(g.star)} fill="#E9E8E2" />
      <rect x={g.bar.x} y={g.bar.y} width={g.bar.w} height={g.bar.h} rx={g.bar.rx} fill="#C8202A" />
    </g>
  )
}

/** Camada dos manches (vetorial; mesmo desenho que o Blender extruda). */
export function YokesArt({ night }: { night: boolean }) {
  return (
    <g aria-hidden="true" data-yokes-art={night ? 'noite' : 'dia'} opacity={night ? 0.8 : 1}>
      {YOKES.map((y) => (
        <Yoke key={y.hub.x} {...y} />
      ))}
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
