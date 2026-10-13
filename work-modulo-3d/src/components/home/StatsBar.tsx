// Seção 2 — Faixa de especificações relâmpago (home.md §2).
// 6 células com count-up, dot de limite e tooltip com definição. Dados: especificacoes.json.

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { especificacoes } from '@/data'
import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/lib/utils'

interface Cell {
  value: number
  prefix?: string
  suffix?: string
  format?: (v: number) => string
  label: string
  dot?: 'green' | 'red'
  tooltip: string
}

const DOT: Record<string, string> = { green: 'bg-green', red: 'bg-red' }

const CELLS: Cell[] = [
  {
    value: 200,
    prefix: '2 × ',
    suffix: ' HP',
    label: 'MOTORES LYCOMING IO/LIO-360',
    tooltip: 'Dois Lycoming de 200 HP a 2700 RPM; o direito (LIO-360) é contra-rotativo.',
  },
  {
    value: 190,
    suffix: ' MPH',
    label: 'VNO — ARCO VERDE MÁX.',
    dot: 'green',
    tooltip: 'Velocidade máxima de cruzeiro estrutural (topo do arco verde: 76–190 MPH).',
  },
  {
    value: especificacoes.marcas_do_velocimetro.linha_radial_vermelha_VNE_mph,
    suffix: ' MPH',
    label: 'VNE — NUNCA EXCEDER',
    dot: 'red',
    tooltip: 'Velocidade que nunca deve ser excedida (linha radial vermelha).',
  },
  {
    value: especificacoes.marcas_do_velocimetro.linha_radial_vermelha_VMC_mph,
    suffix: ' MPH',
    label: 'VMC — CONTROLE MONOMOTOR',
    dot: 'red',
    tooltip: 'Velocidade mínima de controle com um motor inoperante (linha vermelha).',
  },
  {
    value: 93,
    suffix: ' GAL',
    label: 'COMBUSTÍVEL UTILIZÁVEL',
    tooltip: '351,5 litros (93 US gal) utilizáveis de AVGAS 100/130 LL Azul — 2 tanques por asa.',
  },
  {
    value: 4200,
    suffix: ' LB',
    label: 'PESO MÁX. DECOLAGEM',
    format: (v) => v.toLocaleString('pt-BR'),
    tooltip: '1905 kgf (4200 libras) — peso máximo de decolagem do Seneca I.',
  },
]

function StatCell({ cell, index }: { cell: Cell; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20% 0px' })
  const display = useCountUp(cell.value, { duration: 1000, start: inView })
  const text = cell.format ? cell.format(display) : `${cell.prefix ?? ''}${display}${cell.suffix ?? ''}`

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group relative border-hairline px-5 py-6 transition-colors duration-300 hover:bg-overlay max-md:[&:nth-child(odd)]:border-r md:border-r md:[&:nth-child(3n)]:border-r-0 md:[&:nth-child(-n+3)]:border-b lg:border-b-0 lg:[&:nth-child(3n)]:border-r lg:[&:last-child]:border-r-0"
      tabIndex={0}
    >
      <p className="flex items-baseline font-mono text-[28px] font-medium leading-none text-ink">
        {cell.dot && (
          <motion.span
            initial={{ opacity: 0.2 }}
            animate={inView ? { opacity: [0.2, 1, 0.2, 1] } : {}}
            transition={{ duration: 0.6, delay: 1 + index * 0.08 }}
            className={cn('mr-2 inline-block h-2 w-2 translate-y-[-3px] rounded-full', DOT[cell.dot])}
            aria-hidden="true"
          />
        )}
        {text}
      </p>
      <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">{cell.label}</p>
      {/* tooltip */}
      <span
        role="tooltip"
        className="pointer-events-none absolute -top-2 left-1/2 z-30 w-56 -translate-x-1/2 -translate-y-full border border-hairline bg-raised px-3 py-2 font-mono text-[11px] leading-relaxed text-muted opacity-0 shadow-xl shadow-black/50 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {cell.tooltip}
      </span>
    </motion.div>
  )
}

export default function StatsBar() {
  return (
    <section aria-label="Especificações rápidas" className="border-y border-hairline bg-panel">
      <div className="mx-auto grid max-w-[1600px] grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {CELLS.map((c, i) => (
          <StatCell key={c.label} cell={c} index={i} />
        ))}
      </div>
    </section>
  )
}
