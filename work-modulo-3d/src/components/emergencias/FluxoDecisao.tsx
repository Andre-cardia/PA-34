// FluxoDecisao — destaque 12.5 × 12.6 (design/emergencias.md §4).
// Diagrama de decisão: o "avião" percorre a pista por scrub; o nó de decisão
// acende quando 60% da seção está visível; ramos ABORTAR (12.5, green) e
// CONTINUAR (12.6, red) com passos verbatim de emergencias.json. Clique rola
// até o card completo e o expande.

import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { MoveRight, Plane } from 'lucide-react'
import { emergencias } from '@/data'
import SectionHeader from '@/components/ui-custom/SectionHeader'
import { cn } from '@/lib/utils'

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

interface Props {
  onSelect: (id: string) => void
}

function Branch({
  id,
  titulo,
  cor,
  passos,
  scrollable,
  onSelect,
}: {
  id: string
  titulo: string
  cor: 'green' | 'red'
  passos: string[]
  scrollable?: boolean
  onSelect: (id: string) => void
}) {
  const isGreen = cor === 'green'
  return (
    <div className="flex flex-col">
      {/* ramo draw-on a partir do nó de decisão */}
      <motion.span
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 0.5, delay: 0.35, ease: EASE }}
        className={cn('mx-auto block h-10 w-px origin-top border-l border-dashed', isGreen ? 'border-green/50' : 'border-red/50')}
        aria-hidden="true"
      />
      <motion.button
        type="button"
        onClick={() => onSelect(id)}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 0.6, delay: 0.55, ease: EASE }}
        className={cn(
          'group relative flex-1 overflow-hidden border bg-raised p-6 text-left transition-colors',
          isGreen ? 'border-green/40 hover:border-green/70' : 'border-red/40 hover:border-red/70',
        )}
      >
        <span className={cn('absolute inset-y-0 left-0 w-[3px]', isGreen ? 'bg-green' : 'bg-red')} aria-hidden="true" />
        <div className="flex items-center justify-between gap-3 pl-2">
          <span className={cn('font-mono text-xs font-semibold uppercase tracking-[0.22em]', isGreen ? 'text-green' : 'text-red')}>
            {titulo}
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint transition-colors group-hover:text-cyan">
            SOP {id}
            <MoveRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </div>
        <ol
          className={cn(
            'mt-4 space-y-2.5 pl-2',
            scrollable && 'max-h-72 overflow-y-auto pr-3 [scrollbar-width:thin]',
          )}
        >
          {passos.map((p, i) => (
            <li key={i} className="flex gap-2.5">
              <span className={cn('font-mono text-[11px] leading-[1.7]', isGreen ? 'text-green/80' : 'text-red/80')}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="font-mono text-[12px] leading-[1.7] text-muted">{p}</span>
            </li>
          ))}
        </ol>
      </motion.button>
    </div>
  )
}

export default function FluxoDecisao({ onSelect }: Props) {
  const e125 = emergencias.find((e) => e.id === '12.5')
  const e126 = emergencias.find((e) => e.id === '12.6')

  const sectionRef = useRef<HTMLDivElement>(null)
  const runwayRef = useRef<HTMLDivElement>(null)
  const [runwayW, setRunwayW] = useState(600)
  const lit = useInView(sectionRef, { once: true, amount: 0.6 })

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start 85%', 'center 45%'] })
  const planeX = useTransform(scrollYProgress, [0, 1], [0, Math.max(runwayW - 30, 0)])

  useEffect(() => {
    const el = runwayRef.current
    if (!el) return
    const update = () => setRunwayW(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (!e125 || !e126) return null

  return (
    <section className="border-b border-hairline bg-panel py-[72px] md:py-[120px]" aria-label="Fluxo de decisão: pane de motor na decolagem">
      <div className="mx-auto max-w-content px-6 md:px-12">
        <SectionHeader
          kicker="// SEÇÃO 12.5 × 12.6 — SOP REV.13"
          title="Pane na decolagem: a decisão"
          measure="V1/VR 105 MPH"
        />

        <div ref={sectionRef} className="mt-16">
          {/* pista — o avião percorre por scrub */}
          <div ref={runwayRef} className="relative h-14" aria-hidden="true">
            <span className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-faint/40" />
            <motion.div style={{ x: planeX }} className="absolute left-0 top-1/2 -translate-y-1/2">
              <Plane className="h-6 w-6 rotate-45 text-cyan [filter:drop-shadow(0_0_8px_rgb(var(--c-cyan) / 0.5))]" strokeWidth={1.75} />
            </motion.div>
            <span className="absolute right-0 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              V1/VR 105
            </span>
          </div>

          {/* nó de decisão — acende com 60% da seção visível */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15% 0px' }}
            transition={{ duration: 0.6, ease: EASE }}
            className={cn(
              'relative mx-auto mt-6 max-w-xl border p-6 text-center transition-all duration-700',
              lit ? 'border-red/70 bg-red/[0.07] [box-shadow:0_0_40px_rgb(var(--c-red) / 0.15)]' : 'border-hairline bg-raised',
            )}
          >
            <motion.span
              animate={lit ? { opacity: [0.15, 1, 0.15, 1] } : {}}
              transition={{ duration: 0.9, times: [0, 0.33, 0.66, 1] }}
              className="inline-block border border-red/60 bg-red/10 px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-red"
            >
              Pane de motor na decolagem
            </motion.span>
            <p className="mt-4 font-display text-xl font-semibold leading-snug text-ink md:text-2xl">
              Abaixo de V1/VR ou pista suficiente à frente?
            </p>
          </motion.div>

          {/* ramos */}
          <div className="mt-2 grid gap-8 md:grid-cols-2">
            <Branch id="12.5" titulo="Abortar — 12.5" cor="green" passos={e125.passos} onSelect={onSelect} />
            <Branch id="12.6" titulo="Continuar — 12.6" cor="red" passos={e126.passos} scrollable onSelect={onSelect} />
          </div>
        </div>
      </div>
    </section>
  )
}
