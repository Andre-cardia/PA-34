// Seção 2 — Régua de velocidades (design/performance.md §2).
// SVG horizontal 40–230 MPH com faixas dos arcos do ASI + ticks das V-speeds.
// Sticky abaixo da navbar durante as seções 2–4 (versão compacta quando colada);
// marcador cyan desliza conforme a seção visível; clique no tick rola até a
// subseção; hover mostra a definição (tabela 6.2).

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { especificacoes } from '@/data'
import { abbreviations, scrollToAnchor } from './performance-data'
import { cn } from '@/lib/utils'

const v = especificacoes.velocidades_operacionais
const marcas = especificacoes.marcas_do_velocimetro

const V_MIN = 40
const V_MAX = 230
const W = 1200
const H = 96
const pct = (mph: number) => ((mph - V_MIN) / (V_MAX - V_MIN)) * W

const BRANCO: [number, number] = [v.estol_power_off_trem_e_flap_estendidos_mph, v.velocidade_maxima_com_flap_10_mph]
const VERDE: [number, number] = [v.estol_power_off_trem_e_flap_recolhidos_mph, v.velocidade_maxima_de_cruzeiro_mph]
const AMARELO: [number, number] = [v.velocidade_maxima_de_cruzeiro_mph, v.VNE_velocidade_nunca_exceder_mph]
const VNE = marcas.linha_radial_vermelha_VNE_mph

const shortDef = (code: string) =>
  abbreviations.find((a) => a.code.toUpperCase().replace(/[^A-Z0-9]/g, '') === code.toUpperCase().replace(/[^A-Z0-9]/g, ''))

interface Tick {
  code: string
  mph: number
  anchor: string
  color: string
  below?: boolean
  activeSpeed: number
}

const TICKS: Tick[] = [
  { code: 'VS0', mph: v.estol_power_off_trem_e_flap_estendidos_mph, anchor: 'estol', color: 'rgb(var(--c-red))', activeSpeed: v.estol_power_off_trem_e_flap_estendidos_mph },
  { code: 'VS', mph: v.estol_power_off_trem_e_flap_recolhidos_mph, anchor: 'estol', color: 'rgb(var(--c-red))', activeSpeed: v.estol_power_off_trem_e_flap_recolhidos_mph },
  { code: 'VMC', mph: v.VMC_velocidade_minima_de_controle_mph, anchor: 'vmc', color: 'rgb(var(--c-red))', activeSpeed: v.VMC_velocidade_minima_de_controle_mph },
  { code: 'VX', mph: v.melhor_angulo_de_subida_VX_mph, anchor: 'subida', color: 'rgb(var(--c-green))', activeSpeed: v.melhor_angulo_de_subida_VX_mph },
  { code: 'VY', mph: v.melhor_razao_de_subida_VY_mph, anchor: 'subida', color: 'rgb(var(--c-green))', activeSpeed: v.melhor_razao_de_subida_VY_mph },
  { code: 'VYSE', mph: v.velocidade_de_subida_monomotor_VYSE_mph, anchor: 'subida', color: 'rgb(var(--c-blue))', below: true, activeSpeed: v.velocidade_de_subida_monomotor_VYSE_mph },
  { code: 'VFE', mph: v.velocidade_maxima_com_flap_10_mph, anchor: 'trem-flap', color: 'rgb(var(--c-amber))', activeSpeed: v.velocidade_maxima_com_flap_10_mph },
  { code: 'VLE', mph: v.VLE_trem_baixado_e_VLO_down_mph, anchor: 'trem-flap', color: 'rgb(var(--c-amber))', activeSpeed: v.VLE_trem_baixado_e_VLO_down_mph },
  { code: 'VNO', mph: v.velocidade_maxima_de_cruzeiro_mph, anchor: 'glossario', color: 'rgb(var(--c-amber))', activeSpeed: v.velocidade_maxima_de_cruzeiro_mph },
  { code: 'VNE', mph: v.VNE_velocidade_nunca_exceder_mph, anchor: 'glossario', color: 'rgb(var(--c-red))', activeSpeed: v.VNE_velocidade_nunca_exceder_mph },
]

const VA_RANGE: [number, number] = [
  v.VA_velocidade_de_manobra_peso_minimo_2743lbs_1244kg_mph,
  v.VA_velocidade_de_manobra_peso_maximo_4200lbs_1905kg_mph,
]

// velocidade representativa de cada seção para o marcador cyan (null = esconde)
const SECTION_SPEEDS: { id: string; mph: number | null }[] = [
  { id: 'va', mph: VA_RANGE[1] },
  { id: 'trem-flap', mph: v.VLE_trem_baixado_e_VLO_down_mph },
  { id: 'subida', mph: v.melhor_razao_de_subida_VY_mph },
  { id: 'vmc', mph: v.VMC_velocidade_minima_de_controle_mph },
  { id: 'estol', mph: v.estol_power_off_trem_e_flap_recolhidos_mph },
  { id: 'distancias', mph: null },
  { id: 'tabelas', mph: null },
  { id: 'planejamento', mph: null },
  { id: 'glossario', mph: null },
]

function Bands() {
  return (
    <>
      <rect x={pct(BRANCO[0])} y={34} width={pct(BRANCO[1]) - pct(BRANCO[0])} height={16} fill="rgb(var(--c-ink))" opacity={0.85} />
      <rect x={pct(VERDE[0])} y={34} width={pct(VERDE[1]) - pct(VERDE[0])} height={16} fill="rgb(var(--c-green))" opacity={0.85} />
      <rect x={pct(AMARELO[0])} y={34} width={pct(AMARELO[1]) - pct(AMARELO[0])} height={16} fill="rgb(var(--c-amber))" opacity={0.85} />
      <rect x={pct(VNE)} y={34} width={pct(V_MAX) - pct(VNE)} height={16} fill="rgb(var(--c-red))" opacity={0.35} />
      <rect x={pct(VNE)} y={30} width={3} height={24} fill="rgb(var(--c-red))" />
    </>
  )
}

