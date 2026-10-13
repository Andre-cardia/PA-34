// 8.2 — Sistema Elétrico: diagrama de barramento (sistemas.md §3).
// Bateria 12 V + 2 alternadores 60 A → reguladores/relés OV → barramento 14 V
// → consumidores; fluxo azul; OVERVOLTAGE LIGHT pulsa âmbar ao entrar.
// Thumbnail do esquema original (p.46) com lightbox.

import { motion } from 'framer-motion'
import type { Sistema } from '@/data'
import type { SystemMeta } from '../config'
import { DiagramShell, DiagramNode, DrawPath, FlowPath, SopImage } from '../shared'
import { focusComponent, componentDomId } from '../utils'

const DIM = '#2A3B4D'
const FAINT = '#54687E'

// OVERVOLTAGE LIGHT — pulsa âmbar ao entrar no viewport (loop isolado)
function OvervoltageLight({ onClick }: { onClick: () => void }) {
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }} role="button" aria-label="Overvoltage light — ver na lista">
      <motion.rect
        x={292}
        y={132}
        width={176}
        height={40}
        fill="#1a1408"
        stroke="#FFB020"
        strokeWidth={1.5}
        initial={{ opacity: 0.35 }}
        whileInView={{ opacity: [0.35, 1, 0.35] }}
        viewport={{ once: false, margin: '-10% 0px' }}
        transition={{ repeat: Infinity, duration: 1.6 }}
        style={{ filter: 'drop-shadow(0 0 8px #FFB02077)' }}
      />
      <text x={380} y={156} textAnchor="middle" fill="#FFB020" fontSize={11} fontWeight={700} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.14em">
        OVERVOLTAGE LIGHT
      </text>
    </g>
  )
}

function Ammeter({ cx, cy, onClick }: { cx: number; cy: number; onClick: () => void }) {
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }} role="button" aria-label="Amperímetro — ver na lista">
      <circle cx={cx} cy={cy} r={17} fill="#0A1018" stroke="#5B9DFF" strokeWidth={1.5} />
      <line x1={cx} y1={cy} x2={cx + 9} y2={cy - 9} stroke="#5B9DFF" strokeWidth={1.5} />
      <text x={cx} y={cy + 28} textAnchor="middle" fill={FAINT} fontSize={8} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.12em">
        AMP
      </text>
    </g>
  )
}

