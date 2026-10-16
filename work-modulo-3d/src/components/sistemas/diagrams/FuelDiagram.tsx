// 8.1 — Sistema de Combustível: esquema asa-a-asa (sistemas.md §3).
// 4 tanques → seletoras (ON/OFF/X FEED, clicáveis) → bombas → motores.
// Fluxo verde animado; SIMULAR CROSSFEED redireciona tanque dir. → motor esq.;
// ambas em X FEED dispara o aviso proibido. Thumbnail do esquema original p.43.

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Shuffle } from 'lucide-react'
import type { Sistema } from '@/data'
import type { SystemMeta } from '../config'
import { DiagramShell, DiagramNode, DrawPath, FlowPath, SopImage } from '../shared'
import { focusComponent, componentDomId } from '../utils'
import { cn } from '@/lib/utils'
import { asset } from '@/lib/asset'

type SelPos = 'ON' | 'OFF' | 'XFEED'
const SEL_ORDER: SelPos[] = ['ON', 'OFF', 'XFEED']
const SEL_LABEL: Record<SelPos, string> = { ON: 'ON', OFF: 'OFF', XFEED: 'X FEED' }

const DIM = 'rgb(var(--c-dim))'
const TXT = 'rgb(var(--c-muted))'
const FAINT = 'rgb(var(--c-faint))'

interface SelectorProps {
  x: number
  y: number
  pos: SelPos
  color: string
  label: string
  onCycle: () => void
  onSet: (p: SelPos) => void
  danger: boolean
}

function Selector({ x, y, pos, color, label, onCycle, onSet, danger }: SelectorProps) {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.7 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.35 }}
      style={{ transformOrigin: '50% 50%' }}
    >
      <rect
        x={x}
        y={y}
        width={110}
        height={68}
        fill="rgb(var(--c-panel))"
        stroke={danger ? 'rgb(var(--c-red))' : color}
        strokeWidth={danger ? 2 : 1.5}
        style={{ cursor: 'pointer', filter: danger ? 'drop-shadow(0 0 8px #FF4D4D88)' : `drop-shadow(0 0 6px ${color}44)` }}
        onClick={onCycle}
        role="button"
        aria-label={`${label}: posição atual ${SEL_LABEL[pos]} — clique para alternar`}
      />
      <text x={x + 55} y={y - 7} textAnchor="middle" fill={FAINT} fontSize={9} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.14em">
        {label}
      </text>
      {SEL_ORDER.map((p, i) => {
        const active = pos === p
        return (
          <g
            key={p}
            onClick={(e) => {
              e.stopPropagation()
              onSet(p)
            }}
            style={{ cursor: 'pointer' }}
            role="button"
            aria-label={`${label}: selecionar ${SEL_LABEL[p]}`}
          >
            <rect x={x + 8} y={y + 8 + i * 19} width={94} height={17} fill={active ? 'rgb(var(--c-overlay))' : 'transparent'} />
            <rect
              x={x + 13}
              y={y + 13.5 + i * 19}
              width={7}
              height={7}
              fill={active ? (danger ? 'rgb(var(--c-red))' : color) : 'transparent'}
              stroke={active ? 'none' : FAINT}
              strokeWidth={1}
            />
            <text
              x={x + 28}
              y={y + 17 + i * 19}
              dominantBaseline="central"
              fill={active ? 'rgb(var(--c-ink))' : FAINT}
              fontSize={10}
              fontFamily="'IBM Plex Mono', monospace"
              fontWeight={active ? 600 : 400}
              letterSpacing="0.1em"
            >
              {SEL_LABEL[p]}
            </text>
          </g>
        )
      })}
    </motion.g>
  )
}

function EngineBlock({ x, fed, label, color, onClick }: { x: number; fed: boolean; label: string; color: string; onClick: () => void }) {
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }} role="button" aria-label={`${label} — ver divisor de fluxo e bicos na lista`}>
      <rect
        x={x}
        y={430}
        width={130}
        height={58}
        fill="rgb(var(--c-raised))"
        stroke={fed ? color : 'rgb(var(--c-hairline))'}
        strokeWidth={1.5}
        style={fed ? { filter: `drop-shadow(0 0 8px ${color}66)` } : undefined}
      />
      <text x={x + 65} y={452} textAnchor="middle" fill={fed ? 'rgb(var(--c-ink))' : FAINT} fontSize={11} fontWeight={600} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.08em">
        {label}
      </text>
      <text x={x + 65} y={468} textAnchor="middle" fill={FAINT} fontSize={8} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.08em">
        DIVISOR DE FLUXO + BICOS
      </text>
      <circle cx={x + 14} cy={444} r={3.5} fill={fed ? color : 'rgb(var(--c-hairline))'} />
      <text x={x + 22} y={447} fill={fed ? color : FAINT} fontSize={8} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.08em">
        {fed ? 'ALIMENTADO' : 'SEM FLUXO'}
      </text>
    </g>
  )
}

