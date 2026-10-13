// Seção 5 — Pesos & Envelope (design/especificacoes.md §5).
// Esquerda: barra vertical de peso com marcadores (vazio / máx. pouso / máx.
// decolagem / bagageiros) e faixa 4000–4200 lb "somente decolagem".
// Direita: fator de carga + cargas específicas e envelope V-n simplificado
// (VA / VNO / VNE no eixo X, G no Y) com draw-on e tooltips VSChip.

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import SectionHeader from '@/components/ui-custom/SectionHeader'
import SpecTable, { DataRow } from '@/components/ui-custom/SpecTable'
import VSChip from '@/components/ui-custom/VSChip'
import { CornerScrews } from '@/components/assets/PanelScrews'
import { especificacoes } from '@/data'

const p = especificacoes.pesos
const v = especificacoes.velocidades_operacionais

const lb = (s: string) => Number(s.match(/\((\d+)\s*libras\)/)?.[1] ?? 0)
const kgf = (s: string) => s.match(/^([\d.]+)\s*kgf/)?.[1] ?? ''

const VAZIO = lb(p.peso_basico_vazio) // 2625
const MAX_POUSO = lb(p.peso_maximo_pouso) // 4000
const MAX_DEC = lb(p.peso_maximo_decolagem) // 4200
const CARGA_UTIL = lb(p.carga_util_maxima) // 1575
const BAG_NARIZ = lb(p.peso_maximo_bagageiro_nariz) // 100
const BAG_TRAS = lb(p.peso_maximo_bagageiro_traseiro) // 100

const VA = v.VA_velocidade_de_manobra_peso_maximo_4200lbs_1905kg_mph // 146
const VNO = v.velocidade_maxima_de_cruzeiro_mph // 190
const VNE = v.VNE_velocidade_nunca_exceder_mph // 217
const VS = v.estol_power_off_trem_e_flap_recolhidos_mph // 76
const G_MAX = Number(especificacoes.fator_carga.flaps_up.match(/\+(\d+,\d+)/)?.[1].replace(',', '.') ?? 0) // 3.8

// ---------------------------------------------------------------------------
// Barra vertical de peso
// ---------------------------------------------------------------------------

const SCALE_MAX = 4500
const H = 430 // px da régua

const yOf = (lbs: number) => H - (lbs / SCALE_MAX) * H

interface Marker {
  lbs: number
  label: string
  sub: string
  color: string
  line: string
  above?: boolean // rótulo acima do trilho (evita colisão no topo da escala)
}

const MARKERS: Marker[] = [
  { lbs: VAZIO, label: 'PESO BÁSICO VAZIO', sub: `${kgf(p.peso_basico_vazio)} kgf`, color: 'text-cyan', line: 'bg-cyan' },
  { lbs: MAX_POUSO, label: 'PESO MÁX. POUSO', sub: `${kgf(p.peso_maximo_pouso)} kgf`, color: 'text-ink', line: 'bg-ink' },
  { lbs: MAX_DEC, label: 'PESO MÁX. DECOLAGEM', sub: `${kgf(p.peso_maximo_decolagem)} kgf`, color: 'text-amber', line: 'bg-amber', above: true },
]

