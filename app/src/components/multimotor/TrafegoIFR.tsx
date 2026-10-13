import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { TRAFEGO_NOTAS, IFR_PASSOS } from './data'

const MECH = [0.7, 0, 0.2, 1] as const

export default function TrafegoIFR() {
  return (
    <div className="grid gap-10 lg:grid-cols-12">
      {/* circuito de tráfego */}
      <div className="lg:col-span-7">
        <div className="border border-hairline bg-panel/60 p-6 md:p-8">
          <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">Circuito de tráfego monomotor — mais largo, mais raso</p>
          <svg viewBox="0 0 640 360" className="w-full" role="img" aria-label="Circuito de tráfego visual monomotor">
            {/* pista */}
            <rect x="230" y="150" width="180" height="26" fill="#101926" stroke="#54687E" strokeWidth="1.5" />
            <line x1="240" y1="163" x2="400" y2="163" stroke="#E9E4D8" strokeWidth="1.5" strokeDasharray="10 8" strokeOpacity="0.5" />
            {/* circuito */}
            <motion.path
              d="M 410 163 L 520 163 L 560 80 L 520 60 L 140 60 L 90 163 L 226 163"
              fill="none" stroke="#3FE0FF" strokeWidth="2.5"
              initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
              transition={{ duration: 2.2, ease: MECH }}
            />
            {/* rótulos das pernas */}
            {[
              { x: 470, y: 185, t: 'SUBIDA' },
              { x: 545, y: 120, t: 'TRAVESS' },
              { x: 320, y: 46, t: 'PERNA DO VENTO' },
              { x: 108, y: 120, t: 'BASE' },
              { x: 150, y: 185, t: 'FINAL' },
            ].map((l) => (
              <text key={l.t} x={l.x} y={l.y} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="11" letterSpacing="1.5" fill="#93A6BB">
                {l.t}
              </text>
            ))}
            {/* marcações do SOP */}
            <g>
              <circle cx="520" cy="60" r="5" fill="#3DDC97" />
              <text x="534" y="56" fontFamily="IBM Plex Mono, monospace" fontSize="10" fill="#3DDC97">TREM BAIXADO (TRAVESS DA CABECEIRA)</text>
              <circle cx="140" cy="60" r="5" fill="#FFB020" />
              <text x="128" y="82" textAnchor="end" fontFamily="IBM Plex Mono, monospace" fontSize="10" fill="#FFB020">FLAPS NA CURTA FINAL</text>
            </g>
          </svg>
        </div>
        <ul className="mt-5 space-y-3">
          {TRAFEGO_NOTAS.map((n, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex gap-3 text-[15px] leading-relaxed text-muted"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" />
              {n}
            </motion.li>
          ))}
        </ul>
      </div>
      {/* IFR monomotor */}
      <div className="lg:col-span-5">
        <h3 className="font-display text-2xl font-semibold text-ink">11.8 — Procedimento IFR monomotor</h3>
        <div className="mt-5 space-y-3">
          {IFR_PASSOS.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex items-start gap-3 border border-hairline bg-raised/60 p-4"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border border-cyan/50 text-cyan">
                <Check className="h-3.5 w-3.5" />
              </span>
              <p className="font-mono text-sm leading-relaxed text-ink">{p}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-6 border border-hairline bg-panel/60 p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Referência de performance</p>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            Teto de serviço monomotor: <strong className="font-mono text-green">3.650 ft</strong> · Teto absoluto:{' '}
            <strong className="font-mono text-blue">5.000 ft</strong> — planeje a rota e a MSA em função disso.
          </p>
        </div>
      </div>
    </div>
  )
}
