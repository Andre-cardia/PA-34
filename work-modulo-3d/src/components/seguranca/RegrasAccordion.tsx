import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Link } from 'react-router'
import { REGRAS } from './data'
import { cn } from '@/lib/utils'

export default function RegrasAccordion() {
  const [open, setOpen] = useState<string | null>('9.2')
  return (
    <div className="border-t border-hairline">
      {REGRAS.map((r, idx) => {
        const isOpen = open === r.id
        return (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-4% 0px' }}
            transition={{ duration: 0.4, delay: idx * 0.03 }}
            className="border-b border-hairline"
          >
            <button
              onClick={() => setOpen(isOpen ? null : r.id)}
              className="flex w-full items-center gap-4 py-4 text-left transition-colors hover:bg-overlay/50"
              aria-expanded={isOpen}
            >
              <span className="w-14 shrink-0 font-mono text-sm tracking-[0.1em] text-cyan">{r.id}</span>
              <span className="flex-1 font-display text-lg font-semibold text-ink md:text-xl">{r.titulo}</span>
              <Plus className={cn('h-4 w-4 shrink-0 text-faint transition-transform duration-300', isOpen && 'rotate-45 text-cyan')} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-6 pl-14 pr-4 md:pl-[72px]">
                    {r.chips && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {r.chips.map((c) => (
                          <motion.span
                            key={c}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="inline-flex items-center gap-2 border border-amber/50 bg-amber/10 px-3 py-1 font-mono text-[11px] tracking-[0.1em] text-amber"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-amber" />
                            {c}
                          </motion.span>
                        ))}
                      </div>
                    )}
                    <ul className="space-y-2.5">
                      {r.bullets.map((b, i) => (
                        <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-muted">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan/70" />
                          {b}
                        </li>
                      ))}
                    </ul>
                    {r.id === '9.3' && (
                      <Link to="/procedimentos#10-1" className="mt-4 inline-block font-mono text-xs uppercase tracking-[0.14em] text-cyan hover:underline">
                        Ver checklist de inspeção pré-voo →
                      </Link>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}
