// CockpitSections — blocos educativos abaixo do palco (cockpit.md §6):
// 6.1 Como ler o six-pack · 6.2 Arcos e marcações · 6.3 Observações.
// Todo valor vem de cockpit_instruments.json / especificacoes.json.

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import SectionHeader from '@/components/ui-custom/SectionHeader'
import CalloutBanner from '@/components/ui-custom/CalloutBanner'
import { OBSERVACOES, REFERENCIA, instrumentById } from './panel-data'
import { MiniArt } from './artwork'

// ---------------------------------------------------------------------------
// 6.1 — Como ler o six-pack
// ---------------------------------------------------------------------------

const SCAN: { id: string; frase: string }[] = [
  { id: 'velocimetro', frase: 'IAS em MPH — a energia do avião; 95 MPH na final.' },
  { id: 'horizonte_artificial', frase: 'Referência de atitude — o centro do scan (a vácuo).' },
  { id: 'altimetro', frase: 'Altitude via estática — ajuste o QNH na janela.' },
  { id: 'coordenador_curva', frase: 'Razão de curva + bolinha — elétrico, backup do vácuo.' },
  { id: 'giro_direcional', frase: 'Proa estável — alinhe com a bússola a cada ~15 min.' },
  { id: 'variometro', frase: 'Tendência vertical — subida/descida em ft/min.' },
]

function ScanCard({ id, frase, index }: { id: string; frase: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })
  const [go, setGo] = useState(false)
  useEffect(() => {
    if (!inView) return
    const t = window.setTimeout(() => setGo(true), index * 120)
    return () => window.clearTimeout(t)
  }, [inView, index])
  const inst = instrumentById[id]
  return (
    <div
      ref={ref}
      tabIndex={0}
      className="group relative border border-hairline bg-panel p-3 outline-none transition-colors duration-300 hover:border-cyan-dim focus-visible:border-cyan-dim"
      aria-label={`${inst.nome} — ${frase}`}
    >
      <MiniArt id={id} night={false} sweep={go} className="mx-auto block h-24 w-24 transition-transform duration-300 group-hover:scale-[1.04]" />
      <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-ink">
        {inst.nome.split('(')[0]}
      </p>
      <p className="mt-1.5 text-center text-[11px] leading-snug text-faint opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
        {frase}
      </p>
    </div>
  )
}

