// Seção 4 — Distâncias & Tetos (design/performance.md §4).
// 4 big-number cards: decolagem, pouso, tetos, alcance. Count-up ao entrar,
// sparkline SVG draw-on de fundo, hover tilt 3D sutil + borda cyan.

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Gauge, Mountain, PlaneLanding, PlaneTakeoff, Route } from 'lucide-react'
import SectionHeader from '@/components/ui-custom/SectionHeader'
import { CornerScrews } from '@/components/assets/PanelScrews'
import { useCountUp } from '@/hooks/useCountUp'
import { especificacoes } from '@/data'
import { ANCHORS, SEC, numOf } from './performance-data'
import { cn } from '@/lib/utils'

const fmt = (n: number) => n.toLocaleString('pt-BR')

// Valores parseados das tabelas do SOP 06 (performance.md)
const DEC_SOLO = numOf(SEC.decolagem.tables[0]?.rows[0]?.value ?? '0')
const DEC_50 = numOf(SEC.decolagem.tables[0]?.rows[1]?.value ?? '0')
const POUSO_SOLO = numOf(SEC.pouso.tables[0]?.rows[0]?.value ?? '0')
const POUSO_50 = numOf(SEC.pouso.tables[0]?.rows[1]?.value ?? '0')
const TETO_BI = numOf(SEC.tetos.tables[0]?.rows[0]?.value ?? '0')
const TETO_MONO_ABS = numOf(SEC.tetos.tables[0]?.rows[1]?.value ?? '0')
const TETO_MONO_SERV = numOf(SEC.tetos.tables[0]?.rows[2]?.value ?? '0')
const ALC_65 = numOf(SEC.alcance.tables[0]?.rows[0]?.value ?? '0')
const ALC_75 = numOf(SEC.alcance.tables[0]?.rows[1]?.value ?? '0')

function Sparkline({ d, delay = 0.3 }: { d: string; delay?: number }) {
  return (
    <svg viewBox="0 0 200 72" className="absolute bottom-3 right-3 h-16 w-44 opacity-40" aria-hidden="true">
      <motion.path
        d={d}
        fill="none"
        stroke="rgb(var(--c-cyan))"
        strokeWidth="1.5"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: '-20% 0px' }}
        transition={{ duration: 1.2, delay, ease: [0.7, 0, 0.2, 1] }}
      />
    </svg>
  )
}

interface CardProps {
  icon: React.ReactNode
  title: string
  value: number
  unit: string
  context: string
  sub: { label: string; val: string; dot?: 'red' | 'amber' | 'green' }[]
  spark: string
  delay: number
  tip?: string
}

function BigCard({ icon, title, value, unit, context, sub, spark, delay, tip }: CardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-30% 0px' })
  const n = useCountUp(value, { duration: 1200, start: inView })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-15% 0px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ rotateX: 1.6, rotateY: -1.6 }}
      style={{ transformPerspective: 900 }}
      className="group relative overflow-hidden border border-hairline bg-raised p-6 transition-colors duration-300 hover:border-cyan-dim md:p-8"
    >
      <CornerScrews />
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
          <span className="text-cyan" aria-hidden="true">{icon}</span>
          {title}
        </span>
        {tip && (
          <span className="group/tip relative flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-red" tabIndex={0} aria-label={tip}>
            <span className="h-1.5 w-1.5 rounded-full bg-red" aria-hidden="true" />
            nota
            <span className="pointer-events-none absolute right-0 top-full z-30 mt-2 w-60 border border-hairline bg-panel px-3 py-2 font-mono text-[11px] normal-case leading-relaxed tracking-normal text-muted opacity-0 shadow-xl shadow-black/50 transition-opacity duration-200 group-hover/tip:opacity-100 group-focus-visible/tip:opacity-100" role="tooltip">
              {tip}
            </span>
          </span>
        )}
      </div>
      <p className="mt-5 font-mono text-[52px] font-semibold leading-none text-ink md:text-[56px]">
        {fmt(n)}
        <span className="ml-2 text-lg font-normal text-faint">{unit}</span>
      </p>
      <p className="mt-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">{context}</p>
      <div className="mt-5 space-y-1.5 border-t border-hairline pt-4">
        {sub.map((s) => (
          <div key={s.label} className="flex items-baseline justify-between gap-3 font-mono text-[12px]">
            <span className="flex items-center gap-2 uppercase tracking-[0.12em] text-faint">
              {s.dot && <span className={cn('h-1.5 w-1.5 rounded-full', s.dot === 'red' ? 'bg-red' : s.dot === 'amber' ? 'bg-amber' : 'bg-green')} aria-hidden="true" />}
              {s.label}
            </span>
            <span className="text-muted">{s.val}</span>
          </div>
        ))}
      </div>
      <Sparkline d={spark} delay={delay + 0.2} />
    </motion.div>
  )
}

