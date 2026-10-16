// Seção 4 — Capacidades & Fluidos (design/especificacoes.md §4).
// 3 colunas: combustível (4 tanques SVG com nível animado + pressão), lubrificação
// & óleo (faixas de arco horizontais), temperatura de cilindro (CHT).

import { useRef } from 'react'
import { useNavigate } from 'react-router'
import { motion, useInView } from 'framer-motion'
import { ArrowUpRight, Droplet, Fuel, Thermometer } from 'lucide-react'
import SectionHeader from '@/components/ui-custom/SectionHeader'
import SpecTable, { DataRow } from '@/components/ui-custom/SpecTable'
import CalloutBanner from '@/components/ui-custom/CalloutBanner'
import { CornerScrews } from '@/components/assets/PanelScrews'
import { especificacoes } from '@/data'
import ArcoFaixa from './ArcoFaixa'
import { parseRange } from './gauge'

const c = especificacoes.combustivel
const lub = especificacoes.lubrificacao
const tOleo = especificacoes.temperatura_oleo
const pOleo = especificacoes.pressao_oleo
const cht = especificacoes.temperatura_cilindro

// Faixas do SOP (parseadas das strings do JSON)
const FUEL_VERDE = parseRange(c.pressao_combustivel.faixa_verde) // 14–35 PSI
const OLEO_TEMP_VERDE = parseRange(tOleo.faixa_verde_operacao_normal) // 75–245 °F
const OLEO_PRESS_VERDE = parseRange(pOleo.faixa_verde) // 60–90 PSI
const OLEO_PRESS_AMBAR = parseRange(pOleo.faixa_amarela) // 25–60 PSI
const CHT_VERDE = parseRange(cht.faixa_verde) // 200–475 °F

const FUEL_RED_MIN = Number(c.pressao_combustivel.linha_vermelha_minima.match(/\d+/)?.[0] ?? 0)
const FUEL_RED_MAX = Number(c.pressao_combustivel.linha_vermelha_maxima.match(/\d+/)?.[0] ?? 0)
const OLEO_TEMP_RED = Number(tOleo.faixa_vermelha_limite_maximo.match(/\d+/)?.[0] ?? 0)
const OLEO_PRESS_RED_INF = Number(pOleo.faixa_vermelha_inferior.match(/\d+/)?.[0] ?? 0)
const OLEO_PRESS_RED_SUP = Number(pOleo.faixa_vermelha_superior.match(/\d+/)?.[0] ?? 0)
const CHT_RED = Number(cht.linha_vermelha.match(/\d+/)?.[0] ?? 0)

// Nível utilizável/total em galões (parseado das strings do JSON: "… (98 US gal)")
const galOf = (s: string) => Number(s.match(/\((\d+)\s*US gal\)/)?.[1] ?? 0)
const GAL_TOTAL = galOf(c.capacidade_total)
const GAL_UTIL = galOf(c.utilizavel_total)
const NIVEL = GAL_TOTAL ? GAL_UTIL / GAL_TOTAL : 0

const TANKS = [
  { id: 'T1', x: 22, wing: 'esq' },
  { id: 'T2', x: 72, wing: 'esq' },
  { id: 'T3', x: 208, wing: 'dir' },
  { id: 'T4', x: 258, wing: 'dir' },
] as const

