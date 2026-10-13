// IndexPanel — lista-índice lateral com busca e acordeões por categoria
// (cockpit.md §1 toolbar / §7 mobile "LISTA A–Z").

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { instrumentosCockpit } from '@/data'
import { CATEGORY_ORDER, PANEL_MAP, catMeta } from './panel-data'
import { searchInstruments } from './search'

export interface IndexPanelProps {
  open: boolean
  selectedId: string | null
  onPick: (id: string) => void
  onClose: () => void
}

export default function IndexPanel({ open, selectedId, onPick, onClose }: IndexPanelProps) {
  const [q, setQ] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const groups = useMemo(() => {
    const byCat = new Map<string, typeof instrumentosCockpit>()
    for (const i of instrumentosCockpit) {
      const arr = byCat.get(i.categoria) ?? []
      arr.push(i)
      byCat.set(i.categoria, arr)
    }
    return CATEGORY_ORDER.filter((c) => byCat.has(c)).map((c) => ({ cat: c, items: byCat.get(c)! }))
  }, [])

  const results = q.trim() ? searchInstruments(q, 56) : null

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: -340, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -340, opacity: 0 }}
          transition={{ type: 'tween', duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="absolute left-0 top-0 z-30 flex h-full w-full flex-col border-r border-hairline bg-panel/95 backdrop-blur-md sm:w-84 sm:max-w-[340px]"
          aria-label="Índice de instrumentos"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan">
              Índice · {instrumentosCockpit.length} itens
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar índice"
              className="flex h-7 w-7 items-center justify-center text-faint transition-colors hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="border-b border-hairline px-4 py-2.5">
            <div className="flex h-8 items-center gap-2 border border-hairline bg-raised px-2.5 focus-within:border-cyan-dim">
              <Search className="h-3.5 w-3.5 shrink-0 text-faint" aria-hidden="true" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar no índice…"
                aria-label="Buscar no índice"
                className="w-full bg-transparent font-mono text-[11px] text-ink outline-none placeholder:text-faint"
              />
              {q && (
                <button type="button" onClick={() => setQ('')} aria-label="Limpar" className="text-faint hover:text-ink">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {results ? (
              results.length === 0 ? (
                <p className="px-4 py-6 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                  Nenhum instrumento encontrado
                </p>
              ) : (
                <ul>
                  {results.map((i) => (
                    <IndexItem key={i.id} id={i.id} nome={i.nome} selected={selectedId === i.id} onPick={onPick} />
                  ))}
                </ul>
              )
            ) : (
              groups.map((g) => {
                const meta = catMeta(g.cat)
                const isCollapsed = !!collapsed[g.cat]
                return (
                  <div key={g.cat} className="border-b border-hairline/60">
                    <button
                      type="button"
                      onClick={() => setCollapsed((c) => ({ ...c, [g.cat]: !c[g.cat] }))}
                      aria-expanded={!isCollapsed}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-raised/50"
                    >
                      <ChevronDown
                        className={cn('h-3.5 w-3.5 text-faint transition-transform duration-200', isCollapsed && '-rotate-90')}
                        aria-hidden="true"
                      />
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} aria-hidden="true" />
                      <span className="flex-1 font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: meta.color }}>
                        {meta.label}
                      </span>
                      <span className="font-mono text-[9px] text-faint">{g.items.length}</span>
                    </button>
                    <AnimatePresence initial={false}>
                      {!isCollapsed && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          {g.items.map((i) => (
                            <IndexItem key={i.id} id={i.id} nome={i.nome} selected={selectedId === i.id} onPick={onPick} />
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function IndexItem({ id, nome, selected, onPick }: { id: string; nome: string; selected: boolean; onPick: (id: string) => void }) {
  const tag = PANEL_MAP[id]?.tag ?? id
  return (
    <li>
      <button
        type="button"
        onClick={() => onPick(id)}
        className={cn(
          'flex w-full items-center gap-2 border-l-2 py-1.5 pl-6 pr-4 text-left transition-colors',
          selected ? 'border-cyan bg-cyan/5 text-ink' : 'border-transparent text-muted hover:bg-raised/50 hover:text-ink',
        )}
      >
        <span className="min-w-0 flex-1 truncate text-[12px]">{nome}</span>
        <span className="shrink-0 font-mono text-[8.5px] uppercase tracking-[0.12em] text-faint">{tag}</span>
      </button>
    </li>
  )
}
