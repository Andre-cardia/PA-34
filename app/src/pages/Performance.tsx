// PERFORMANCE & PLANEJAMENTO — `/performance` (design/performance.md).
// SOP Seções 06 / 07 — V-speeds, tabelas de performance e planejamento de voo.
// Dados: performance.md (?raw, parseado) + especificacoes.json.

import { motion } from 'framer-motion'
import PageHero from '@/components/ui-custom/PageHero'
import VSChip from '@/components/ui-custom/VSChip'
import ReguaVelocidades from '@/components/performance/ReguaVelocidades'
import VelocidadesDetalhe from '@/components/performance/VelocidadesDetalhe'
import DistanciasTetos from '@/components/performance/DistanciasTetos'
import GaleriaTabelas from '@/components/performance/GaleriaTabelas'
import PlanejamentoTimeline from '@/components/performance/PlanejamentoTimeline'
import Glossario from '@/components/performance/Glossario'
import { ANCHORS, scrollToAnchor } from '@/components/performance/performance-data'
import { especificacoes } from '@/data'

const v = especificacoes.velocidades_operacionais

// VSchips-âncora do hero (design/performance.md §1)
const HERO_CHIPS = [
  { code: 'VMCA', value: `${v.VMC_velocidade_minima_de_controle_mph} MPH`, categoria: 'critica' as const, anchor: ANCHORS.vmc, def: 'Velocidade mínima de controle no ar — ir para VMC' },
  { code: 'VYSE', value: `${v.velocidade_de_subida_monomotor_VYSE_mph} MPH`, categoria: 'mono' as const, anchor: ANCHORS.subida, def: 'Blue Line — ir para velocidades de subida' },
  { code: 'VNO', value: `${v.velocidade_maxima_de_cruzeiro_mph} MPH`, categoria: 'cautela' as const, anchor: ANCHORS.tabelas, def: 'Máxima estrutural de cruzeiro — ir para as tabelas' },
  { code: 'VNE', value: `${v.VNE_velocidade_nunca_exceder_mph} MPH`, categoria: 'critica' as const, anchor: ANCHORS.tabelas, def: 'Nunca exceder — ir para as tabelas' },
]

export default function Performance() {
  return (
    <>
      <PageHero
        secao="06"
        kicker="// SEÇÕES 06–07 — PERFORMANCE & PLANEJAMENTO"
        title="Performance"
        lead="Velocidades, distâncias, tetos e alcance do Seneca I — as tabelas do SOP em formato de leitura rápida."
        breadcrumb={[{ label: 'HOME', to: '/' }, { label: 'PERFORMANCE' }]}
      />

      {/* faixa de VSchips-âncora */}
      <div className="border-b border-hairline bg-panel">
        <div className="mx-auto flex max-w-content flex-wrap items-center gap-2.5 px-6 py-5 md:px-12">
          <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
            Ir para →
          </span>
          {HERO_CHIPS.map((c, i) => (
            <motion.span
              key={c.code}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.7 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex"
            >
              <button type="button" onClick={() => scrollToAnchor(c.anchor)} aria-label={`${c.code} ${c.value} — ${c.def}`}>
                <VSChip code={c.code} value={c.value} categoria={c.categoria} definicao={c.def} className="cursor-pointer" />
              </button>
            </motion.span>
          ))}
        </div>
      </div>

      {/* régua sticky cobre as seções 2–4 */}
      <div className="relative">
        <ReguaVelocidades />
        <VelocidadesDetalhe />
        <DistanciasTetos />
      </div>

      <GaleriaTabelas />
      <PlanejamentoTimeline />
      <Glossario />
    </>
  )
}
