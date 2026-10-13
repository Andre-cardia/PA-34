// Modelo3D — o módulo central do site (modelo3d.md): desenho técnico 3D
// interativo do PA34-200 Seneca I. App-frame sem scroll vertical: rail de
// camadas (esq) · canvas R3F (centro) · ficha em Drawer (dir) · barra inferior.
// Deep-links ?camada=<id>&c=<componenteId> (usados pela busca ⌘K global).
// Fallback estático para prefers-reduced-motion / dispositivos fracos (§8).

import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { Layers, X } from 'lucide-react'
import type { FocusRequest, ViewRequest } from '@/components/modelo3d/ModelCanvas'
import LayerRail from '@/components/modelo3d/LayerRail'
import BottomBar from '@/components/modelo3d/BottomBar'
import ComponentDrawer from '@/components/modelo3d/ComponentDrawer'
import GuideCard from '@/components/modelo3d/GuideCard'
import StaticFallback from '@/components/modelo3d/StaticFallback'
import { camadas3d } from '@/data'
import { DEFAULT_VIEW, VIEW_PRESETS, isLayerId } from '@/components/modelo3d/config'
import type { LayerId } from '@/components/modelo3d/config'
import { LAYER_ORDER } from '@/components/modelo3d/config'

// ---------------------------------------------------------------------------
// Detecção do modo estático (§8)
// ---------------------------------------------------------------------------

function detectStaticReason(): string | null {
  if (typeof window === 'undefined') return null
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'MOVIMENTO REDUZIDO ATIVADO'
  const hc = navigator.hardwareConcurrency ?? 8
  const dm = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
  // só dispositivos realmente fracos (o GLB tem ~17k tris — roda bem em quad-core)
  if (hc <= 2 || dm <= 2) {
    if (!new URLSearchParams(window.location.search).has('force3d')) return 'DISPOSITIVO COM RECURSOS LIMITADOS'
  }
  try {
    const c = document.createElement('canvas')
    if (!c.getContext('webgl2') && !c.getContext('webgl')) return 'WEBGL INDISPONÍVEL'
  } catch {
    return 'WEBGL INDISPONÍVEL'
  }
  return null
}

const TOTAL_COMPS = camadas3d.reduce((n, c) => n + c.componentes.length, 0)

// WebGL pesado fora do bundle principal (react-dev: lazy + Suspense)
const ModelCanvas = lazy(() => import('@/components/modelo3d/ModelCanvas'))

