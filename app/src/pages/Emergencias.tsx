// PROCEDIMENTOS DE EMERGÊNCIA — `/emergencias` (design/emergencias.md).
// SOP 12.1–12.21: índice sticky com busca + filtro por sistema, 21 cards QRH,
// fluxo de decisão 12.5 × 12.6, flashcards de itens de memória e modo QRH
// claro para impressão.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router'
import { BookOpenText, ChevronsDown, ChevronsUp } from 'lucide-react'
import { emergencias } from '@/data'
import CalloutBanner from '@/components/ui-custom/CalloutBanner'
import SectionHeader from '@/components/ui-custom/SectionHeader'
import EmergenciasHero from '@/components/emergencias/EmergenciasHero'
import IndiceRapido from '@/components/emergencias/IndiceRapido'
import EmergenciaCard from '@/components/emergencias/EmergenciaCard'
import FluxoDecisao from '@/components/emergencias/FluxoDecisao'
import FlashcardsMemoria from '@/components/emergencias/FlashcardsMemoria'
import QrhView from '@/components/emergencias/QrhView'
import { classificar, emergenciaAnchor, type Categoria } from '@/components/emergencias/emergenciasUtils'

const DEFAULT_OPEN = ['12.1', '12.2', '12.3']

export default function Emergencias() {
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [categoria, setCategoria] = useState<Categoria | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(DEFAULT_OPEN))
  const [qrh, setQrh] = useState(false)

  const filtradas = useMemo(() => {
    const q = query.trim().toLowerCase()
    return emergencias.filter((e) => {
      if (categoria && classificar(e) !== categoria) return false
      if (!q) return true
      const hay = `${e.titulo} ${e.secao_sop} ${e.situacao} ${e.passos.join(' ')}`.toLowerCase()
      return hay.includes(q)
    })
  }, [query, categoria])

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // índice / fluxo: expande o card e rola até ele
  const expandAndScroll = useCallback((id: string) => {
    setExpanded((prev) => new Set(prev).add(id))
    window.setTimeout(() => {
      document.getElementById(emergenciaAnchor(id))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }, [])

  // deep-link (#12-1 … #12-21): limpa filtros, expande e rola
  useEffect(() => {
    if (!location.hash) return
    const id = location.hash.slice(1).replace('-', '.')
    if (!emergencias.some((e) => e.id === id)) return
    const t = window.setTimeout(() => {
      setQuery('')
      setCategoria(null)
      setExpanded((prev) => new Set(prev).add(id))
      window.setTimeout(() => {
        document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }, 250)
    return () => window.clearTimeout(t)
  }, [location.hash])

  const allExpanded = expanded.size >= emergencias.length

  return (
    <>
      <div className={qrh ? 'print:hidden' : undefined}>
        <EmergenciasHero />
      </div>

      {qrh ? (
        <QrhView onClose={() => setQrh(false)} />
      ) : (
        <>
          <IndiceRapido
            query={query}
            onQuery={setQuery}
            categoria={categoria}
            onCategoria={setCategoria}
            filtradas={filtradas}
            total={emergencias.length}
            onSelect={expandAndScroll}
          />

          <FluxoDecisao onSelect={expandAndScroll} />

          {/* os 21 cards */}
          <section className="border-b border-hairline bg-abyss py-[72px] md:py-[120px]" aria-label="Os 21 procedimentos de emergência">
            <div className="mx-auto max-w-content px-6 md:px-12">
              <div className="flex flex-wrap items-end justify-between gap-6">
                <SectionHeader
                  kicker="// SEÇÃO 12 — SOP REV.13"
                  title="Os 21 procedimentos"
                  measure={`${filtradas.length} EM EXIBIÇÃO`}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExpanded(allExpanded ? new Set() : new Set(emergencias.map((e) => e.id)))}
                    className="flex items-center gap-2 border border-hairline px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted transition-colors hover:border-cyan-dim hover:text-cyan"
                  >
                    {allExpanded ? <ChevronsUp className="h-3.5 w-3.5" /> : <ChevronsDown className="h-3.5 w-3.5" />}
                    {allExpanded ? 'Recolher todos' : 'Expandir todos'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrh(true)}
                    className="flex items-center gap-2 border border-red/50 bg-red/10 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-red transition-colors hover:bg-red/20"
                  >
                    <BookOpenText className="h-3.5 w-3.5" aria-hidden="true" />
                    Modo QRH
                  </button>
                </div>
              </div>

              <div className="mx-auto mt-14 max-w-[900px] space-y-6">
                {filtradas.length === 0 && (
                  <p className="border border-hairline bg-raised px-6 py-10 text-center font-mono text-sm tracking-[0.1em] text-muted">
                    NENHUM PROCEDIMENTO EM EXIBIÇÃO — AJUSTE A BUSCA OU O FILTRO.
                  </p>
                )}
                {filtradas.map((e, i) => (
                  <EmergenciaCard key={e.id} em={e} expanded={expanded.has(e.id)} onToggle={() => toggle(e.id)} index={i} />
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      <div className={qrh ? 'print:hidden' : undefined}>
        <FlashcardsMemoria />

        {/* disclaimer */}
        <section className="bg-abyss py-[72px] md:py-[100px]">
          <div className="mx-auto max-w-[900px] px-6 md:px-12">
            <CalloutBanner variant="nota" title="Material de estudo">
              Conteúdo baseado no SOP VoeFloripa REV.13, com fins exclusivamente didáticos.{' '}
              <strong className="font-semibold text-ink">Não substitui o POH nem o Manual de Voo da aeronave</strong> —
              em caso de dúvida, o manual da aeronave tem autoridade máxima.
            </CalloutBanner>
          </div>
        </section>
      </div>
    </>
  )
}
