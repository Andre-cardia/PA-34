// IndiceRapido — índice de acesso rápido (design/emergencias.md §2).
// Barra sticky: busca instantânea + filtro por sistema afetado + contador.
// Abaixo, grade de mini-cards (número 12.X red + título) que rolam até o card.

import { AnimatePresence, motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import type { Emergencia } from '@/data'
import { cn } from '@/lib/utils'
import { CATEGORIAS, type Categoria } from './emergenciasUtils'

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

interface Props {
  query: string
  onQuery: (q: string) => void
  categoria: Categoria | null
  onCategoria: (c: Categoria | null) => void
  filtradas: Emergencia[]
  total: number
  onSelect: (id: string) => void
}

export default function IndiceRapido({ query, onQuery, categoria, onCategoria, filtradas, total, onSelect }: Props) {
  return (
    <>
      {/* barra sticky */}
      <div className="sticky top-14 z-40 border-b border-hairline bg-panel/95 backdrop-blur-[8px]">
        <div className="mx-auto flex max-w-content flex-wrap items-center gap-3 px-4 py-3 md:px-12">
          {/* busca instantânea */}
          <label className="flex min-w-[220px] flex-1 items-center gap-2 border border-hairline bg-raised px-3 py-2 focus-within:border-cyan-dim sm:max-w-xs">
            <Search className="h-3.5 w-3.5 shrink-0 text-faint" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="BUSCAR EMERGÊNCIA… ex.: fogo, trem, gelo"
              aria-label="Buscar emergência"
              className="w-full bg-transparent font-mono text-xs tracking-[0.08em] text-ink placeholder:text-faint focus:outline-none"
            />
            {query && (
              <button type="button" onClick={() => onQuery('')} aria-label="Limpar busca" className="text-faint transition-colors hover:text-ink">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </label>
          {/* filtro por sistema */}
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrar por sistema afetado">
            {CATEGORIAS.map((c) => {
              const on = categoria === c
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => onCategoria(on ? null : c)}
                  aria-pressed={on}
                  className={cn(
                    'border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors',
                    on ? 'border-red/60 bg-red/10 text-red' : 'border-hairline text-faint hover:border-red/40 hover:text-muted',
                  )}
                >
                  {c}
                </button>
              )
            })}
          </div>
          {/* contador */}
          <span className="ml-auto font-mono text-[11px] tracking-[0.16em] text-muted">
            <span className="text-red">{filtradas.length}</span>
            <span className="text-faint">/{total}</span> PROCEDIMENTOS
          </span>
        </div>
      </div>

      {/* grade de mini-cards índice */}
      <section className="border-b border-hairline bg-abyss py-[56px] md:py-[72px]" aria-label="Índice de procedimentos">
        <div className="mx-auto max-w-content px-6 md:px-12">
          {filtradas.length === 0 ? (
            <p className="border border-hairline bg-raised px-6 py-10 text-center font-mono text-sm tracking-[0.1em] text-muted">
              NENHUM PROCEDIMENTO ENCONTRADO — AJUSTE A BUSCA OU O FILTRO.
            </p>
          ) : (
            <motion.div layout className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {filtradas.map((e, i) => (
                  <motion.button
                    layout
                    key={e.id}
                    type="button"
                    onClick={() => onSelect(e.id)}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3, delay: Math.min(i, 12) * 0.03, ease: EASE }}
                    className="group relative border border-hairline bg-raised p-4 pl-5 text-left transition-transform duration-300 ease-out-expo hover:translate-x-1"
                  >
                    <span
                      className="absolute inset-y-0 left-0 w-[3px] bg-red/30 transition-colors duration-300 group-hover:bg-red"
                      aria-hidden="true"
                    />
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-semibold tracking-[0.08em] text-red">{e.secao_sop}</span>
                      {e.passos.length >= 5 && (
                        <span className="border border-amber/50 bg-amber/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-amber">
                          {e.passos.length} passos
                        </span>
                      )}
                    </span>
                    <span className="mt-1.5 block font-display text-[15px] font-semibold leading-snug text-ink line-clamp-2">
                      {e.titulo}
                    </span>
                  </motion.button>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>
    </>
  )
}
