// Seção 7 — Abreviaturas 6.2: glossário vivo (design/performance.md §7).
// Tabela sigla | definição com busca instantânea; linhas com definição longa
// (SOP 6.2 "Definições") expandem inline. Filtro com layout animation.

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Search } from 'lucide-react'
import SectionHeader from '@/components/ui-custom/SectionHeader'
import { ANCHORS, abbreviations } from './performance-data'
import { cn } from '@/lib/utils'

export default function Glossario() {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const q = query.trim().toLowerCase()
  const filtered = abbreviations.filter(
    (a) => !q || `${a.code} ${a.short} ${a.long ?? ''}`.toLowerCase().includes(q),
  )

  return (
    <section id={ANCHORS.glossario} className="scroll-mt-[180px] border-t border-hairline bg-abyss py-[72px] md:py-[100px]">
      <div className="mx-auto max-w-content px-6 md:px-12">
        <SectionHeader
          kicker="// SEÇÃO 6.2 — ABREVIATURAS & DEFINIÇÕES"
          title="Glossário de V-speeds"
          measure={`${abbreviations.length} SIGLAS`}
        />

        {/* busca */}
        <div className="relative mt-10 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar sigla ou definição… (ex.: VYSE, estol, blue line)"
            aria-label="Filtrar glossário de V-speeds"
            className="w-full border border-hairline bg-panel py-3 pl-11 pr-4 font-mono text-[13px] text-ink placeholder:text-faint focus:border-cyan-dim focus:outline-none"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            {filtered.length}/{abbreviations.length}
          </span>
        </div>

        {/* linhas */}
        <motion.div layout className="mt-6 divide-y divide-hairline/60 border-y border-hairline">
          <AnimatePresence initial={false}>
            {filtered.map((a, i) => {
              const open = expanded === a.code
              return (
                <motion.div
                  key={a.code}
                  layout="position"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.3) }}
                >
                  <button
                    type="button"
                    disabled={!a.long}
                    onClick={() => setExpanded(open ? null : a.code)}
                    aria-expanded={a.long ? open : undefined}
                    className={cn(
                      'grid w-full grid-cols-[110px_1fr_auto] items-baseline gap-4 px-3 py-3 text-left transition-colors duration-300 sm:grid-cols-[160px_1fr_auto]',
                      a.long ? 'cursor-pointer hover:bg-overlay' : 'cursor-default hover:bg-overlay/60',
                    )}
                  >
                    <span className="font-mono text-[13px] font-semibold text-cyan">{a.code}</span>
                    <span className="text-[14px] leading-relaxed text-muted">{a.short}</span>
                    {a.long ? (
                      <ChevronDown
                        className={cn('h-4 w-4 self-center text-faint transition-transform duration-300', open && 'rotate-180 text-cyan')}
                        aria-hidden="true"
                      />
                    ) : (
                      <span className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                  <AnimatePresence initial={false}>
                    {open && a.long && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="mx-3 mb-3 border-l-2 border-cyan/50 bg-cyan/[0.05] py-3 pl-4 pr-3 text-[14px] leading-relaxed text-muted sm:ml-[172px]">
                          {a.long}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </AnimatePresence>
          {filtered.length === 0 && (
            <p className="px-3 py-8 text-center font-mono text-[12px] uppercase tracking-[0.16em] text-faint">
              Nenhuma sigla encontrada para “{query}”
            </p>
          )}
        </motion.div>

        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.24em] text-faint">
          Fonte: SOP 6.2 — velocidades, abreviaturas e definições · aeronave graduada em MPH
        </p>
      </div>
    </section>
  )
}