export default function FuelDiagram({ sistema, meta }: { sistema: Sistema; meta: SystemMeta }) {
  const c = meta.color
  const [selL, setSelL] = useState<SelPos>('ON')
  const [selR, setSelR] = useState<SelPos>('ON')

  const bothX = selL === 'XFEED' && selR === 'XFEED'
  const fedL = selL !== 'OFF'
  const fedR = selR !== 'OFF'
  // fluxo saindo de cada conjunto de tanques
  const tankLActive = selL === 'ON' || selR === 'XFEED'
  const tankRActive = selR === 'ON' || selL === 'XFEED'
  const crossLR = selR === 'XFEED' // tanques esq → motor dir
  const crossRL = selL === 'XFEED' // tanques dir → motor esq

  const status = useMemo(() => {
    const src = (sel: SelPos, own: string) =>
      sel === 'ON' ? own : sel === 'XFEED' ? 'LADO OPOSTO — X FEED' : 'CORTADO — OFF'
    return { l: src(selL, 'TANQUES ESQ'), r: src(selR, 'TANQUES DIR') }
  }, [selL, selR])

  const cycle = (cur: SelPos, set: (p: SelPos) => void) => () =>
    set(SEL_ORDER[(SEL_ORDER.indexOf(cur) + 1) % SEL_ORDER.length])

  return (
    <div className="space-y-5">
      <DiagramShell
        title="Diagrama de fluxo — seletoras interativas ON / OFF / X FEED"
        right={
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-faint sm:block">
            clique nas seletoras
          </span>
        }
        footer={
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelL('XFEED')
                  setSelR('OFF')
                }}
                className={cn(
                  'flex items-center gap-2 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors',
                  crossRL
                    ? 'border-amber bg-amber/10 text-amber'
                    : 'border-hairline text-muted hover:border-amber hover:text-amber',
                )}
              >
                <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
                Simular crossfeed
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelL('ON')
                  setSelR('ON')
                }}
                className="flex items-center gap-2 border border-hairline px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted transition-colors hover:border-cyan-dim hover:text-cyan"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reset — ambas ON
              </button>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[10px] tracking-[0.1em]">
              <span className="flex items-center gap-1.5">
                <span className={cn('h-1.5 w-1.5 rounded-full', fedL ? 'bg-green' : 'bg-red')} />
                <span className="text-faint">MOTOR ESQ:</span>
                <span className="text-muted">{status.l}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className={cn('h-1.5 w-1.5 rounded-full', fedR ? 'bg-green' : 'bg-red')} />
                <span className="text-faint">MOTOR DIR:</span>
                <span className="text-muted">{status.r}</span>
              </span>
            </div>
          </div>
        }
      >
        <svg viewBox="0 0 760 520" className="h-auto w-full" role="img" aria-label="Esquema do sistema de combustível: quatro tanques, seletoras, bombas e motores">
          {/* contornos das asas (blueprint) */}
          <DrawPath d="M16 20 H306 V126 H16 Z" color={FAINT} width={1} dashed opacity={0.5} duration={0.8} />
          <DrawPath d="M454 20 H744 V126 H454 Z" color={FAINT} width={1} dashed opacity={0.5} duration={0.8} />
          <text x={22} y={16} fill={FAINT} fontSize={9} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.18em">ASA ESQUERDA</text>
          <text x={738} y={16} textAnchor="end" fill={FAINT} fontSize={9} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.18em">ASA DIREITA</text>

          {/* tubulações base (draw-on) */}
          <DrawPath d="M89 96 V132 H231 M231 96 V132 M160 132 V210" color={DIM} width={2.5} duration={1.1} delay={0.15} />
          <DrawPath d="M529 96 V132 H671 M671 96 V132 M600 132 V210" color={DIM} width={2.5} duration={1.1} delay={0.15} />
          <DrawPath d="M210 244 H550" color={bothX ? 'rgb(var(--c-red))' : DIM} width={2.5} duration={0.9} delay={0.5} />
          <DrawPath d="M160 278 V430" color={DIM} width={2.5} duration={1} delay={0.6} />
          <DrawPath d="M600 278 V430" color={DIM} width={2.5} duration={1} delay={0.6} />
          <text x={384} y={238} fill={FAINT} fontSize={8} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.14em">LINHA DE CROSSFEED</text>

          {/* fluxos ativos */}
          <FlowPath d="M89 96 V132 H160 V210" color={c} active={tankLActive} />
          <FlowPath d="M231 96 V132 H160" color={c} active={tankLActive} />
          <FlowPath d="M671 96 V132 H600 V210" color={c} active={tankRActive} />
          <FlowPath d="M529 96 V132 H600" color={c} active={tankRActive} />
          <FlowPath d="M210 244 H550" color={bothX ? 'rgb(var(--c-red))' : 'rgb(var(--c-amber))'} active={crossLR} width={2.5} />
          <FlowPath d="M550 244 H210" color={bothX ? 'rgb(var(--c-red))' : 'rgb(var(--c-amber))'} active={crossRL} width={2.5} />
          <FlowPath d="M160 278 V430" color={c} active={fedL} />
          <FlowPath d="M600 278 V430" color={c} active={fedR} />

          {/* tanques */}
          <DiagramNode x={30} y={36} w={118} h={60} label="TQ EXT" sub="24,5 GAL" color={c} delay={0.1} active={tankLActive} onClick={() => focusComponent(componentDomId(sistema.id, 0))} />
          <DiagramNode x={172} y={36} w={118} h={60} label="TQ INT" sub="24,5 GAL" color={c} delay={0.16} active={tankLActive} onClick={() => focusComponent(componentDomId(sistema.id, 0))} />
          <DiagramNode x={470} y={36} w={118} h={60} label="TQ INT" sub="24,5 GAL" color={c} delay={0.16} active={tankRActive} onClick={() => focusComponent(componentDomId(sistema.id, 0))} />
          <DiagramNode x={612} y={36} w={118} h={60} label="TQ EXT" sub="24,5 GAL" color={c} delay={0.1} active={tankRActive} onClick={() => focusComponent(componentDomId(sistema.id, 0))} />

          {/* bocais de abastecimento */}
          {[89, 671].map((bx) => (
            <g key={bx} onClick={() => focusComponent(componentDomId(sistema.id, 1))} style={{ cursor: 'pointer' }} role="button" aria-label="Bocal de abastecimento — ver na lista">
              <circle cx={bx} cy={36} r={5} fill="rgb(var(--c-panel))" stroke={c} strokeWidth={1.5} />
              <text x={bx} y={24} textAnchor="middle" fill={FAINT} fontSize={8} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.1em">BOCAL</text>
            </g>
          ))}

          {/* seletoras */}
          <Selector x={105} y={210} pos={selL} color={c} label="SELETORA ESQ" danger={bothX} onCycle={cycle(selL, setSelL)} onSet={setSelL} />
          <Selector x={545} y={210} pos={selR} color={c} label="SELETORA DIR" danger={bothX} onCycle={cycle(selR, setSelR)} onSet={setSelR} />
          {/* tag clicável → ficha da válvula seletora */}
          <g style={{ cursor: 'pointer' }} onClick={() => focusComponent(componentDomId(sistema.id, 4))} role="button" aria-label="Válvula seletora de combustível — ver na lista">
            <rect x={298} y={252} width={164} height={18} fill="rgb(var(--c-panel))" stroke={FAINT} strokeWidth={1} strokeDasharray="3 3" />
            <text x={380} y={264} textAnchor="middle" fill={TXT} fontSize={8.5} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.08em">
              VÁLVULAS SELETORAS → FICHA
            </text>
          </g>

          {/* bombas */}
          <DiagramNode x={105} y={306} w={110} h={42} label="BOMBA ELÉTR." color={c} delay={0.42} active={fedL} onClick={() => focusComponent(componentDomId(sistema.id, 3))} />
          <DiagramNode x={105} y={366} w={110} h={42} label="BOMBA MOTOR" color={c} delay={0.48} active={fedL} onClick={() => focusComponent(componentDomId(sistema.id, 2))} />
          <DiagramNode x={545} y={306} w={110} h={42} label="BOMBA ELÉTR." color={c} delay={0.42} active={fedR} onClick={() => focusComponent(componentDomId(sistema.id, 3))} />
          <DiagramNode x={545} y={366} w={110} h={42} label="BOMBA MOTOR" color={c} delay={0.48} active={fedR} onClick={() => focusComponent(componentDomId(sistema.id, 2))} />

          {/* motores */}
          <EngineBlock x={95} fed={fedL} label="MOTOR ESQ" color={c} onClick={() => focusComponent(componentDomId(sistema.id, 10))} />
          <EngineBlock x={535} fed={fedR} label="MOTOR DIR" color={c} onClick={() => focusComponent(componentDomId(sistema.id, 10))} />

          {/* aviso: ambas em X FEED */}
          {bothX && (
            <motion.g animate={{ opacity: [1, 0.25, 1] }} transition={{ repeat: Infinity, duration: 0.9 }}>
              <rect x={300} y={206} width={160} height={24} fill="rgb(var(--c-red))" />
              <text x={380} y={222} textAnchor="middle" fill="rgb(var(--c-abyss))" fontSize={10} fontWeight={700} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.12em">
                CONFIG. PROIBIDA
              </text>
            </motion.g>
          )}

          {/* legenda de fluxo */}
          <g fontFamily="'IBM Plex Mono', monospace" fontSize={9} letterSpacing="0.12em">
            <line x1={300} y1={512} x2={324} y2={512} stroke={c} strokeWidth={2} strokeDasharray="2 6" />
            <text x={330} y={515} fill={TXT}>FLUXO ATIVO</text>
            <line x1={440} y1={512} x2={464} y2={512} stroke="rgb(var(--c-amber))" strokeWidth={2} strokeDasharray="2 6" />
            <text x={470} y={515} fill={TXT}>CROSSFEED</text>
            <line x1={580} y1={512} x2={604} y2={512} stroke={DIM} strokeWidth={2.5} />
            <text x={610} y={515} fill={TXT}>LINHA</text>
          </g>
        </svg>
      </DiagramShell>

      <SopImage
        src={asset('/sop-fuel-schematic.png')}
        alt="Esquema original do sistema de combustível (Fuel Schematic, página 43 do SOP)"
      />
    </div>
  )
}
