// Seção 1 — Hero "O Seneca em Camadas" (home.md §1).
// Pin 150vh: título reduz/desloca e o modelo separa camadas conforme o scroll.

import { lazy, Suspense, useRef } from 'react'
import { Link, useNavigate } from 'react-router'
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { useScramble } from '@/hooks/useScramble'
import HudBoot from './HudBoot'
import MiniGauge from './MiniGauge'
import HeroErrorBoundary from './HeroErrorBoundary'
import { asset } from '@/lib/asset'

const HeroCanvas = lazy(() => import('./HeroCanvas'))

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

export default function HeroSection() {
  const navigate = useNavigate()
  const sectionRef = useRef<HTMLElement>(null)
  const canvasScroll = useRef(0)
  const title = useScramble('PA-34', { duration: 800, delay: 1950 })

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    canvasScroll.current = v
  })
  const titleScale = useTransform(scrollYProgress, [0, 1], [1, 0.8])
  const titleX = useTransform(scrollYProgress, [0, 1], [0, -48])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0])

  return (
    <section ref={sectionRef} className="relative h-[160dvh]">
      <div className="sticky top-14 flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden">
        {/* fundo: hangar 18% + grid + vinheta */}
        <div className="absolute inset-0" aria-hidden="true">
          <img
            src={asset('/hangar-ambience.jpg')}
            alt=""
            className="h-full w-full object-cover opacity-[0.18] blur-[6px]"
            loading="eager"
          />
          <div className="blueprint-grid absolute inset-0" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgb(var(--c-abyss))_92%)]" />
        </div>

        {/* canvas 3D — centro-direita */}
        <div className="absolute inset-0 opacity-50 md:left-[44%] md:opacity-70 lg:left-[34%] lg:opacity-100">
          <HeroErrorBoundary>
            <Suspense fallback={null}>
              <HeroCanvas scrollRef={canvasScroll} onSelect={() => navigate('/modelo-3d')} assemblyDelay={1.9} />
            </Suspense>
          </HeroErrorBoundary>
        </div>

        {/* conteúdo — esquerda 40% */}
        <motion.div
          style={{ opacity: contentOpacity }}
          className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-1 items-center px-6 md:px-12"
        >
          <motion.div style={{ scale: titleScale, x: titleX }} className="max-w-xl origin-left">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.85 }}
              className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-cyan"
            >
              {'// MANUAL TÉCNICO INTERATIVO — SOP REV.13'}
            </motion.p>
            <h1 className="mt-5 font-display text-[56px] font-semibold leading-[0.95] tracking-[-0.03em] text-ink md:text-[96px]">
              {title}
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 2.15 }}
              className="mt-2 font-mono text-sm uppercase tracking-[0.3em] text-cyan"
            >
              Seneca I
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 2.3, ease: EASE }}
              className="mt-6 max-w-md text-[17px] leading-relaxed text-muted md:text-[19px]"
            >
              Desenho técnico interativo do bimotor Piper PA34-200. Remova camadas, explore sistemas,
              decore o painel — direto do SOP da VoeFloripa.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 2.5, ease: EASE }}
              className="mt-9 flex flex-wrap items-center gap-4"
            >
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.25 }}>
                <Link
                  to="/modelo-3d"
                  className="group inline-flex items-center gap-2.5 bg-cyan px-6 py-3.5 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-abyss transition-shadow duration-300 hover:shadow-[0_0_32px_rgb(var(--c-cyan) / 0.35)]"
                >
                  Explorar modelo 3D
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.25 }}>
                <Link
                  to="/cockpit"
                  className="inline-flex items-center gap-2.5 border border-hairline px-6 py-3.5 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-ink transition-colors duration-300 hover:bg-overlay hover:border-cyan-dim"
                >
                  Abrir cockpit 2D
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* instrument strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2.7, ease: EASE }}
          className="relative z-10 border-t border-hairline bg-panel/70 backdrop-blur-sm"
        >
          <div className="mx-auto grid max-w-[1600px] grid-cols-2 items-center gap-x-4 gap-y-4 px-6 py-4 md:grid-cols-4 md:px-12 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
            <MiniGauge label="RPM" value={2700} max={3000} ticks={6} redLineAt={2700} />
            <MiniGauge label="ASI · MPH" value={105} max={240} ticks={6} blueLineAt={105} redLineAt={217} />
            <MiniGauge label="MANIFOLD · IN HG" value={25.5} max={30} ticks={5} decimals={1} formatValue={(v) => v.toFixed(1).replace('.', ',')} />
            <MiniGauge label="SUCÇÃO · IN HG" value={5.0} max={10} ticks={5} decimals={1} formatValue={(v) => v.toFixed(1).replace('.', ',')} />
            <div className="hidden items-center gap-3 lg:flex" aria-hidden="true">
              <ChevronDown className="h-4 w-4 animate-bounce text-cyan" />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
                Role para abrir
                <br />
                o dossiê
              </span>
              <span className="block h-10 w-px overflow-hidden bg-hairline">
                <span className="block h-full w-full animate-scroll-line bg-cyan" />
              </span>
            </div>
          </div>
        </motion.div>

        <HudBoot />
      </div>
    </section>
  )
}
