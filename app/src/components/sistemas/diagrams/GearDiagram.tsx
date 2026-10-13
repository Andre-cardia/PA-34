// 8.5 — Trem de Pouso Retrátil: peça visual da página (sistemas.md §3).
// Diagrama lateral com as 3 pernas; RECOLHER/BAIXAR anima o ciclo completo
// (portas → pernas → luzes: vermelha em trânsito → apagadas / 3 GREEN com
// annunciator blink). Painel-luz replica o indicador real; chips VLE/VLO.

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import type { Sistema } from '@/data'
import type { SystemMeta } from '../config'
import CalloutBanner from '@/components/ui-custom/CalloutBanner'
import VSChip from '@/components/ui-custom/VSChip'
import { DiagramShell, DrawPath } from '../shared'
import { focusComponent, EASE_MECH, componentDomId } from '../utils'
import { cn } from '@/lib/utils'

const FAINT = '#54687E'
const DIM = '#2A3B4D'

type GearState = 'down' | 'transit-up' | 'up' | 'transit-down'
const TRANSIT_MS = 1900 // simulação visual (SOP: 6–10 s reais)

function GearLeg({
  pivotX,
  pivotY,
  up,
  rotation,
  color,
  faded = false,
  squat = false,
  onClick,
}: {
  pivotX: number
  pivotY: number
  up: boolean
  rotation: number
  color: string
  faded?: boolean
  squat?: boolean
  onClick?: () => void
}) {
  return (
    <g style={{ opacity: faded ? 0.4 : 1 }}>
      <motion.g
        initial={false}
        animate={{ rotate: up ? rotation : 0 }}
        transition={{ duration: TRANSIT_MS / 1000, ease: EASE_MECH }}
        style={{ transformOrigin: '50% 0%', cursor: onClick ? 'pointer' : 'default' }}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        aria-label={onClick ? 'Perna do trem — ver componentes na lista' : undefined}
      >
        {/* bbox estabilizadora: mantém a origem da rotação no pivô (transform-box: fill-box) */}
        <rect x={pivotX - 20} y={pivotY} width={40} height={92} fill="none" pointerEvents="none" />
        {/* oleo (amortecedor) */}
        <line x1={pivotX} y1={pivotY} x2={pivotX} y2={pivotY + 44} stroke={color} strokeWidth={5} strokeLinecap="round" />
        <line x1={pivotX} y1={pivotY + 40} x2={pivotX} y2={pivotY + 66} stroke="#93A6BB" strokeWidth={3} />
        {/* braço */}
        <line x1={pivotX} y1={pivotY + 20} x2={pivotX - 16} y2={pivotY + 58} stroke={DIM} strokeWidth={2} />
        {/* roda */}
        <circle cx={pivotX} cy={pivotY + 74} r={15} fill="#0A1018" stroke={color} strokeWidth={2} />
        <circle cx={pivotX} cy={pivotY + 74} r={5} fill={DIM} />
      </motion.g>
      {squat && (
        <g>
          <rect x={pivotX + 7} y={pivotY + 30} width={9} height={9} fill="#FFB020" />
          <line x1={pivotX + 16} y1={pivotY + 34} x2={pivotX + 44} y2={pivotY + 34} stroke="#FFB020" strokeWidth={1} strokeDasharray="3 3" />
          <text x={pivotX + 48} y={pivotY + 38} fill="#FFB020" fontSize={8.5} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.1em">
            SQUAT SWITCH
          </text>
        </g>
      )}
    </g>
  )
}

