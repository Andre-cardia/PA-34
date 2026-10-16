// 8.6 — Bagageiro do Nariz (sistemas.md §3): cone do nariz com porta +
// trava/chave interativos (girar a chave → destrancar → abrir). Foto original
// da chave (p.55) com filtro escuro e lightbox. Banner de ênfase é renderizado
// pela estação (notaDestaque — travamento verificado no pré-voo).

import { useState } from 'react'
import { motion } from 'framer-motion'
import { KeyRound, Lock, LockOpen } from 'lucide-react'
import type { Sistema } from '@/data'
import type { SystemMeta } from '../config'
import { DiagramShell, DrawPath, SopImage } from '../shared'
import { focusComponent, EASE_OUT, componentDomId } from '../utils'
import { cn } from '@/lib/utils'

const FAINT = 'rgb(var(--c-faint))'
const DIM = 'rgb(var(--c-dim))'

type DoorState = 'locked' | 'unlocked' | 'open'

export default function BaggageDiagram({ sistema, meta }: { sistema: Sistema; meta: SystemMeta }) {
  const c = meta.color
  const [door, setDoor] = useState<DoorState>('locked')
  const [shake, setShake] = useState(0)
  const fc = (i: number) => () => focusComponent(componentDomId(sistema.id, i))

  const tryDoor = () => {
    if (door === 'locked') {
      setShake((n) => n + 1) // porta trancada: não abre (shake)
      return
    }
    setDoor((d) => (d === 'open' ? 'unlocked' : 'open'))
  }

  return (
    <div className="space-y-5">
      <DiagramShell
        title="Cone do nariz — porta, trava e chave (interativo)"
        right={
          <span
            className={cn(
              'font-mono text-[10px] uppercase tracking-[0.16em]',
              door === 'locked' ? 'text-green' : door === 'unlocked' ? 'text-amber' : 'text-red',
            )}
          >
            {door === 'locked' ? 'TRANCADA' : door === 'unlocked' ? 'DESTRANCADA' : 'ABERTA'}
          </span>
        }
        footer={
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDoor((d) => (d === 'locked' ? 'unlocked' : d === 'unlocked' ? 'locked' : d))}
                disabled={door === 'open'}
                className={cn(
                  'flex items-center gap-2 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors',
                  door === 'locked'
                    ? 'border-green/60 text-green hover:bg-green/10'
                    : door === 'open'
                      ? 'cursor-not-allowed border-hairline text-faint'
                      : 'border-amber/60 text-amber hover:bg-amber/10',
                )}
              >
                {door === 'locked' ? <Lock className="h-3.5 w-3.5" aria-hidden="true" /> : <LockOpen className="h-3.5 w-3.5" aria-hidden="true" />}
                {door === 'locked' ? 'Destrancar (chave)' : 'Trancar (chave)'}
              </button>
              <button
                type="button"
                onClick={tryDoor}
                className={cn(
                  'flex items-center gap-2 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors',
                  door === 'open'
                    ? 'border-red/60 text-red hover:bg-red/10'
                    : 'border-hairline text-muted hover:border-cyan-dim hover:text-cyan',
                )}
              >
                <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                {door === 'open' ? 'Fechar porta' : 'Abrir porta'}
              </button>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              {door === 'locked' ? 'Chave aplicada — porta verificada' : door === 'unlocked' ? 'Tranque com a chave após verificar' : 'Em voo, a porta pode quebrar-se e desprender'}
            </span>
          </div>
        }
      >
        <svg viewBox="0 0 760 420" className="h-auto w-full" role="img" aria-label="Perfil do cone do nariz do PA-34 com a porta do bagageiro, trava e chave">
          {/* cone do nariz */}
          <DrawPath
            d="M64 210 C96 148 188 116 306 110 L706 110 M64 210 C96 272 188 304 306 310 L706 310"
            color={c}
            width={1.5}
            duration={1.3}
          />
          <DrawPath d="M706 96 V324" color={c} width={1.5} duration={0.5} delay={0.9} />
          <text x={110} y={120} fill={FAINT} fontSize={9} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.16em">
            CONE DO NARIZ
          </text>
          {/* linha de centro */}
          <DrawPath d="M64 210 H706" color={DIM} width={1} dashed opacity={0.5} duration={1} delay={0.5} />

          {/* vão da porta (visível ao abrir) */}
          <motion.g
            initial={false}
            animate={{ opacity: door === 'open' ? 1 : 0 }}
            transition={{ duration: 0.35 }}
          >
            <rect x={238} y={148} width={156} height={124} fill="rgb(var(--c-abyss))" stroke={DIM} strokeWidth={1} />
            {/* bagagem + bateria no compartimento */}
            <g onClick={fc(1)} style={{ cursor: 'pointer' }} role="button" aria-label="Compartimento do bagageiro — ver na lista">
              <rect x={252} y={206} width={58} height={46} fill="rgb(var(--c-raised))" stroke={FAINT} strokeWidth={1.2} />
              <rect x={262} y={198} width={38} height={8} fill="none" stroke={FAINT} strokeWidth={1.2} />
              <rect x={322} y={186} width={56} height={40} fill="rgb(var(--c-raised))" stroke="rgb(var(--c-blue))" strokeWidth={1.2} />
              <text x={350} y={210} textAnchor="middle" fill="rgb(var(--c-blue))" fontSize={9} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.06em">
                BATERIA
              </text>
              <text x={350} y={222} textAnchor="middle" fill={FAINT} fontSize={8} fontFamily="'IBM Plex Mono', monospace">
                12 V · 35 A·h
              </text>
              <text x={281} y={266} textAnchor="middle" fill={FAINT} fontSize={8} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.08em">
                MÁX 45 KGF
              </text>
            </g>
          </motion.g>

          {/* porta (dobradiça à esquerda) — shake se trancada */}
          <motion.g
            key={shake}
            animate={shake > 0 && door === 'locked' ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* dobradiças (fixas — fora do grupo que gira) */}
            <rect x={234} y={164} width={6} height={16} fill={DIM} />
            <rect x={234} y={240} width={6} height={16} fill={DIM} />
            <motion.g
              initial={false}
              animate={{ scaleX: door === 'open' ? 0.14 : 1, opacity: door === 'open' ? 0.85 : 1 }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              style={{ transformOrigin: '0% 50%', cursor: 'pointer' }}
              onClick={tryDoor}
              role="button"
              aria-label={door === 'open' ? 'Fechar a porta do bagageiro' : 'Porta do bagageiro'}
            >
              <rect
                x={238}
                y={148}
                width={156}
                height={124}
                rx={6}
                fill="rgb(var(--c-raised))"
                stroke={door === 'locked' ? c : door === 'unlocked' ? 'rgb(var(--c-amber))' : 'rgb(var(--c-red))'}
                strokeWidth={1.5}
              />
              <text x={316} y={176} textAnchor="middle" fill={FAINT} fontSize={9} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.14em">
                PORTA DO BAGAGEIRO
              </text>
            </motion.g>
          </motion.g>

          {/* fechadura + chave */}
          <g onClick={fc(0)} style={{ cursor: 'pointer' }} role="button" aria-label="Mecanismo de fechamento e travamento — ver na lista">
            <motion.circle
              cx={368}
              cy={238}
              r={13}
              fill="rgb(var(--c-panel))"
              initial={false}
              animate={{
                stroke: door === 'locked' ? 'rgb(var(--c-green))' : door === 'unlocked' ? 'rgb(var(--c-amber))' : 'rgb(var(--c-red))',
              }}
              strokeWidth={2}
            />
            <motion.line
              x1={368}
              y1={238}
              x2={368}
              y2={228}
              stroke={door === 'locked' ? 'rgb(var(--c-green))' : 'rgb(var(--c-amber))'}
              strokeWidth={2.5}
              strokeLinecap="round"
              initial={false}
              animate={{ rotate: door === 'locked' ? 90 : 0 }}
              style={{ transformOrigin: '50% 100%' }}
              transition={{ duration: 0.3 }}
            />
            <text x={368} y={292} textAnchor="middle" fill={FAINT} fontSize={8.5} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.12em">
              TRAVA + CHAVE
            </text>
          </g>

          {/* cotas */}
          <g stroke={FAINT} strokeWidth={1} opacity={0.7}>
            <line x1={238} y1={330} x2={394} y2={330} />
            <line x1={238} y1={326} x2={238} y2={334} />
            <line x1={394} y1={326} x2={394} y2={334} />
          </g>
          <text x={316} y={346} textAnchor="middle" fill={FAINT} fontSize={8.5} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.12em">
            ACESSO AO COMPARTIMENTO DIANTEIRO
          </text>
        </svg>
      </DiagramShell>

      <SopImage
        src="/sop-baggage-key.png"
        alt="Foto original da chave da porta do bagageiro do nariz (página 55 do SOP)"
      />
    </div>
  )
}
