// ResumoProgresso — Seção 6 de /procedimentos: donut SVG com o progresso total
// de todos os checklists + contador + ZERAR TUDO (confirmação inline).
// Estado local: "Progresso salvo neste navegador."

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Eraser } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/lib/utils'
import { clearAllChecklists, useChecklistStats } from './checklistStore'

const R = 56
const CIRC = 2 * Math.PI * R

export default function ResumoProgresso() {
  const stats = useChecklistStats()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20% 0px' })
  const counted = useCountUp(stats.totalDone, { start: inView, duration: 900 })
  const [confirming, setConfirming] = useState(false)

  const pct = stats.totalItens > 0 ? stats.totalDone / stats.totalItens : 0
  const allDone = stats.totalItens > 0 && stats.totalDone === stats.totalItens

  return (
    <section className="bg-abyss py-[72px] md:py-[120px]">
      <div className="mx-auto max-w-content px-6 md:px-12">
        <div
          ref={ref}
          className="flex flex-col items-center gap-10 border border-hairline bg-raised px-6 py-12 md:flex-row md:justify-center md:gap-16 md:px-12"
        >
          {/* donut */}
          <div className="relative">
            <svg viewBox="0 0 140 140" className="h-44 w-44 -rotate-90" role="img" aria-label={`Progresso total: ${stats.totalDone} de ${stats.totalItens} itens`}>
              <circle cx="70" cy="70" r={R} fill="none" stroke="#1E2C3D" strokeWidth="8" />
              <motion.circle
                cx="70" cy="70" r={R} fill="none"
                stroke={allDone ? '#3DDC97' : '#3FE0FF'}
                strokeWidth="8"
                strokeDasharray={CIRC}
                initial={{ strokeDashoffset: CIRC }}
                animate={inView ? { strokeDashoffset: CIRC * (1 - pct) } : {}}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('font-display text-3xl font-bold', allDone ? 'text-green' : 'text-ink')}>
                {Math.round(pct * 100)}%
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">concluído</span>
            </div>
          </div>
          {/* contador + ações */}
          <div className="text-center md:text-left">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan">// Resumo de progresso</p>
            <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              <span className={allDone ? 'text-green' : undefined}>{counted}</span>
              <span className="text-faint">/{stats.totalItens}</span>{' '}
              <span className="text-xl text-muted md:text-2xl">ITENS MARCADOS</span>
            </p>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
              Progresso salvo neste navegador.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              {confirming ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      clearAllChecklists()
                      setConfirming(false)
                    }}
                    className="border border-red/60 bg-red/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-red transition-colors hover:bg-red/20"
                  >
                    Confirmar zeragem
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="border border-hairline px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  disabled={stats.totalDone === 0}
                  className="flex items-center gap-2 border border-hairline px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-muted transition-colors hover:border-red/50 hover:text-red disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Eraser className="h-3.5 w-3.5" aria-hidden="true" />
                  Zerar tudo
                </button>
              )}
            </div>
          </div>
        </div>
        <p className="mt-10 text-center font-mono text-sm uppercase tracking-[0.3em] text-faint">
          Disciplina de cabine começa em terra.
        </p>
      </div>
    </section>
  )
}
