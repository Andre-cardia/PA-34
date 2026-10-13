// FluxoEmergencia — Seção 5 de /procedimentos: ponte com o SOP 12.
// 3 cards-alert (rail red) com situação verbatim de emergencias.json e link
// para a âncora correspondente em /emergencias.

import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { ArrowRight, Siren } from 'lucide-react'
import { emergencias } from '@/data'
import SectionHeader from '@/components/ui-custom/SectionHeader'

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

const ALERTS = [
  { id: '12.6', titulo: 'PANE DE MOTOR NA DECOLAGEM' },
  { id: '12.8', titulo: 'ARREMETIDA MONOMOTOR' },
  { id: '12.11', titulo: 'POUSO COM TREM RECOLHIDO' },
]

export default function FluxoEmergencia() {
  return (
    <section className="border-b border-hairline bg-panel py-[72px] md:py-[120px]">
      <div className="mx-auto max-w-content px-6 md:px-12">
        <SectionHeader
          kicker="// PONTE — SEÇÃO 12 SOP REV.13"
          title="Se algo sair do normal em qualquer fase, o fluxo está aqui."
          measure="SOP 12.1–12.21"
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {ALERTS.map((a, i) => {
            const em = emergencias.find((e) => e.id === a.id)
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10% 0px' }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
              >
                <Link
                  to={`/emergencias#${a.id.replace('.', '-')}`}
                  className="group relative block h-full overflow-hidden border border-hairline bg-raised p-6 pl-7 transition-colors hover:border-red/50"
                >
                  {/* rail red — pulsa 2× ao entrar (annunciator), depois sólido */}
                  <motion.span
                    initial={{ opacity: 0.15 }}
                    whileInView={{ opacity: [0.15, 1, 0.15, 1] }}
                    viewport={{ once: true, margin: '-10% 0px' }}
                    transition={{ duration: 0.9, delay: 0.3 + i * 0.1, times: [0, 0.33, 0.66, 1] }}
                    className="absolute inset-y-0 left-0 w-[3px] bg-red"
                    aria-hidden="true"
                  />
                  <div className="flex items-center gap-2">
                    <Siren className="h-4 w-4 text-red" strokeWidth={1.75} aria-hidden="true" />
                    <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-red">
                      SOP {a.id}
                    </span>
                  </div>
                  <p className="mt-3 font-display text-lg font-semibold leading-snug text-ink">{a.titulo}</p>
                  {em && <p className="mt-2 text-sm leading-relaxed text-muted">{em.situacao}</p>}
                  <span className="mt-4 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-cyan">
                    Ver procedimento
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
