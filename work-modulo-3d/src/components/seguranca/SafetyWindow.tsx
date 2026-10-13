import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, RotateCcw } from 'lucide-react'
import { SEQ_DECOLAGEM } from './data'
import { cn } from '@/lib/utils'

const TICKS_X = [70, 150, 220, 290, 370, 470, 560]

export default function SafetyWindow() {
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(-1)
  const [typed, setTyped] = useState('')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clear = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  const start = () => {
    clear()
    setRunning(true)
    setStep(-1)
    setTyped('')
    let t = 400
    SEQ_DECOLAGEM.forEach((s, i) => {
      timers.current.push(setTimeout(() => {
        setStep(i)
        setTyped('')
        // typewriter
        for (let c = 1; c <= s.fala.length; c++) {
          timers.current.push(setTimeout(() => setTyped(s.fala.slice(0, c)), c * 45))
        }
      }, t))
      t += 400 + s.fala.length * 45 + 1300
    })
    timers.current.push(setTimeout(() => setRunning(false), t + 300))
  }

  const reset = () => {
    clear()
    setRunning(false)
    setStep(-1)
    setTyped('')
  }

  useEffect(() => clear, [])

  return (
    <div className="border border-hairline bg-panel/60 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">Simular sequência de decolagem — coreografia de callouts</p>
        <div className="flex gap-2">
          <button
            onClick={start}
            disabled={running}
            className={cn(
              'flex items-center gap-2 border px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] transition-colors',
              running ? 'border-hairline text-faint' : 'border-cyan/60 bg-cyan/10 text-cyan hover:bg-cyan/20',
            )}
          >
            <Play className="h-3.5 w-3.5" /> Iniciar
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-2 border border-hairline bg-raised px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reiniciar
          </button>
        </div>
      </div>

      {/* diagrama */}
      <svg viewBox="0 0 640 220" className="mt-6 w-full" role="img" aria-label="Safety window da decolagem">
        {/* janela de segurança */}
        <motion.rect
          x="370" y="30" width="240" height="130" fill="#3DDC97" fillOpacity="0.08" stroke="#3DDC97" strokeOpacity="0.4" strokeDasharray="5 4"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
        />
        <text x="490" y="46" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="10" fill="#3DDC97" letterSpacing="2">SAFETY WINDOW</text>
        {/* pista */}
        <rect x="20" y="160" width="340" height="14" fill="#101926" stroke="#54687E" />
        {/* trajetória */}
        <motion.path
          d="M 30 160 L 360 160 Q 420 158 460 110 L 620 50"
          fill="none" stroke="#3FE0FF" strokeWidth="2.5"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.8, ease: [0.7, 0, 0.2, 1] }}
        />
        {/* ticks dos callouts */}
        {SEQ_DECOLAGEM.map((s, i) => (
          <g key={i}>
            <motion.line
              x1={TICKS_X[i]} y1={s.tick >= 5 ? 120 : 190} x2={TICKS_X[i]} y2={s.tick >= 5 ? 100 : 176}
              stroke={step >= i ? '#3FE0FF' : '#1E2C3D'} strokeWidth="2"
            />
            <motion.circle
              cx={TICKS_X[i]} cy={s.tick >= 5 ? 96 : 196} r={step === i ? 6 : 4}
              fill={step >= i ? '#3FE0FF' : '#101926'}
              stroke={step >= i ? '#3FE0FF' : '#54687E'}
              animate={step === i ? { scale: [1, 1.35, 1] } : {}}
              transition={{ duration: 0.5 }}
            />
          </g>
        ))}
      </svg>

      {/* fala atual */}
      <div className="mt-4 flex min-h-[88px] items-center justify-center border border-hairline bg-abyss/70 p-6">
        <AnimatePresence mode="wait">
          {step >= 0 ? (
            <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="text-center">
              <p className="font-mono text-xl font-semibold tracking-[0.06em] text-cyan md:text-3xl">
                {typed}
                <span className="animate-pulse">▌</span>
              </p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">{SEQ_DECOLAGEM[step].quem}</p>
            </motion.div>
          ) : (
            <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-xs uppercase tracking-[0.18em] text-faint">
              Pressione INICIAR para percorrer os 7 callouts da decolagem
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