export function SixPackSection() {
  return (
    <section className="mx-auto max-w-[1100px] px-4 py-16 sm:px-6 md:py-24" aria-labelledby="ck-sixpack">
      <SectionHeader kicker="Fluxo de scan" title="Como ler o six-pack" measure="SCAN EM T · 6 INSTR." />
      <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-muted">
        O <em>T clássico</em> do Seneca I: velocidade, atitude e altitude na linha de cima;
        curva, proa e razão na linha de baixo. Passe o mouse (ou foque) para a frase de scan.
      </p>
      <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3">
        {SCAN.map((s, i) => (
          <ScanCard key={s.id} id={s.id} frase={s.frase} index={i} />
        ))}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// 6.2 — Arcos e marcações (valores de especificacoes.json + operacao)
// ---------------------------------------------------------------------------

interface ArcSeg {
  f: number
  t: number
  c: string
  label: string
}
interface ArcLine {
  v: number
  c: string
  label: string
}
interface ArcBar {
  nome: string
  unit: string
  min: number
  max: number
  segs: ArcSeg[]
  lines: ArcLine[]
}

const G = '#3DDC97'
const A = '#FFB020'
const R = '#FF4D4D'
const B = '#5B9DFF'
const W = '#E9E4D8'

const ARC_BARS: ArcBar[] = [
  {
    nome: 'Velocímetro (ASI)',
    unit: 'MPH',
    min: 40,
    max: 240,
    segs: [
      { f: 69, t: 125, c: W, label: 'Arco branco 69–125 (flaps)' },
      { f: 76, t: 190, c: G, label: 'Arco verde 76–190 (normal)' },
      { f: 190, t: 217, c: A, label: 'Arco amarelo 190–217 (cautela)' },
    ],
    lines: [
      { v: 80, c: R, label: 'VMC 80' },
      { v: 105, c: B, label: 'Vyse 105 (linha azul)' },
      { v: 217, c: R, label: 'VNE 217' },
    ],
  },
  {
    nome: 'Tacômetro',
    unit: 'RPM ×100',
    min: 0,
    max: 28,
    segs: [
      { f: 5, t: 22, c: G, label: 'Verde 500–2200' },
      { f: 22, t: 24, c: R, label: 'Vermelho 2200–2400' },
      { f: 24, t: 27, c: G, label: 'Verde 2400–2700' },
    ],
    lines: [{ v: 27, c: R, label: 'Máx 2700 RPM' }],
  },
  {
    nome: 'Pressão de óleo',
    unit: 'PSI',
    min: 0,
    max: 100,
    segs: [
      { f: 25, t: 60, c: A, label: 'Amarelo 25–60' },
      { f: 60, t: 90, c: G, label: 'Verde 60–90' },
    ],
    lines: [
      { v: 25, c: R, label: 'Mín 25 PSI' },
      { v: 90, c: R, label: 'Máx 90 PSI' },
    ],
  },
  {
    nome: 'Temperatura de óleo',
    unit: '°F',
    min: 50,
    max: 260,
    segs: [{ f: 75, t: 245, c: G, label: 'Verde 75–245 °F' }],
    lines: [{ v: 245, c: R, label: 'Máx 245 °F' }],
  },
  {
    nome: 'CHT',
    unit: '°F',
    min: 150,
    max: 500,
    segs: [{ f: 200, t: 475, c: G, label: 'Verde 200–475 °F' }],
    lines: [{ v: 475, c: R, label: 'Máx 475 °F' }],
  },
  {
    nome: 'Pressão de combustível',
    unit: 'PSI',
    min: 0,
    max: 40,
    segs: [{ f: 14, t: 35, c: G, label: 'Verde 14–35 PSI' }],
    lines: [
      { v: 14, c: R, label: 'Mín 14 PSI' },
      { v: 35, c: R, label: 'Máx 35 PSI' },
    ],
  },
  {
    nome: 'Sucção (vácuo)',
    unit: 'inHg',
    min: 3,
    max: 7,
    segs: [{ f: 4.5, t: 5.5, c: G, label: 'Verde 4,5–5,5 inHg' }],
    lines: [{ v: 4.5, c: R, label: 'Mín 4,5 inHg' }],
  },
]

function pct(v: number, bar: ArcBar) {
  return ((v - bar.min) / (bar.max - bar.min)) * 100
}

function ArcBarRow({ bar, index }: { bar: ArcBar; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  return (
    <div ref={ref} className="grid gap-2 md:grid-cols-[180px_1fr] md:items-center md:gap-4">
      <div>
        <p className="text-[13px] text-ink">{bar.nome}</p>
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
          {bar.min}–{bar.max} {bar.unit}
        </p>
      </div>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : undefined}
        transition={{ duration: 0.7, delay: (index % 4) * 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="relative h-4 origin-left border border-hairline bg-raised"
      >
        {bar.segs.map((s) => (
          <div
            key={s.label}
            className="group absolute inset-y-0"
            style={{ left: `${pct(s.f, bar)}%`, width: `${pct(s.t, bar) - pct(s.f, bar)}%`, background: s.c }}
            title={s.label}
          >
            <span className="pointer-events-none absolute -top-7 left-0 hidden whitespace-nowrap border border-hairline bg-panel px-1.5 py-0.5 font-mono text-[9px] text-ink group-hover:block">
              {s.label}
            </span>
          </div>
        ))}
        {bar.lines.map((l) => (
          <div key={l.label} className="group absolute -inset-y-1 w-[3px]" style={{ left: `calc(${pct(l.v, bar)}% - 1px)`, background: l.c }} title={l.label}>
            <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap border border-hairline bg-panel px-1.5 py-0.5 font-mono text-[9px] text-ink group-hover:block">
              {l.label}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

export function ArcsSection() {
  return (
    <section className="mx-auto max-w-[1100px] px-4 py-16 sm:px-6 md:py-24" aria-labelledby="ck-arcos">
      <SectionHeader kicker="Limites visuais" title="Arcos e marcações" measure="ARCO VERDE = NORMAL" />
      <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-muted">
        As faixas coloridas dos mostradores do PA34-200 — verde para operação normal, âmbar para
        cautela, vermelho para limite, azul para a melhor razão monomotor (Vyse 105 MPH).
      </p>
      <div className="mt-10 flex flex-col gap-7">
        {ARC_BARS.map((bar, i) => (
          <ArcBarRow key={bar.nome} bar={bar} index={i} />
        ))}
      </div>
      <p className="mt-8 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
        Fonte: especificações e faixas operacionais do manual interativo (P/N 761 506)
      </p>
    </section>
  )
}

// ---------------------------------------------------------------------------
// 6.3 — Observações (texto literal do JSON)
// ---------------------------------------------------------------------------

export function ObservationsSection() {
  return (
    <section className="mx-auto max-w-[1100px] px-4 py-16 sm:px-6 md:py-24" aria-labelledby="ck-obs">
      <SectionHeader kicker="Notas do painel" title="Observações" measure="P/N 761 506 · 1972" />
      <div className="mt-8 flex flex-col gap-4">
        {OBSERVACOES.map((obs, i) => (
          <CalloutBanner key={i} variant="nota" title={`Nota ${i + 1}`}>
            {obs}
          </CalloutBanner>
        ))}
      </div>
      <p className="mt-8 border-t border-hairline pt-5 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-faint">
        Referência — {REFERENCIA}
      </p>
    </section>
  )
}