export default function ReguaVelocidades() {
  const [stuck, setStuck] = useState(false)
  const [activeMph, setActiveMph] = useState<number | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // modo compacto quando colada no topo
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting), {
      rootMargin: '-57px 0px 0px 0px',
      threshold: 0,
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // marcador cyan acompanha a seção visível
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + window.innerHeight * 0.35
      let current: number | null = null
      for (const s of SECTION_SPEEDS) {
        const el = document.getElementById(s.id)
        if (el && el.offsetTop <= y) current = s.mph
      }
      setActiveMph(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" />
      <div className="sticky top-14 z-40 border-y border-hairline bg-panel/95 backdrop-blur-md">
        <div className="mx-auto max-w-content px-6 md:px-12">
          <div className={cn('relative transition-all duration-300', stuck ? 'py-1.5' : 'py-3')}>
            {/* versão completa */}
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className={cn('w-full transition-opacity duration-300', stuck ? 'pointer-events-none absolute inset-x-0 h-0 opacity-0' : 'opacity-100')}
              role="img"
              aria-label="Régua de velocidades de 40 a 230 MPH com os arcos do velocímetro e as V-speeds"
            >
              {/* trilho base */}
              <rect x={0} y={34} width={W} height={16} fill="rgb(var(--c-panel))" stroke="rgb(var(--c-hairline))" />
              <Bands />
              {/* faixa VA */}
              <g>
                <rect x={pct(VA_RANGE[0])} y={14} width={pct(VA_RANGE[1]) - pct(VA_RANGE[0])} height={5} fill="rgb(var(--c-cyan))" opacity={0.5} />
                <text x={(pct(VA_RANGE[0]) + pct(VA_RANGE[1])) / 2} y={10} textAnchor="middle" fill="rgb(var(--c-cyan))" fontSize="11" fontFamily="'IBM Plex Mono', monospace">
                  VA {VA_RANGE[0]}–{VA_RANGE[1]}
                </text>
              </g>
              {/* ticks das V-speeds */}
              {TICKS.map((t) => {
                const def = shortDef(t.code)
                const x = pct(t.mph)
                return (
                  <g
                    key={t.code}
                    className="group/tick cursor-pointer"
                    onClick={() => scrollToAnchor(t.anchor)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        scrollToAnchor(t.anchor)
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${t.code} ${t.mph} MPH — ir para a seção`}
                  >
                    <line x1={x} y1={t.below ? 50 : 22} x2={x} y2={t.below ? 66 : 34} stroke={t.color} strokeWidth={t.code === 'VNE' ? 0 : 2.5} />
                    {!t.below && t.code !== 'VNE' && (
                      <text x={x} y={t.code === 'VNO' ? 32 : 20} textAnchor="middle" fill={t.color} fontSize="11.5" fontFamily="'IBM Plex Mono', monospace" fontWeight={600}>
                        {t.code}
                      </text>
                    )}
                    {t.code === 'VNE' && (
                      <text x={x} y={20} textAnchor="middle" fill={t.color} fontSize="11.5" fontFamily="'IBM Plex Mono', monospace" fontWeight={600}>
                        VNE
                      </text>
                    )}
                    {t.below && (
                      <text x={x} y={80} textAnchor="middle" fill={t.color} fontSize="11.5" fontFamily="'IBM Plex Mono', monospace" fontWeight={600}>
                        {t.code}
                      </text>
                    )}
                    {/* tooltip nativo (definição da tabela 6.2) */}
                    {def && <title>{`${t.code} — ${def.short} · ${t.mph} MPH`}</title>}
                  </g>
                )
              })}
              {/* escala */}
              {[40, 60, 80, 100, 120, 140, 160, 180, 200, 220].map((mph) => (
                <g key={mph}>
                  <line x1={pct(mph)} y1={50} x2={pct(mph)} y2={56} stroke="rgb(var(--c-faint))" strokeWidth="1" />
                  <text x={pct(mph)} y={68} textAnchor="middle" fill="rgb(var(--c-faint))" fontSize="9.5" fontFamily="'IBM Plex Mono', monospace">
                    {mph}
                  </text>
                </g>
              ))}
              <text x={W - 4} y={92} textAnchor="end" fill="rgb(var(--c-faint))" fontSize="9.5" fontFamily="'IBM Plex Mono', monospace" letterSpacing="2">
                MPH
              </text>
              {/* marcador cyan */}
              {activeMph !== null && (
                <motion.g
                  initial={false}
                  animate={{ x: pct(activeMph) }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <polygon points="0,26 -5,18 5,18" fill="rgb(var(--c-cyan))" />
                  <line x1={0} y1={26} x2={0} y2={50} stroke="rgb(var(--c-cyan))" strokeWidth="1.4" opacity={0.7} />
                </motion.g>
              )}
            </svg>
            {/* versão compacta (só faixas) */}
            <svg
              viewBox={`0 0 ${W} 20`}
              className={cn('w-full transition-opacity duration-300', stuck ? 'opacity-100' : 'pointer-events-none absolute inset-x-0 h-0 opacity-0')}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <rect x={0} y={2} width={W} height={16} fill="rgb(var(--c-panel))" />
              <g transform="translate(0 -32)">
                <Bands />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </>
  )
}
