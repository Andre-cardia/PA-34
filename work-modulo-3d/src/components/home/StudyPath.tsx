// Seção 6 — Trilha de estudo em 3 passos (home.md §6).
// Rota tracejada cyan desenhada por scrub conectando as colunas.

import { useRef } from 'react'
import { Link } from 'react-router'
import { motion, useScroll, useSpring, useInView } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { useScramble } from '@/hooks/useScramble'
import SectionHeader from '@/components/ui-custom/SectionHeader'

const PASSOS = [
  {
    num: '01',
    titulo: 'ESTUDE O SISTEMA',
    texto: 'Abra o modelo 3D e remova camadas até entender onde cada coisa vive.',
    to: '/modelo-3d',
  },
  {
    num: '02',
    titulo: 'DECORE O PAINEL',
    texto: 'Percorra os 56 instrumentos no cockpit 2D com os boxes de operação.',
    to: '/cockpit',
  },
  {
    num: '03',
    titulo: 'EXECUTE O FLUXO',
    texto: 'Rode os checklists por fase de voo e revise os itens de memória.',
    to: '/procedimentos',
  },
]

function Step({ passo, index }: { passo: (typeof PASSOS)[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })
  const num = useScramble(passo.num, { duration: 500, enabled: inView })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-15% 0px' }}
      transition={{ duration: 0.7, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="relative pt-10"
    >
      {/* nó da rota */}
      <span className="absolute left-0 top-0 h-3 w-3 -translate-y-1/2 rotate-45 border border-cyan bg-panel" aria-hidden="true" />
      <span className="font-display text-5xl font-bold text-faint/60">{num}</span>
      <h3 className="mt-4 font-mono text-sm font-semibold uppercase tracking-[0.22em] text-ink">{passo.titulo}</h3>
      <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-muted">{passo.texto}</p>
      <Link
        to={passo.to}
        className="group mt-5 inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-cyan"
      >
        Abrir
        <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </Link>
    </motion.div>
  )
}

export default function StudyPath() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 55%'] })
  const route = useSpring(scrollYProgress, { stiffness: 100, damping: 26 })

  return (
    <section className="border-b border-hairline bg-abyss py-[72px] md:py-[120px]">
      <div className="mx-auto max-w-content px-6 md:px-12">
        <SectionHeader kicker="// TRILHA DE ESTUDO" title="Do hangar ao checklist, em três passos." measure="FLUXO VFL" />
        <div ref={ref} className="relative mt-20">
          {/* rota tracejada (scrub) */}
          <svg className="absolute left-0 top-0 hidden h-px w-full md:block" aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 100 1">
            <motion.line
              x1="0"
              y1="0.5"
              x2="100"
              y2="0.5"
              stroke="rgb(var(--c-cyan))"
              strokeWidth="1.5"
              strokeDasharray="4 5"
              vectorEffect="non-scaling-stroke"
              style={{ pathLength: route }}
              pathLength={1}
            />
          </svg>
          {/* hairline de apoio mobile */}
          <span className="absolute left-0 top-0 h-px w-full bg-hairline md:hidden" aria-hidden="true" />
          <div className="grid gap-12 md:grid-cols-3 md:gap-8">
            {PASSOS.map((p, i) => (
              <Step key={p.num} passo={p} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
