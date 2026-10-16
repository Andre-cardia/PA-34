import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, OctagonAlert } from 'lucide-react'
import { PASSOS_IDENTIFICACAO } from './data'
import { cn } from '@/lib/utils'

const MECH = [0.7, 0, 0.2, 1] as const

function PropDisc({ x, spinning, dead }: { x: number; spinning: boolean; dead: boolean }) {
  return (
    <g transform={`translate(${x},0)`}>
      <circle r="30" fill="none" stroke={dead ? 'rgb(var(--c-red))' : 'rgb(var(--c-cyan))'} strokeOpacity={dead ? 0.5 : 0.35} strokeWidth="1.5" />
      <motion.g
        animate={{ rotate: spinning ? 360 : 0 }}
        transition={spinning ? { duration: 0.7, repeat: Infinity, ease: 'linear' } : { duration: 1.1, ease: MECH }}
        style={{ originX: '0px', originY: '0px' }}
      >
        {[0, 60, 120].map((a) => (
          <line key={a} x1="-26" y1="0" x2="26" y2="0" stroke={dead ? 'rgb(var(--c-faint))' : 'rgb(var(--c-cyan))'} strokeWidth="2" strokeOpacity={dead ? 0.6 : 0.9} transform={`rotate(${a})`} />
        ))}
      </motion.g>
      <circle r="4" fill={dead ? 'rgb(var(--c-red))' : 'rgb(var(--c-ink))'} />
    </g>
  )
}

