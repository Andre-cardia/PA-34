// Drawer lateral direito para detalhes de instrumento/componente (design.md §7.9).
// 420px desktop / bottom-sheet mobile; spring stiffness 260 damping 30.

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  chip?: string // categoria com chip, ex.: "VOO" / "MOTORES"
  children?: React.ReactNode
}

export default function Drawer({ open, onClose, title, chip, children }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[80] bg-abyss/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: '100%', y: 0 }}
            animate={{ x: 0, y: 0 }}
            exit={{ x: '100%', y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className={cn(
              'fixed z-[90] border-hairline bg-raised shadow-2xl shadow-black/60',
              // desktop: painel direito 420px
              'md:inset-y-0 md:right-0 md:w-[420px] md:border-l',
              // mobile: bottom-sheet
              'max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[82dvh] max-md:border-t',
            )}
          >
            <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
              <div className="flex items-center gap-3">
                {chip && (
                  <span className="border border-cyan-dim bg-cyan/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan">
                    {chip}
                  </span>
                )}
                <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center border border-hairline text-muted transition-colors hover:border-cyan-dim hover:text-cyan"
                aria-label="Fechar painel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[calc(100dvh-65px)] overflow-y-auto px-6 py-5 max-md:max-h-[calc(82dvh-65px)]">
              {children}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