function WeightBar() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-12% 0px' })

  return (
    <div ref={ref} className="relative border border-hairline bg-raised p-6 md:p-7">
      <CornerScrews />
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">Régua de peso — libras</p>

      <div className="mt-6 flex gap-6">
        {/* trilho */}
        <div className="relative w-16 shrink-0 border border-hairline bg-panel" style={{ height: H }}>
          {/* preenchimento até MTOW */}
          <motion.div
            initial={{ height: 0 }}
            animate={inView ? { height: H - yOf(MAX_DEC) } : undefined}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-0 w-full bg-cyan-dim/25"
          />
          {/* faixa somente decolagem 4000–4200 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : undefined}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="group/band absolute w-full bg-amber/20"
            style={{ bottom: H - yOf(MAX_DEC), height: yOf(MAX_POUSO) - yOf(MAX_DEC) }}
            tabIndex={0}
            aria-label={`Entre ${MAX_POUSO} e ${MAX_DEC} libras: somente decolagem — reduzir peso para o pouso`}
          >
            <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-52 -translate-x-1/2 border border-hairline bg-raised px-2.5 py-1.5 font-mono text-[11px] leading-snug text-muted opacity-0 shadow-xl shadow-black/50 transition-opacity duration-200 group-hover/band:opacity-100 group-focus-visible/band:opacity-100" role="tooltip">
              {p.nota_reducao_peso}
            </span>
          </motion.div>
          {/* ticks de escala */}
          {[0, 1000, 2000, 3000, 4000].map((t) => (
            <div key={t} className="absolute left-0 flex w-full items-center gap-1" style={{ bottom: yOf(t) }}>
              <span className="h-px w-2 bg-faint" />
              <span className="font-mono text-[9px] text-faint">{t.toLocaleString('pt-BR')}</span>
            </div>
          ))}
          {/* marcadores */}
          {MARKERS.map((mk, i) => (
            <motion.div
              key={mk.label}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : undefined}
              transition={{ type: 'spring', stiffness: 260, damping: 17, delay: 0.3 + i * 0.12 }}
              className="absolute -left-1 w-[calc(100%+8px)]"
              style={{ bottom: yOf(mk.lbs) }}
            >
              <span className={`block h-[2.5px] w-full ${mk.line}`} />
            </motion.div>
          ))}
        </div>

        {/* rótulos */}
        <div className="relative flex-1" style={{ height: H }}>
          {MARKERS.map((mk, i) => (
            <motion.div
              key={mk.label}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : undefined}
              transition={{ type: 'spring', stiffness: 260, damping: 17, delay: 0.38 + i * 0.12 }}
              className="absolute"
              style={mk.above ? { top: -4 } : { bottom: Math.max(0, yOf(mk.lbs) - 10) }}
            >
              <p className={`flex items-center gap-2 font-mono text-[15px] font-medium ${mk.color}`}>
                <span className={`inline-block h-2 w-2 ${mk.line}`} aria-hidden="true" />
                {mk.lbs.toLocaleString('pt-BR')} LB
              </p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{mk.label}</p>
              <p className="font-mono text-[10px] text-faint">{mk.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <SpecTable className="mt-6">
        <DataRow label="Carga útil máx." value={`${CARGA_UTIL.toLocaleString('pt-BR')} lb (${kgf(p.carga_util_maxima)} kgf)`} dot="green" />
        <DataRow label="Bagageiro do nariz" value={`${BAG_NARIZ} lb máx.`} dot="amber" />
        <DataRow label="Bagageiro traseiro" value={`${BAG_TRAS} lb máx.`} dot="amber" />
      </SpecTable>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Envelope V-n simplificado
// ---------------------------------------------------------------------------

const EW = 520
const EH = 300
const PAD = { l: 46, r: 18, t: 18, b: 40 }
const X_MAX = 240
const Y_MAX = 4.4

const ex = (mph: number) => PAD.l + (mph / X_MAX) * (EW - PAD.l - PAD.r)
const ey = (g: number) => PAD.t + (1 - g / Y_MAX) * (EH - PAD.t - PAD.b)

function Envelope() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-12% 0px' })

  const curve = `M ${ex(VS)} ${ey(1)} Q ${ex((VS + VA) / 2)} ${ey(G_MAX)} ${ex(VA)} ${ey(G_MAX)} L ${ex(VNE)} ${ey(G_MAX)} L ${ex(VNE)} ${ey(1)}`

  const points = [
    { code: 'VA', mph: VA, g: G_MAX, cat: 'cautela' as const, def: `Velocidade de manobra (peso máx. 4.200 lb) — ${VA} MPH` },
    { code: 'VNO', mph: VNO, g: G_MAX, cat: 'normal' as const, def: `Velocidade máx. estrutural de cruzeiro — ${VNO} MPH` },
    { code: 'VNE', mph: VNE, g: G_MAX, cat: 'critica' as const, def: `Velocidade nunca exceder — ${VNE} MPH` },
  ]

  return (
    <div ref={ref} className="relative border border-hairline bg-raised p-6 md:p-7">
      <CornerScrews />
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">Envelope V-n simplificado</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">G × MPH</p>
      </div>

      <svg viewBox={`0 0 ${EW} ${EH}`} className="mt-4 w-full" role="img" aria-label={`Envelope de fator de carga: limite +${G_MAX} g entre VA ${VA} e VNE ${VNE} MPH`}>
        {/* eixos */}
        <motion.g initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : undefined} transition={{ duration: 0.5 }}>
          <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={EH - PAD.b} stroke="#54687E" strokeWidth="1" />
          <line x1={PAD.l} y1={EH - PAD.b} x2={EW - PAD.r} y2={EH - PAD.b} stroke="#54687E" strokeWidth="1" />
          {/* grid + labels X */}
          {[0, 60, 120, 180, 240].map((mph) => (
            <g key={mph}>
              <line x1={ex(mph)} y1={PAD.t} x2={ex(mph)} y2={EH - PAD.b} stroke="#1E2C3D" strokeWidth="1" strokeDasharray="2 5" />
              <text x={ex(mph)} y={EH - PAD.b + 16} textAnchor="middle" fill="#54687E" fontSize="10" fontFamily="'IBM Plex Mono', monospace">
                {mph}
              </text>
            </g>
          ))}
          {/* grid + labels Y */}
          {[0, 1, 2, 3, 4].map((g) => (
            <g key={g}>
              <line x1={PAD.l} y1={ey(g)} x2={EW - PAD.r} y2={ey(g)} stroke="#1E2C3D" strokeWidth="1" strokeDasharray="2 5" />
              <text x={PAD.l - 8} y={ey(g) + 3.5} textAnchor="end" fill="#54687E" fontSize="10" fontFamily="'IBM Plex Mono', monospace">
                {g}
              </text>
            </g>
          ))}
          <text x={EW - PAD.r} y={EH - PAD.b + 30} textAnchor="end" fill="#54687E" fontSize="10" fontFamily="'IBM Plex Mono', monospace" letterSpacing="2">
            MPH
          </text>
          <text x={PAD.l - 34} y={PAD.t - 6} fill="#54687E" fontSize="10" fontFamily="'IBM Plex Mono', monospace" letterSpacing="2">
            G
          </text>
        </motion.g>

        {/* curva do envelope */}
        <motion.path
          d={curve}
          fill="none"
          stroke="#3FE0FF"
          strokeWidth="1.8"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : undefined}
          transition={{ duration: 1.4, delay: 0.35, ease: [0.7, 0, 0.2, 1] }}
        />
        {/* linha do limite +3,8 g */}
        <motion.line
          x1={ex(VA)}
          y1={ey(G_MAX)}
          x2={ex(VNE)}
          y2={ey(G_MAX)}
          stroke="#FFB020"
          strokeWidth="1"
          strokeDasharray="4 4"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : undefined}
          transition={{ duration: 0.5, delay: 1.5 }}
        />
        <motion.text
          x={ex((VA + VNE) / 2)}
          y={ey(G_MAX) - 8}
          textAnchor="middle"
          fill="#FFB020"
          fontSize="10.5"
          fontFamily="'IBM Plex Mono', monospace"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : undefined}
          transition={{ duration: 0.5, delay: 1.6 }}
        >
          +{String(G_MAX).replace('.', ',')} g
        </motion.text>

        {/* pontos VA / VNO / VNE */}
        {points.map((pt, i) => (
          <motion.g
            key={pt.code}
            initial={{ opacity: 0, scale: 0 }}
            animate={inView ? { opacity: 1, scale: 1 } : undefined}
            transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 1.1 + i * 0.12 }}
            className="group/pt"
            tabIndex={0}
            aria-label={pt.def}
          >
            <circle cx={ex(pt.mph)} cy={ey(pt.g)} r="5" fill="#0A1018" stroke={pt.cat === 'critica' ? '#FF4D4D' : pt.cat === 'cautela' ? '#FFB020' : '#3DDC97'} strokeWidth="2" />
            <text x={ex(pt.mph)} y={ey(pt.g) + 20} textAnchor="middle" fill="#E8F0F7" fontSize="11" fontFamily="'IBM Plex Mono', monospace">
              {pt.code}
            </text>
          </motion.g>
        ))}
      </svg>

      {/* VSchips dos pontos */}
      <div className="mt-4 flex flex-wrap gap-2">
        {points.map((pt) => (
          <VSChip key={pt.code} code={pt.code} value={`${pt.mph} MPH`} categoria={pt.cat} definicao={pt.def} />
        ))}
      </div>
    </div>
  )
}