function compExiste(camada: string, compId: string) {
  return camadas3d.some((c) => c.id === camada && c.componentes.some((x) => x.id === compId))
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export default function Modelo3D() {
  const [searchParams, setSearchParams] = useSearchParams()

  // ---- estado principal ----
  const [visible, setVisible] = useState<Record<LayerId, boolean>>(() => {
    const v = {} as Record<LayerId, boolean>
    for (const id of LAYER_ORDER) v[id] = id === 'exterior'
    return v
  })
  const [explodePct, setExplodePct] = useState(0)
  const [xrayManual, setXrayManual] = useState(false)
  const [isolate, setIsolate] = useState<LayerId | null>(null)
  const [selected, setSelected] = useState<{ camada: LayerId; comp: string } | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)
  const [showLabels, setShowLabels] = useState(false)
  const [pulse, setPulse] = useState<{ layer: LayerId; key: number } | null>(null)
  const [viewRequest, setViewRequest] = useState<ViewRequest | null>(null)
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null)
  const [activeView, setActiveView] = useState<string | null>(null)
  const [railOpen, setRailOpen] = useState(false) // bottom-sheet mobile
  const [introDone, setIntroDone] = useState(false)

  const staticReason = useMemo(detectStaticReason, [])
  const deepLink = useRef<{ camada: LayerId; comp: string } | null>(null)

  // ---- deep-link inicial (?camada=<id>&c=<componenteId>) ----
  useEffect(() => {
    const camada = searchParams.get('camada')
    const comp = searchParams.get('c')
    if (isLayerId(camada) && comp && compExiste(camada, comp)) {
      deepLink.current = { camada, comp }
      setVisible((v) => ({ ...v, [camada]: true }))
      setSelected({ camada, comp })
      // focus move após a montagem rápida (0.6s, §9)
      const t = window.setTimeout(() => setFocusRequest({ compId: comp, key: Date.now() }), 900)
      return () => window.clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- sincroniza URL com a seleção (shareable / ⌘K) ----
  useEffect(() => {
    const curC = searchParams.get('c')
    if (selected) {
      if (curC !== selected.comp || searchParams.get('camada') !== selected.camada) {
        setSearchParams({ camada: selected.camada, c: selected.comp }, { replace: true })
      }
    } else if (curC) {
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  // ---- raio-x: toggle OU automático (camada interna ligada com exterior visível, §2) ----
  const innerVisible = LAYER_ORDER.some((id) => id !== 'exterior' && visible[id])
  const xray = xrayManual || (visible.exterior && innerVisible)

  const visibleCount = LAYER_ORDER.filter((id) => visible[id]).length

  // ---- ações ----
  const toggleLayer = useCallback((id: LayerId) => {
    setVisible((v) => ({ ...v, [id]: !v[id] }))
  }, [])

  const pulseLayer = useCallback((id: LayerId) => {
    setPulse({ layer: id, key: Date.now() })
  }, [])

  const isolateLayer = useCallback((id: LayerId | null) => {
    setIsolate(id)
    if (id) setVisible((v) => ({ ...v, [id]: true }))
  }, [])

  const selectComponent = useCallback((camada: LayerId, comp: string) => {
    setVisible((v) => (v[camada] ? v : { ...v, [camada]: true }))
    setSelected({ camada, comp })
    setFocusRequest((f) => ({ compId: comp, key: (f?.key ?? 0) + 1 }))
  }, [])

  const clearSelection = useCallback(() => setSelected(null), [])

  const explodeAll = useCallback(() => {
    setVisible(() => {
      const v = {} as Record<LayerId, boolean>
      for (const id of LAYER_ORDER) v[id] = true
      return v
    })
    setExplodePct(100)
  }, [])

  const closeAll = useCallback(() => setExplodePct(0), [])

  const onlyExterior = useCallback(() => {
    setVisible(() => {
      const v = {} as Record<LayerId, boolean>
      for (const id of LAYER_ORDER) v[id] = id === 'exterior'
      return v
    })
    setExplodePct(0)
    setXrayManual(false)
    setIsolate(null)
  }, [])

  const gotoView = useCallback((id: string) => {
    const preset = VIEW_PRESETS.find((v) => v.id === id)
    if (!preset) return
    setActiveView(id)
    setViewRequest((r) => ({ preset, key: (r?.key ?? 0) + 1 }))
  }, [])

  const resetCamera = useCallback(() => {
    setActiveView(null)
    setViewRequest((r) => ({ preset: DEFAULT_VIEW, key: (r?.key ?? 0) + 1 }))
  }, [])

  // ---- atalhos de teclado (1–9, E, X, R, ESC — §6/§10) ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.key >= '1' && e.key <= '9') {
        const id = LAYER_ORDER[Number(e.key) - 1]
        if (id) toggleLayer(id)
      } else if (e.key === 'e' || e.key === 'E') {
        setExplodePct((p) => (p > 50 ? 0 : 100))
      } else if (e.key === 'x' || e.key === 'X') {
        setXrayManual((x) => !x)
      } else if (e.key === 'r' || e.key === 'R') {
        resetCamera()
      } else if (e.key === 'Escape') {
        if (selected) setSelected(null)
        else if (isolate) setIsolate(null)
        else if (railOpen) setRailOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleLayer, resetCamera, selected, isolate, railOpen])

  // intro: duração da "montagem de prancheta" (montagem rápida 0.6s com deep-link, §9)
  // ?nointro=1 desativa (validação automatizada / dispositivos com rAF estrangulado)
  const introDur = deepLink.current ? 0.6 : new URLSearchParams(window.location.search).has('nointro') ? 0 : 1.4
  useEffect(() => {
    const t = window.setTimeout(() => setIntroDone(true), deepLink.current ? 900 : 2100)
    return () => window.clearTimeout(t)
  }, [])

  // -------------------------------------------------------------------------
  // Fallback estático (§8)
  // -------------------------------------------------------------------------
  if (staticReason) {
    return (
      <div className="min-h-[calc(100dvh-64px)] bg-abyss">
        <StaticFallback
          reason={staticReason}
          selectedId={selected?.comp ?? null}
          onSelectComponent={(camada, comp) => setSelected({ camada, comp })}
        />
        <ComponentDrawer
          camadaId={selected?.camada ?? null}
          compId={selected?.comp ?? null}
          isolated={false}
          onClose={clearSelection}
          onNavigate={(camada, comp) => setSelected({ camada, comp })}
          onIsolate={() => undefined}
        />
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // App-frame 3D
  // -------------------------------------------------------------------------
  return (
    <div className="flex h-[calc(100dvh-64px)] flex-col overflow-hidden bg-abyss">
      {/* faixa de título (kicker) */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-hairline bg-panel px-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-faint">
          <span className="text-cyan">// MÓDULO 3D</span> — DESENHO TÉCNICO INTERATIVO
        </p>
        <p className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-faint sm:block">
          PA34-200 SENECA I · {LAYER_ORDER.length} CAMADAS · {TOTAL_COMPS} COMPONENTES
        </p>
      </div>

      {/* corpo: rail + canvas */}
      <div className="flex min-h-0 flex-1">
        {/* rail esquerdo (desktop) */}
        <div className="hidden w-[280px] shrink-0 lg:block">
          <LayerRail
            visible={visible}
            isolate={isolate}
            selectedId={selected?.comp ?? null}
            onToggleLayer={toggleLayer}
            onIsolateLayer={isolateLayer}
            onPulseLayer={pulseLayer}
            onSelectComponent={selectComponent}
            onExplodeAll={explodeAll}
            onCloseAll={closeAll}
            onOnlyExterior={onlyExterior}
          />
        </div>

        {/* canvas */}
        <div className="relative min-w-0 flex-1">
          <Suspense
            fallback={
              <div className="flex h-full w-full items-center justify-center bg-abyss">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan">CARREGANDO MALHA …</p>
              </div>
            }
          >
            <ModelCanvas
              visible={visible}
              explode={explodePct / 100}
              xray={xray}
              isolate={isolate}
              selectedId={selected?.comp ?? null}
              pulse={pulse}
              introDur={introDur}
              showLabels={showLabels}
              autoRotate={autoRotate}
              viewRequest={viewRequest}
              focusRequest={focusRequest}
              onSelectComponent={selectComponent}
              onClearSelection={clearSelection}
              hud={{ visibleCount, explodePct }}
            />
          </Suspense>
          {!selected && <GuideCard onSelectComponent={selectComponent} />}

          {/* overlay de entrada: readout mono da montagem (§7) */}
          <AnimatePresence>
            {!introDone && (
              <motion.div
                className="pointer-events-none absolute inset-0 z-10 flex items-end justify-start bg-abyss/40 p-6"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan">
                  {['CARREGANDO MALHA … OK', `${LAYER_ORDER.length} CAMADAS … OK`, `${TOTAL_COMPS} COMPONENTES … OK`].map((line, i) => (
                    <motion.p
                      key={line}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.3, duration: 0.3 }}
                      className="mb-1"
                    >
                      {line}
                    </motion.p>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* botão CAMADAS (mobile — abre bottom-sheet) */}
          <button
            type="button"
            onClick={() => setRailOpen(true)}
            className="absolute bottom-4 right-4 flex items-center gap-2 border border-cyan-dim bg-panel/95 px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-cyan backdrop-blur-sm lg:hidden"
            aria-label="Abrir painel de camadas"
          >
            <Layers className="h-4 w-4" aria-hidden="true" />
            CAMADAS
          </button>
        </div>
      </div>

      {/* barra inferior */}
      <BottomBar
        explodePct={explodePct}
        onExplode={setExplodePct}
        autoRotate={autoRotate}
        onToggleAutoRotate={() => setAutoRotate((a) => !a)}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels((l) => !l)}
        xray={xray}
        onToggleXray={() => setXrayManual((x) => !x)}
        activeView={activeView}
        onView={gotoView}
        onResetCamera={resetCamera}
      />

      {/* ficha do componente (Drawer compartilhado) */}
      <ComponentDrawer
        camadaId={selected?.camada ?? null}
        compId={selected?.comp ?? null}
        isolated={!!isolate && isolate === selected?.camada}
        onClose={clearSelection}
        onNavigate={selectComponent}
        onIsolate={(id) => isolateLayer(id)}
      />

      {/* bottom-sheet mobile com o rail */}
      <AnimatePresence>
        {railOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[70] bg-abyss/60 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRailOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-[75] flex h-[72dvh] flex-col border-t border-cyan-dim bg-panel lg:hidden"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              role="dialog"
              aria-modal="true"
              aria-label="Painel de camadas"
            >
              <div className="flex items-center justify-between border-b border-hairline px-4 py-2">
                <span className="mx-auto h-1 w-10 bg-hairline" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => setRailOpen(false)}
                  aria-label="Fechar painel de camadas"
                  className="absolute right-3 top-2.5 text-muted hover:text-ink"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <LayerRail
                  visible={visible}
                  isolate={isolate}
                  selectedId={selected?.comp ?? null}
                  onToggleLayer={toggleLayer}
                  onIsolateLayer={isolateLayer}
                  onPulseLayer={pulseLayer}
                  onSelectComponent={(c, id) => {
                    selectComponent(c, id)
                    setRailOpen(false)
                  }}
                  onExplodeAll={explodeAll}
                  onCloseAll={closeAll}
                  onOnlyExterior={onlyExterior}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
