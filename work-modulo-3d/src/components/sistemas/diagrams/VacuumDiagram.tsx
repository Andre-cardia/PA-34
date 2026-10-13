// 8.3 — Sistema de Vácuo (sistemas.md §3): ar da cabine → filtro → giros
// (horizonte + giro direcional) → reguladores → 2 bombas; fluxo violeta.
// Gauge de sucção com agulha que varre até 5,0 inHg (faixa verde 4,5–5,5).

import { motion } from 'framer-motion'
import type { Sistema } from '@/data'
import type { SystemMeta } from '../config'
import { DiagramShell, DiagramNode, DrawPath, FlowPath } from '../shared'
import { focusComponent, EASE_MECH, componentDomId } from '../utils'

const DIM = '#2A3B4D'
const FAINT = '#54687E'
const GAUGE_C = '#A78BFA'

// ---- gauge de sucção: escala 0–10 inHg, semicírculo -------------------------
const GX = 175 // centro x
const GY = 398 // centro y
const GR = 62 // raio

function polar(v: number, r: number): [number, number] {
  const theta = Math.PI - (v / 10) * Math.PI // v=0 → 180° (esq), v=10 → 0° (dir)
  return [GX + r * Math.cos(theta), GY - r * Math.sin(theta)]
}

function arcPath(v0: number, v1: number, r: number) {
  const [x0, y0] = polar(v0, r)
  const [x1, y1] = polar(v1, r)
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}

function SuctionGauge({ onClick }: { onClick: () => void }) {
  const [nx, ny] = polar(5, GR - 14)
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }} role="button" aria-label="Instrumento de Suction — ver na lista">
      {/* fundo */}
      <path d={arcPath(0, 10, GR)} fill="none" stroke="#101926" strokeWidth={10} />
      <path d={arcPath(0, 10, GR)} fill="none" stroke={DIM} strokeWidth={1.5} />
      {/* faixa verde 4,5–5,5 */}
      <path d={arcPath(4.5, 5.5, GR)} fill="none" stroke="#3DDC97" strokeWidth={6} style={{ filter: 'drop-shadow(0 0 5px #3DDC9766)' }} />
      {/* ticks */}
      {[0, 2, 4, 6, 8, 10].map((v) => {
        const [x0, y0] = polar(v, GR - 4)
        const [x1, y1] = polar(v, GR + 6)
        const [tx, ty] = polar(v, GR + 16)
        return (
          <g key={v}>
            <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={FAINT} strokeWidth={1.2} />
            <text x={tx} y={ty} textAnchor="middle" dominantBaseline="central" fill={FAINT} fontSize={8} fontFamily="'IBM Plex Mono', monospace">
              {v}
            </text>
          </g>
        )
      })}
      {/* agulha — varre de 0 a 5,0 ao entrar (gauge sweep) */}
      <motion.g
        initial={{ rotate: -90 }}
        whileInView={{ rotate: 0 }}
        viewport={{ once: true, margin: '-15% 0px' }}
        transition={{ duration: 1.4, delay: 0.5, ease: EASE_MECH }}
        style={{ transformOrigin: '50% 100%' }}
      >
        <line x1={GX} y1={GY} x2={nx} y2={ny} stroke="#E8F0F7" strokeWidth={2} />
      </motion.g>
      <circle cx={GX} cy={GY} r={4} fill="#101926" stroke="#E8F0F7" strokeWidth={1.5} />
      <text x={GX} y={GY + 24} textAnchor="middle" fill="#E8F0F7" fontSize={10} fontWeight={600} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.14em">
        SUCTION
      </text>
      <text x={GX} y={GY + 38} textAnchor="middle" fill={GAUGE_C} fontSize={8.5} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.1em">
        5,0 IN HG
      </text>
    </g>
  )
}

