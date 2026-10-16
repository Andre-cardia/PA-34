// 8.7 — Aquecimento, ventilação e desembaciamento (sistemas.md §3).
// Fluxo de ar: captação → permutador (muff-heater) → válvula DEFROST → caixa
// de mistura → cabine; toggle CALOR ON/OFF muda o fluxo cyan (frio) → amber
// (quente) e, em OFF, o ar aquecido é despejado fora do avião (conforme SOP).

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Snowflake, Wind } from 'lucide-react'
import type { Sistema } from '@/data'
import type { SystemMeta } from '../config'
import { DiagramShell, DiagramNode, DrawPath, FlowPath } from '../shared'
import { focusComponent, componentDomId } from '../utils'
import { cn } from '@/lib/utils'

const DIM = 'rgb(var(--c-dim))'
const FAINT = 'rgb(var(--c-faint))'
const COLD = 'rgb(var(--c-cyan))'
const HOT = 'rgb(var(--c-amber))'

export default function HvacDiagram({ sistema }: { sistema: Sistema; meta: SystemMeta }) {
  const [heat, setHeat] = useState(true)
  const [defrost, setDefrost] = useState(false)
  const fc = (i: number) => () => focusComponent(componentDomId(sistema.id, i))
  const hotFlow = heat ? HOT : FAINT

  return (
    <DiagramShell
      title="Fluxo de ar — captação, muff-heater e distribuição na cabine"
      right={
        <span className={cn('font-mono text-[10px] uppercase tracking-[0.16em]', heat ? 'text-amber' : 'text-cyan')}>
          {heat ? 'AR AQUECIDO — MUFF-HEATER' : 'AR EXTERNO — CALOR OFF'}
        </span>
      }
      footer={
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setHeat((v) => !v)}
              aria-pressed={heat}
              className={cn(
                'flex items-center gap-2 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors',
                heat ? 'border-amber bg-amber/10 text-amber' : 'border-hairline text-muted hover:border-cyan-dim hover:text-cyan',
              )}
            >
              {heat ? <Flame className="h-3.5 w-3.5" aria-hidden="true" /> : <Snowflake className="h-3.5 w-3.5" aria-hidden="true" />}
              Calor {heat ? 'ON' : 'OFF'}
            </button>
            <button
              type="button"
              onClick={() => setDefrost((v) => !v)}
              aria-pressed={defrost}
              className={cn(
                'flex items-center gap-2 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors',
                defrost ? 'border-cyan bg-cyan/10 text-cyan' : 'border-hairline text-muted hover:border-cyan-dim hover:text-cyan',
              )}
            >
              <Wind className="h-3.5 w-3.5" aria-hidden="true" />
              Defrost {defrost ? 'ON' : 'OFF'}
            </button>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            {heat
              ? 'Permutador aquece o ar — mistura regulada na caixa de temperatura'
              : 'Controles em OFF: ar aquecido despejado para fora do avião'}
          </span>
        </div>
      }
    >
      <svg viewBox="0 0 760 470" className="h-auto w-full" role="img" aria-label="Esquema do fluxo de ar do sistema de aquecimento e desembaciamento">
        {/* tubulações */}
        <DrawPath d="M170 114 H230" color={DIM} width={2.5} duration={0.6} delay={0.1} />
        <DrawPath d="M380 114 H440" color={heat ? HOT : DIM} width={2.5} duration={0.6} delay={0.3} />
        <DrawPath d="M570 114 H665 V84" color={DIM} width={2} duration={0.7} delay={0.45} />
        <DrawPath d="M505 138 V220" color={DIM} width={2.5} duration={0.7} delay={0.45} />
        <DrawPath d="M380 248 H440" color={DIM} width={2.5} duration={0.6} delay={0.6} />
        <DrawPath d="M590 246 H620" color={DIM} width={2.5} duration={0.5} delay={0.75} />
        <DrawPath d="M305 144 V340" color={DIM} width={2} duration={0.7} delay={0.55} />

        {/* fluxos */}
        <FlowPath d="M170 114 H230" color={COLD} />
        <FlowPath d="M380 114 H440" color={hotFlow} active={heat} />
        <FlowPath d="M380 114 H440" color={COLD} active={!heat} period={1.8} />
        <FlowPath d="M570 114 H665 V84" color={defrost && heat ? HOT : COLD} active={defrost} />
        <FlowPath d="M505 138 V220" color={heat ? HOT : COLD} />
        <FlowPath d="M380 248 H440" color={COLD} />
        <FlowPath d="M590 246 H620" color={heat ? HOT : COLD} />
        <FlowPath d="M305 144 V340" color={HOT} active={!heat} />

        {/* nós */}
        <DiagramNode x={40} y={90} w={130} h={48} label="ENTRADA DE AR" sub="BORDO DE ATAQUE" color={COLD} delay={0.05} />
        <DiagramNode x={230} y={84} w={150} h={60} label="MUFF-HEATER" sub="PERMUTADOR — ESCAPAMENTO" color={heat ? HOT : FAINT} delay={0.2} onClick={fc(0)} />
        <DiagramNode x={440} y={90} w={130} h={48} label="VÁLVULA DEFROST" color={defrost ? COLD : FAINT} delay={0.35} onClick={fc(1)} />
        <DiagramNode x={600} y={40} w={130} h={44} label="PARA-BRISA" sub="DESEMBAÇADOR" color={defrost ? COLD : FAINT} delay={0.5} onClick={fc(1)} />
        <DiagramNode x={230} y={226} w={150} h={44} label="AR EXTERNO" sub="ENTRADAS NAS ASAS" color={COLD} delay={0.6} />
        <DiagramNode x={440} y={220} w={150} h={52} label="CAIXA DE MISTURA" sub="CONTROLE DE TEMPERATURA" color={heat ? HOT : COLD} delay={0.7} onClick={fc(2)} />
        <DiagramNode x={620} y={214} w={120} h={60} label="CABINE" sub="SAÍDAS PÉS + TETO" color={heat ? HOT : COLD} delay={0.85} onClick={fc(5)} />
        <DiagramNode x={230} y={340} w={150} h={44} label="DESCARTE EXTERNO" sub={heat ? 'FECHADO' : 'AR QUENTE → FORA'} color={heat ? FAINT : HOT} delay={0.65} />

        {/* ventiladores */}
        <g onClick={fc(4)} style={{ cursor: 'pointer' }} role="button" aria-label="Ventilador do desembaçador — ver na lista">
          <circle cx={700} cy={128} r={14} fill="rgb(var(--c-panel))" stroke={defrost ? COLD : FAINT} strokeWidth={1.5} />
          <motion.g
            animate={defrost ? { rotate: 360 } : { rotate: 0 }}
            transition={defrost ? { repeat: Infinity, duration: 1.1, ease: 'linear' } : { duration: 0.3 }}
            style={{ transformOrigin: '50% 50%' }}
          >
            <line x1={700} y1={118} x2={700} y2={138} stroke={defrost ? COLD : FAINT} strokeWidth={2} />
            <line x1={690} y1={128} x2={710} y2={128} stroke={defrost ? COLD : FAINT} strokeWidth={2} />
          </motion.g>
          <text x={700} y={158} textAnchor="middle" fill={FAINT} fontSize={8} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.08em">
            VENT. DEFROST (SOLO)
          </text>
        </g>

        {/* Janitrol — opcional, não instalado */}
        <g onClick={fc(6)} style={{ cursor: 'pointer' }} role="button" aria-label="Aquecedor Janitrol — opcional, não instalado; ver na lista">
          <rect x={440} y={330} width={290} height={52} fill="transparent" stroke={FAINT} strokeWidth={1} strokeDasharray="4 4" />
          <text x={585} y={352} textAnchor="middle" fill={FAINT} fontSize={9.5} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.12em">
            JANITROL — AQUECEDOR A COMBUSTÃO
          </text>
          <text x={585} y={368} textAnchor="middle" fill={FAINT} fontSize={8.5} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.1em">
            OPCIONAL — NÃO INSTALADO NO SENECA I VOEFLORIPA
          </text>
        </g>

        {/* legenda */}
        <g fontFamily="'IBM Plex Mono', monospace" fontSize={9} letterSpacing="0.12em">
          <line x1={40} y1={450} x2={64} y2={450} stroke={COLD} strokeWidth={2} strokeDasharray="2 6" />
          <text x={70} y={453} fill={FAINT}>AR FRIO</text>
          <line x1={160} y1={450} x2={184} y2={450} stroke={HOT} strokeWidth={2} strokeDasharray="2 6" />
          <text x={190} y={453} fill={FAINT}>AR AQUECIDO</text>
        </g>
      </svg>
    </DiagramShell>
  )
}