export default function DistanciasTetos() {
  return (
    <section id={ANCHORS.distancias} className="scroll-mt-[180px] border-t border-hairline bg-panel py-[72px] md:py-[100px]">
      <div className="mx-auto max-w-content px-6 md:px-12">
        <SectionHeader
          kicker="// SEÇÃO 06 — DISTÂNCIAS & TETOS"
          title="Números de missão"
          measure="ISA · NÍVEL DO MAR · PESO MÁX."
        />

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          <BigCard
            icon={<PlaneTakeoff className="h-4 w-4" strokeWidth={1.75} />}
            title="Decolagem"
            value={DEC_SOLO}
            unit="m"
            context={SEC.decolagem.tables[0]?.rows[0]?.label ?? ''}
            sub={[{ label: 'Com obstáculo de 50 ft', val: `${fmt(DEC_50)} m`, dot: 'amber' }]}
            spark="M 4 64 L 90 64 L 120 64 L 196 12"
            delay={0}
          />
          <BigCard
            icon={<PlaneLanding className="h-4 w-4" strokeWidth={1.75} />}
            title="Pouso"
            value={POUSO_SOLO}
            unit="m"
            context={SEC.pouso.tables[0]?.rows[0]?.label ?? ''}
            sub={[{ label: 'Com obstáculo de 50 ft', val: `${fmt(POUSO_50)} m`, dot: 'amber' }]}
            spark="M 4 12 L 120 52 L 150 60 L 196 64"
            delay={0.08}
          />
          <BigCard
            icon={<Mountain className="h-4 w-4" strokeWidth={1.75} />}
            title="Teto de serviço"
            value={TETO_BI}
            unit="ft"
            context={SEC.tetos.tables[0]?.rows[0]?.label ?? ''}
            sub={[
              { label: 'Monomotor — absoluto', val: `${fmt(TETO_MONO_ABS)} ft`, dot: 'red' },
              { label: 'Monomotor — serviço (50 ft/min)', val: `${fmt(TETO_MONO_SERV)} ft`, dot: 'amber' },
            ]}
            tip="Absoluto: razão de subida tende a zero. Serviço: ainda sobra 50 ft/min de razão — o valor operacional."
            spark="M 4 64 L 60 64 L 80 28 L 120 28 L 140 12 L 196 12"
            delay={0.16}
          />
          <BigCard
            icon={<Route className="h-4 w-4" strokeWidth={1.75} />}
            title="Alcance"
            value={ALC_65}
            unit="NM"
            context={SEC.alcance.tables[0]?.rows[0]?.label ?? ''}
            sub={[
              { label: SEC.alcance.tables[0]?.rows[1]?.label ?? '', val: `${fmt(ALC_75)} NM`, dot: 'green' },
              { label: 'Consumo a 65%', val: especificacoes.combustivel.consumo_65_pct_potencia },
            ]}
            spark="M 4 40 C 60 30 120 44 196 34"
            delay={0.24}
          />
        </div>

        <p className="mt-8 flex items-start gap-2 font-mono text-[11px] leading-relaxed tracking-[0.06em] text-faint">
          <Gauge className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{SEC.graficos.paragraphs[0] ?? ''}</span>
        </p>
      </div>
    </section>
  )
}