export default function VacuumDiagram({ sistema, meta }: { sistema: Sistema; meta: SystemMeta }) {
  const c = meta.color
  const fc = (i: number) => () => focusComponent(componentDomId(sistema.id, i))

  return (
    <DiagramShell
      title="Fluxo pneumático — ar aspirado da cabine até as bombas"
      right={
        <span className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: c }}>
          5,0 inHg @ 2000 RPM
        </span>
      }
      footer={
        <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[10px] uppercase tracking-[0.14em]">
          <span className="flex items-center gap-2 text-faint">
            <span className="h-1.5 w-1.5 bg-green" aria-hidden="true" />
            Faixa verde — mín. 4,5 inHg
          </span>
          <span className="flex items-center gap-2 text-faint">
            <span className="h-1.5 w-1.5" style={{ backgroundColor: '#FF8C42' }} aria-hidden="true" />
            Pino laranja — falha de bomba individual
          </span>
        </div>
      }
    >
      <svg viewBox="0 0 760 450" className="h-auto w-full" role="img" aria-label="Esquema do sistema de vácuo: filtro, instrumentos giroscópicos, reguladores e bombas">
        {/* tubulações */}
        <DrawPath d="M180 124 H240 M180 124 V204 H240" color={DIM} width={2.5} duration={0.9} delay={0.15} />
        <DrawPath d="M390 124 H450 M390 204 H450" color={DIM} width={2.5} duration={0.9} delay={0.35} />
        <DrawPath d="M560 122 H600 M560 202 H600" color={DIM} width={2.5} duration={0.7} delay={0.55} />
        {/* fluxo (sentido: cabine → bombas) */}
        <FlowPath d="M180 124 H240" color={c} />
        <FlowPath d="M180 124 V204 H240" color={c} />
        <FlowPath d="M390 124 H450 M390 204 H450" color={c} />
        <FlowPath d="M560 122 H600 M560 202 H600" color={c} />

        {/* nós */}
        <DiagramNode x={60} y={100} w={120} h={48} label="FILTRO" sub="AR DA CABINE" color={c} delay={0.05} onClick={fc(1)} />
        <DiagramNode x={240} y={100} w={150} h={48} label="HORIZONTE ARTIF." color={c} delay={0.18} onClick={fc(3)} />
        <DiagramNode x={240} y={180} w={150} h={48} label="GIRO DIRECIONAL" color={c} delay={0.24} onClick={fc(3)} />
        <DiagramNode x={450} y={100} w={110} h={44} label="REG ESQ" color={c} delay={0.36} onClick={fc(2)} />
        <DiagramNode x={450} y={180} w={110} h={44} label="REG DIR" color={c} delay={0.42} onClick={fc(2)} />
        <DiagramNode x={600} y={96} w={130} h={52} label="BOMBA ESQ" sub="MOTOR ESQ" color={c} delay={0.54} onClick={fc(0)} />
        <DiagramNode x={600} y={176} w={130} h={52} label="BOMBA DIR" sub="MOTOR DIR" color={c} delay={0.6} onClick={fc(0)} />

        {/* gauge de sucção */}
        <SuctionGauge onClick={fc(4)} />

        {/* nota: redundância (texto do funcionamento JSON) */}
        <g>
          <rect x={360} y={300} width={370} height={58} fill="#0A1018" stroke="#1E2C3D" />
          <text x={378} y={324} fill={GAUGE_C} fontSize={9} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.14em">
            REDUNDÂNCIA
          </text>
          <text x={378} y={342} fill="#93A6BB" fontSize={10} fontFamily="'IBM Plex Mono', monospace">
            1 bomba supre giros duplos até 12.000 ft;
          </text>
          <text x={378} y={356} fill="#93A6BB" fontSize={10} fontFamily="'IBM Plex Mono', monospace">
            acima disso, manter RPM elevada.
          </text>
          {/* pino laranja */}
          <rect x={700} y={310} width={10} height={10} fill="#FF8C42" />
        </g>

        {/* legenda sentido do fluxo */}
        <g fontFamily="'IBM Plex Mono', monospace" fontSize={9} letterSpacing="0.12em">
          <line x1={470} y1={420} x2={494} y2={420} stroke={c} strokeWidth={2} strokeDasharray="2 6" />
          <text x={500} y={423} fill={FAINT}>SENTIDO DA SUCÇÃO</text>
        </g>
      </svg>
    </DiagramShell>
  )
}
