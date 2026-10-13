// Seção final — Mapa cruzado sistema ↔ modelo 3D (sistemas.md).
// Tabela-mapa: sistema (chip) ↔ camada 3D ↔ nº de componentes ↔ ABRIR CAMADA.
// Encerra com CTA duplo: explodir no 3D / ver instrumentos no cockpit.

import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { ArrowRight, Box, Gauge } from 'lucide-react'
import SectionHeader from '@/components/ui-custom/SectionHeader'
import { camadas3d, sistemas } from '@/data'
import { metaFor } from './config'
import { EASE_OUT } from './utils'

export default function CrossMap() {
  return (
    <section className="relative border-t border-hairline bg-panel py-16 md:py-24" aria-label="Mapa cruzado sistema e modelo 3D">
      <div className="mx-auto max-w-content px-6 md:px-12">
        <SectionHeader
          kicker="// MAPA CRUZADO — SISTEMA ↔ MODELO 3D"
          title="Mapa dos sistemas no modelo 3D"
          measure="7 CAMADAS REMOVÍVEIS"
        />

        <div className="mt-10 overflow-hidden border border-hairline">
          {/* cabeçalho da tabela */}
          <div className="hidden grid-cols-12 gap-4 border-b border-hairline bg-raised px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-faint md:grid">
            <span className="col-span-4">Sistema — SOP 08</span>
            <span className="col-span-5">Camada no modelo 3D</span>
            <span className="col-span-2 text-right">Componentes</span>
            <span className="col-span-1" />
          </div>
          {sistemas.map((s, i) => {
            const meta = metaFor(s)
            const camada = camadas3d.find((cd) => cd.id === meta.camada3d)
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-8% 0px' }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: EASE_OUT }}
                className="grid grid-cols-2 items-center gap-4 border-b border-hairline px-5 py-4 transition-colors last:border-b-0 hover:bg-raised md:grid-cols-12"
              >
                <a
                  href={`#${meta.anchor}`}
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById(meta.anchor)?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="col-span-1 flex items-center gap-2.5 md:col-span-4"
                >
                  <span className="h-2 w-2 shrink-0" style={{ backgroundColor: meta.color }} aria-hidden="true" />
                  <span className="font-mono text-xs tracking-[0.1em] text-muted transition-colors hover:text-cyan">
                    {s.secao_sop} · {meta.short}
                  </span>
                </a>
                <span className="col-span-1 text-[13px] leading-snug text-faint md:col-span-5 md:text-muted">
                  {camada?.nome ?? meta.camada3d}
                </span>
                <span className="col-span-1 font-mono text-sm md:col-span-2 md:text-right" style={{ color: meta.color }}>
                  {camada ? String(camada.componentes.length).padStart(2, '0') : '—'}
                </span>
                <span className="col-span-1 flex justify-end md:col-span-1">
                  <Link
                    to={`/modelo-3d?camada=${meta.camada3d}`}
                    className="group/open flex items-center gap-1.5 border border-hairline px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:border-cyan-dim hover:text-cyan"
                    aria-label={`Abrir camada ${camada?.nome ?? meta.camada3d} no modelo 3D`}
                  >
                    Abrir
                    <ArrowRight className="h-3 w-3 transition-transform group-hover/open:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </span>
              </motion.div>
            )
          })}
        </div>

        {/* CTA duplo */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <Link
            to="/modelo-3d"
            className="group/cta relative flex items-center justify-between overflow-hidden border border-cyan-dim px-6 py-5 transition-colors"
          >
            <span className="absolute inset-0 -translate-x-full bg-cyan/10 transition-transform duration-500 ease-out-expo group-hover/cta:translate-x-0" aria-hidden="true" />
            <span className="relative flex items-center gap-3">
              <Box className="h-5 w-5 text-cyan" aria-hidden="true" />
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
                Explodir o avião no 3D
              </span>
            </span>
            <ArrowRight className="relative h-4 w-4 text-cyan transition-transform duration-300 group-hover/cta:translate-x-1" aria-hidden="true" />
          </Link>
          <Link
            to="/cockpit"
            className="group/cta relative flex items-center justify-between overflow-hidden border border-hairline px-6 py-5 transition-colors hover:border-cyan-dim"
          >
            <span className="absolute inset-0 -translate-x-full bg-cyan/10 transition-transform duration-500 ease-out-expo group-hover/cta:translate-x-0" aria-hidden="true" />
            <span className="relative flex items-center gap-3">
              <Gauge className="h-5 w-5 text-muted transition-colors group-hover/cta:text-cyan" aria-hidden="true" />
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-muted transition-colors group-hover/cta:text-cyan">
                Ver os instrumentos no cockpit
              </span>
            </span>
            <ArrowRight className="relative h-4 w-4 text-muted transition-all duration-300 group-hover/cta:translate-x-1 group-hover/cta:text-cyan" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
