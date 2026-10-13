// Seção 4 — Índice do SOP (home.md §4): fichas de seção navegáveis.

import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import SectionHeader from '@/components/ui-custom/SectionHeader'
import { counts } from '@/data'

const FICHAS = [
  { secao: '01–04', titulo: 'Introdução, Manual & Standard Callouts', sub: 'Filosofia do documento, convenções e fraseologia padrão.', to: '/seguranca' },
  { secao: '05', titulo: 'Generalidades, Especificações & Limitações', sub: 'Ficha técnica, arcos do velocímetro e limites operacionais.', to: '/especificacoes' },
  { secao: '06–07', titulo: 'Performance & Planejamento de Voo', sub: 'V-speeds, distâncias, tetos, alcance e esteiras de planejamento.', to: '/performance' },
  { secao: '08', titulo: 'Sistemas Avançados (8.1–8.7)', sub: 'Combustível, elétrico, vácuo, trem de pouso e mais — em detalhe.', to: '/sistemas' },
  { secao: '10', titulo: `Procedimentos Normais — ${counts.procedimentos} fases`, sub: 'Da inspeção pré-voo ao pós-voo, com checklists interativos.', to: '/procedimentos' },
  { secao: '11', titulo: 'Técnicas de Pilotagem Multimotor', sub: 'Voo assimétrico, VMC e a física do motor crítico.', to: '/multimotor' },
  { secao: '12', titulo: `Procedimentos de Emergência — ${counts.emergencias} procedimentos`, sub: 'Fluxos, itens de memória e notas críticas de cada cenário.', to: '/emergencias', alerta: true },
]

export default function SopIndex() {
  return (
    <section className="border-b border-hairline bg-panel py-[72px] md:py-[120px]">
      <div className="mx-auto max-w-content px-6 md:px-12">
        <SectionHeader
          kicker="// SUMÁRIO — SOP VOEFLORIPA REV.13"
          title="O documento, virado site."
          measure={`${FICHAS.length} BLOCOS · 10 PÁGINAS`}
        />
        <div className="mt-14 grid gap-x-12 md:grid-cols-2">
          {FICHAS.map((f, i) => (
            <motion.div
              key={f.secao}
              className="min-w-0"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                to={f.to}
                className="group flex min-w-0 items-center gap-4 border-b border-hairline py-7 transition-transform duration-300 ease-out-expo hover:translate-x-2 md:gap-6"
              >
                <motion.span
                  initial={{ opacity: 0, rotateX: 90 }}
                  whileInView={{ opacity: 1, rotateX: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.15 + i * 0.06 }}
                  className="w-24 shrink-0 font-mono text-[42px] font-medium leading-none text-faint transition-colors duration-300 group-hover:text-cyan md:text-[56px]"
                  aria-hidden="true"
                >
                  {f.secao}
                </motion.span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-3 font-display text-xl font-semibold tracking-tight text-ink md:text-2xl">
                    {f.titulo}
                    {f.alerta && (
                      <span className="border border-red/50 bg-red/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-red group-hover:animate-pulse">
                        Itens de memória
                      </span>
                    )}
                  </span>
                  <span className="mt-1.5 block truncate text-sm text-muted">{f.sub}</span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 -translate-x-2 text-cyan opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden="true" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
