// TourOverlay — tour guiado (cockpit.md §5): cartão compacto com resumo,
// progresso n/8, PULAR / PRÓXIMO, e "LER FICHA COMPLETA" abrindo o drawer.

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, BookOpen, X } from 'lucide-react'
import { TOUR_STOPS, catMeta, instrumentById } from './panel-data'

export interface TourOverlayProps {
  index: number // parada atual (0–7)
  drawerOpen: boolean
  onNext: () => void
  onSkip: () => void
  onOpenFull: (id: string) => void
}

function summarize(text: string, max = 150): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 40))}…`
}

export default function TourOverlay({ index, drawerOpen, onNext, onSkip, onOpenFull }: TourOverlayProps) {
  const stop = TOUR_STOPS[index]
  const inst = stop ? instrumentById[stop.id] : undefined
  if (!stop || !inst) return null
  const last = index === TOUR_STOPS.length - 1
  const meta = catMeta(inst.categoria)

  return (
    <AnimatePresence>
      {!drawerOpen && (
        <motion.div
          key={`tour-${index}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-14 left-4 z-30 w-[min(21rem,calc(100%-2rem))] border border-hairline bg-panel/95 shadow-[0_16px_50px_rgba(0,0,0,0.55)] backdrop-blur-md"
          role="dialog"
          aria-label={`Tour guiado — parada ${index + 1} de ${TOUR_STOPS.length}`}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* progresso */}
          <div className="flex items-center gap-1 border-b border-hairline px-3.5 py-2.5">
            <span className="mr-2 font-mono text-[10px] tracking-[0.18em] text-cyan">
              {index + 1}/{TOUR_STOPS.length}
            </span>
            {TOUR_STOPS.map((_, i) => (
              <span
                key={i}
                className="h-[3px] flex-1"
                style={{ background: i <= index ? '#3FE0FF' : '#1E2C3D', transition: 'background 0.3s' }}
                aria-hidden="true"
              />
            ))}
            <button
              type="button"
              onClick={onSkip}
              aria-label="Encerrar tour"
              className="ml-2 flex h-6 w-6 items-center justify-center text-faint transition-colors hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="px-3.5 py-3">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} aria-hidden="true" />
              <span className="font-mono text-[8.5px] uppercase tracking-[0.18em]" style={{ color: meta.color }}>
                {meta.label}
              </span>
            </div>
            <h3 className="mt-1 font-display text-[16px] font-semibold text-ink">{stop.titulo ?? inst.nome}</h3>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{summarize(inst.descricao)}</p>
            <button
              type="button"
              onClick={() => onOpenFull(stop.id)}
              className="mt-2.5 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-cyan transition-colors hover:text-ink"
            >
              <BookOpen className="h-3 w-3" aria-hidden="true" /> Ler ficha completa
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-hairline px-3.5 py-2.5">
            <button
              type="button"
              onClick={onSkip}
              className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint transition-colors hover:text-ink"
            >
              Pular
            </button>
            <button
              type="button"
              onClick={onNext}
              className="flex items-center gap-1.5 border border-cyan-dim bg-cyan/10 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-cyan transition-colors hover:bg-cyan/20"
            >
              {last ? 'Concluir' : 'Próximo'} <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
