// ESPECIFICAÇÕES & LIMITAÇÕES — `/especificacoes` (design/especificacoes.md).
// SOP Seções 05 / 5.1 — ficha técnica viva do Seneca I. Dados: especificacoes.json
// + intro_generalidades.md (?raw).

import PageHero from '@/components/ui-custom/PageHero'
import IdentidadeAeronave from '@/components/especificacoes/IdentidadeAeronave'
import MotoresHelice from '@/components/especificacoes/MotoresHelice'
import CapacidadesFluidos from '@/components/especificacoes/CapacidadesFluidos'
import PesosEnvelope from '@/components/especificacoes/PesosEnvelope'
import VelocimetroASI from '@/components/especificacoes/VelocimetroASI'
import Generalidades from '@/components/especificacoes/Generalidades'

export default function Especificacoes() {
  return (
    <>
      <PageHero
        secao="05"
        kicker="// SEÇÃO 05 — GENERALIDADES & ESPECIFICAÇÕES"
        title="Especificações & Limitações"
        lead="Piper PA34-200 Seneca I — bimotor, monoplano, asa baixa, trem de pouso retrátil, inteiramente metálico, para até seis ocupantes."
        breadcrumb={[{ label: 'HOME', to: '/' }, { label: 'ESPECIFICAÇÕES' }]}
      />
      <IdentidadeAeronave />
      <MotoresHelice />
      <CapacidadesFluidos />
      <PesosEnvelope />
      <VelocimetroASI />
      <Generalidades />
    </>
  )
}