export default function GearDiagram({ sistema, meta }: { sistema: Sistema; meta: SystemMeta }) {
  const c = meta.color
  const [state, setState] = useState<GearState>('down')
  const [downCount, setDownCount] = useState(0)
  const transit = state === 'transit-up' || state === 'transit-down'
  const up = state === 'up' || state === 'transit-up'

  useEffect(() => {
    if (state === 'transit-up') {
      const t = window.setTimeout(() => setState('up'), TRANSIT_MS)
      return () => window.clearTimeout(t)
    }
    if (state === 'transit-down') {
      const t = window.setTimeout(() => {
        setState('down')
        setDownCount((n) => n + 1)
      }, TRANSIT_MS)
      return () => window.clearTimeout(t)
    }
  }, [state])

  const squat = sistema.componentes[4] // Microswitches de peso (squat switches)

  return (
    <div className="space-y-5">
      <DiagramShell
        title="Ciclo do trem — portas, pernas e indicações"
        right={
          <span
            className={cn(
              'font-mono text-[10px] uppercase tracking-[0.16em]',
              state === 'down' ? 'text-green' : transit ? 'text-red' : 'text-faint',
            )}
          >
            {state === 'down' ? 'BAIXADO E TRAVADO' : transit ? 'EM TRÂNSITO' : 'EM CIMA E TRAVADO'}
          </span>
        }
        footer={
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <button
              type="button"
              disabled={transit}
              onClick={() => setState((s) => (s === 'down' ? 'transit-up' : s === 'up' ? 'transit-down' : s))}
              className={cn(
                'flex items-center gap-2 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors',
                transit
                  ? 'cursor-wait border-hairline text-faint'
                  : state === 'down'
                    ? 'border-red/60 text-red hover:bg-red/10'
                    : 'border-green/60 text-green hover:bg-green/10',
              )}
            >
              {state === 'down' || state === 'transit-up' ? (
                <>
                  <ArrowUpFromLine className="h-3.5 w-3.5" aria-hidden="true" />
                  {transit ? 'Recolhendo…' : 'Recolher'}
                </>
              ) : (
                <>
                  <ArrowDownToLine className="h-3.5 w-3.5" aria-hidden="true" />
                  {transit ? 'Baixando…' : 'Baixar'}
                </>
              )}
            </button>
            {/* painel-luz: réplica do indicador real */}
            <div className="flex items-center gap-3 border border-hairline bg-abyss px-3 py-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">Gear</span>
              <span className="flex gap-1.5" aria-label={state === 'down' ? 'Três luzes verdes: trem baixado e travado' : 'Luzes apagadas: trem em trânsito ou em cima'}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={`${downCount}-${i}`}
                    className={cn(
                      'h-3 w-3',
                      state === 'down' ? 'animate-annunciator-blink bg-green [box-shadow:0_0_8px_rgba(61,220,151,0.8)]' : 'bg-overlay',
                    )}
                  />
                ))}
              </span>
              <span
                className={cn('h-3 w-3', transit ? 'bg-red [box-shadow:0_0_8px_rgba(255,77,77,0.8)]' : 'bg-overlay')}
                aria-label={transit ? 'Luz vermelha: trem em trânsito' : 'Luz vermelha apagada'}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <VSChip code="VLE" value="150 MPH" categoria="critica" />
              <VSChip code="VLO↑" value="125 MPH" categoria="cautela" />
              <VSChip code="VLO↓" value="150 MPH" categoria="cautela" />
            </div>
          </div>
        }
      >
        <svg viewBox="0 0 760 400" className="h-auto w-full" role="img" aria-label="Vista lateral do PA-34 com as três pernas do trem de pouso retrátil">
          {/* pernas (atrás da fuselagem — somem ao recolher) */}
          <GearLeg pivotX={170} pivotY={206} up={up} rotation={100} color={c} onClick={() => focusComponent(componentDomId(sistema.id, 6))} />
          <GearLeg pivotX={505} pivotY={208} up={up} rotation={-95} color={c} faded onClick={() => focusComponent(componentDomId(sistema.id, 6))} />
          <GearLeg pivotX={448} pivotY={208} up={up} rotation={-95} color={c} squat={state === 'down'} onClick={() => focusComponent(componentDomId(sistema.id, 4))} />

          {/* fuselagem (vista lateral, traço blueprint) */}
          <motion.path
            d="M58 176 C70 148 112 130 162 124 L516 110 C596 108 656 122 698 148 L712 168 C662 194 560 204 458 206 L180 212 C122 210 76 198 58 184 Z"
            fill="#0A1018"
            stroke={c}
            strokeWidth={1.5}
            initial={{ pathLength: 0, fillOpacity: 0 }}
            whileInView={{ pathLength: 1, fillOpacity: 1 }}
            viewport={{ once: true, margin: '-12% 0px' }}
            transition={{ duration: 1.4, ease: EASE_MECH, fillOpacity: { delay: 0.9, duration: 0.5 } }}
          />
          {/* empenagem */}
          <DrawPath d="M606 112 L668 48 L686 54 L660 118 Z" color={c} width={1.5} duration={0.8} delay={0.4} />
          {/* nacele + hélice */}
          <DrawPath d="M330 164 H444 a18 18 0 0 1 0 36 H330 a18 18 0 0 1 0 -36 Z" color={c} width={1.5} duration={0.9} delay={0.5} />
          <DrawPath d="M330 150 V214" color={c} width={1.2} dashed duration={0.6} delay={0.7} />
          {/* janelas */}
          <DrawPath d="M210 138 h34 M256 136 h34 M302 134 h34" color={DIM} width={4} duration={0.7} delay={0.8} />
          {/* portas do trem */}
          {[
            { x: 140, open: transit || state === 'down' },
            { x: 420, open: transit || state === 'down' },
            { x: 478, open: transit || state === 'down' },
          ].map((d, i) => (
            <motion.rect
              key={i}
              x={d.x}
              y={204}
              width={56}
              height={4}
              fill={DIM}
              initial={false}
              animate={{ rotate: d.open ? -32 : 0, opacity: d.open ? 1 : 0.5 }}
              transition={{ duration: 0.6, ease: EASE_MECH }}
              style={{ transformOrigin: '0% 0%' }}
            />
          ))}
          {/* linha de solo */}
          <line x1={40} y1={302} x2={720} y2={302} stroke={FAINT} strokeWidth={1} strokeDasharray="6 6" opacity={0.6} />
          <text x={720} y={294} textAnchor="end" fill={FAINT} fontSize={9} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.16em">
            SOLO
          </text>
          {/* rótulos */}
          <text x={170} y={330} textAnchor="middle" fill={FAINT} fontSize={9} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.12em">
            DIANTEIRO — RECOLHE P/ FRENTE
          </text>
          <text x={478} y={330} textAnchor="middle" fill={FAINT} fontSize={9} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.12em">
            PRINCIPAIS — RECOLHEM P/ DENTRO
          </text>
        </svg>
      </DiagramShell>

      {/* squat switch destacado (texto do JSON: funcao + detalhes) */}
      <CalloutBanner variant="cuidado" title="CUIDADO — SQUAT SWITCH (MICROSWITCH DE PESO)">
        {squat.funcao} {squat.detalhes}
      </CalloutBanner>
    </div>
  )
}
