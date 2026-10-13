// Seção 6 — Marcações do velocímetro & velocidades operacionais
// (design/especificacoes.md §6). ASI gigante em SVG fiel a marcas_do_velocimetro:
// arco branco 69–125, verde 76–190, amarelo 190–217, radiais vermelhas 217 (VNE)
// e 80 (VMC), linha azul 105 (VYSE). VSchips clicáveis posicionados no anel do
// mostrador — clique move a agulha (tween 0.6s) e acende a faixa correspondente.

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import SectionHeader from '@/components/ui-custom/SectionHeader'
import VSChip from '@/components/ui-custom/VSChip'
import { especificacoes } from '@/data'
import { cn } from '@/lib/utils'
import { arcPath, parseRange, polarToXY, valueToAngle } from './gauge'

const marcas = especificacoes.marcas_do_velocimetro
const v = especificacoes.velocidades_operacionais

// Faixas reais do ASI (parse das strings do JSON)
const BRANCO = parseRange(marcas.arco_branco_operacao_com_flap) // 69–125
const VERDE = parseRange(marcas.arco_verde_operacao_normal) // 76–190
const AMARELO = parseRange(marcas.arco_amarelo_operacao_em_ar_calmo) // 190–217
const VNE = marcas.linha_radial_vermelha_VNE_mph // 217
const VMC = marcas.linha_radial_vermelha_VMC_mph // 80
const VYSE = marcas.linha_radial_azul_VYSE_mph // 105

// Geometria do mostrador
const CX = 280
const CY = 250
const R_ARC = 196
const V_MIN = 40
const V_MAX = 230
const A0 = -135
const SWEEP = 270
const angle = (mph: number) => valueToAngle(mph, V_MIN, V_MAX, A0, SWEEP)

type Cat = 'critica' | 'mono' | 'normal' | 'cautela'

interface VSpeed {
  code: string
  mph: number
  cat: Cat
  def: string
  ring?: boolean
  ringBoost?: number // desloca o chip no anel (sobreposições)
}

const VSPEEDS: VSpeed[] = [
  { code: 'VS0', mph: v.estol_power_off_trem_e_flap_estendidos_mph, cat: 'critica', def: 'Estol power-off — trem e flaps estendidos', ring: true },
  { code: 'VS', mph: v.estol_power_off_trem_e_flap_recolhidos_mph, cat: 'critica', def: 'Estol power-off — trem e flaps recolhidos', ring: true },
  { code: 'VMC', mph: v.VMC_velocidade_minima_de_controle_mph, cat: 'critica', def: 'Velocidade mínima de controle — radial vermelha', ring: true },
  { code: 'VX', mph: v.melhor_angulo_de_subida_VX_mph, cat: 'normal', def: 'Melhor ângulo de subida', ring: true },
  { code: 'VY', mph: v.melhor_razao_de_subida_VY_mph, cat: 'normal', def: 'Melhor razão de subida', ring: true, ringBoost: -14 },
  { code: 'VYSE', mph: v.velocidade_de_subida_monomotor_VYSE_mph, cat: 'mono', def: 'Melhor razão de subida monomotor — linha azul', ring: true },
  { code: 'VR', mph: v.VR_rotacao_padrao_VFL_todos_os_pesos_mph, cat: 'normal', def: 'Rotação padrão VFL — todos os pesos', ring: true, ringBoost: 14 },
  { code: 'VFE', mph: v.velocidade_maxima_com_flap_10_mph, cat: 'cautela', def: 'Velocidade máxima com flap 10° — topo do arco branco', ring: true },
  { code: 'VA', mph: v.VA_velocidade_de_manobra_peso_maximo_4200lbs_1905kg_mph, cat: 'cautela', def: 'Velocidade de manobra — peso máx. 4.200 lb', ring: true, ringBoost: -12 },
  { code: 'VLE', mph: v.VLE_trem_baixado_e_VLO_down_mph, cat: 'cautela', def: 'Trem baixado e VLO down', ring: true, ringBoost: 10 },
  { code: 'VNO', mph: v.velocidade_maxima_de_cruzeiro_mph, cat: 'cautela', def: 'Velocidade máxima de cruzeiro — topo do arco verde', ring: true },
  { code: 'VNE', mph: v.VNE_velocidade_nunca_exceder_mph, cat: 'critica', def: 'Velocidade nunca exceder — radial vermelha', ring: true },
]

