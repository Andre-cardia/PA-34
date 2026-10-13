// Estação de sistema (template repetido 7× — sistemas.md §"Estações 8.1–8.7").
// Cabeçalho (chip SOP + H2 + resumo + meta chips) · grid 12: diagrama SVG (7)
// + lista de componentes (5) · rodapé com notas/limitações em CalloutBanners
// auto-classificados. Âncora estável #8-X + número-fantasma da subseção.

import { useState } from 'react'
import type { JSX } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Box, ChevronRight, ListTree } from 'lucide-react'
import type { Sistema } from '@/data'
import CalloutBanner from '@/components/ui-custom/CalloutBanner'
import PA34SilhouetteTop from '@/components/assets/PA34SilhouetteTop'
import type { SystemMeta } from './config'
import { classifyNota } from './config'
import { EASE_OUT } from './utils'
import ComponentList from './ComponentList'
import FuelDiagram from './diagrams/FuelDiagram'
import ElectricalDiagram from './diagrams/ElectricalDiagram'
import VacuumDiagram from './diagrams/VacuumDiagram'
import PropSyncDiagram from './diagrams/PropSyncDiagram'
import GearDiagram from './diagrams/GearDiagram'
import BaggageDiagram from './diagrams/BaggageDiagram'
import HvacDiagram from './diagrams/HvacDiagram'

const DIAGRAMS: Record<SystemMeta['diagram'], (p: DiagramProps) => JSX.Element> = {
  fuel: FuelDiagram,
  electrical: ElectricalDiagram,
  vacuum: VacuumDiagram,
  propsync: PropSyncDiagram,
  gear: GearDiagram,
  baggage: BaggageDiagram,
  hvac: HvacDiagram,
}

export interface DiagramProps {
  sistema: Sistema
  meta: SystemMeta
}

// Funcionamento — texto longo do SOP; expande/colapsa quando extenso
function Funcionamento({ texto, color }: { texto: string; color: string }) {
  const [full, setFull] = useState(false)
  const long = texto.length > 620
  const shown = full || !long ? texto : `${texto.slice(0, 620).trimEnd()}…`
  return (
    <div className="border border-hairline bg-panel px-5 py-4">
      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
        <ListTree className="h-3.5 w-3.5" style={{ color }} aria-hidden="true" />
        Funcionamento — conforme SOP
      </p>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">{shown}</p>
      {long && (
        <button
          type="button"
          onClick={() => setFull((v) => !v)}
          className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors hover:text-ink"
          style={{ color }}
          aria-expanded={full}
        >
          {full ? 'Recolher texto −' : 'Ler o texto completo +'}
        </button>
      )}
    </div>
  )
}

interface Props {
  sistema: Sistema
  meta: SystemMeta
}

export default function SystemStation({ sistema, meta }: Props) {
  const Diagram = DIAGRAMS[meta.diagram]
  const notas = sistema.notas_limitacoes.filter((_, i) => i !== meta.notaDestaque?.index)
  const destaque = meta.notaDestaque ? sistema.notas_limitacoes[meta.notaDestaque.index] : null

  return (
    <section
      id={meta.anchor}
      aria-label={`${sistema.secao_sop} — ${sistema.nome}`}
      className="relative overflow-hidden border-t border-hairline py-16 md:py-24"
      style={{ scrollMarginTop: '7rem' }}
    >
      {/* número-fantasma da subseção */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-6 right-0 select-none font-display text-[140px] font-bold leading-none text-faint/[0.08] md:text-[240px]"
      >
        {sistema.secao_sop}
      </span>
      <PA34SilhouetteTop
        className="pointer-events-none absolute -left-24 top-10 h-[420px] w-[420px] text-cyan opacity-[0.04]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-content px-6 md:px-12">
        {/* 1 — cabeçalho */}
        <motion.header
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20% 0px' }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="border px-2.5 py-1 font-mono text-[11px] font-semibold tracking-[0.22em]"
              style={{ borderColor: `${meta.color}55`, color: meta.color }}
            >
              SOP {sistema.secao_sop}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
              {'//'} estação {meta.anchor.replace('-', '.')}
            </span>
          </div>
          <h2 className="mt-4 max-w-3xl font-display text-[28px] font-semibold leading-tight tracking-[-0.01em] text-ink md:text-[40px]">
            {sistema.nome}
          </h2>
          <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-muted md:text-[18px]">{sistema.resumo}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span
              className="border border-hairline bg-panel px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em]"
              style={{ color: meta.color }}
            >
              {sistema.componentes.length} componentes
            </span>
            <Link
              to={`/modelo-3d?camada=${meta.camada3d}`}
              className="group/layer flex items-center gap-1.5 border border-hairline px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted transition-colors hover:border-cyan-dim hover:text-cyan"
            >
              <Box className="h-3.5 w-3.5" aria-hidden="true" />
              Ver camada no 3D
              <ChevronRight className="h-3 w-3 transition-transform group-hover/layer:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        </motion.header>

        {/* 2 — corpo em grid 12 */}
        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          {/* coluna esquerda (7) — diagrama + funcionamento */}
          <div className="space-y-6 lg:col-span-7">
            <Diagram sistema={sistema} meta={meta} />
            {destaque && meta.notaDestaque && (
              <CalloutBanner variant={meta.notaDestaque.variant} title={meta.notaDestaque.title}>
                {destaque}
              </CalloutBanner>
            )}
            <Funcionamento texto={sistema.funcionamento} color={meta.color} />
          </div>
          {/* coluna direita (5) — lista de componentes */}
          <div className="lg:col-span-5">
            <p className="mb-4 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
              <span>Componentes — ficha técnica</span>
              <span style={{ color: meta.color }}>
                {String(sistema.componentes.length).padStart(2, '0')} itens
              </span>
            </p>
            <ComponentList sistema={sistema} meta={meta} />
          </div>
        </div>

        {/* 3 — rodapé: notas & limitações auto-classificadas */}
        {notas.length > 0 && (
          <div className="mt-12">
            <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
              {'//'} Notas &amp; limitações — SOP {sistema.secao_sop}
            </p>
            <div className="grid items-start gap-4 md:grid-cols-2">
              {notas.map((n, i) => (
                <motion.div
                  key={n}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-6% 0px' }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: EASE_OUT }}
                >
                  <CalloutBanner variant={classifyNota(n)} className="h-full">
                    {n}
                  </CalloutBanner>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
