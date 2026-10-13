// Seção 5 — Blueprint draw-on (home.md §5): traço das 3 vistas por scrub,
// cotas e labels ao final; textos de intro_generalidades.md à direita.

import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import PA34ThreeView from '@/components/assets/PA34ThreeView'
import { cn } from '@/lib/utils'

type Part = 'helice' | 'trem' | 'tanques'

const LABELS: { part: Part; text: string; pos: string }[] = [
  { part: 'helice', text: 'HÉLICE HARTZELL BIPÁ', pos: 'left-[6%] top-[24%]' },
  { part: 'tanques', text: 'TANQUES ALARES 2×2', pos: 'left-[2%] top-[52%]' },
  { part: 'trem', text: 'TREM TRICICLO RETRÁTIL', pos: 'left-[16%] top-[78%]' },
]

// Parágrafos destilados de src/data/intro_generalidades.md (SOP 01–05)
const PARAGRAPHOS = [
  'O Piper PA34-200 Seneca I é uma aeronave bimotora, monoplano de asa baixa, inteiramente metálica, equipada com trem de pouso retrátil e certificada para até seis ocupantes — a plataforma de treinamento multimotor e IFR da VoeFloripa.',
  'Este dossiê é o Flight Standards Manual da escola disposto em camadas: cada sistema, procedimento e emergência segue a numeração original do SOP Rev. 13, do preflight ao shutdown.',
  'Os manuais e recomendações não substituem o bom julgamento do piloto. Material de estudo — usar sempre em conjunto com o POH da aeronave.',
]

export default function BlueprintSection() {
  const ref = useRef<HTMLElement>(null)
  const [glow, setGlow] = useState<Part | null>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.6 })
  const labelOpacity = useTransform(progress, [0.85, 1], [0, 1])

  return (
    <section ref={ref} className="relative h-[175dvh] border-b border-hairline bg-panel">
      <div className="sticky top-14 flex min-h-[calc(100dvh-3.5rem)] items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-[1600px] items-center gap-10 px-6 py-16 md:px-12 lg:grid-cols-[1.55fr_1fr]">
          {/* desenho */}
          <div className="relative">
            <p className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.22em] text-cyan">
              {'// VISTA 3 FACES — ESCALA BLUEPRINT'}
            </p>
            <PA34ThreeView progress={progress} glow={glow} className="w-full" />
            {/* labels interativas */}
            <motion.div style={{ opacity: labelOpacity }}>
              {LABELS.map((l) => (
                <button
                  key={l.part}
                  type="button"
                  onMouseEnter={() => setGlow(l.part)}
                  onMouseLeave={() => setGlow(null)}
                  onFocus={() => setGlow(l.part)}
                  onBlur={() => setGlow(null)}
                  className={cn(
                    'absolute flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors duration-300',
                    l.pos,
                    glow === l.part ? 'text-cyan' : 'text-faint hover:text-muted',
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rotate-45 border', glow === l.part ? 'border-cyan bg-cyan/40' : 'border-faint')} aria-hidden="true" />
                  {l.text}
                </button>
              ))}
            </motion.div>
          </div>
          {/* texto */}
          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-cyan">{'// A AERONAVE'}</p>
            <h2 className="mt-3 font-display text-[28px] font-semibold tracking-[-0.01em] text-ink md:text-[36px]">
              Bimotor de escola, dossier de engenharia.
            </h2>
            <div className="mt-6 space-y-5">
              {PARAGRAPHOS.map((p, i) => (
                <motion.p
                  key={p.slice(0, 24)}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-10% 0px' }}
                  transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className="text-[15px] leading-relaxed text-muted"
                >
                  {p}
                </motion.p>
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link
                to="/especificacoes"
                className="group mt-8 inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-cyan"
              >
                Ler generalidades
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
