// EmergenciasHero — PageHero em variação de alerta (design/emergencias.md §1).
// Kicker amber, número-fantasma "12" em red 10%, hairline superior red,
// annunciator CAUT/WARN (blink 2× → sólido amber) e frase-etiqueta mono.

import { useRef } from 'react'
import { Link } from 'react-router'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useScramble } from '@/hooks/useScramble'
import PA34SilhouetteTop from '@/components/assets/PA34SilhouetteTop'

function WarnAnnunciator() {
  return (
    <span className="flex items-center gap-2" aria-label="Annunciator decorativo: cautela e warning">
      <motion.span
        initial={{ opacity: 0.15 }}
        animate={{ opacity: [0.15, 1, 0.15, 1, 0.15, 1] }}
        transition={{ duration: 0.9, delay: 0.9, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }}
        className="border border-amber/60 bg-amber/10 px-2.5 py-1.5 font-mono text-[10px] font-medium tracking-[0.22em] text-amber"
      >
        CAUT
      </motion.span>
      <motion.span
        initial={{ opacity: 0.15 }}
        animate={{ opacity: [0.15, 1, 0.15, 1, 0.15, 0.3] }}
        transition={{ duration: 0.9, delay: 1.05, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }}
        className="border border-red/60 bg-red/10 px-2.5 py-1.5 font-mono text-[10px] font-medium tracking-[0.22em] text-red"
      >
        WARN
      </motion.span>
    </span>
  )
}

export default function EmergenciasHero() {
  const scrambled = useScramble('Emergências', { duration: 800 })
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const ghostY = useTransform(scrollYProgress, [0, 1], [0, 60])

  return (
    <header
      ref={ref}
      className="blueprint-grid relative flex min-h-[55dvh] flex-col justify-end overflow-hidden border-t-2 border-red/70 border-b border-hairline bg-panel"
    >
      <PA34SilhouetteTop className="pointer-events-none absolute -right-24 -top-16 h-[560px] w-[560px] text-red opacity-[0.05] max-md:right-[-180px]" />
      {/* número-fantasma em red 10% */}
      <motion.span
        style={{ y: ghostY }}
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 right-6 select-none font-display text-[200px] font-bold leading-none text-red/10 md:text-[320px]"
      >
        12
      </motion.span>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-abyss/80 to-transparent" aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-content px-6 pb-16 pt-28 md:px-12">
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
          <Link to="/" className="transition-colors hover:text-cyan">
            HOME
          </Link>
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
          <span className="text-muted">EMERGÊNCIAS</span>
        </nav>

        <div className="flex flex-wrap items-center gap-4">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-amber">
            {'// SEÇÃO 12 — PROCEDIMENTOS DE EMERGÊNCIA'}
          </p>
          <WarnAnnunciator />
        </div>
        <h1 className="mt-4 max-w-3xl font-display text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink md:text-[56px]">
          {scrambled}
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 max-w-2xl text-[17px] leading-relaxed text-muted md:text-[19px]"
        >
          21 procedimentos do SOP — da pane de motor à descida de emergência. Leia em terra para executar no ar.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-red"
        >
          Decorar os itens de memória. O checklist confirma.
        </motion.p>
      </div>
    </header>
  )
}
