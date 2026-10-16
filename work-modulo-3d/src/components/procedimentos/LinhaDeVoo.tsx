// LinhaDeVoo — navegador de fases sticky (procedimentos.md §3).
// 16 nós em sequência estilo plano de voo, ligados por linha tracejada cyan;
// scroll-spy marca o nó ativo, clique rola até a fase, nó de fase 100%
// completa (localStorage) acende verde. Progresso global à direita.

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { procedimentosNormais } from '@/data'
import { cn } from '@/lib/utils'
import { faseAnchor, useChecklistStats } from './checklistStore'

const SHORT: Record<string, string> = {
  '10.1': 'PRE-FLT',
  '10.2': 'PARTIDA',
  '10.3': 'ACIONAM.',
  '10.4': 'TAXI',
  '10.5': 'ANTES DEC.',
  '10.6': 'DECOLAGEM',
  '10.6b': 'PÓS-DEC.',
  '10.7': 'SUBIDA',
  '10.8': 'CRUZEIRO',
  '10.9': 'DESCIDA',
  '10.10': 'APROX.',
  '10.11': 'POUSO',
  '10.12': 'ARREMET.',
  '10.13': 'PATTERNS',
  '10.14': 'PÓS-POUSO',
  '10.15': 'CORTE',
}

export default function LinhaDeVoo() {
  const stats = useChecklistStats()
  const [active, setActive] = useState<string>(procedimentosNormais[0]?.id ?? '')

  // scroll-spy: marca o nó da fase visível
  useEffect(() => {
    const sections = procedimentosNormais
      .map((f) => document.getElementById(faseAnchor(f.id)))
      .filter((el): el is HTMLElement => !!el)
    const obs = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            const id = (en.target as HTMLElement).dataset.fase
            if (id) setActive(id)
          }
        }
      },
      { rootMargin: '-25% 0px -65% 0px' },
    )
    sections.forEach((s) => obs.observe(s))
    return () => obs.disconnect()
  }, [])

  const scrollTo = (e: React.MouseEvent, anchor: string) => {
    e.preventDefault()
    document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // tooltip em position:fixed (escapa do overflow-x-auto da barra)
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null)
  const showTip = (e: React.SyntheticEvent<HTMLElement>, text: string) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTip({ x: rect.left + rect.width / 2, y: rect.bottom + 6, text })
  }

  const pct = stats.totalItens > 0 ? stats.totalDone / stats.totalItens : 0

  return (
    <div className="sticky top-14 z-40 border-y border-hairline bg-panel/95 backdrop-blur-[8px]">
      <div className="mx-auto flex max-w-content items-center gap-6 px-4 py-3 md:px-12">
        {/* rota com 16 nós */}
        <nav aria-label="Linha de voo — fases do SOP 10" className="min-w-0 flex-1 overflow-x-auto">
          <ol className="relative flex min-w-max items-start px-1 pt-1">
            {/* rota tracejada (draw-on na primeira passagem) */}
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-2 top-[9px] origin-left border-t border-dashed border-cyan-dim"
              aria-hidden="true"
            />
            {procedimentosNormais.map((f) => {
              const anchor = faseAnchor(f.id)
              const stat = stats.fases.find((s) => s.id === f.id)
              const isActive = active === f.id
              const isComplete = !!stat?.complete
              return (
                <li key={f.id} className="relative">
                  <a
                    href={`#${anchor}`}
                    onClick={(e) => scrollTo(e, anchor)}
                    onMouseEnter={(e) => showTip(e, `${stat?.total ?? 0} ITENS · SOP ${f.secao_sop}`)}
                    onMouseLeave={() => setTip(null)}
                    onFocus={(e) => showTip(e, `${stat?.total ?? 0} ITENS · SOP ${f.secao_sop}`)}
                    onBlur={() => setTip(null)}
                    aria-current={isActive ? 'true' : undefined}
                    className="group relative flex w-[76px] flex-col items-center gap-1.5 pb-1"
                  >
                    <span
                      className={cn(
                        'relative z-10 h-2.5 w-2.5 rounded-full border transition-all duration-300',
                        isComplete
                          ? 'animate-annunciator-blink border-green bg-green [box-shadow:0_0_10px_rgb(var(--c-green) / 0.6)]'
                          : isActive
                            ? 'border-cyan bg-cyan [box-shadow:0_0_12px_rgb(var(--c-cyan) / 0.7)]'
                            : 'border-faint/60 bg-panel group-hover:border-cyan-dim group-hover:bg-cyan-dim',
                      )}
                      aria-hidden="true"
                    />
                    <span
                      className={cn(
                        'font-mono text-[9px] uppercase tracking-[0.08em] transition-colors duration-300',
                        isComplete ? 'text-green' : isActive ? 'text-cyan' : 'text-faint group-hover:text-muted',
                      )}
                    >
                      {SHORT[f.id] ?? f.nome}
                    </span>
                  </a>
                </li>
              )
            })}
          </ol>
        </nav>
        {/* tooltip flutuante (fixed — fora do overflow da barra) */}
        {tip && (
          <span
            className="pointer-events-none fixed z-[60] -translate-x-1/2 whitespace-nowrap border border-hairline bg-raised px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-muted"
            style={{ left: tip.x, top: tip.y }}
            aria-hidden="true"
          >
            {tip.text}
          </span>
        )}
        {/* progresso global */}
        <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
          <span className="font-mono text-[11px] tracking-[0.16em] text-muted">
            <span className={stats.totalDone === stats.totalItens && stats.totalItens > 0 ? 'text-green' : 'text-cyan'}>
              {stats.totalDone}
            </span>
            /{stats.totalItens} ITENS
          </span>
          <span className="h-0.5 w-24 bg-hairline/60" aria-hidden="true">
            <span
              className={cn('block h-full transition-[width] duration-500', pct === 1 ? 'bg-green' : 'bg-cyan')}
              style={{ width: `${pct * 100}%` }}
            />
          </span>
        </div>
      </div>
    </div>
  )
}
