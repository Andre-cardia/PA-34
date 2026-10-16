// ChecklistCard — checklist interativo por fase de voo (design.md §7.8).
// Checkbox por item com "carimbo" verde, progresso, RESET, persiste em localStorage.

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import type { ChecklistGrupo } from '@/data'
import { cn } from '@/lib/utils'
import { CornerScrews } from '@/components/assets/PanelScrews'

interface Props {
  faseId: string // ex.: "10.6"
  titulo: string // ex.: "ANTES DA DECOLAGEM"
  grupos: ChecklistGrupo[]
  className?: string
}

const storageKey = (faseId: string) => `pa34-checklist-${faseId}`

export default function ChecklistCard({ faseId, titulo, grupos, className }: Props) {
  const flat = useMemo(
    () => grupos.flatMap((g, gi) => g.itens.map((it, ii) => ({ key: `${gi}:${ii}`, grupo: g.grupo, ...it }))),
    [grupos],
  )
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(faseId))
      if (raw) setChecked(JSON.parse(raw) as Record<string, boolean>)
    } catch {
      /* storage indisponível */
    }
  }, [faseId])

  const done = flat.filter((f) => checked[f.key]).length
  const complete = done === flat.length && flat.length > 0

  const toggle = (key: string) => {
    setChecked((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      try {
        localStorage.setItem(storageKey(faseId), JSON.stringify(next))
      } catch {
        /* noop */
      }
      return next
    })
  }

  const reset = () => {
    setChecked({})
    try {
      localStorage.removeItem(storageKey(faseId))
    } catch {
      /* noop */
    }
  }

  return (
    <div className={cn('relative border border-hairline bg-raised', className)}>
      <CornerScrews />
      {/* cabeçalho */}
      <div className="flex items-center justify-between gap-4 border-b border-hairline bg-panel px-5 py-4">
        <div>
          <p className="font-mono text-sm font-semibold uppercase tracking-[0.14em] text-ink">
            <span className="text-cyan">{faseId}</span>
            <span className="mx-2 text-faint">—</span>
            {titulo}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('font-mono text-xs tracking-[0.14em]', complete ? 'text-green' : 'text-faint')}>
            {done}/{flat.length}
          </span>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 border border-hairline px-2 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-faint transition-colors hover:border-cyan-dim hover:text-cyan"
            aria-label="Resetar checklist"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        </div>
      </div>
      {/* barra de progresso */}
      <div className="h-0.5 w-full bg-hairline/60">
        <div
          className={cn('h-full transition-[width] duration-500 ease-out-expo', complete ? 'bg-green' : 'bg-cyan')}
          style={{ width: `${flat.length ? (done / flat.length) * 100 : 0}%` }}
        />
      </div>
      {/* itens */}
      <div className="relative px-2 py-2">
        {grupos.map((g, gi) => (
          <div key={g.grupo} className="mb-1">
            <p className="px-3 pb-1 pt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-faint">{g.grupo}</p>
            {g.itens.map((it, ii) => {
              const key = `${gi}:${ii}`
              const isOn = !!checked[key]
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggle(key)}
                  aria-pressed={isOn}
                  className="group flex w-full items-baseline gap-3 rounded-sm px-3 py-2 text-left transition-colors hover:bg-overlay"
                >
                  <span
                    className={cn(
                      'mt-0.5 inline-flex h-4 w-4 shrink-0 translate-y-[2px] items-center justify-center border font-mono text-[10px] transition-all duration-200',
                      isOn ? 'border-green bg-green/15 text-green' : 'border-hairline text-transparent group-hover:border-cyan-dim',
                    )}
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span
                    className={cn(
                      'font-mono text-[13px] uppercase tracking-wide transition-colors',
                      isOn ? 'text-faint line-through decoration-green/50' : 'text-ink',
                    )}
                  >
                    {it.item}
                  </span>
                  <span className="dot-leader" aria-hidden="true" />
                  <span className={cn('text-right font-mono text-[13px]', isOn ? 'text-faint' : 'text-muted')}>{it.acao}</span>
                </button>
              )
            })}
          </div>
        ))}
        {/* carimbo de completo */}
        <AnimatePresence>
          {complete && (
            <motion.div
              initial={{ opacity: 0, scale: 1.6, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: -8 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              aria-hidden="true"
            >
              <span className="border-2 border-green px-6 py-2 font-mono text-lg font-semibold uppercase tracking-[0.3em] text-green [text-shadow:0_0_18px_rgb(var(--c-green) / 0.4)]">
                Checklist completo
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
