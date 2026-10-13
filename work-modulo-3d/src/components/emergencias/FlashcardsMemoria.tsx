// FlashcardsMemoria — Seção 5 de /emergencias: itens de memória (ação imediata)
// dos procedimentos-chave 12.1, 12.2, 12.5, 12.6 e 12.21 em flashcards 3D.
// Frente = nome do procedimento; verso = passos verbatim de emergencias.json.
// Estado "DOMINADO ✓" por flashcard (localStorage).

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, RotateCw } from 'lucide-react'
import { emergencias, type Emergencia } from '@/data'
import SectionHeader from '@/components/ui-custom/SectionHeader'
import { cn } from '@/lib/utils'

const MEMORY_IDS = ['12.1', '12.2', '12.5', '12.6', '12.21']
const storageKey = (id: string) => `pa34-flashcard:${id}`

function readDone(id: string) {
  try {
    return localStorage.getItem(storageKey(id)) === '1'
  } catch {
    return false
  }
}

function Flashcard({ em, index }: { em: Emergencia; index: number }) {
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(() => readDone(em.id))

  const toggleDone = (ev: React.MouseEvent) => {
    ev.stopPropagation()
    const next = !done
    setDone(next)
    try {
      localStorage.setItem(storageKey(em.id), next ? '1' : '0')
    } catch {
      /* noop */
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.6, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="[perspective:1400px]"
    >
      <motion.div
        role="button"
        tabIndex={0}
        onClick={() => setFlipped((v) => !v)}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget && (e.target as HTMLElement).closest('button, a, input, select, textarea')) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setFlipped((v) => !v)
          }
        }}
        aria-pressed={flipped}
        aria-label={`Flashcard ${em.secao_sop} — ${em.titulo}. ${flipped ? 'Verso: itens de memória.' : 'Clique para ver os itens de memória.'}`}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        className="relative h-[380px] cursor-pointer [transform-style:preserve-3d]"
      >
        {/* frente */}
        <div className="absolute inset-0 flex flex-col border border-hairline bg-raised p-6 [backface-visibility:hidden]">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-sm font-semibold tracking-[0.1em] text-red">{em.secao_sop}</span>
            {done && (
              <span className="flex items-center gap-1 border border-green/50 bg-green/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-green">
                <Check className="h-3 w-3" aria-hidden="true" /> Dominado
              </span>
            )}
          </div>
          <p className="mt-4 font-display text-xl font-semibold leading-snug text-ink md:text-[22px]">{em.titulo}</p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-amber">Itens de memória</p>
          <div className="mt-auto flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
            <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
            Clique para virar
          </div>
        </div>
        {/* verso */}
        <div className="absolute inset-0 flex flex-col border border-red/40 bg-panel p-5 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <p className="font-mono text-[10px] font-semibold uppercase leading-relaxed tracking-[0.14em] text-red">
            Itens de memória — executar sem consultar o checklist
          </p>
          <ol className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
            {em.passos.map((p, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="shrink-0 font-mono text-[11px] leading-[1.65] text-red/80">{String(i + 1).padStart(2, '0')}</span>
                <span className="font-mono text-[12px] leading-[1.65] text-ink/90">{p}</span>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={toggleDone}
            aria-pressed={done}
            className={cn(
              'mt-4 flex w-full items-center justify-center gap-2 border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors',
              done ? 'border-green/60 bg-green/10 text-green' : 'border-hairline text-muted hover:border-green/50 hover:text-green',
            )}
          >
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            {done ? 'Dominado ✓' : 'Marcar como dominado'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function FlashcardsMemoria() {
  const cards = MEMORY_IDS.map((id) => emergencias.find((e) => e.id === id)).filter((e): e is Emergencia => !!e)
  return (
    <section className="border-b border-hairline bg-abyss py-[72px] md:py-[120px]" aria-label="Itens de memória">
      <div className="mx-auto max-w-content px-6 md:px-12">
        <SectionHeader
          kicker="// SEÇÃO 12 — ITENS DE MEMÓRIA"
          title="Decore em terra. Execute no ar."
          measure="12.1 · 12.2 · 12.5 · 12.6 · 12.21"
        />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((em, i) => (
            <Flashcard key={em.id} em={em} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