export default function ElectricalDiagram({ sistema, meta }: { sistema: Sistema; meta: SystemMeta }) {
  const c = meta.color
  const fc = (i: number) => () => focusComponent(componentDomId(sistema.id, i))

  return (
    <div className="space-y-5">
      <DiagramShell
        title="Diagrama de barramento — geração, regulação e consumo"
        right={
          <span className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: c }}>
            14 V constantes
          </span>
        }
        footer={
          <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[10px] uppercase tracking-[0.14em]">
            <span className="text-faint">
              Fontes: <span className="text-muted">2× alternador 60 A + bateria 12 V / 35 A·h</span>
            </span>
            <span className="text-faint">
              Proteção: <span className="text-muted">reguladores + relés OV + circuit breakers</span>
            </span>
          </div>
        }
      >
        <svg viewBox="0 0 760 490" className="h-auto w-full" role="img" aria-label="Esquema elétrico: alternadores, reguladores, bateria, barramento e consumidores">
          {/* ligações base */}
          <DrawPath d="M145 94 V130" color={DIM} width={2.5} duration={0.5} delay={0.2} />
          <DrawPath d="M615 94 V130" color={DIM} width={2.5} duration={0.5} delay={0.2} />
          <DrawPath d="M145 174 V300 H240" color={DIM} width={2.5} duration={0.9} delay={0.35} />
          <DrawPath d="M615 174 V300" color={DIM} width={2.5} duration={0.9} delay={0.35} />
          <DrawPath d="M120 330 V300 H700" color={c} width={3} duration={1.2} delay={0.55} opacity={0.9} />
          <DrawPath d="M280 300 V380 M415 300 V380 M565 300 V380 M665 300 V340" color={DIM} width={2} duration={0.9} delay={0.8} />
          <DrawPath d="M210 152 H292 M550 152 H468" color="#FFB020" width={1.2} dashed duration={0.8} delay={0.9} opacity={0.7} />

          {/* fluxos */}
          <FlowPath d="M145 94 V130" color={c} />
          <FlowPath d="M615 94 V130" color={c} />
          <FlowPath d="M145 174 V300 H240" color={c} />
          <FlowPath d="M615 174 V300" color={c} />
          <FlowPath d="M120 330 V300" color={c} period={2.2} />
          <FlowPath d="M120 300 H700" color={c} period={2} />
          <FlowPath d="M280 300 V380 M415 300 V380 M565 300 V380" color={c} period={1.8} />

          {/* geração */}
          <DiagramNode x={80} y={40} w={130} h={54} label="ALT ESQ" sub="60 A — MOTOR ESQ" color={c} delay={0.05} onClick={fc(0)} />
          <DiagramNode x={550} y={40} w={130} h={54} label="ALT DIR" sub="60 A — MOTOR DIR" color={c} delay={0.12} onClick={fc(0)} />
          <DiagramNode x={80} y={130} w={130} h={44} label="REG + OV ESQ" color={c} delay={0.2} onClick={fc(3)} />
          <DiagramNode x={550} y={130} w={130} h={44} label="REG + OV DIR" color={c} delay={0.26} onClick={fc(3)} />
          <Ammeter cx={145} cy={222} onClick={fc(1)} />
          <Ammeter cx={615} cy={222} onClick={fc(1)} />
          <OvervoltageLight onClick={fc(4)} />

          {/* bateria */}
          <g onClick={fc(2)} style={{ cursor: 'pointer' }} role="button" aria-label="Bateria — ver na lista">
            <rect x={60} y={330} width={120} height={60} fill="#101926" stroke={c} strokeWidth={1.5} style={{ filter: `drop-shadow(0 0 6px ${c}44)` }} />
            <text x={120} y={356} textAnchor="middle" fill="#E8F0F7" fontSize={11} fontWeight={600} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.08em">
              BATERIA
            </text>
            <text x={120} y={372} textAnchor="middle" fill={FAINT} fontSize={8.5} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.06em">
              12 V · 35 A·h — NARIZ
            </text>
          </g>

          {/* barramento */}
          <text x={700} y={292} textAnchor="end" fill={c} fontSize={9} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.16em">
            BARRAMENTO 14 V
          </text>

          {/* consumidores */}
          <DiagramNode x={220} y={380} w={120} h={44} label="AVIÔNICOS" color={c} delay={0.9} />
          <DiagramNode x={360} y={380} w={110} h={44} label="LUZES" color={c} delay={0.96} />
          <DiagramNode x={490} y={380} w={150} h={44} label="INSTR. + BOMBA TREM" color={c} delay={1.02} onClick={fc(5)} />
          <DiagramNode x={600} y={340} w={130} h={40} label="CIRCUIT BREAKERS" color={c} delay={1.08} onClick={fc(5)} />

          {/* console de switches */}
          <g onClick={fc(6)} style={{ cursor: 'pointer' }} role="button" aria-label="Console de switches elétricos — ver na lista">
            <rect x={60} y={430} width={250} height={34} fill="transparent" stroke={FAINT} strokeWidth={1} strokeDasharray="4 4" />
            <text x={185} y={451} textAnchor="middle" fill={FAINT} fontSize={9} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.1em">
              CONSOLE DE SWITCHES — LATERAL ESQ. CABINE
            </text>
          </g>
        </svg>
      </DiagramShell>

      <SopImage
        src="/sop-electrical-schematic.png"
        alt="Esquema original dos alternadores e do sistema de partida (página 46 do SOP)"
      />
    </div>
  )
}