function TankDiagram() {
  const navigate = useNavigate()
  const ref = useRef<HTMLButtonElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })
  const TY = 26
  const TH = 92
  const TW = 40

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => navigate('/modelo-3d?camada=combustivel')}
      className="group/tanks block w-full text-left"
      aria-label="Diagrama dos tanques de combustível — abrir no modelo 3D"
    >
      <svg viewBox="0 0 320 150" className="w-full" role="img" aria-label="Quatro tanques, dois por asa; nível utilizável 93 de 98 galões">
        {/* fuselagem */}
        <rect x="146" y="10" width="28" height="118" fill="none" stroke="rgb(var(--c-hairline))" strokeWidth="1.2" />
        <line x1="160" y1="10" x2="160" y2="128" stroke="rgb(var(--c-hairline))" strokeWidth="1" strokeDasharray="3 4" />
        {/* asas */}
        <line x1="8" y1="70" x2="146" y2="70" stroke="rgb(var(--c-cyan-dim))" strokeWidth="1" strokeDasharray="2 5" />
        <line x1="174" y1="70" x2="312" y2="70" stroke="rgb(var(--c-cyan-dim))" strokeWidth="1" strokeDasharray="2 5" />
        {TANKS.map((t, i) => {
          const fillH = TH * NIVEL
          return (
            <g key={t.id}>
              <rect
                x={t.x}
                y={TY}
                width={TW}
                height={TH}
                fill="rgb(var(--c-panel))"
                stroke="rgb(var(--c-cyan))"
                strokeWidth="1.2"
                className="transition-[filter] duration-300 group-hover/tanks:[filter:drop-shadow(0_0_6px_rgb(var(--c-cyan)_/_0.5))]"
              />
              {/* nível */}
              <clipPath id={`tank-${t.id}`}>
                <rect x={t.x} y={TY} width={TW} height={TH} />
              </clipPath>
              <motion.rect
                x={t.x + 2}
                width={TW - 4}
                fill="rgb(var(--c-cyan-dim))"
                clipPath={`url(#tank-${t.id})`}
                initial={{ y: TY + TH - 2, height: 0 }}
                animate={inView ? { y: TY + TH - fillH, height: fillH } : undefined}
                transition={{ duration: 1.3, delay: 0.25 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              />
              {/* linha do nível utilizável */}
              <motion.line
                x1={t.x + 2}
                x2={t.x + TW - 2}
                stroke="rgb(var(--c-cyan))"
                strokeWidth="1.4"
                initial={{ y1: TY + TH - 2, y2: TY + TH - 2, opacity: 0 }}
                animate={inView ? { y1: TY + TH - fillH, y2: TY + TH - fillH, opacity: 1 } : undefined}
                transition={{ duration: 1.3, delay: 0.25 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              />
              <text x={t.x + TW / 2} y={TY + TH + 14} textAnchor="middle" fill="rgb(var(--c-faint))" fontSize="9" fontFamily="'IBM Plex Mono', monospace">
                {t.id}
              </text>
            </g>
          )
        })}
        {/* linha do 100% */}
        <line x1="14" y1={TY} x2="306" y2={TY} stroke="rgb(var(--c-faint))" strokeWidth="1" strokeDasharray="2 4" />
        <text x="312" y={TY - 6} fill="rgb(var(--c-faint))" fontSize="8.5" fontFamily="'IBM Plex Mono', monospace" textAnchor="end">
          {GAL_TOTAL} GAL
        </text>
        <text x="160" y="146" textAnchor="middle" fill="rgb(var(--c-muted))" fontSize="10" fontFamily="'IBM Plex Mono', monospace" letterSpacing="2">
          {`UTILIZÁVEL ${GAL_UTIL} GAL · 2 TANQUES POR ASA`}
        </text>
      </svg>
      <span className="mt-2 flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-faint transition-colors group-hover/tanks:text-cyan">
        Ver no modelo 3D <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
      </span>
    </button>
  )
}

function ColCard({ icon, title, children, delay = 0 }: { icon: React.ReactNode; title: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col border border-hairline bg-raised p-6 md:p-7"
    >
      <CornerScrews />
      <div className="flex items-center gap-2.5">
        <span className="text-cyan" aria-hidden="true">{icon}</span>
        <h3 className="font-display text-lg font-semibold text-ink md:text-xl">{title}</h3>
      </div>
      {children}
    </motion.div>
  )
}

export default function CapacidadesFluidos() {
  return (
    <section className="border-t border-hairline bg-abyss py-[72px] md:py-[120px]">
      <div className="mx-auto max-w-content px-6 md:px-12">
        <SectionHeader
          kicker="// SEÇÃO 5.1 — CAPACIDADES & FLUIDOS"
          title="Combustível, óleo & temperaturas"
          measure="98 US GAL · AVGAS 100LL"
        />

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* combustível */}
          <ColCard icon={<Fuel className="h-5 w-5" strokeWidth={1.75} />} title="Combustível">
            <div className="mt-5">
              <TankDiagram />
            </div>
            <SpecTable className="mt-5">
              <DataRow label="Capacidade total" value={c.capacidade_total} />
              <DataRow label="Por tanque" value={c.capacidade_por_tanque} />
              <DataRow label="Utilizável total" value={c.utilizavel_total} dot="green" />
              <DataRow label="Não utilizável" value={c.nao_utilizavel} dot="amber" />
              <DataRow label="Tipo" value={c.tipo} dot="blue" />
              <DataRow label="Consumo 65% pot." value={c.consumo_65_pct_potencia} />
            </SpecTable>
            <ArcoFaixa
              label="Pressão de combustível"
              unit="PSI"
              scale={[0, 40]}
              segments={[{ from: FUEL_VERDE[0], to: FUEL_VERDE[1], color: 'green', label: `Operação normal — ${c.pressao_combustivel.faixa_verde}` }]}
              lines={[
                { at: FUEL_RED_MIN, label: 'mín' },
                { at: FUEL_RED_MAX, label: 'máx' },
              ]}
              delay={0.1}
            />
            <CalloutBanner variant="nota" className="mt-5">
              {c.nota}
            </CalloutBanner>
          </ColCard>

          {/* lubrificação & óleo */}
          <ColCard icon={<Droplet className="h-5 w-5" strokeWidth={1.75} />} title="Lubrificação & óleo" delay={0.08}>
            <SpecTable className="mt-5">
              <DataRow label="Capacidade total" value={lub.capacidade_total_oleo} />
              <DataRow label="Mínimo operacional" value={lub.quantidade_minima_operacional} dot="amber" />
              <DataRow label="Tipo de óleo" value={lub.tipo_de_oleo} />
            </SpecTable>
            <div className="mt-4 divide-y divide-hairline/60 border-t border-hairline">
              <ArcoFaixa
                label="Temperatura do óleo"
                unit="°F"
                scale={[0, 260]}
                segments={[{ from: OLEO_TEMP_VERDE[0], to: OLEO_TEMP_VERDE[1], color: 'green', label: `Operação normal — ${tOleo.faixa_verde_operacao_normal}` }]}
                lines={[{ at: OLEO_TEMP_RED, label: 'máx' }]}
                delay={0.15}
              />
              <ArcoFaixa
                label="Pressão do óleo"
                unit="PSI"
                scale={[0, 100]}
                segments={[
                  { from: 0, to: OLEO_PRESS_AMBAR[0], color: 'red', label: `Abaixo de ${pOleo.faixa_vermelha_inferior} — linha vermelha inferior` },
                  { from: OLEO_PRESS_AMBAR[0], to: OLEO_PRESS_AMBAR[1], color: 'amber', label: `Cautela — ${pOleo.faixa_amarela}` },
                  { from: OLEO_PRESS_VERDE[0], to: OLEO_PRESS_VERDE[1], color: 'green', label: `Operação normal — ${pOleo.faixa_verde}` },
                  { from: OLEO_PRESS_VERDE[1], to: 100, color: 'red', label: `Acima de ${pOleo.faixa_vermelha_superior} — linha vermelha superior` },
                ]}
                lines={[
                  { at: OLEO_PRESS_RED_INF, label: 'mín' },
                  { at: OLEO_PRESS_RED_SUP, label: 'máx' },
                ]}
                delay={0.25}
              />
            </div>
            <SpecTable className="mt-auto pt-5">
              <DataRow label="Pressão mín./máx." value={`${lub.pressao_minima_oleo} / ${lub.pressao_maxima_oleo}`} dot="red" />
              <DataRow label="Temperatura máx." value={lub.temperatura_maxima_oleo} dot="red" />
            </SpecTable>
          </ColCard>

          {/* CHT */}
          <ColCard icon={<Thermometer className="h-5 w-5" strokeWidth={1.75} />} title="Temperatura de cilindro" delay={0.16}>
            <p className="mt-5 text-[14px] leading-relaxed text-muted">
              Faixas de temperatura do cabeçote (CHT) conforme o SOP 5.1 — motores de
              4 cilindros opostos horizontalmente, refrigerados a ar.
            </p>
            <div className="mt-4 border-t border-hairline">
              <ArcoFaixa
                label="CHT"
                unit="°F"
                scale={[0, 500]}
                segments={[{ from: CHT_VERDE[0], to: CHT_VERDE[1], color: 'green', label: `Operação normal — ${cht.faixa_verde}` }]}
                lines={[{ at: CHT_RED, label: 'máx' }]}
                delay={0.2}
              />
            </div>
            <SpecTable className="mt-auto pt-5">
              <DataRow label="Faixa verde" value={cht.faixa_verde} dot="green" />
              <DataRow label="Linha vermelha" value={cht.linha_vermelha} dot="red" />
            </SpecTable>
          </ColCard>
        </div>
      </div>
    </section>
  )
}
