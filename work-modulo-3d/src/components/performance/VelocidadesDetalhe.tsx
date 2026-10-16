// Seção 3 — Velocidades em detalhe (design/performance.md §3).
// Accordion exclusivo (1º aberto por padrão): VA, trem/flap, subida, VMC, estol.
// Conteúdo parseado de performance.md; definições da tabela 6.2.

import { useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Plus } from 'lucide-react'
import SectionHeader from '@/components/ui-custom/SectionHeader'
import SpecTable, { DataRow } from '@/components/ui-custom/SpecTable'
import CalloutBanner from '@/components/ui-custom/CalloutBanner'
import VSChip from '@/components/ui-custom/VSChip'
import { especificacoes } from '@/data'
import { ANCHORS, SEC, definitionOf, numOf } from './performance-data'
import { cn } from '@/lib/utils'

const v = especificacoes.velocidades_operacionais

// ---------------------------------------------------------------------------
// Peças visuais
// ---------------------------------------------------------------------------

/** Barra horizontal animada (scaleX) para comparativos de velocidade. */
function SpeedBar({ label, mph, max, color, delay = 0 }: { label: string; mph: number; max: number; color: string; delay?: number }) {
  return (
    <div className="py-2">
      <div className="flex items-baseline justify-between gap-3 font-mono">
        <span className="text-[11px] uppercase tracking-[0.16em] text-muted">{label}</span>
        <span className="text-[13px] text-ink">{mph} MPH</span>
      </div>
      <div className="mt-1.5 h-2.5 border border-hairline bg-panel">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(mph / max) * 100}%` }}
          transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
          className="h-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  )
}

/** Mini-gráfico VA × peso (draw-on) — dois pontos do SOP 06. */
function VaChart() {
  const W = 460
  const H = 190
  const PAD = { l: 44, r: 16, t: 14, b: 32 }
  const pesos = [2743, 4200]
  const vas = [v.VA_velocidade_de_manobra_peso_minimo_2743lbs_1244kg_mph, v.VA_velocidade_de_manobra_peso_maximo_4200lbs_1905kg_mph]
  const x = (lb: number) => PAD.l + ((lb - 2500) / (4400 - 2500)) * (W - PAD.l - PAD.r)
  const y = (mph: number) => PAD.t + (1 - (mph - 125) / (155 - 125)) * (H - PAD.t - PAD.b)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full max-w-[520px]" role="img" aria-label={`VA varia com o peso: ${vas[0]} MPH a 2.743 lb e ${vas[1]} MPH a 4.200 lb`}>
      <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} stroke="rgb(var(--c-faint))" strokeWidth="1" />
      <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="rgb(var(--c-faint))" strokeWidth="1" />
      {[130, 140, 150].map((mph) => (
        <g key={mph}>
          <line x1={PAD.l} y1={y(mph)} x2={W - PAD.r} y2={y(mph)} stroke="rgb(var(--c-hairline))" strokeDasharray="2 5" />
          <text x={PAD.l - 8} y={y(mph) + 3.5} textAnchor="end" fill="rgb(var(--c-faint))" fontSize="9.5" fontFamily="'IBM Plex Mono', monospace">
            {mph}
          </text>
        </g>
      ))}
      <motion.path
        d={`M ${x(pesos[0])} ${y(vas[0])} L ${x(pesos[1])} ${y(vas[1])}`}
        stroke="rgb(var(--c-cyan))"
        strokeWidth="1.8"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, delay: 0.3, ease: [0.7, 0, 0.2, 1] }}
      />
      {pesos.map((lb, i) => (
        <motion.g key={lb} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.25 }}>
          <circle cx={x(lb)} cy={y(vas[i])} r="4.5" fill="rgb(var(--c-panel))" stroke="rgb(var(--c-cyan))" strokeWidth="2" />
          <text x={x(lb)} y={y(vas[i]) - 12} textAnchor="middle" fill="rgb(var(--c-ink))" fontSize="11" fontFamily="'IBM Plex Mono', monospace">
            {vas[i]} MPH
          </text>
          <text x={x(lb)} y={H - PAD.b + 16} textAnchor="middle" fill="rgb(var(--c-faint))" fontSize="9.5" fontFamily="'IBM Plex Mono', monospace">
            {lb.toLocaleString('pt-BR')} lb
          </text>
        </motion.g>
      ))}
    </svg>
  )
}

function ChipLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 border border-hairline bg-panel px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-faint transition-colors duration-300 hover:border-cyan-dim hover:text-cyan"
    >
      {children} <ArrowRight className="h-3 w-3" aria-hidden="true" />
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Accordion exclusivo
// ---------------------------------------------------------------------------

interface ItemProps {
  id: string
  index: string
  title: string
  subtitle: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}

function AccordionItem({ id, index, title, subtitle, open, onToggle, children }: ItemProps) {
  return (
    <div id={id} className="scroll-mt-[180px] border border-hairline bg-raised">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors duration-300 hover:bg-overlay md:px-7"
      >
        <span className="font-mono text-[11px] text-faint">{index}</span>
        <span className="flex-1">
          <span className={cn('block font-display text-[17px] font-semibold transition-colors duration-300 md:text-lg', open ? 'text-cyan' : 'text-ink')}>
            {title}
          </span>
          <span className="mt-0.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{subtitle}</span>
        </span>
        <Plus
          className={cn('h-5 w-5 shrink-0 text-cyan transition-transform duration-300', open && 'rotate-45')}
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="border-t border-hairline px-5 py-6 md:px-7"
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------------------------

export default function VelocidadesDetalhe() {
  const [open, setOpen] = useState<string>(ANCHORS.va)
  const toggle = (id: string) => setOpen((cur) => (cur === id ? '' : id))

  const defVA = definitionOf('VA')
  const defVMC = definitionOf('VMC')
  const defVMCA = definitionOf('VMCA')

  return (
    <section className="bg-abyss py-[72px] md:py-[100px]">
      <div className="mx-auto max-w-content px-6 md:px-12">
        <SectionHeader
          kicker="// SEÇÃO 06 — VELOCIDADES EM DETALHE"
          title="O que cada V-speed significa"
          measure="SOP 06 · TABELAS 1–6"
        />

        <div className="mt-10 space-y-4">
          {/* 1 — VA */}
          <AccordionItem id={ANCHORS.va} index="06.1" title="VA — Velocidade de Manobra" subtitle="133–146 MPH conforme o peso" open={open === ANCHORS.va} onToggle={() => toggle(ANCHORS.va)}>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div>
                {defVA && <p className="text-[15px] leading-relaxed text-muted">{defVA}</p>}
                <div className="mt-5 flex flex-wrap gap-2">
                  <VSChip code="VA MÍN." value={`${SEC.va.tables[0]?.rows[0]?.value ?? ''}`} categoria="cautela" definicao={SEC.va.tables[0]?.rows[0]?.label} />
                  <VSChip code="VA MÁX." value={`${SEC.va.tables[0]?.rows[1]?.value ?? ''}`} categoria="cautela" definicao={SEC.va.tables[0]?.rows[1]?.label} />
                  <VSChip code="TURB." value={`${v.penetracao_em_ar_turbulento_mph} MPH`} categoria="cautela" definicao="Penetração em ar turbulento" />
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <ChipLink to="/especificacoes">Ver marcações</ChipLink>
                  <ChipLink to="/cockpit">Ver no ASI</ChipLink>
                </div>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">VA × peso — quanto maior o peso, maior a VA</p>
                <VaChart />
              </div>
            </div>
          </AccordionItem>

          {/* 2 — Trem de pouso & flap */}
          <AccordionItem id={ANCHORS.tremFlap} index="06.2" title="Trem de pouso & flap" subtitle="VLE · VLO · VFE" open={open === ANCHORS.tremFlap} onToggle={() => toggle(ANCHORS.tremFlap)}>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <SpecTable>
                {SEC.tremFlap.tables[0]?.rows.map((r) => (
                  <DataRow key={r.label} label={r.label} value={r.value} dot="amber" />
                ))}
              </SpecTable>
              <div>
                <p className="text-[15px] leading-relaxed text-muted">
                  {definitionOf('VLO') ?? ''}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <VSChip code="VLE" value={`${v.VLE_trem_baixado_e_VLO_down_mph} MPH`} categoria="cautela" definicao={definitionOf('VLE')} />
                  <VSChip code="VLO↓" value={`${v.VLE_trem_baixado_e_VLO_down_mph} MPH`} categoria="cautela" definicao="Estender o trem — VLO down" />
                  <VSChip code="VLO↑" value={`${v.VLO_up_mph} MPH`} categoria="cautela" definicao="Recolher o trem — VLO up" />
                  <VSChip code="VFE 10°" value={`${v.velocidade_maxima_com_flap_10_mph} MPH`} categoria="cautela" definicao={definitionOf('VFE')} />
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <ChipLink to="/especificacoes">Ver marcações</ChipLink>
                  <ChipLink to="/cockpit">Ver no ASI</ChipLink>
                </div>
              </div>
            </div>
          </AccordionItem>

          {/* 3 — Velocidades de subida */}
          <AccordionItem id={ANCHORS.subida} index="06.3" title="Velocidades de subida" subtitle="VX · VY · VYSE · rota" open={open === ANCHORS.subida} onToggle={() => toggle(ANCHORS.subida)}>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div>
                {SEC.subida.tables[0]?.rows.map((r, i) => (
                  <SpeedBar
                    key={r.label}
                    label={r.label}
                    mph={numOf(r.value)}
                    max={160}
                    color={r.label.includes('Monomotor') ? 'rgb(var(--c-blue))' : r.label.includes('Ângulo') ? 'rgb(var(--c-amber))' : 'rgb(var(--c-green))'}
                    delay={i * 0.12}
                  />
                ))}
              </div>
              <div>
                <p className="text-[15px] leading-relaxed text-muted">{definitionOf('Vyse') ?? ''}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <VSChip code="VX" value={`${v.melhor_angulo_de_subida_VX_mph} MPH`} categoria="normal" definicao={definitionOf('Vx')} />
                  <VSChip code="VY" value={`${v.melhor_razao_de_subida_VY_mph} MPH`} categoria="normal" definicao={definitionOf('Vy')} />
                  <VSChip code="VYSE" value={`${v.velocidade_de_subida_monomotor_VYSE_mph} MPH`} categoria="mono" definicao="Blue Line — linha azul no velocímetro" />
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <ChipLink to="/multimotor">Voo assimétrico</ChipLink>
                </div>
              </div>
            </div>
          </AccordionItem>

          {/* 4 — VMC */}
          <AccordionItem id={ANCHORS.vmc} index="06.4" title="VMC — Velocidade Mínima de Controle" subtitle="80 MPH · 90 MPH na instrução" open={open === ANCHORS.vmc} onToggle={() => toggle(ANCHORS.vmc)}>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div>
                <div className="flex items-end gap-6">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">VMC</p>
                    <p className="font-mono text-5xl font-semibold text-red md:text-6xl">
                      {v.VMC_velocidade_minima_de_controle_mph}
                      <span className="ml-2 text-base text-faint">MPH</span>
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">Durante a instrução</p>
                    <p className="font-mono text-3xl font-medium text-amber">
                      {v.VMC_durante_instrucao_mph}
                      <span className="ml-1.5 text-sm text-faint">MPH</span>
                    </p>
                  </div>
                </div>
                {defVMC && <p className="mt-5 text-[15px] leading-relaxed text-muted">{defVMC}</p>}
              </div>
              <div className="flex flex-col gap-5">
                <CalloutBanner variant="cuidado" title="Abaixo de VMC">
                  {defVMCA ?? ''}{' '}
                  <Link to="/multimotor" className="mt-2 inline-flex items-center gap-1 font-mono text-[13px] uppercase tracking-[0.1em] text-amber hover:underline">
                    Técnicas de voo assimétrico <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </CalloutBanner>
                <div className="flex flex-wrap gap-2">
                  <VSChip code="VMC" value={`${v.VMC_velocidade_minima_de_controle_mph} MPH`} categoria="critica" definicao="Radial vermelha no ASI" />
                  <VSChip code="VMCA" value={`${v.VMC_velocidade_minima_de_controle_mph} MPH`} categoria="critica" definicao={defVMCA} />
                </div>
              </div>
            </div>
          </AccordionItem>

          {/* 5 — Estol power-off */}
          <AccordionItem id={ANCHORS.estol} index="06.5" title="Estol power-off" subtitle="VS 76 · VS0 69 MPH" open={open === ANCHORS.estol} onToggle={() => toggle(ANCHORS.estol)}>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div>
                {SEC.estol.tables[0]?.rows.map((r, i) => (
                  <SpeedBar key={r.label} label={r.label} mph={numOf(r.value)} max={120} color={i === 0 ? 'rgb(var(--c-green))' : 'rgb(var(--c-ink))'} delay={i * 0.12} />
                ))}
                <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                  Limpo (verde) × configuração de pouso (branco)
                </p>
              </div>
              <div>
                <p className="text-[15px] leading-relaxed text-muted">{definitionOf('Vs') ?? ''}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <VSChip code="VS" value={`${v.estol_power_off_trem_e_flap_recolhidos_mph} MPH`} categoria="critica" definicao="Estol power-off — trem e flaps recolhidos (início do arco verde)" />
                  <VSChip code="VS0" value={`${v.estol_power_off_trem_e_flap_estendidos_mph} MPH`} categoria="critica" definicao="Estol power-off — trem e flaps estendidos (início do arco branco)" />
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <ChipLink to="/especificacoes">Ver marcações</ChipLink>
                  <ChipLink to="/cockpit">Ver no ASI</ChipLink>
                </div>
              </div>
            </div>
          </AccordionItem>
        </div>
      </div>
    </section>
  )
}
