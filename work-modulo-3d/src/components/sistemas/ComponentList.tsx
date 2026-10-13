// Lista de componentes da estação — cards-accordion (sistemas.md, template
// item 2): título + função sempre visível; expandir revela detalhes. Rail
// esquerdo na cor-chave acende no hover; ícone de link cruzado 3D/cockpit.

import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { Box, Gauge, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Sistema } from '@/data'
import type { SystemMeta } from './config'
import { EASE_OUT, componentDomId } from './utils'

interface Props {
  sistema: Sistema
  meta: SystemMeta
}

export default function ComponentList({ sistema, meta }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [flash, setFlash] = useState<number | null>(null)

  // Nós do diagrama despacham foco para o componente correspondente
  useEffect(() => {
    const onFocus = (e: Event) => {
      const id = (e as CustomEvent<{ id: string }>).detail?.id
      if (!id?.startsWith(`${sistema.id}-c-`)) return
      const idx = Number(id.split('-c-')[1])
      if (Number.isNaN(idx) || idx >= sistema.componentes.length) return
      setOpenIndex(idx)
      setFlash(idx)
      window.setTimeout(() => setFlash((f) => (f === idx ? null : f)), 2200)
    }
    window.addEventListener('sistemas:focus-component', onFocus)
    return () => window.removeEventListener('sistemas:focus-component', onFocus)
  }, [sistema.id, sistema.componentes.length])

  return (
    <ol className="border-t border-hairline">
      {sistema.componentes.map((c, i) => {
        const open = openIndex === i
        const cross = meta.crossLinks?.[i]
        return (
          <motion.li
            key={c.nome}
            id={componentDomId(sistema.id, i)}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-6% 0px' }}
            transition={{ duration: 0.5, delay: i * 0.07, ease: EASE_OUT }}
            className={cn(
              'group/comp relative border-b border-hairline transition-colors duration-300',
              flash === i ? 'bg-overlay' : 'hover:bg-raised',
            )}
            style={{ scrollMarginTop: '9rem' }}
          >
            {/* rail esquerdo na cor-chave */}
            <span
              aria-hidden="true"
              className={cn(
                'absolute inset-y-0 left-0 w-[3px] transition-opacity duration-300',
                open || flash === i ? 'opacity-100' : 'opacity-0 group-hover/comp:opacity-100',
              )}
              style={{ backgroundColor: meta.color, boxShadow: `0 0 10px ${meta.color}` }}
            />
            <div className="flex items-start gap-1 py-4 pl-4 pr-3">
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : i)}
                className="flex flex-1 items-start justify-between gap-3 text-left"
                aria-expanded={open}
              >
                <span>
                  <span className="flex items-baseline gap-2">
                    <span className="font-mono text-[10px] tracking-[0.14em] text-faint">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-display text-[17px] font-semibold leading-snug text-ink">
                      {c.nome}
                    </span>
                  </span>
                  <span className="mt-1 block text-[15px] leading-relaxed text-muted">{c.funcao}</span>
                </span>
                <Plus
                  className={cn(
                    'mt-1 h-4 w-4 shrink-0 text-faint transition-transform duration-300',
                    open && 'rotate-45 text-ink',
                  )}
                  aria-hidden="true"
                />
              </button>
              {cross && (
                <Link
                  to={cross.to}
                  className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center border border-hairline text-faint transition-colors hover:border-cyan-dim hover:text-cyan"
                  aria-label={`${c.nome} — ver no ${cross.tipo === '3d' ? 'modelo 3D' : 'cockpit'}`}
                  title={cross.tipo === '3d' ? 'Ver no modelo 3D' : 'Ver no cockpit'}
                >
                  {cross.tipo === '3d' ? (
                    <Box className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </Link>
              )}
            </div>
            <AnimatePresence initial={false}>
              {open && c.detalhes && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: EASE_OUT }}
                  className="overflow-hidden"
                >
                  <p className="border-t border-hairline/60 px-4 py-3 pl-10 text-sm leading-relaxed text-muted">
                    {c.detalhes}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.li>
        )
      })}
    </ol>
  )
}