export default function AssimetriaDemo() {
  const [pane, setPane] = useState(false)
  const [passo, setPasso] = useState(0)

  const reset = () => {
    setPane(false)
    setPasso(0)
  }

  // bolinha do coordenador: deslocada p/ esquerda na pane, centro após passo 1, meia-bolinha após passo 4
  const ballX = !pane ? 0 : passo === 0 ? -16 : passo >= 4 ? 7 : 0
  const bank = pane && passo >= 2 ? -5 : 0

  return (
    <div className="border border-hairline bg-panel/60 p-5 md:p-8">
      {/* palco SVG */}
      <div className="relative mx-auto max-w-[720px]">
        <svg viewBox="-260 -300 520 470" className="w-full" role="img" aria-label="Diagrama interativo do voo assimétrico">
          {/* seta de guinada */}
          <AnimatePresence>
            {pane && passo === 0 && (
              <motion.path
                key="yaw"
                d="M 0 -160 Q -110 -140 -140 -60"
                fill="none"
                stroke="rgb(var(--c-red))"
                strokeWidth="3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: MECH }}
                markerEnd="url(#arrowRed)"
              />
            )}
          </AnimatePresence>
          <defs>
            <marker id="arrowRed" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="rgb(var(--c-red))" />
            </marker>
          </defs>

          {/* vetor de tração do motor bom (direito) */}
          <motion.g animate={{ opacity: pane ? 1 : 0.55 }} transition={{ duration: 0.6 }}>
            {[0, 1, 2].map((i) => (
              <motion.line
                key={i}
                x1={80 + i * 12}
                y1={-160}
                x2={80 + i * 12}
                y2={pane ? -240 : -200}
                stroke="rgb(var(--c-green))"
                strokeWidth="2.5"
                strokeOpacity={pane ? 0.9 : 0.4}
                animate={{ y2: pane ? -240 : -200 }}
                transition={{ duration: 0.6, ease: MECH }}
              />
            ))}
          </motion.g>
          {/* vetor do motor esquerdo (some na pane) */}
          <motion.g animate={{ opacity: pane ? 0 : 0.55 }} transition={{ duration: 0.5 }}>
            {[0, 1, 2].map((i) => (
              <line key={i} x1={-104 + i * 12} y1={-160} x2={-104 + i * 12} y2={-200} stroke="rgb(var(--c-green))" strokeWidth="2.5" />
            ))}
          </motion.g>

          {/* aeronave (vista superior, nariz para cima) com bank */}
          <motion.g animate={{ rotate: bank }} transition={{ duration: 0.7, ease: MECH }} style={{ originX: '0px', originY: '0px' }}>
            {/* asa */}
            <rect x="-215" y="-70" width="430" height="34" rx="6" fill="rgb(var(--c-raised))" stroke="rgb(var(--c-hairline))" strokeWidth="1.5" />
            {/* flaps (recolhem no passo 4) */}
            <motion.rect x="-150" y="-36" width="110" height="10" fill="rgb(var(--c-overlay))" stroke="rgb(var(--c-hairline))" animate={{ opacity: passo >= 4 ? 0 : 1 }} transition={{ duration: 0.5 }} />
            <motion.rect x="40" y="-36" width="110" height="10" fill="rgb(var(--c-overlay))" stroke="rgb(var(--c-hairline))" animate={{ opacity: passo >= 4 ? 0 : 1 }} transition={{ duration: 0.5 }} />
            {/* fuselagem */}
            <path d="M 0 -220 C 16 -160 18 -60 14 40 L 10 150 L -10 150 L -14 40 C -18 -60 -16 -160 0 -220 Z" fill="rgb(var(--c-overlay))" stroke="rgb(var(--c-cyan))" strokeOpacity="0.5" strokeWidth="1.5" />
            {/* empenagem */}
            <rect x="-90" y="120" width="180" height="20" rx="5" fill="rgb(var(--c-raised))" stroke="rgb(var(--c-hairline))" strokeWidth="1.5" />
            <rect x="-8" y="120" width="16" height="58" rx="4" fill="rgb(var(--c-raised))" stroke="rgb(var(--c-hairline))" strokeWidth="1.5" />
            {/* naceles */}
            <rect x="-116" y="-120" width="48" height="130" rx="14" fill={pane ? '#1a1420' : 'rgb(var(--c-raised))'} stroke={pane ? 'rgb(var(--c-red))' : 'rgb(var(--c-hairline))'} strokeWidth="1.5" />
            <rect x="68" y="-120" width="48" height="130" rx="14" fill="rgb(var(--c-raised))" stroke="rgb(var(--c-hairline))" strokeWidth="1.5" />
            {/* trem (recolhe no passo 4) */}
            {[ -92, 92, 0 ].map((gx, i) => (
              <motion.circle key={i} cx={gx} cy={i === 2 ? 60 : 30} r="9" fill="none" stroke="rgb(var(--c-green))" strokeWidth="2.5"
                animate={{ opacity: passo >= 4 ? 0 : 0.8, scale: passo >= 4 ? 0.4 : 1 }} transition={{ duration: 0.5, delay: i * 0.1 }} />
            ))}
            {/* hélices */}
            <PropDisc x={-92} spinning={!pane} dead={pane} />
            <PropDisc x={92} spinning dead={false} />
            {/* etiqueta do motor em pane */}
            <AnimatePresence>
              {pane && (
                <motion.text
                  key="deadlabel"
                  x="-92" y="-185" textAnchor="middle"
                  fill="rgb(var(--c-red))" fontSize="15" fontFamily="IBM Plex Mono, monospace" letterSpacing="2"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                >
                  MOTOR EM PANE
                </motion.text>
              )}
            </AnimatePresence>
          </motion.g>
        </svg>

        {/* coordenador de curva (bolinha) */}
        <div className="absolute bottom-2 left-2 border border-hairline bg-abyss/90 px-4 py-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">Turn Coordinator</p>
          <svg width="120" height="34" viewBox="0 0 120 34">
            <rect x="1" y="1" width="118" height="32" fill="none" stroke="rgb(var(--c-hairline))" />
            <line x1="60" y1="6" x2="60" y2="28" stroke="rgb(var(--c-hairline))" strokeDasharray="3 3" />
            <motion.circle r="6" fill="rgb(var(--c-ink))" animate={{ cx: 60 + ballX }} transition={{ duration: 0.6, ease: MECH }} cy="17" />
          </svg>
          <p className={cn('mt-1.5 font-mono text-[10px] tracking-[0.1em]', pane && passo >= 4 ? 'text-green' : 'text-faint')}>
            {pane && passo >= 4 ? 'MEIA BOLINHA ESPIRRADA ✓' : pane && passo === 0 ? 'BOLINHA DESLOCADA' : 'BOLINHA CENTRALIZADA'}
          </p>
        </div>

        {/* manetes */}
        <div className="absolute bottom-2 right-2 flex gap-2">
          {['MISTURA', 'PASSO', 'POTÊNCIA'].map((m, i) => (
            <motion.div
              key={m}
              animate={{ y: passo >= 3 ? -14 : 0, borderColor: passo >= 3 ? 'rgb(var(--c-green))' : 'rgb(var(--c-hairline))' }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: MECH }}
              className="border bg-abyss/90 px-2.5 py-2 text-center"
            >
              <div className={cn('mx-auto mb-1.5 h-6 w-1 rounded-full', passo >= 3 ? 'bg-green' : 'bg-faint')} />
              <p className="font-mono text-[9px] tracking-[0.12em] text-muted">{m}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* chip Vyse */}
      <div className="mt-4 flex justify-center">
        <motion.div
          animate={{ opacity: passo >= 4 ? 1 : 0.3, scale: passo >= 4 ? 1 : 0.96 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 border border-blue/50 bg-blue/10 px-4 py-2"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-blue" />
          <span className="font-mono text-xs tracking-[0.14em] text-blue">VYSE 105 MPH (91 KT) — LINHA AZUL · MÍNIMO ARRASTO</span>
        </motion.div>
      </div>

      {/* controles */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={() => {
            if (pane) reset()
            else setPane(true)
          }}
          className={cn(
            'flex items-center gap-2 border px-4 py-2.5 font-mono text-xs uppercase tracking-[0.14em] transition-colors',
            pane ? 'border-red/60 bg-red/10 text-red' : 'border-hairline bg-raised text-muted hover:border-red/40 hover:text-red',
          )}
        >
          <OctagonAlert className="h-3.5 w-3.5" />
          {pane ? 'MOTOR ESQ. EM PANE: ON' : 'SIMULAR PANE NO MOTOR ESQ.'}
        </button>
        <button
          onClick={reset}
          className="flex items-center gap-2 border border-hairline bg-raised px-4 py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Resetar demo
        </button>
      </div>

      {/* passos da técnica */}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {PASSOS_IDENTIFICACAO.map((p) => {
          const ativo = passo === p.id - 1 && pane
          const feito = passo >= p.id
          return (
            <button
              key={p.id}
              disabled={!pane || passo !== p.id - 1}
              onClick={() => setPasso(p.id)}
              className={cn(
                'border p-4 text-left transition-all duration-300',
                feito
                  ? 'border-green/50 bg-green/[0.07]'
                  : ativo
                    ? 'border-cyan/60 bg-cyan/[0.08] shadow-[0_0_24px_rgb(var(--c-cyan) / 0.12)]'
                    : 'border-hairline bg-raised/60 opacity-50',
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center border font-mono text-xs',
                    feito ? 'border-green/60 text-green' : ativo ? 'border-cyan/60 text-cyan' : 'border-hairline text-faint',
                  )}
                >
                  {feito ? '✓' : p.id}
                </span>
                <p className={cn('font-mono text-xs font-medium tracking-[0.08em]', feito ? 'text-green' : ativo ? 'text-cyan' : 'text-muted')}>
                  {p.titulo}
                </p>
              </div>
              <AnimatePresence initial={false}>
                {(ativo || feito) && (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-2.5 overflow-hidden pl-10 text-[13px] leading-relaxed text-muted"
                  >
                    {p.texto}
                  </motion.p>
                )}
              </AnimatePresence>
            </button>
          )
        })}
      </div>
    </div>
  )
}
