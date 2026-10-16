import { motion } from 'framer-motion'
import CalloutBanner from '@/components/ui-custom/CalloutBanner'
import { REGRAS_CURVAS } from './data'

const MECH = [0.7, 0, 0.2, 1] as const

export default function TetoCurvas() {
  return (
    <div className="grid gap-10 lg:grid-cols-12">
      {/* teto monomotor */}
      <div className="lg:col-span-7">
        <div className="border border-hairline bg-panel/60 p-6 md:p-8">
          <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">Perfil de subida — bimotor × monomotor</p>
          <svg viewBox="0 0 640 320" className="w-full" role="img" aria-label="Curvas de subida bimotor e monomotor até seus tetos">
            {/* grid */}
            {[0, 1, 2, 3, 4].map((i) => (
              <line key={i} x1="40" y1={280 - i * 60} x2="620" y2={280 - i * 60} stroke="rgb(var(--c-hairline))" strokeWidth="1" strokeDasharray="2 6" />
            ))}
            {/* teto bimotor 18.000 (fora da escala — indicado) */}
            <line x1="40" y1="30" x2="620" y2="30" stroke="rgb(var(--c-cyan))" strokeWidth="1" strokeDasharray="8 6" strokeOpacity="0.5" />
            <text x="616" y="22" textAnchor="end" fontFamily="IBM Plex Mono, monospace" fontSize="11" fill="rgb(var(--c-cyan))" fillOpacity="0.8">TETO BIMOTOR 18.000 FT</text>
            {/* teto absoluto mono 5.000 */}
            <line x1="40" y1="140" x2="620" y2="140" stroke="rgb(var(--c-blue))" strokeWidth="1" strokeDasharray="8 6" strokeOpacity="0.6" />
            <text x="616" y="132" textAnchor="end" fontFamily="IBM Plex Mono, monospace" fontSize="11" fill="rgb(var(--c-blue))">TETO ABSOLUTO MONO 5.000 FT</text>
            {/* teto de serviço mono 3.650 */}
            <line x1="40" y1="168" x2="620" y2="168" stroke="rgb(var(--c-green))" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.6" />
            <text x="616" y="160" textAnchor="end" fontFamily="IBM Plex Mono, monospace" fontSize="11" fill="rgb(var(--c-green))">TETO DE SERVIÇO MONO 3.650 FT (50 FT/MIN)</text>
            {/* curva bimotor */}
            <motion.path
              d="M 40 280 C 200 270 320 140 600 36"
              fill="none" stroke="rgb(var(--c-cyan))" strokeWidth="2.5"
              initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
              transition={{ duration: 1.6, ease: MECH }}
            />
            {/* curva monomotor */}
            <motion.path
              d="M 40 280 C 220 276 380 210 600 148"
              fill="none" stroke="rgb(var(--c-blue))" strokeWidth="2.5"
              initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
              transition={{ duration: 1.6, delay: 0.3, ease: MECH }}
            />
            {/* eixos */}
            <line x1="40" y1="20" x2="40" y2="280" stroke="rgb(var(--c-faint))" strokeWidth="1.5" />
            <line x1="40" y1="280" x2="620" y2="280" stroke="rgb(var(--c-faint))" strokeWidth="1.5" />
            <text x="46" y="296" fontFamily="IBM Plex Mono, monospace" fontSize="10" fill="rgb(var(--c-faint))">TEMPO / DISTÂNCIA →</text>
            <text x="16" y="26" fontFamily="IBM Plex Mono, monospace" fontSize="10" fill="rgb(var(--c-faint))" transform="rotate(-90 16 26)">ALTITUDE</text>
            {/* legendas */}
            <circle cx="60" cy="306" r="4" fill="rgb(var(--c-cyan))" /><text x="72" y="310" fontFamily="IBM Plex Mono, monospace" fontSize="10" fill="rgb(var(--c-muted))">BIMOTOR</text>
            <circle cx="150" cy="306" r="4" fill="rgb(var(--c-blue))" /><text x="162" y="310" fontFamily="IBM Plex Mono, monospace" fontSize="10" fill="rgb(var(--c-muted))">MONOMOTOR</text>
          </svg>
        </div>
        <div className="mt-5">
          <CalloutBanner variant="nota" title="Driftdown">
            Teto de serviço monomotor é a máxima altitude ensaiada em que a aeronave ainda sobe a 50 ft/min, em ar
            calmo, com uma hélice embandeirada. Acima do teto monomotor, a Vyse indica a{' '}
            <strong className="text-ink">menor razão de descida</strong> — durante a falha de um motor haverá driftdown
            de altitude e velocidade.
          </CalloutBanner>
        </div>
      </div>
      {/* curvas monomotor */}
      <div className="lg:col-span-5">
        <h3 className="font-display text-2xl font-semibold text-ink">11.6 — Curvas monomotor</h3>
        <ul className="mt-5 space-y-4">
          {REGRAS_CURVAS.map((r, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex gap-3 border-b border-hairline pb-4 text-[15px] leading-relaxed text-muted"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
              {r}
            </motion.li>
          ))}
        </ul>
        <div className="mt-6">
          <CalloutBanner variant="cuidado" title="Limite prático">
            Evite curvas a baixa altura e inclinação acima de 30° voando monomotor — e nunca para o lado do motor
            inoperante.
          </CalloutBanner>
        </div>
      </div>
    </div>
  )
}