export default function PesosEnvelope() {
  return (
    <section className="border-t border-hairline bg-panel py-[72px] md:py-[120px]">
      <div className="mx-auto max-w-content px-6 md:px-12">
        <SectionHeader
          kicker="// SEÇÃO 5.1 — PESOS & ENVELOPE"
          title="Pesos & envelope de carga"
          measure={`MTOW ${MAX_DEC.toLocaleString('pt-BR')} LB`}
        />

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <WeightBar />
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10% 0px' }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="relative border border-hairline bg-raised p-5"
              >
                <CornerScrews size={8} />
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">Fator de carga</p>
                <SpecTable className="mt-4">
                  <DataRow label="Flaps UP" value={especificacoes.fator_carga.flaps_up} dot="amber" />
                  <DataRow label="Flaps DOWN" value={especificacoes.fator_carga.flaps_down} dot="amber" />
                </SpecTable>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10% 0px' }}
                transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="relative border border-hairline bg-raised p-5"
              >
                <CornerScrews size={8} />
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">Cargas específicas</p>
                <SpecTable className="mt-4">
                  <DataRow label="Carga alar" value={especificacoes.cargas_especificas.carga_alar} />
                  <DataRow label="Peso × potência" value={especificacoes.cargas_especificas.carga_de_potencia_peso_x_potencia} />
                </SpecTable>
              </motion.div>
            </div>
            <Envelope />
          </div>
        </div>

        <p className="mt-6 font-mono text-[11px] leading-relaxed tracking-[0.06em] text-faint">
          {p.nota}
        </p>
      </div>
    </section>
  )
}
