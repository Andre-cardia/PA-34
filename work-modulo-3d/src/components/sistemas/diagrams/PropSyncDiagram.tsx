// 8.4 — Sincronizador de hélices & velocidade constante (sistemas.md §3).
// Duas hélices SVG girando em loop CSS; toggle SYNC ON/OFF — OFF gera o
// batimento visual (períodos distintos), ON alinha as duas. O Seneca I da
// VoeFloripa NÃO possui sincronizador (chip no rodapé, texto do JSON).

import { useState } from 'react'
import { AudioWaveform } from 'lucide-react'
import type { Sistema } from '@/data'
import type { SystemMeta } from '../config'
import { DiagramShell, DiagramNode, DrawPath } from '../shared'
import { focusComponent, componentDomId } from '../utils'
import { cn } from '@/lib/utils'

const FAINT = 'rgb(var(--c-faint))'
const DIM = 'rgb(var(--c-dim))'

function Propeller({ cx, cy, period, color, label, onClick }: { cx: number; cy: number; period: number; color: string; label: string; onClick: () => void }) {
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }} role="button" aria-label={`${label} — ver hélices na lista`}>
      {/* nacele */}
      <rect x={cx - 52} y={cy - 34} width={104} height={68} rx={34} fill="rgb(var(--c-panel))" stroke="rgb(var(--c-hairline))" strokeWidth={1.5} />
      {/* disco da hélice */}
      <circle cx={cx} cy={cy} r={128} fill={color} opacity={0.04} />
      <circle cx={cx} cy={cy} r={128} fill="none" stroke={DIM} strokeWidth={1} strokeDasharray="3 7" opacity={0.6} />
      {/* pás (bipá) — giro em loop CSS */}
      <g
        style={{
          transformBox: 'view-box',
          transformOrigin: `${cx}px ${cy}px`,
          animation: `sis-propspin ${period}s linear infinite`,
        }}
      >
        <g transform={`translate(${cx} ${cy})`}>
          <path
            d="M0 -10 C13 -28 15 -92 7 -122 C3 -126 -5 -126 -7 -121 C-13 -90 -11 -28 0 -10 Z"
            fill={color}
            opacity={0.9}
            style={{ filter: `drop-shadow(0 0 6px ${color}55)` }}
          />
          <path
            d="M0 10 C-13 28 -15 92 -7 122 C-3 126 5 126 7 121 C13 90 11 28 0 10 Z"
            fill={color}
            opacity={0.9}
            style={{ filter: `drop-shadow(0 0 6px ${color}55)` }}
          />
        </g>
      </g>
      {/* spinner */}
      <path d={`M ${cx} ${cy - 16} L ${cx + 11} ${cy + 10} L ${cx - 11} ${cy + 10} Z`} fill="rgb(var(--c-raised))" stroke={color} strokeWidth={1.5} />
      <text x={cx} y={cy + 158} textAnchor="middle" fill={FAINT} fontSize={10} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.18em">
        {label}
      </text>
    </g>
  )
}

export default function PropSyncDiagram({ sistema, meta }: { sistema: Sistema; meta: SystemMeta }) {
  const c = meta.color
  const [sync, setSync] = useState(false)
  const fc = (i: number) => () => focusComponent(componentDomId(sistema.id, i))

  return (
    <DiagramShell
      title="Batimento de hélices — passo variável / velocidade constante"
      right={
        <span
          className={cn('font-mono text-[10px] uppercase tracking-[0.16em]', sync ? 'text-green' : 'text-amber')}
        >
          {sync ? 'SINCRONIZADAS' : 'RESSONÂNCIA — BATIMENTO'}
        </span>
      }
      footer={
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <button
            type="button"
            onClick={() => setSync((v) => !v)}
            className={cn(
              'flex items-center gap-2 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors',
              sync
                ? 'border-green bg-green/10 text-green'
                : 'border-amber bg-amber/10 text-amber',
            )}
            aria-pressed={sync}
          >
            <AudioWaveform className="h-3.5 w-3.5" aria-hidden="true" />
            Sync {sync ? 'ON' : 'OFF'}
          </button>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            {sync ? 'RPM ESQ = RPM DIR — ajuste fino pelo sincronizador' : 'RPM ESQ ≠ RPM DIR — as pás “andam” uma em relação à outra'}
          </span>
          <span className="ml-auto border border-amber/40 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-amber">
            Não instalado no Seneca I VoeFloripa
          </span>
        </div>
      }
    >
      {/* keyframes locais do giro das hélices */}
      <style>{'@keyframes sis-propspin { to { transform: rotate(360deg) } }'}</style>
      <svg viewBox="0 0 760 470" className="h-auto w-full" role="img" aria-label="Duas hélices bipá girando; o toggle de sincronização alinha ou dessincroniza as rotações">
        {/* linha de centro do avião */}
        <DrawPath d="M380 30 V440" color={FAINT} width={1} dashed opacity={0.4} duration={0.8} />
        <text x={388} y={44} fill={FAINT} fontSize={8} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.14em">LINHA DE CENTRO</text>

        {/* hélices */}
        <Propeller cx={205} cy={180} period={1} color={c} label="HÉLICE ESQ — HARTZELL BIPÁ" onClick={fc(3)} />
        <Propeller cx={555} cy={180} period={sync ? 1 : 1.17} color={c} label="HÉLICE DIR — ROTAÇÃO OPOSTA" onClick={fc(3)} />

        {/* comparador de fase */}
        <text x={380} y={182} textAnchor="middle" fill={sync ? 'rgb(var(--c-green))' : 'rgb(var(--c-amber))'} fontSize={22} fontWeight={700} fontFamily="'IBM Plex Mono', monospace">
          {sync ? '=' : '≠'}
        </text>

        {/* governadores */}
        <DrawPath d="M205 214 V330 H290" color={DIM} width={1.8} duration={0.8} delay={0.3} />
        <DrawPath d="M555 214 V330 H470" color={DIM} width={1.8} duration={0.8} delay={0.3} />
        <DiagramNode x={290} y={306} w={180} h={48} label="GOVERNADORES" sub="ÓLEO / CONTRAPESOS — 1 POR MOTOR" color={c} delay={0.45} onClick={fc(1)} />

        {/* manete do passo */}
        <DrawPath d="M380 354 V396" color={DIM} width={1.8} duration={0.5} delay={0.6} />
        <DiagramNode x={290} y={396} w={180} h={48} label="MANETE DO PASSO" sub="À FRENTE: ↓ PASSO · ↑ RPM" color={c} delay={0.7} onClick={fc(2)} />

        {/* sincronizador */}
        <DiagramNode x={40} y={396} w={200} h={48} label="SINCRONIZADOR" sub={sync ? 'ATUANDO — AJUSTE FINO' : 'DESLIGADO'} color={sync ? c : FAINT} delay={0.8} onClick={fc(0)} />
      </svg>
    </DiagramShell>
  )
}
