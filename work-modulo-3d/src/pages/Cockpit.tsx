// Cockpit 2D — painel vetorial interativo do PA-34-200 Seneca I.
// Integra: toolbar (filtros/busca/toggles/tour), palco SVG com 54 hotspots,
// drawer de ficha, tour guiado, índice lateral e deep-link ?i=<id> (⌘K global).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { instrumentosCockpit } from '@/data'
import { useIsMobile } from '@/hooks/use-mobile'
import CockpitPanel from '@/components/cockpit/CockpitPanel'
import CockpitToolbar from '@/components/cockpit/CockpitToolbar'
import InstrumentDrawer from '@/components/cockpit/InstrumentDrawer'
import TourOverlay from '@/components/cockpit/TourOverlay'
import IndexPanel from '@/components/cockpit/IndexPanel'
import { ArcsSection, ObservationsSection, SixPackSection } from '@/components/cockpit/CockpitSections'
import { usePanZoom } from '@/components/cockpit/usePanZoom'
import { PANEL_MAP, PANEL_ORDER, TOUR_STOPS, instrumentById, resolveInstrumentId, shapeCenter } from '@/components/cockpit/panel-data'

export default function Cockpit() {
  const pz = usePanZoom()
  const isMobile = useIsMobile()
  const [searchParams, setSearchParams] = useSearchParams()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string | null>(null)
  const [labelsOn, setLabelsOn] = useState(false)
  const [yokesOn, setYokesOn] = useState(false) // manches: desligados por padrão
  const [night, setNight] = useState(false) // modo dia é o padrão (decisão 2026-10-16); noite pelo botão da toolbar
  const [tour, setTour] = useState<{ active: boolean; index: number }>({ active: false, index: 0 })
  const [scanlineKey, setScanlineKey] = useState(0)
  const [indexOpen, setIndexOpen] = useState(false)
  const [interacted, setInteracted] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const i of instrumentosCockpit) c[i.categoria] = (c[i.categoria] ?? 0) + 1
    return c
  }, [])

  // -------------------------------------------------------------------------
  // Seleção + deep-link ?i=
  // -------------------------------------------------------------------------

  const select = useCallback(
    (id: string, center = true) => {
      setInteracted(true)
      setSelectedId(id)
      setSearchParams({ i: id }, { replace: true })
      // se o tour estiver ativo, o drawer aberto o pausa (TourOverlay recebe drawerOpen)
      if (center) {
        const e = PANEL_MAP[id]
        if (e) {
          const c = shapeCenter(e.shape)
          pz.centerOn(c.x, c.y, 1.8, 700)
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pz.centerOn, setSearchParams, tour.active],
  )

  const closeDrawer = useCallback(() => {
    setSelectedId(null)
    setSearchParams({}, { replace: true })
  }, [setSearchParams])

  // deep-link (⌘K global navega para /cockpit?i=<id>)
  useEffect(() => {
    const id = resolveInstrumentId(searchParams.get('i'))
    if (id) {
      setInteracted(true)
      setSelectedId((cur) => (cur === id ? cur : id))
    } else {
      setSelectedId(null)
    }
  }, [searchParams])

  // centraliza o deep-link assim que o palco mede e quando ?i= muda
  const centeredId = useRef<string | null>(null)
  useEffect(() => {
    if (pz.size.w === 0) return
    const id = resolveInstrumentId(searchParams.get('i'))
    if (id && PANEL_MAP[id]) {
      if (centeredId.current === id) return
      centeredId.current = id
      const c = shapeCenter(PANEL_MAP[id].shape)
      pz.centerOn(c.x, c.y, 1.8, 700, 'exact')
    } else if (isMobile && centeredId.current === null) {
      centeredId.current = '__mobile__'
      // mobile: começa centralizado no six-pack do piloto (centro entre ASI/AI/ALT e TC/HSI/VSI)
      pz.centerOn(392, 272, 2.6, 0, 'exact')
    } else if (!id) {
      centeredId.current = null
    }
  }, [isMobile, pz.centerOn, pz.size.w, searchParams])

  // -------------------------------------------------------------------------
  // Tour guiado
  // -------------------------------------------------------------------------

  const startTour = useCallback(() => {
    setInteracted(true)
    setSelectedId(null)
    setIndexOpen(false)
    setScanlineKey((k) => k + 1)
    setTour({ active: true, index: 0 })
  }, [])

  const endTour = useCallback(() => {
    setTour({ active: false, index: 0 })
    pz.reset()
  }, [pz])

  const tourNext = useCallback(() => {
    setTour((t) => {
      if (t.index >= TOUR_STOPS.length - 1) {
        pz.reset()
        return { active: false, index: 0 }
      }
      return { ...t, index: t.index + 1 }
    })
  }, [pz])

  // cada parada centraliza o instrumento-alvo
  useEffect(() => {
    if (!tour.active) return
    const stop = TOUR_STOPS[tour.index]
    const e = stop ? PANEL_MAP[stop.id] : null
    if (e) {
      const c = shapeCenter(e.shape)
      pz.centerOn(c.x, c.y, 2.1, 900, 'exact')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour.active, tour.index])

  const tourTargetId = tour.active ? TOUR_STOPS[tour.index].id : null

  // -------------------------------------------------------------------------
  // Teclado: +/− zoom, setas pan
  // -------------------------------------------------------------------------

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement
      const tag = el?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'Escape' && tour.active && !selectedId) {
        endTour()
        return
      }
      if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        pz.zoomAt(pz.size.w / 2, pz.size.h / 2, 1.3, true)
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        pz.zoomAt(pz.size.w / 2, pz.size.h / 2, 1 / 1.3, true)
      } else if (e.key === 'ArrowLeft') {
        if (selectedId) return
        pz.panBy(70, 0)
      } else if (e.key === 'ArrowRight') {
        if (selectedId) return
        pz.panBy(-70, 0)
      } else if (e.key === 'ArrowUp') {
        if (selectedId) return
        pz.panBy(0, 70)
      } else if (e.key === 'ArrowDown') {
        if (selectedId) return
        pz.panBy(0, -70)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, tour.active, endTour])

  const hoveredNome = hoveredId ? (instrumentById[hoveredId]?.nome ?? null) : null
  const selectedNome = selectedId ? (instrumentById[selectedId]?.nome ?? null) : null

  return (
    <div className="bg-abyss">
      {/* barra de ferramentas do módulo */}
      <CockpitToolbar
        filterCat={filterCat}
        onFilter={setFilterCat}
        labelsOn={labelsOn}
        onToggleLabels={() => setLabelsOn((v) => !v)}
        yokesOn={yokesOn}
        onToggleYokes={() => setYokesOn((v) => !v)}
        total={PANEL_ORDER.length}
        night={night}
        onToggleNight={() => setNight((v) => !v)}
        tourActive={tour.active}
        onStartTour={startTour}
        indexOpen={indexOpen}
        onToggleIndex={() => setIndexOpen((v) => !v)}
        counts={counts}
        onPick={(id) => {
          setIndexOpen(false)
          select(id)
        }}
      />

      {/* palco — sempre escuro, mesmo no tema claro (theme-dark) */}
      <div className="theme-dark mx-auto max-w-[1600px] border-x border-hairline bg-abyss text-ink">
        <div className="relative h-[78dvh] min-h-[540px]">
          <CockpitPanel
            pz={pz}
            night={night}
            labelsOn={labelsOn}
            yokesOn={yokesOn}
            filterCat={filterCat}
            selectedId={selectedId}
            suggestedActive={!interacted}
            tourTargetId={tourTargetId}
            scanlineKey={scanlineKey}
            onHover={setHoveredId}
            onSelect={(id) => {
              if (tour.active) setTour({ active: false, index: 0 })
              select(id)
            }}
          />
          <IndexPanel
            open={indexOpen}
            selectedId={selectedId}
            onPick={(id) => {
              setIndexOpen(false)
              select(id)
            }}
            onClose={() => setIndexOpen(false)}
          />
          {tour.active && (
            <TourOverlay
              index={tour.index}
              drawerOpen={selectedId !== null}
              onNext={tourNext}
              onSkip={endTour}
              onOpenFull={(id) => select(id, false)}
            />
          )}
        </div>

        {/* barra de status / ajuda */}
        <div className="flex items-center justify-between gap-4 border-t border-hairline bg-panel px-4 py-2">
          <span className="truncate font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
            Arraste p/ pan · roda p/ zoom · Tab navega os {PANEL_ORDER.length} hotspots · Enter abre a ficha
          </span>
          <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.16em] text-cyan">
            {selectedNome ?? hoveredNome ?? `${PANEL_ORDER.length} instrumentos mapeados`}
          </span>
        </div>
      </div>

      {/* blocos educativos */}
      <SixPackSection />
      <ArcsSection />
      <ObservationsSection />

      {/* ficha do instrumento */}
      <InstrumentDrawer id={selectedId} night={night} onClose={closeDrawer} onSelect={(id) => select(id)} />
    </div>
  )
}
