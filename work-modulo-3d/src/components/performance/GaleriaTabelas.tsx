// Seção 5 — Tabelas & gráficos originais (design/performance.md §5).
// Galeria 3-col de "pranchetas": cada tabela do SOP 06 (parseada de
// performance.md) vira um card-documento; clique abre lightbox (Esc fecha).

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FileText, X } from 'lucide-react'
import SectionHeader from '@/components/ui-custom/SectionHeader'
import { CornerScrews } from '@/components/assets/PanelScrews'
import { ANCHORS, perfSections, SEC } from './performance-data'
import type { PerfTable } from './performance-data'

interface Doc {
  num: string
  title: string
  table: PerfTable
}

// Todas as tabelas numeradas do cap. 06, na ordem do documento
const DOCS: Doc[] = perfSections
  .filter((s) => !s.id.startsWith('6-2') && s.id !== '06-performance' && s.id !== '07-planejamento-de-voo')
  .flatMap((s) => s.tables)
  .map((t, i) => ({ num: `06.${i + 1}`, title: t.title, table: t }))

function TableGrid({ table, large }: { table: PerfTable; large?: boolean }) {
  return (
    <table className="w-full text-left font-mono">
      <thead>
        <tr className="border-b border-hairline">
          <th className={`py-1.5 pr-3 font-medium uppercase tracking-[0.14em] text-faint ${large ? 'text-[12px]' : 'text-[10px]'}`}>
            {table.colLabel}
          </th>
          <th className={`py-1.5 text-right font-medium uppercase tracking-[0.14em] text-faint ${large ? 'text-[12px]' : 'text-[10px]'}`}>
            {table.colValue}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-hairline/50">
        {table.rows.map((r) => (
          <tr key={r.label} className="transition-colors hover:bg-overlay/60">
            <td className={`py-1.5 pr-3 text-muted ${large ? 'text-[13px]' : 'text-[11px]'}`}>{r.label}</td>
            <td className={`py-1.5 text-right text-ink ${large ? 'text-[13px]' : 'text-[11px]'}`}>{r.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function GaleriaTabelas() {
  const [open, setOpen] = useState<Doc | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null)
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <section id={ANCHORS.tabelas} className="scroll-mt-[180px] border-t border-hairline bg-abyss py-[72px] md:py-[100px]">
      <div className="mx-auto max-w-content px-6 md:px-12">
        <SectionHeader
          kicker="// SEÇÃO 06 — GALERIA TÉCNICA"
          title="Gráficos e tabelas de performance (SOP 6)"
          measure={`${DOCS.length} TABELAS`}
        />

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DOCS.map((doc, i) => (
            <motion.button
              key={doc.num}
              type="button"
              onClick={() => setOpen(doc)}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-8% 0px' }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="group relative border border-hairline bg-raised p-5 text-left transition-colors duration-300 hover:border-cyan-dim"
              aria-label={`Abrir tabela ${doc.num} — ${doc.title}`}
            >
              <CornerScrews size={8} />
              <div className="flex items-center justify-between gap-3 border-b border-hairline pb-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan">
                  Tabela {doc.num}
                </span>
                <FileText className="h-3.5 w-3.5 text-faint transition-colors group-hover:text-cyan" aria-hidden="true" />
              </div>
              <p className="mt-3 mb-3 font-display text-[15px] font-semibold leading-snug text-ink">
                {doc.title}
              </p>
              <TableGrid table={doc.table} />
            </motion.button>
          ))}

          {/* card-nota: figuras do documento original (pp. 27–32) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-8% 0px' }}
            transition={{ duration: 0.45, delay: (DOCS.length % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="relative border border-dashed border-hairline bg-panel p-5"
          >
            <div className="flex items-center justify-between gap-3 border-b border-hairline pb-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">Figuras</span>
              <FileText className="h-3.5 w-3.5 text-faint" aria-hidden="true" />
            </div>
            <p className="mt-3 font-display text-[15px] font-semibold text-ink">{SEC.graficos.title}</p>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">{SEC.graficos.paragraphs[0]}</p>
          </motion.div>
        </div>
      </div>

      {/* lightbox */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-abyss/85 p-6 backdrop-blur-sm"
            onClick={() => setOpen(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`Tabela ${open.num} — ${open.title}`}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-2xl border border-hairline bg-raised p-7 md:p-9"
              onClick={(e) => e.stopPropagation()}
            >
              <CornerScrews />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan">
                    Tabela {open.num} — SOP 06
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-semibold text-ink">{open.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  className="border border-hairline p-2 text-muted transition-colors hover:border-cyan-dim hover:text-cyan"
                  aria-label="Fechar (Esc)"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-6">
                <TableGrid table={open.table} large />
              </div>
              <p className="mt-6 border-t border-hairline pt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
                Fonte: SOP VoeFloripa Rev.13 — cap. 06 · valores em MPH / metros / ft / NM
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