const EXTRA: VSpeed[] = [
  { code: 'VMC INST.', mph: v.VMC_durante_instrucao_mph, cat: 'critica', def: 'VMC durante a instrução' },
  { code: 'VA MÍN.', mph: v.VA_velocidade_de_manobra_peso_minimo_2743lbs_1244kg_mph, cat: 'cautela', def: 'Velocidade de manobra — peso mín. 2.743 lb' },
  { code: 'TURB.', mph: v.penetracao_em_ar_turbulento_mph, cat: 'cautela', def: 'Penetração em ar turbulento' },
  { code: 'VLO UP', mph: v.VLO_up_mph, cat: 'cautela', def: 'Velocidade máx. para recolher o trem' },
  { code: 'ROTA', mph: v.subida_em_rota_mph, cat: 'normal', def: 'Subida em rota' },
  { code: 'CRZ 75% MSL', mph: v.velocidade_de_cruzeiro_75_pct_MSL_mph, cat: 'normal', def: 'Cruzeiro 75% ao nível do mar' },
  { code: 'CRZ 75% FL060', mph: v.cruzeiro_75_pct_a_6000ft_mph, cat: 'normal', def: 'Cruzeiro 75% a 6.000 ft' },
  { code: 'CRZ 65% FL090', mph: v.cruzeiro_otimo_65_pct_a_9000ft_mph, cat: 'normal', def: 'Cruzeiro ótimo 65% a 9.000 ft' },
]

function bandOf(mph: number): 'branco' | 'verde' | 'amarelo' | 'red' | null {
  if (mph >= VNE) return 'red'
  if (mph >= AMARELO[0]) return 'amarelo'
  if (mph <= BRANCO[1]) return 'branco'
  if (mph >= VERDE[0]) return 'verde'
  return null
}

const MAJORS = [40, 60, 80, 100, 120, 140, 160, 180, 200, 220]
const MINORS = [50, 70, 90, 110, 130, 150, 170, 190, 210, 230]

function RingChip({ s, active, onSelect }: { s: VSpeed; active: boolean; onSelect: (s: VSpeed) => void }) {
  const a = ((angle(s.mph) + (s.ringBoost ?? 0)) * Math.PI) / 180
  const left = 50 + 45 * Math.sin(a)
  const top = 53 - 45 * Math.cos(a)
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => onSelect(s)}
      className={cn(
        'absolute z-10 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 border px-2 py-1 font-mono text-[11px] transition-colors duration-300 lg:flex',
        active ? 'border-cyan bg-cyan/15 text-cyan' : 'border-hairline bg-panel/90 text-muted hover:border-cyan-dim hover:text-ink',
      )}
      style={{ left: `${left}%`, top: `${top}%` }}
      aria-label={`${s.code} ${s.mph} MPH — ${s.def}`}
      aria-pressed={active}
    >
      <span className="font-display font-semibold">{s.code}</span>
      <span className="text-faint">{s.mph}</span>
    </motion.button>
  )
}

