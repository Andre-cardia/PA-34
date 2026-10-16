// Seção 3 — Motores & Hélice: "a dupla assimétrica" (design/especificacoes.md §3).
// Dois cards espelhados (IO-360 / LIO-360 contra-rotativo) com hélice girando
// em sentidos opostos, tacômetro duplo e bloco Hartzell + callout full-feathering.

import { memo, useRef } from 'react'
import { Link } from 'react-router'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, RotateCw, RotateCcw } from 'lucide-react'
import SectionHeader from '@/components/ui-custom/SectionHeader'
import SpecTable, { DataRow } from '@/components/ui-custom/SpecTable'
import CalloutBanner from '@/components/ui-custom/CalloutBanner'
import { CornerScrews } from '@/components/assets/PanelScrews'
import { especificacoes } from '@/data'
import { cn } from '@/lib/utils'
import TacometroDuplo from './TacometroDuplo'

const m = especificacoes.motores
const h = especificacoes.helice

// Loop infinito isolado em micro-componente memoizado (react-dev.md §Animation).
const Propeller = memo(function Propeller({ reverse, spinning }: { reverse?: boolean; spinning: boolean }) {
  return (
    <div className="relative h-20 w-20 shrink-0" aria-hidden="true">
      <style>{`@keyframes prop-spin { to { transform: rotate(360deg) } }`}</style>
      <svg viewBox="0 0 80 80" className="h-full w-full">
        <g
          style={{
            transformBox: 'fill-box',
            transformOrigin: 'center',
            animation: spinning ? `prop-spin 3s linear infinite ${reverse ? 'reverse' : 'normal'}` : 'none',
          }}
        >
          <ellipse cx="40" cy="19" rx="6" ry="17" fill="rgb(var(--c-overlay))" stroke="rgb(var(--c-cyan))" strokeWidth="1.2" />
          <ellipse cx="40" cy="61" rx="6" ry="17" fill="rgb(var(--c-overlay))" stroke="rgb(var(--c-cyan))" strokeWidth="1.2" />
        </g>
        <circle cx="40" cy="40" r="8" fill="rgb(var(--c-panel))" stroke="rgb(var(--c-muted))" strokeWidth="1.4" />
        <circle cx="40" cy="40" r="2.2" fill="rgb(var(--c-faint))" />
      </svg>
      {/* disco da hélice */}
      <span className="pointer-events-none absolute inset-0 rounded-full border border-dashed border-cyan-dim/60" />
    </div>
  )
})

function EngineCard({
  side,
  model,
  reverse,
  badge,
  delay,
}: {
  side: string
  model: string
  reverse?: boolean
  badge?: string
  delay: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-12% 0px' })
  const RotIcon = reverse ? RotateCcw : RotateCw

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className="relative border border-hairline bg-raised p-6 md:p-7"
    >
      <CornerScrews />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">{side}</p>
          <h3 className="mt-2 font-display text-xl font-semibold text-ink md:text-2xl">
            LYCOMING <span className="text-cyan">{model}</span>
          </h3>
          {badge && (
            <span className="mt-3 inline-flex items-center gap-1.5 border border-amber/50 bg-amber/[0.08] px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-amber">
              <span className="h-1.5 w-1.5 rounded-full bg-amber" aria-hidden="true" />
              {badge}
            </span>
          )}
        </div>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={inView ? { scale: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.5, delay: delay + 0.2 }}
          className="flex flex-col items-center gap-1.5"
        >
          <Propeller reverse={reverse} spinning={inView} />
          <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
            <RotIcon className="h-3 w-3" aria-hidden="true" />
            {reverse ? 'anti-horário' : 'horário'}
          </span>
        </motion.div>
      </div>

      <SpecTable className="mt-6">
        <DataRow label="Potência" value={m.potencia} dot="red" />
        <DataRow label="Rotação máxima" value={`${m.rotacao_maxima_rpm} RPM`} dot="red" />
        <DataRow label="Pressão de admissão" value={m.pressao_admissao} />
        <DataRow label="Consumo horário" value={m.consumo_horario} />
      </SpecTable>
    </motion.div>
  )
}

export default function MotoresHelice() {
  return (
    <section className="border-t border-hairline bg-panel py-[72px] md:py-[120px]">
      <div className="mx-auto max-w-content px-6 md:px-12">
        <SectionHeader
          kicker="// SEÇÃO 5.1 — MOTORES & HÉLICE"
          title="A dupla assimétrica"
          measure="2× 200 HP · 2700 RPM"
        />

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <EngineCard side="Motor esquerdo" model={m.modelo_motor_esquerdo} delay={0} />
          <EngineCard side="Motor direito" model={m.modelo_motor_direito} reverse badge="Contra-rotativo" delay={0.12} />
        </div>

        <p className="mx-auto mt-6 max-w-3xl text-center text-[14px] leading-relaxed text-muted">
          {m.tipo}
        </p>

        <TacometroDuplo />

        {/* bloco hélice */}
        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative border border-hairline bg-raised p-6 md:p-7"
          >
            <CornerScrews />
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">Hélices</p>
            <h3 className="mt-2 font-display text-xl font-semibold text-ink md:text-2xl">
              HARTZELL <span className="text-cyan">VELOCIDADE CONSTANTE</span>
            </h3>
            <SpecTable className="mt-6">
              <DataRow label="Fabricante / modelos" value={h.fabricantes} />
              <DataRow label="Tipo" value={h.tipo} />
              <DataRow label="Número de pás" value={h.numero_de_pas} />
              <DataRow label="Diâmetro" value={`${h.diametro_maximo_pol}–${h.diametro_minimo_pol} pol`} />
            </SpecTable>
          </motion.div>

          <div className="flex flex-col justify-center gap-5">
            <CalloutBanner variant="nota" title="FULL-FEATHERING">
              Hélices full-feathering — base do voo assimétrico seguro (ver SOP 11).{' '}
              <Link to="/multimotor" className="inline-flex items-center gap-1 font-mono text-[13px] uppercase tracking-[0.1em] text-cyan hover:underline">
                Técnicas multimotor <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </CalloutBanner>
            <p className={cn('text-[14px] leading-relaxed text-muted')}>
              O motor direito ({m.modelo_motor_direito}) é contra-rotativo: gira em sentido
              oposto ao esquerdo ({m.modelo_motor_esquerdo}). Potência de {m.potencia} por
              motor, com rotação máxima de {m.rotacao_maxima_rpm} RPM (SOP 5.1).
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
