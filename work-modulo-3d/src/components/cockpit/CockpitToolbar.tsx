// CockpitToolbar — barra superior do módulo (cockpit.md §1): título + info,
// chips de categoria com contagens, busca com dropdown, toggles RÓTULOS e
// DIA/NOITE, botão TOUR GUIADO e ÍNDICE.

import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Info, List, Moon, Play, Search, Gamepad2, Sun, Tag, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CATEGORY_ORDER, REFERENCIA, catMeta } from './panel-data'
import { searchInstruments } from './search'

export interface ToolbarProps {
  filterCat: string | null
  onFilter: (cat: string | null) => void
  labelsOn: boolean
  onToggleLabels: () => void
  yokesOn: boolean
  onToggleYokes: () => void
  total: number
  night: boolean
  onToggleNight: () => void
  tourActive: boolean
  onStartTour: () => void
  indexOpen: boolean
  onToggleIndex: () => void
  counts: Record<string, number>
  onPick: (id: string) => void
}

function SearchBox({ onPick }: { onPick: (id: string) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const results = searchInstruments(q, 8)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const pick = (id: string) => {
    onPick(id)
    setQ('')
    setOpen(false)
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="flex h-9 items-center gap-2 border border-hairline bg-raised px-2.5 transition-colors focus-within:border-cyan-dim">
        <Search className="h-3.5 w-3.5 shrink-0 text-faint" aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
            setCursor(0)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setCursor((c) => Math.min(results.length - 1, c + 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setCursor((c) => Math.max(0, c - 1))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              if (results[cursor]) pick(results[cursor].id)
            } else if (e.key === 'Escape') {
              setOpen(false)
            }
          }}
          placeholder="Buscar instrumento…"
          aria-label="Buscar instrumento no painel"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls={listId}
          className="w-36 bg-transparent font-mono text-[11px] text-ink outline-none placeholder:text-faint sm:w-44"
        />
        {q && (
          <button type="button" onClick={() => setQ('')} aria-label="Limpar busca" className="text-faint hover:text-ink">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.ul
            id={listId}
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 z-50 max-h-72 w-72 overflow-auto border border-hairline bg-panel shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
          >
            {results.map((r, i) => {
              const cat = catMeta(r.categoria)
              return (
                <li key={r.id} role="option" aria-selected={i === cursor}>
                  <button
                    type="button"
                    onClick={() => pick(r.id)}
                    onMouseEnter={() => setCursor(i)}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors',
                      i === cursor ? 'bg-raised' : '',
                    )}
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: cat.color }} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] text-ink">{r.nome}</span>
                      <span className="block truncate font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
                        {r.nome_en}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.14em]" style={{ color: cat.color }}>
                      {cat.label}
                    </span>
                  </button>
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function CockpitToolbar(props: ToolbarProps) {
  const { filterCat, onFilter, labelsOn, onToggleLabels, yokesOn, onToggleYokes, total, night, onToggleNight, tourActive, onStartTour, indexOpen, onToggleIndex, counts, onPick } = props
  const [infoOpen, setInfoOpen] = useState(false)
  const infoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!infoOpen) return
    const onDoc = (e: MouseEvent) => {
      if (infoRef.current && !infoRef.current.contains(e.target as Node)) setInfoOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [infoOpen])

  return (
    <div className="relative z-40 border-b border-hairline bg-panel">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-2 px-3 sm:gap-3 sm:px-5">
        {/* título */}
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden font-display text-[13px] font-semibold tracking-[0.08em] text-ink md:block">
            PAINEL PA34-200 · SENECA I
          </span>
          <span className="font-display text-[13px] font-semibold tracking-[0.08em] text-ink md:hidden">PA34-200</span>
          <div ref={infoRef} className="relative">
            <button
              type="button"
              onClick={() => setInfoOpen((v) => !v)}
              aria-label="Referência do painel"
              aria-expanded={infoOpen}
              className="flex h-6 w-6 items-center justify-center text-faint transition-colors hover:text-cyan"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
            <AnimatePresence>
              {infoOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute left-0 top-8 z-50 w-80 border border-hairline bg-panel p-3 shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
                >
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-cyan">Referência</p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{REFERENCIA}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* chips de categoria (scroll horizontal no mobile) */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Filtrar por categoria">
          {CATEGORY_ORDER.map((cat) => {
            const meta = catMeta(cat)
            const active = filterCat === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onFilter(active ? null : cat)}
                aria-pressed={active}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] transition-all duration-200',
                  active ? 'border-current' : 'border-hairline text-faint hover:text-muted',
                )}
                style={active ? { color: meta.color, background: `${meta.color}14` } : undefined}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} aria-hidden="true" />
                {meta.label}
                <span className="opacity-70">{counts[cat] ?? 0}</span>
              </button>
            )
          })}
        </div>

        {/* ações */}
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="hidden lg:block">
            <SearchBox onPick={onPick} />
          </div>
          <button
            type="button"
            onClick={onToggleLabels}
            aria-pressed={labelsOn}
            title="Mostrar/esconder rótulos (tags com leader lines)"
            className={cn(
              'flex h-9 items-center gap-1.5 border px-2 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors',
              labelsOn ? 'border-cyan-dim text-cyan' : 'border-hairline text-faint hover:text-muted',
            )}
          >
            <Tag className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Rótulos</span>
          </button>
          <button
            type="button"
            onClick={onToggleYokes}
            aria-pressed={yokesOn}
            aria-label="Mostrar manches"
            title="Mostrar manches (não bloqueiam os cliques nos instrumentos)"
            className={cn(
              'flex h-9 items-center gap-1.5 border px-2 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors',
              yokesOn ? 'border-cyan-dim text-cyan' : 'border-hairline text-faint hover:text-muted',
            )}
          >
            <Gamepad2 className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Manches</span>
          </button>
          <button
            type="button"
            onClick={onToggleNight}
            aria-pressed={night}
            title={night ? 'Modo dia' : 'Modo noite (backlight)'}
            className={cn(
              'flex h-9 items-center gap-1.5 border px-2 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors',
              night ? 'border-amber text-amber' : 'border-hairline text-faint hover:text-muted',
            )}
          >
            {night ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            <span className="hidden xl:inline">{night ? 'Noite' : 'Dia'}</span>
          </button>
          <button
            type="button"
            onClick={onStartTour}
            disabled={tourActive}
            title="Tour guiado — 8 paradas"
            className={cn(
              'flex h-9 items-center gap-1.5 border px-2.5 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors',
              tourActive
                ? 'cursor-not-allowed border-cyan-dim text-cyan opacity-60'
                : 'border-cyan-dim bg-cyan/10 text-cyan hover:bg-cyan/20',
            )}
          >
            <Play className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tour guiado</span>
          </button>
          <button
            type="button"
            onClick={onToggleIndex}
            aria-pressed={indexOpen}
            aria-expanded={indexOpen}
            title={`Índice A–Z dos ${total} instrumentos`}
            className={cn(
              'flex h-9 items-center gap-1.5 border px-2 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors',
              indexOpen ? 'border-cyan-dim text-cyan' : 'border-hairline text-faint hover:text-muted',
            )}
          >
            <List className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Índice</span>
          </button>
        </div>
      </div>
      {/* busca mobile (linha própria) */}
      <div className="border-t border-hairline px-3 py-2 lg:hidden">
        <SearchBox onPick={onPick} />
      </div>
    </div>
  )
}
