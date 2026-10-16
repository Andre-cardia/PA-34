// PhaseChecklist — checklist interativo da fase (procedimentos.md §4).
// Adaptação do ChecklistCard global: grupos amber, MARCAR TODOS, modo DESAFIO
// (respostas sob blur até clicar), carimbo FASE COMPLETA ✓ e micro-shake 0.15s
// a cada check. Persistência via checklistStore (localStorage por fase).

import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { CheckCheck, Eye, EyeOff, RotateCcw } from 'lucide-react'
import type { ProcedimentoNormal } from '@/data'
import { cn } from '@/lib/utils'
import { CornerScrews } from '@/components/assets/PanelScrews'
import { usePhaseChecklist } from './checklistStore'

interface Props {
  fase: ProcedimentoNormal
}

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

export default function PhaseChecklist({ fase }: Props) {
  const flat = useMemo(
    () => fase.checklist.flatMap((g, gi) => g.itens.map((it, ii) => ({ key: `${gi}:${ii}`, ...it }))),
    [fase],
  )
  // stagger 0.03s limitado aos primeiros 12 itens (procedimentos.md §4)
  const delayByKey = useMemo(() => {
    const map: Record<string, number> = {}
    flat.forEach((f, i) => {
      map[f.key] = Math.min(i, 12) * 0.03
    })
    return map
  }, [flat])
  const { checked, toggle, markAll, reset } = usePhaseChecklist(fase.id)
  const [desafio, setDesafio] = useState(false)
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const controls = useAnimationControls()

  const done = flat.filter((f) => checked[f.key]).length
  const complete = done === flat.length && flat.length > 0

  const handleToggle = (key: string) => {
    toggle(key)
    // micro-shake do "papel" — feedback instantâneo (0.15s), nunca atrasar
    controls.start({ x: [0, -2, 2, -1, 0], transition: { duration: 0.15 } })
  }

  const reveal = (key: string) => setRevealed((prev) => ({ ...prev, [key]: true }))

  return (
    <motion.div animate={controls} className="relative border border-hairline bg-raised">
      <CornerScrews />
      {/* barra de controle */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-panel px-5 py-3.5">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-faint">
          Checklist <span className="text-cyan">SOP {fase.secao_sop}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn('font-mono text-xs tracking-[0.14em]', complete ? 'text-green' : 'text-faint')}
            aria-live="polite"
          >
            {done}/{flat.length}
          </span>
          <button
            type="button"
            onClick={() => markAll(flat.map((f) => f.key))}
            className="flex items-center gap-1.5 border border-hairline px-2 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-faint transition-colors hover:border-cyan-dim hover:text-cyan"
          >
            <CheckCheck className="h-3 w-3" /> Marcar todos
          </button>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 border border-hairline px-2 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-faint transition-colors hover:border-cyan-dim hover:text-cyan"
            aria-label="Resetar checklist"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          <button
            type="button"
            onClick={() => setDesafio((v) => !v)}
            aria-pressed={desafio}
            title="Modo desafio: esconde as respostas para responder de memória"
            className={cn(
              'flex items-center gap-1.5 border px-2 py-1 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors',
              desafio
                ? 'border-amber/60 bg-amber/10 text-amber'
                : 'border-hairline text-faint hover:border-cyan-dim hover:text-cyan',
            )}
          >
            {desafio ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            Desafio
          </button>
        </div>
      </div>
      {/* barra de progresso da fase */}
      <div className="h-0.5 w-full bg-hairline/60">
        <div
          className={cn('h-full transition-[width] duration-500 ease-out-expo', complete ? 'bg-green' : 'bg-cyan')}
          style={{ width: `${flat.length ? (done / flat.length) * 100 : 0}%` }}
        />
      </div>
      {/* grupos e itens */}
      <div className="relative px-2 py-2">
        {fase.checklist.map((g, gi) => (
          <div key={`${g.grupo}-${gi}`} className="mb-1">
            <p className="px-3 pb-1 pt-3 font-mono text-xs font-medium uppercase tracking-[0.22em] text-amber">
              {g.grupo}
            </p>
            {g.itens.map((it, ii) => {
              const key = `${gi}:${ii}`
              const isOn = !!checked[key]
              const staggerDelay = delayByKey[key] ?? 0
              const hidden = desafio && !revealed[key]
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-5% 0px' }}
                  transition={{ duration: 0.35, delay: staggerDelay, ease: EASE }}
                  className="flex min-w-0 items-baseline gap-3 rounded-sm px-3 py-2 transition-colors hover:bg-overlay"
                >
                  <button
                    type="button"
                    onClick={() => handleToggle(key)}
                    aria-pressed={isOn}
                    aria-label={`${it.item} — ${it.acao}`}
                    className="group flex min-w-0 flex-1 items-baseline gap-3 text-left"
                  >
                    <motion.span
                      key={`${key}-${isOn}`}
                      initial={isOn ? { scale: 0.4 } : false}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      className={cn(
                        'mt-0.5 inline-flex h-4 w-4 shrink-0 translate-y-[2px] items-center justify-center border font-mono text-[10px] transition-colors duration-150',
                        isOn
                          ? 'border-green bg-green/15 text-green [box-shadow:0_0_10px_rgb(var(--c-green) / 0.35)]'
                          : 'border-hairline text-transparent group-hover:border-cyan-dim',
                      )}
                      aria-hidden="true"
                    >
                      ✓
                    </motion.span>
                    <span className="relative min-w-0">
                      <span
                        className={cn(
                          'font-mono text-[13px] tracking-wide transition-colors duration-200',
                          isOn ? 'text-faint' : 'text-ink',
                        )}
                        style={isOn ? { opacity: 0.55 } : undefined}
                      >
                        {it.item}
                      </span>
                      {/* line-through animado */}
                      <span
                        className="absolute left-0 top-1/2 h-px w-full origin-left bg-green/60 transition-transform duration-200"
                        style={{ transform: `scaleX(${isOn ? 1 : 0})` }}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="dot-leader hidden sm:block" aria-hidden="true" />
                  </button>
                  {hidden ? (
                    <button
                      type="button"
                      onClick={() => reveal(key)}
                      aria-label={`Revelar resposta de ${it.item}`}
                      className="group/ans flex min-w-0 max-w-[48%] shrink items-center gap-2 text-right font-mono text-[13px] leading-snug text-faint sm:max-w-none sm:shrink-0"
                    >
                      <span
                        className="select-none text-cyan/60 blur-[5px] transition-[filter] duration-200 group-hover/ans:blur-[3px]"
                        aria-hidden="true"
                      >
                        {it.acao}
                      </span>
                      <EyeOff className="h-3.5 w-3.5 shrink-0 text-faint" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggle(key)}
                      className={cn(
                        'min-w-0 max-w-[48%] shrink text-right font-mono text-[13px] leading-snug transition-colors duration-200 sm:max-w-none sm:shrink-0',
                        isOn ? 'text-faint' : 'text-cyan',
                      )}
                      style={isOn ? { opacity: 0.55 } : undefined}
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      {it.acao}
                    </button>
                  )}
                </motion.div>
              )
            })}
          </div>
        ))}
        {/* carimbo FASE COMPLETA */}
        <AnimatePresence>
          {complete && (
            <motion.div
              initial={{ opacity: 0, scale: 1.6, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: -8 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 16 }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              aria-hidden="true"
            >
              <span className="border-2 border-green px-6 py-2 font-mono text-lg font-semibold uppercase tracking-[0.3em] text-green [text-shadow:0_0_18px_rgb(var(--c-green) / 0.4)]">
                Fase completa ✓
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
