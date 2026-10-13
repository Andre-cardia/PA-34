// Faixa central da Seção 3 — tacômetro SVG duplo (design/especificacoes.md §3).
// Arcos reais de especificacoes.tacometro: verde 500–2200, cautela 2200–2400,
// linha vermelha 2700. Agulhas com gauge sweep até 2000 RPM ao entrar no viewport.

import { useEffect, useRef } from 'react'
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion'
import { especificacoes } from '@/data'
import { arcPath, parseFirstNumber, parseRange, polarToXY, valueToAngle } from './gauge'

const CX = 150
const CY = 138
const R_ARC = 108
const R_TICK = 108
const R_NEEDLE = 84
const V_MIN = 0
const V_MAX = 2800
const A0 = -120
const SWEEP = 240
const TARGET = 2000

const angle = (v: number) => valueToAngle(v, V_MIN, V_MAX, A0, SWEEP)

// Dados do SOP (especificacoes.json → tacometro)
const VERDE = parseRange(especificacoes.tacometro.faixa_verde_operacao_normal)
const CAUTELA = parseRange(especificacoes.tacometro.faixa_vermelha_operacao_com_cautela)
const REDLINE = parseFirstNumber(especificacoes.tacometro.linha_vermelha_limite_maximo)

const MAJORS = [0, 500, 1000, 1500, 2000, 2500]
const MINORS: number[] = []
for (let v = 250; v <= 2750; v += 250) if (v % 500 !== 0) MINORS.push(v)

function Tachometer({ label, delay }: { label: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })
  const rpm = useMotionValue(0)

  useEffect(() => {
    if (!inView) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      rpm.set(TARGET)
      return
    }
    const c = animate(rpm, TARGET, { duration: 1.6, delay, ease: [0.7, 0, 0.2, 1] })
    return () => c.stop()
  }, [inView, rpm, delay])

  const nx = useTransform(rpm, (v) => polarToXY(CX, CY, R_NEEDLE, angle(v)).x)
  const ny = useTransform(rpm, (v) => polarToXY(CX, CY, R_NEEDLE, angle(v)).y)
  const tx = useTransform(rpm, (v) => polarToXY(CX, CY, -16, angle(v)).x)
  const ty = useTransform(rpm, (v) => polarToXY(CX, CY, -16, angle(v)).y)
  const readout = useTransform(rpm, (v) => String(Math.round(v / 10) * 10))

  return (
    <div ref={ref} className="relative border border-hairline bg-panel p-5">
      <p className="text-center font-mono text-[11px] uppercase tracking-[0.22em] text-faint">{label}</p>
      <svg viewBox="0 0 300 220" className="mt-2 w-full" role="img" aria-label={`Tacômetro ${label}: arco verde ${VERDE[0]} a ${VERDE[1]} RPM, cautela ${CAUTELA[0]} a ${CAUTELA[1]} RPM, linha vermelha ${REDLINE} RPM`}>
        {/* aro externo */}
        <circle cx={CX} cy={CY} r={R_ARC + 16} fill="none" stroke="#1E2C3D" strokeWidth="1" />
        {/* arcos de operação */}
        <path d={arcPath(CX, CY, R_ARC, angle(VERDE[0]), angle(VERDE[1]))} stroke="#3DDC97" strokeWidth="9" fill="none" />
        <path d={arcPath(CX, CY, R_ARC, angle(CAUTELA[0]), angle(CAUTELA[1]))} stroke="#FF4D4D" strokeWidth="9" fill="none" opacity="0.85" />
        {/* ticks */}
        {MINORS.map((v) => {
          const p1 = polarToXY(CX, CY, R_TICK - 6, angle(v))
          const p2 = polarToXY(CX, CY, R_TICK + 2, angle(v))
          return <line key={v} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#54687E" strokeWidth="1" />
        })}
        {MAJORS.map((v) => {
          const p1 = polarToXY(CX, CY, R_TICK - 11, angle(v))
          const p2 = polarToXY(CX, CY, R_TICK + 2, angle(v))
          const pt = polarToXY(CX, CY, R_TICK - 24, angle(v))
          return (
            <g key={v}>
              <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#93A6BB" strokeWidth="1.6" />
              <text x={pt.x} y={pt.y + 3.5} textAnchor="middle" fill="#93A6BB" fontSize="11" fontFamily="'IBM Plex Mono', monospace">
                {v}
              </text>
            </g>
          )
        })}
        {/* linha vermelha 2700 */}
        {(() => {
          const p1 = polarToXY(CX, CY, R_TICK - 13, angle(REDLINE))
          const p2 = polarToXY(CX, CY, R_TICK + 4, angle(REDLINE))
          return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#FF4D4D" strokeWidth="3.5" />
        })()}
        {/* agulha */}
        <motion.line x1={tx} y1={ty} x2={nx} y2={ny} stroke="#E8F0F7" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx={CX} cy={CY} r="9" fill="#0A1018" stroke="#3FE0FF" strokeWidth="1.4" />
        <circle cx={CX} cy={CY} r="2.4" fill="#3FE0FF" />
        {/* leitura digital */}
        <rect x={CX - 44} y={CY + 44} width="88" height="26" fill="#05080D" stroke="#1E2C3D" />
        <motion.text x={CX} y={CY + 62} textAnchor="middle" fill="#3FE0FF" fontSize="15" fontFamily="'IBM Plex Mono', monospace">
          {readout}
        </motion.text>
        <text x={CX + 56} y={CY + 62} fill="#54687E" fontSize="10" fontFamily="'IBM Plex Mono', monospace">
          RPM
        </text>
      </svg>
      {/* legenda dos arcos */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-green" aria-hidden="true" /> {VERDE[0]}–{VERDE[1]}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-red" aria-hidden="true" /> {CAUTELA[0]}–{CAUTELA[1]} cautela
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-px bg-red" aria-hidden="true" /> {REDLINE} máx
        </span>
      </div>
    </div>
  )
}

export default function TacometroDuplo() {
  return (
    <div className="mt-10">
      <p className="mb-4 text-center font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
        {'// Tacômetro — marcações do SOP 5.1 (por motor)'}
      </p>
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
        <Tachometer label="Motor esquerdo" delay={0} />
        <Tachometer label="Motor direito" delay={0.15} />
      </div>
    </div>
  )
}
