// Seção 6 — Planejamento de voo (design/performance.md §6 / SOP 07).
// Timeline vertical: rail cyan desenhado por scrub, 5 nós numerados (itens do
// SOP 07 parseados de performance.md), cards alternados com chips de referência
// cruzada; nós com formulário SOP expandem nota extra (accordion inline).

import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion, useScroll, useSpring, useInView } from 'framer-motion'
import { ArrowRight, ChevronDown, ClipboardList, FileText, Fuel, Map, Scale } from 'lucide-react'
import SectionHeader from '@/components/ui-custom/SectionHeader'
import { ANCHORS, planning, scrollToAnchor } from './performance-data'
import { cn } from '@/lib/utils'

// Extras (formulários do SOP 07) associados aos nós 3 e 4 — vindos do markdown
const EXTRA_BY_TITLE: Record<string, string> = {}
for (const f of planning.forms) {
  EXTRA_BY_TITLE[f.title.toUpperCase()] = `${f.title} ${f.body}`
}
const extraFor = (title: string): string | undefined => {
  const t = title.toUpperCase()
  if (t.includes('PESO')) return Object.values(EXTRA_BY_TITLE).find((e) => e.toUpperCase().includes('PESO'))
  if (t.includes('NAVEGA')) return Object.values(EXTRA_BY_TITLE).find((e) => e.toUpperCase().includes('NAVEGA'))
  return undefined
}

const ICONS = [Map, ClipboardList, Scale, Fuel, FileText]

// Chips de referência cruzada por índice do nó
function CrossChips({ idx }: { idx: number }) {
  if (idx === 2)
    return (
      <Link to="/especificacoes" className="inline-flex items-center gap-1.5 border border-hairline bg-panel px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-faint transition-colors hover:border-cyan-dim hover:text-cyan">
        Pesos & envelope <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </Link>
    )
  if (idx === 3)
    return (
      <button
        type="button"
        onClick={() => scrollToAnchor(ANCHORS.tabelas)}
        className="inline-flex items-center gap-1.5 border border-hairline bg-panel px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-faint transition-colors hover:border-cyan-dim hover:text-cyan"
      >
        Tabelas de cruzeiro <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </button>
    )
  if (idx === 0)
    return (
      <Link to="/seguranca" className="inline-flex items-center gap-1.5 border border-hairline bg-panel px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-faint transition-colors hover:border-cyan-dim hover:text-cyan">
        Regras de segurança <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </Link>
    )
  return null
}

function Node({ idx, title, body, side }: { idx: number; title: string; body: string; side: 'left' | 'right' }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20% 0px' })
  const [expanded, setExpanded] = useState(false)
  const extra = extraFor(title)
  const Icon = ICONS[idx % ICONS.length]

  return (
    <div ref={ref} className={cn('relative flex pl-14 md:w-1/2', side === 'left' ? 'md:pl-0 md:pr-14' : 'md:ml-auto md:pl-14')}>
      {/* nó circular no rail */}
      <motion.span
        initial={{ scale: 0.6, opacity: 0.4 }}
        animate={inView ? { scale: 1, opacity: 1 } : undefined}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        className={cn(
          'absolute top-7 z-10 flex h-10 w-10 items-center justify-center rounded-full border bg-panel font-mono text-[12px] transition-colors duration-500',
          'left-0 md:left-auto',
          side === 'left' ? 'md:-right-5' : 'md:-left-5',
          inView ? 'border-cyan text-cyan [box-shadow:0_0_18px_rgba(63,224,255,0.35)]' : 'border-hairline text-faint',
        )}
        aria-hidden="true"
      >
        {String(idx + 1).padStart(2, '0')}
      </motion.span>

      {/* card */}
      <motion.div
        initial={{ opacity: 0, x: side === 'left' ? -40 : 40 }}
        animate={inView ? { opacity: 1, x: 0 } : undefined}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'w-full border bg-raised p-6 transition-colors duration-500',
          inView ? 'border-hairline' : 'border-hairline/60',
        )}
      >
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-cyan" strokeWidth={1.75} aria-hidden="true" />
          <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
        </div>
        {body && <p className="mt-3 text-[15px] leading-relaxed text-muted">{body}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <CrossChips idx={idx} />
          {extra && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              className="inline-flex items-center gap-1 border border-dashed border-hairline px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-faint transition-colors hover:border-cyan-dim hover:text-cyan"
            >
              Formulário SOP
              <ChevronDown className={cn('h-3 w-3 transition-transform duration-300', expanded && 'rotate-180')} aria-hidden="true" />
            </button>
          )}
        </div>
        <AnimatePresence initial={false}>
          {expanded && extra && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <p className="mt-4 border-l-2 border-cyan/50 bg-cyan/[0.05] py-2.5 pl-3.5 pr-3 font-mono text-[12px] leading-relaxed text-muted">
                {extra}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default function PlanejamentoTimeline() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.65'] })
  const rail = useSpring(scrollYProgress, { stiffness: 90, damping: 24 })

  return (
    <section id={ANCHORS.planejamento} className="scroll-mt-[180px] border-t border-hairline bg-panel py-[72px] md:py-[100px]">
      <div className="mx-auto max-w-content px-6 md:px-12">
        <SectionHeader
          kicker="// SEÇÃO 07 — PLANEJAMENTO DE VOO"
          title="Antes do voo, em 5 passos"
          measure="SOP 07 · REV.13"
        />

        <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-muted">{planning.intro}</p>

        <div ref={ref} className="relative mt-12">
          {/* rail */}
          <span className="absolute bottom-0 left-5 top-0 w-px bg-hairline md:left-1/2" aria-hidden="true" />
          <motion.span
            style={{ scaleY: rail }}
            className="absolute bottom-0 left-5 top-0 w-px origin-top bg-cyan md:left-1/2"
            aria-hidden="true"
          />
          <div className="space-y-8 md:space-y-10">
            {planning.items.map((item, i) => (
              <Node key={item.title} idx={i} title={item.title} body={item.body} side={i % 2 === 0 ? 'left' : 'right'} />
            ))}
          </div>
        </div>

        <p className="mt-10 font-mono text-[11px] leading-relaxed tracking-[0.06em] text-faint">
          {planning.formsIntro} {planning.forms.map((f) => `${f.title} ${f.body}`).join(' · ')}
        </p>
      </div>
    </section>
  )
}