export default function VelocimetroASI() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-18% 0px' })
  const speed = useMotionValue(V_MIN)
  const [selected, setSelected] = useState<VSpeed | null>(null)

  // sweep inicial: agulha vai até VYSE (linha azul) com micro-bounce de mola
  useEffect(() => {
    if (!inView) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const done = () => setSelected(VSPEEDS.find((s) => s.code === 'VYSE') ?? null)
    const c = reduced
      ? animate(speed, VYSE, { duration: 0, onComplete: done })
      : animate(speed, VYSE, { type: 'spring', stiffness: 68, damping: 10, delay: 1.2, onComplete: done })
    return () => c.stop()
  }, [inView, speed])

  const select = (s: VSpeed) => {
    setSelected(s)
    animate(speed, s.mph, { duration: 0.6, ease: [0.7, 0, 0.2, 1] })
  }

  const nx = useTransform(speed, (mph) => polarToXY(CX, CY, R_ARC - 34, angle(mph)).x)
  const ny = useTransform(speed, (mph) => polarToXY(CX, CY, R_ARC - 34, angle(mph)).y)
  const tx = useTransform(speed, (mph) => polarToXY(CX, CY, -18, angle(mph)).x)
  const ty = useTransform(speed, (mph) => polarToXY(CX, CY, -18, angle(mph)).y)
  const readout = useTransform(speed, (mph) => String(Math.round(mph)))

  const activeBand = selected ? bandOf(selected.mph) : null
  const bandOpacity = (b: string) => (activeBand === null || activeBand === b ? 1 : 0.45)
  const bandGlow = (b: string, color: string) =>
    activeBand === b ? `drop-shadow(0 0 7px ${color})` : 'none'

  const arcs = [
    { id: 'branco', d: arcPath(CX, CY, R_ARC, angle(BRANCO[0]), angle(BRANCO[1])), stroke: '#E8F0F7', w: 11, delay: 0 },
    { id: 'verde', d: arcPath(CX, CY, R_ARC, angle(VERDE[0]), angle(VERDE[1])), stroke: '#3DDC97', w: 11, delay: 0.18 },
    { id: 'amarelo', d: arcPath(CX, CY, R_ARC, angle(AMARELO[0]), angle(AMARELO[1])), stroke: '#FFB020', w: 11, delay: 0.36 },
  ]

  return (
    <section className="border-t border-hairline bg-abyss py-[72px] md:py-[120px]">
      <div className="mx-auto max-w-content px-6 md:px-12">
        <SectionHeader
          kicker="// SEÇÃO 5.1 — MARCAÇÕES DO VELOCÍMETRO"
          title="Arcos & V-speeds"
          measure={`VNE ${VNE} MPH`}
        />

        <div ref={ref} className="relative mx-auto mt-10 max-w-[980px]">
          {/* chips no anel (desktop) */}
          {VSPEEDS.map((s) => (
            <RingChip key={s.code} s={s} active={selected?.code === s.code} onSelect={select} />
          ))}

          <svg viewBox="0 0 560 470" className="mx-auto w-full max-w-[620px]" role="img" aria-label={`Velocímetro: arco branco ${marcas.arco_branco_operacao_com_flap}, verde ${marcas.arco_verde_operacao_normal}, amarelo ${marcas.arco_amarelo_operacao_em_ar_calmo}, linha vermelha ${VNE}, radial VMC ${VMC}, linha azul VYSE ${VYSE}`}>
            {/* aro */}
            <circle cx={CX} cy={CY} r={R_ARC + 22} fill="#0A1018" stroke="#1E2C3D" strokeWidth="1.4" />
            {/* arcos (draw-on sequencial) */}
            {arcs.map((a) => (
              <motion.path
                key={a.id}
                d={a.d}
                stroke={a.stroke}
                strokeWidth={a.w}
                fill="none"
                initial={{ pathLength: 0 }}
                animate={inView ? { pathLength: 1, opacity: bandOpacity(a.id) } : { opacity: 0.45 }}
                transition={{
                  pathLength: { duration: 0.8, delay: a.delay, ease: [0.7, 0, 0.2, 1] },
                  opacity: { duration: 0.4 },
                }}
                style={{ filter: bandGlow(a.id, a.stroke) }}
              />
            ))}
            {/* ticks */}
            {MINORS.map((mph) => {
              const p1 = polarToXY(CX, CY, R_ARC - 8, angle(mph))
              const p2 = polarToXY(CX, CY, R_ARC + 3, angle(mph))
              return <line key={mph} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#54687E" strokeWidth="1" />
            })}
            {MAJORS.map((mph) => {
              const p1 = polarToXY(CX, CY, R_ARC - 16, angle(mph))
              const p2 = polarToXY(CX, CY, R_ARC + 3, angle(mph))
              const pt = polarToXY(CX, CY, R_ARC - 34, angle(mph))
              return (
                <g key={mph}>
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#93A6BB" strokeWidth="1.8" />
                  <text x={pt.x} y={pt.y + 4} textAnchor="middle" fill="#93A6BB" fontSize="13" fontFamily="'IBM Plex Mono', monospace">
                    {mph}
                  </text>
                </g>
              )
            })}
            {/* radial vermelha VMC 80 */}
            {(() => {
              const p1 = polarToXY(CX, CY, R_ARC - 14, angle(VMC))
              const p2 = polarToXY(CX, CY, R_ARC + 6, angle(VMC))
              return (
                <motion.g initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : undefined} transition={{ delay: 0.6, duration: 0.4 }}>
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#FF4D4D" strokeWidth="3" />
                  <text x={polarToXY(CX, CY, R_ARC + 18, angle(VMC)).x} y={polarToXY(CX, CY, R_ARC + 18, angle(VMC)).y + 4} textAnchor="middle" fill="#FF4D4D" fontSize="10.5" fontFamily="'IBM Plex Mono', monospace">
                    VMC
                  </text>
                </motion.g>
              )
            })()}
            {/* linha azul VYSE 105 */}
            {(() => {
              const p1 = polarToXY(CX, CY, R_ARC - 14, angle(VYSE))
              const p2 = polarToXY(CX, CY, R_ARC + 6, angle(VYSE))
              const pt = polarToXY(CX, CY, R_ARC + 18, angle(VYSE))
              return (
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : undefined}
                  transition={{ delay: 0.75, duration: 0.4 }}
                  style={{ filter: selected?.code === 'VYSE' ? 'drop-shadow(0 0 6px #5B9DFF)' : 'none' }}
                >
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#5B9DFF" strokeWidth="3" />
                  <text x={pt.x} y={pt.y + 4} textAnchor="middle" fill="#5B9DFF" fontSize="10.5" fontFamily="'IBM Plex Mono', monospace">
                    VYSE
                  </text>
                </motion.g>
              )
            })()}
            {/* linha vermelha VNE 217 */}
            {(() => {
              const p1 = polarToXY(CX, CY, R_ARC - 14, angle(VNE))
              const p2 = polarToXY(CX, CY, R_ARC + 6, angle(VNE))
              const pt = polarToXY(CX, CY, R_ARC + 18, angle(VNE))
              return (
                <motion.g initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : undefined} transition={{ delay: 0.9, duration: 0.4 }}>
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#FF4D4D" strokeWidth="4.5" />
                  <text x={pt.x} y={pt.y + 4} textAnchor="middle" fill="#FF4D4D" fontSize="10.5" fontFamily="'IBM Plex Mono', monospace">
                    VNE
                  </text>
                </motion.g>
              )
            })()}
            {/* agulha */}
            <motion.line x1={tx} y1={ty} x2={nx} y2={ny} stroke="#E8F0F7" strokeWidth="3" strokeLinecap="round" />
            <circle cx={CX} cy={CY} r="11" fill="#0A1018" stroke="#3FE0FF" strokeWidth="1.6" />
            <circle cx={CX} cy={CY} r="3" fill="#3FE0FF" />
            {/* leitura */}
            <rect x={CX - 56} y={CY + 74} width="112" height="34" fill="#05080D" stroke="#1E2C3D" />
            <motion.text x={CX - 8} y={CY + 97} textAnchor="middle" fill="#3FE0FF" fontSize="20" fontFamily="'IBM Plex Mono', monospace">
              {readout}
            </motion.text>
            <text x={CX + 40} y={CY + 97} fill="#54687E" fontSize="11" fontFamily="'IBM Plex Mono', monospace">
              MPH
            </text>
            <text x={CX} y={CY + 130} textAnchor="middle" fill="#54687E" fontSize="10" fontFamily="'IBM Plex Mono', monospace" letterSpacing="3">
              {selected ? `${selected.code} — ${selected.def.toUpperCase().slice(0, 44)}` : 'AIRSPEED'}
            </text>
          </svg>

          {/* chips (mobile/tablet) */}
          <div className="mt-6 flex flex-wrap justify-center gap-2 lg:hidden">
            {VSPEEDS.map((s) => (
              <button key={s.code} type="button" onClick={() => select(s)} aria-pressed={selected?.code === s.code}>
                <VSChip
                  code={s.code}
                  value={`${s.mph} MPH`}
                  categoria={s.cat}
                  className={selected?.code === s.code ? 'border-cyan bg-cyan/10' : ''}
                />
              </button>
            ))}
          </div>
        </div>

        {/* grade completa de V-speeds */}
        <div className="mt-14">
          <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
            {'// Velocidades operacionais — SOP 5.1'}
          </p>
          <div className="flex flex-wrap gap-2.5">
            {[...VSPEEDS, ...EXTRA].map((s, i) => (
              <motion.span
                key={s.code}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-6% 0px' }}
                transition={{ duration: 0.35, delay: i * 0.045 }}
                className="inline-flex"
              >
                <button type="button" onClick={() => select(s)} aria-label={`${s.code} ${s.mph} MPH — ${s.def}`}>
                  <VSChip code={s.code} value={`${s.mph} MPH`} categoria={s.cat} definicao={s.def} className="cursor-pointer" />
                </button>
              </motion.span>
            ))}
            {/* V1 = VR (nota SOP) */}
            <motion.span
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: 0.9 }}
              className="inline-flex items-center border border-dashed border-hairline px-3 py-1.5 font-mono text-[12px] text-faint"
            >
              {v.V1_padrao_VFL}
            </motion.span>
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              to="/performance"
              className="group inline-flex items-center gap-2 border border-cyan-dim bg-cyan/[0.06] px-5 py-3 font-mono text-xs font-medium uppercase tracking-[0.18em] text-cyan transition-colors duration-300 hover:border-cyan hover:bg-cyan/15"
            >
              Ver tabelas de performance
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
