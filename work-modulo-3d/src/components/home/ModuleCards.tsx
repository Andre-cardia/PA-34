// Seção 3 — Os dois módulos (home.md §3): cards gigantes interativos.
// Card A: layer stack 2.5D com as 9 lâminas (dados de componentes_3d.json).
// Card B: recorte SVG do six-pack com hotspots pulsando + cockpit-ref.jpg 15%.

import { useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { camadas3d, counts } from '@/data'
import { CornerScrews } from '@/components/assets/PanelScrews'

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

// ---------------------------------------------------------------------------
// Card A — layer stack
// ---------------------------------------------------------------------------

function LayerStack({ active }: { active: boolean }) {
  return (
    <div className="relative flex h-full items-center justify-center" style={{ perspective: '1100px' }} aria-hidden="true">
      <div
        className="relative h-56 w-72 transition-transform duration-700 ease-out-expo"
        style={{ transformStyle: 'preserve-3d', transform: 'rotateX(58deg) rotateZ(-42deg)' }}
      >
        {camadas3d.map((c, i) => {
          const z = active ? i * 26 : i * 9
          return (
            <div
              key={c.id}
              className="absolute inset-0 border transition-all duration-500"
              style={{
                transform: `translateZ(${z}px)`,
                transitionTimingFunction: 'cubic-bezier(0.7, 0, 0.2, 1)',
                borderColor: active ? 'rgb(var(--c-cyan) / 0.55)' : 'rgb(var(--c-hairline))',
                backgroundColor: i === camadas3d.length - 1 ? 'rgb(var(--c-cyan) / 0.06)' : 'rgb(var(--c-raised) / 0.72)',
              }}
            >
              <span
                className="absolute -left-2 top-1/2 -translate-y-1/2 font-mono text-[9px] uppercase tracking-[0.18em]"
                style={{
                  color: active ? 'rgb(var(--c-cyan))' : 'rgb(var(--c-faint))',
                  transform: `translateY(-50%) rotateZ(42deg) rotateX(-58deg)`,
                  transformOrigin: 'right center',
                  whiteSpace: 'nowrap',
                  right: '105%',
                  left: 'auto',
                }}
              >
                {String(i + 1).padStart(2, '0')} {c.nome}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Card B — six-pack snippet com hotspots
// ---------------------------------------------------------------------------

function SixPack() {
  const instruments = ['ASI', 'AH', 'ALT', 'TC', 'DG', 'VSI']
  return (
    <div className="relative flex h-full items-center justify-center" aria-hidden="true">
      <img src="/cockpit-ref.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.15]" loading="lazy" />
      <div className="relative grid grid-cols-3 gap-4">
        {instruments.map((n, i) => (
          <div key={n} className="relative">
            <svg viewBox="0 0 80 80" className="h-20 w-20 md:h-24 md:w-24">
              <circle cx="40" cy="40" r="36" fill="rgb(var(--c-panel))" stroke="rgb(var(--c-hairline))" strokeWidth="2" />
              {Array.from({ length: 12 }).map((_, t) => {
                const a = (t / 12) * Math.PI * 2
                return (
                  <line
                    key={t}
                    x1={40 + 30 * Math.cos(a)}
                    y1={40 + 30 * Math.sin(a)}
                    x2={40 + 34 * Math.cos(a)}
                    y2={40 + 34 * Math.sin(a)}
                    stroke="rgb(var(--c-faint))"
                    strokeWidth="1"
                  />
                )
              })}
              <line x1="40" y1="40" x2={40 + 20 * Math.cos(i)} y2={40 + 20 * Math.sin(i)} stroke="rgb(var(--c-ink))" strokeWidth="1.6" />
              <circle cx="40" cy="40" r="2.5" fill="rgb(var(--c-overlay))" stroke="rgb(var(--c-faint))" strokeWidth="1" />
              <text x="40" y="62" textAnchor="middle" fill="rgb(var(--c-faint))" fontSize="9" fontFamily="'IBM Plex Mono', monospace">
                {n}
              </text>
            </svg>
            {(i === 1 || i === 4) && (
              <>
                <span className="absolute inset-0 m-auto h-10 w-10 rounded-full border border-cyan animate-hotspot-pulse" />
                <span className="absolute inset-0 m-auto h-2 w-2 rounded-full bg-cyan" />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

interface CardProps {
  to: string
  kicker: string
  title: string
  body: string
  chips: string[]
  children: React.ReactNode
  index: number
  onHoverChange?: (h: boolean) => void
}

function ModuleCard({ to, kicker, title, body, chips, children, index, onHoverChange }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, clipPath: 'inset(0 0 100% 0)' }}
      whileInView={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' }}
      viewport={{ once: true, margin: '-15% 0px' }}
      transition={{ duration: 0.9, delay: index * 0.15, ease: EASE }}
    >
      <Link
        to={to}
        onMouseEnter={() => onHoverChange?.(true)}
        onMouseLeave={() => onHoverChange?.(false)}
        className="group relative flex min-h-[70dvh] flex-col overflow-hidden border border-hairline bg-panel transition-colors duration-500 hover:border-cyan-dim"
      >
        <CornerScrews />
        <div className="relative h-[38dvh] border-b border-hairline bg-abyss/40">{children}</div>
        <div className="flex flex-1 flex-col p-7 md:p-9">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 + index * 0.15 }}
            className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-cyan"
          >
            {kicker}
          </motion.p>
          <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink md:text-[28px]">{title}</h3>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">{body}</p>
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-8">
            {chips.map((c) => (
              <span key={c} className="border border-hairline px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-faint transition-colors group-hover:border-cyan-dim group-hover:text-muted">
                {c}
              </span>
            ))}
            <ArrowRight className="ml-auto h-5 w-5 text-cyan transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden="true" />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function ModuleCards() {
  const [hoverA, setHoverA] = useState(false)
  return (
    <section className="border-b border-hairline bg-abyss py-[72px] md:py-[120px]">
      <div className="mx-auto grid max-w-content gap-6 px-6 md:px-12 lg:grid-cols-2">
        <ModuleCard
          to="/modelo-3d"
          kicker="MÓDULO 01"
          title="Exploda a aeronave, camada por camada"
          body="9 camadas removíveis — da carenagem ao sistema de vácuo. Clique em qualquer componente para ver função, operação e limites."
          chips={[`${counts.camadas3d} CAMADAS`, `≈${counts.componentes3d} COMPONENTES`, 'RAYCAST PICKING']}
          index={0}
          onHoverChange={setHoverA}
        >
          <LayerStack active={hoverA} />
        </ModuleCard>
        <ModuleCard
          to="/cockpit"
          kicker="MÓDULO 02"
          title="Cada instrumento, com seu box de descrição"
          body="56 instrumentos e controles mapeados no painel. Passe o mouse, aproxime, clique — e entenda o que cada um faz em voo."
          chips={[`${counts.instrumentos} HOTSPOTS`, '7 CATEGORIAS', 'ZOOM/PAN']}
          index={1}
        >
          <SixPack />
        </ModuleCard>
      </div>
    </section>
  )
}
