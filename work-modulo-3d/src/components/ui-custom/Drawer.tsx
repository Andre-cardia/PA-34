// Drawer lateral direito para detalhes de instrumento/componente (design.md §7.9).
// 420px desktop / bottom-sheet mobile; spring stiffness 260 damping 30.

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDialogFocus } from '@/hooks/useDialogFocus'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  chip?: string // categoria com chip, ex.: "VOO" / "MOTORES"
  children?: React.ReactNode
  /** blur (padrão, cockpit): desfoca o fundo; dim: só escurece, mantendo o conteúdo legível. */
  backdrop?: 'blur' | 'dim'
  /** inline (padrão, cockpit): chip e título na mesma linha; stacked: chip acima do título em largura total. */
  header?: 'inline' | 'stacked'
}

export default function Drawer({ open, onClose, title, chip, children, backdrop = 'blur', header = 'inline' }: Props) {
  const drawerRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const titleId = 'drawer-title'

  useDialogFocus(open, drawerRef, closeRef)

  // Esc fecha a ficha; o trap de Tab e o retorno de foco ficam no hook.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
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

  const closeButton = (
    <button
      ref={closeRef}
      type="button"
      onClick={onClose}
      className={cn(
        'flex h-8 w-8 items-center justify-center border border-hairline text-muted transition-colors hover:border-cyan-dim hover:text-cyan',
        header === 'stacked' && 'shrink-0',
      )}
      aria-label="Fechar painel"
    >
      <X className="h-4 w-4" />
    </button>
  )

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={cn('fixed inset-0 z-[80]', backdrop === 'blur' ? 'bg-abyss/60 backdrop-blur-sm' : 'bg-abyss/25')}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={{ x: '100%', y: 0 }}
            animate={{ x: 0, y: 0 }}
            exit={{ x: '100%', y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className={cn(
              'fixed z-[90] border-hairline bg-raised shadow-2xl shadow-black/60',
              'md:inset-y-0 md:right-0 md:w-[420px] md:border-l',
              'max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[82dvh] max-md:border-t',
              header === 'stacked' && 'flex flex-col',
            )}
          >
            {header === 'stacked' ? (
              <div className="flex shrink-0 items-start gap-3 border-b border-hairline px-6 py-4">
                <div className="min-w-0 flex-1">
                  {chip && (
                    <span className="mb-2 inline-block border border-cyan-dim bg-cyan/10 px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.16em] text-cyan">
                      {chip}
                    </span>
                  )}
                  <h3 id={titleId} className="font-display text-xl font-semibold leading-snug text-ink">{title}</h3>
                </div>
                {closeButton}
              </div>
            ) : (
              <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
                <div className="flex items-center gap-3">
                  {chip && (
                    <span className="border border-cyan-dim bg-cyan/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan">
                      {chip}
                    </span>
                  )}
                  <h3 id={titleId} className="font-display text-lg font-semibold text-ink">{title}</h3>
                </div>
                {closeButton}
              </div>
            )}
            {/* inline: altura do cabeçalho fixa (65px), como antes; stacked: cabeçalho variável, corpo ocupa o resto */}
            <div
              className={cn(
                'overflow-y-auto px-6 py-5',
                header === 'stacked' ? 'min-h-0 flex-1' : 'max-h-[calc(100dvh-65px)] max-md:max-h-[calc(82dvh-65px)]',
              )}
            >
              {children}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
