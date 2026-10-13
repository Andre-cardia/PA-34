// Faixa de arco horizontal (design/especificacoes.md §4) — barra com segmentos
// verde/âmbar/vermelho + linhas de limite. Entra com scaleX 0→1; hover numa
// faixa mostra tooltip com o nome do limite.

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { cn } from '@/lib/utils'

type SegColor = 'green' | 'amber' | 'red'

const SEG_BG: Record<SegColor, string> = {
  green: 'bg-green/80',
  amber: 'bg-amber/80',
  red: 'bg-red/80',
}

export interface FaixaSegment {
  from: number
  to: number
  color: SegColor
  label: string
}

export interface FaixaLine {
  at: number
  label: string
  color?: 'red' | 'amber'
}

interface Props {
  label: string
  unit: string
  scale: [number, number]
  segments: FaixaSegment[]
  lines?: FaixaLine[]
  delay?: number
}

export default function ArcoFaixa({ label, unit, scale, segments, lines = [], delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const [min, max] = scale
  const pct = (v: number) => ((v - min) / (max - min)) * 100

  return (
    <div ref={ref} className="py-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">{label}</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{unit}</p>
      </div>
      {/* barra */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : undefined}
        transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: 'left' }}
        className="relative mt-2.5 h-3 border border-hairline bg-panel"
      >
        {segments.map((s) => (
          <div
            key={`${s.from}-${s.to}`}
            className={cn('group/seg absolute inset-y-0', SEG_BG[s.color])}
            style={{ left: `${pct(s.from)}%`, width: `${pct(s.to) - pct(s.from)}%` }}
            tabIndex={0}
            aria-label={`${label}: ${s.label}`}
          >
            <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-[220px] -translate-x-1/2 border border-hairline bg-raised px-2.5 py-1.5 font-mono text-[11px] leading-snug text-muted opacity-0 shadow-xl shadow-black/50 transition-opacity duration-200 group-hover/seg:opacity-100 group-focus-visible/seg:opacity-100" role="tooltip">
              {s.label}
            </span>
          </div>
        ))}
        {/* linhas de limite */}
        {lines.map((l) => (
          <span
            key={l.at}
            className={cn('absolute -inset-y-1 w-[3px]', l.color === 'amber' ? 'bg-amber' : 'bg-red')}
            style={{ left: `calc(${pct(l.at)}% - 1px)` }}
            aria-hidden="true"
          />
        ))}
      </motion.div>
      {/* escala */}
      <div className="relative mt-1.5 h-4 font-mono text-[10px] text-faint">
        <span className="absolute left-0">{min}</span>
        {lines.map((l) => (
          <span
            key={l.at}
            className={cn('absolute -translate-x-1/2', l.color === 'amber' ? 'text-amber' : 'text-red')}
            style={{ left: `${pct(l.at)}%` }}
          >
            {l.at}
          </span>
        ))}
        <span className="absolute right-0">{max}</span>
      </div>
    </div>
  )
}
