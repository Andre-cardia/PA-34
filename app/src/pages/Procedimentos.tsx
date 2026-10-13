// PROCEDIMENTOS NORMAIS — `/procedimentos` (design/procedimentos.md).
// SOP 03 (filosofia de checklist) + SOP 10.1–10.15: linha de voo sticky com
// scroll-spy e 16 fases com checklists interativos persistentes.

import { useEffect } from 'react'
import { useLocation } from 'react-router'
import PageHero from '@/components/ui-custom/PageHero'
import SectionHeader from '@/components/ui-custom/SectionHeader'
import { procedimentosNormais } from '@/data'
import FilosofiaChecklist from '@/components/procedimentos/FilosofiaChecklist'
import LinhaDeVoo from '@/components/procedimentos/LinhaDeVoo'
import FaseSection from '@/components/procedimentos/FaseSection'
import FluxoEmergencia from '@/components/procedimentos/FluxoEmergencia'
import ResumoProgresso from '@/components/procedimentos/ResumoProgresso'
import { useChecklistStats } from '@/components/procedimentos/checklistStore'

export default function Procedimentos() {
  const location = useLocation()
  const stats = useChecklistStats()

  // deep-link (#10-1 … #10-15) — rola até a fase após montar
  useEffect(() => {
    if (!location.hash) return
    const target = location.hash.slice(1)
    const t = window.setTimeout(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 350)
    return () => window.clearTimeout(t)
  }, [location.hash])

  return (
    <>
      <PageHero
        secao="10"
        kicker="// SEÇÕES 03 + 10 — CHECKLISTS & PROCEDIMENTOS NORMAIS"
        title="Procedimentos Normais"
        lead="Da inspeção pré-voo ao corte dos motores: execute cada checklist como faria na cabine — item por item, em voz alta."
        breadcrumb={[{ label: 'HOME', to: '/' }, { label: 'PROCEDIMENTOS' }]}
      />

      <FilosofiaChecklist />

      {/* linha de voo sticky + as 16 fases */}
      <div className="relative">
        <LinhaDeVoo />
        <section className="bg-abyss py-[72px] md:py-[120px]" aria-label="As 16 fases de voo">
          <div className="mx-auto max-w-content px-6 md:px-12">
            <SectionHeader
              kicker="// SEÇÃO 10 — SOP REV.13"
              title="As 16 fases de voo"
              measure={`${stats.totalItens} ITENS · 16 FASES`}
            />
            <div className="mx-auto mt-16 max-w-[980px] space-y-20">
              {procedimentosNormais.map((fase) => (
                <FaseSection key={fase.id} fase={fase} />
              ))}
            </div>
          </div>
        </section>
      </div>

      <FluxoEmergencia />
      <ResumoProgresso />
    </>
  )
}
