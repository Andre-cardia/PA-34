// MiniGauge — mostrador SVG com gauge sweep ao entrar no viewport
// (design.md §5.2): agulha 0→valor em 1.2s ease mecânico + count-up mono.

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { useCountUp } from '@/hooks/useCountUp'

interface Props {
  label: string // ex.: "RPM"
  value: number // valor final (ex.: 2700)
  max: number // fundo de escala
  unit?: string
  decimals?: number
  ticks?: number // marcações
  blueLineAt?: number // linha azul (Vyse no ASI)
  redLineAt?: number
  formatValue?: (v: number) => string
}

const R = 34
const START = -210 // graus (0 = topo, sentido horário)
const END = 30

function polar(angleDeg: number, radius: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180
  return { x: 50 + radius * Math.cos(a), y: 50 + radius * Math.sin(a) }
}

export default function MiniGauge({ label, value, max, unit, decimals = 0, ticks = 5, blueLineAt, redLineAt, formatValue }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  // A faixa de instrumentos fica encostada ao rodapé do hero; uma margem
  // negativa de viewport a mantinha fora da área observada no primeiro frame.
  const inView = useInView(ref, { once: true, margin: '0px' })
  const [needleOn, setNeedleOn] = useState(false)
  const display = useCountUp(value, { duration: 1200, decimals, start: inView })

  useEffect(() => {
    if (inView) {
      const t = window.setTimeout(() => setNeedleOn(true), 60)
      return () => window.clearTimeout(t)
    }
  }, [inView])

  const frac = Math.min(1, value / max)
  const needleAngle = START + frac * (END - START)
  const tip = polar(needleOn ? needleAngle : START, R - 6)

  return (
    <div ref={ref} className="flex items-center gap-3">
      <svg viewBox="0 0 100 100" className="h-16 w-16" role="img" aria-label={`${label}: ${value}${unit ?? ''}`}>
        {/* arco de fundo */}
        <path
          d={`M ${polar(START, R).x} ${polar(START, R).y} A ${R} ${R} 0 1 1 ${polar(END, R).x} ${polar(END, R).y}`}
          fill="none"
          stroke="rgb(var(--c-hairline))"
          strokeWidth="2"
        />
        {/* arco ativo */}
        <path
          d={`M ${polar(START, R).x} ${polar(START, R).y} A ${R} ${R} 0 1 1 ${polar(needleOn ? needleAngle : START, R).x} ${polar(needleOn ? needleAngle : START, R).y}`}
          fill="none"
          stroke="rgb(var(--c-cyan))"
          strokeWidth="2"
          style={{ transition: 'all 1.2s cubic-bezier(0.7, 0, 0.2, 1)' }}
        />
        {/* ticks */}
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const a = START + (i / ticks) * (END - START)
          const p1 = polar(a, R - 3)
          const p2 = polar(a, R - 7)
          return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgb(var(--c-faint))" strokeWidth="1" />
        })}
        {/* linha azul / vermelha */}
        {blueLineAt !== undefined &&
          (() => {
            const a = START + (blueLineAt / max) * (END - START)
            const p1 = polar(a, R - 2)
            const p2 = polar(a, R - 10)
            return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgb(var(--c-blue))" strokeWidth="2.5" />
          })()}
        {redLineAt !== undefined &&
          (() => {
            const a = START + (redLineAt / max) * (END - START)
            const p1 = polar(a, R - 2)
            const p2 = polar(a, R - 10)
            return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgb(var(--c-red))" strokeWidth="2.5" />
          })()}
        {/* agulha */}
        <line
          x1="50"
          y1="50"
          x2={tip.x}
          y2={tip.y}
          stroke="rgb(var(--c-ink))"
          strokeWidth="1.8"
          style={{ transition: 'all 1.2s cubic-bezier(0.7, 0, 0.2, 1)' }}
        />
        <circle cx="50" cy="50" r="3" fill="rgb(var(--c-panel))" stroke="rgb(var(--c-faint))" strokeWidth="1" />
      </svg>
      <div>
        <p className="font-mono text-lg font-medium leading-none text-ink">
          {formatValue ? formatValue(display) : display.toFixed(decimals)}
          {unit && <span className="ml-1 text-[11px] text-faint">{unit}</span>}
        </p>
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-faint">{label}</p>
      </div>
    </div>
  )
}
