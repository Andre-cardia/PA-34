// LayerRail — rail esquerdo (280px): 9 lâminas de camada com cor-chave, toggle
// de visibilidade, pulso no modelo ao hover e isolado por duplo-clique (§1–§3).
// Aba ÍNDICE: lista-índice dos 68 componentes agrupados por camada com busca
// local (acessibilidade/teclado — design.md §11).

import { useMemo, useState } from 'react'
import { Eye, EyeOff, Layers, ListFilter, Search } from 'lucide-react'
import { camadas3d } from '@/data'
import { cn } from '@/lib/utils'
import { LAYERS, LAYER_ORDER } from './config'
import type { LayerId } from './config'

interface RailProps {
  visible: Record<LayerId, boolean>
  isolate: LayerId | null
  selectedId: string | null
  onToggleLayer: (id: LayerId) => void
  onIsolateLayer: (id: LayerId | null) => void
  onPulseLayer: (id: LayerId) => void
  onSelectComponent: (camada: LayerId, compId: string) => void
  onExplodeAll: () => void
  onCloseAll: () => void
  onOnlyExterior: () => void
}

export default function LayerRail(props: RailProps) {
  const { visible, isolate, selectedId, onToggleLayer, onIsolateLayer, onPulseLayer, onSelectComponent, onExplodeAll, onCloseAll, onOnlyExterior } = props
  const [tab, setTab] = useState<'camadas' | 'indice'>('camadas')
  const [query, setQuery] = useState('')

  const visibleCount = LAYER_ORDER.filter((id) => visible[id]).length

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return camadas3d
      .map((c) => ({
        ...c,
        componentes: q
          ? c.componentes.filter(
              (comp) =>
                comp.nome.toLowerCase().includes(q) ||
                comp.localizacao.toLowerCase().includes(q) ||
                comp.funcao.toLowerCase().includes(q),
            )
          : c.componentes,
      }))
      .filter((c) => c.componentes.length > 0)
  }, [query])

  return (
    <div className="flex h-full flex-col border-r border-hairline bg-panel">
      {/* cabeçalho */}
      <div className="border-b border-hairline px-4 pb-3 pt-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan">// CAMADAS DA AERONAVE</p>
        <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
          {visibleCount}/9 VISÍVEIS
          {isolate && (
            <button
              type="button"
              onClick={() => onIsolateLayer(null)}
              className="ml-2 border border-amber/60 px-1.5 py-0.5 text-[9px] text-amber transition-colors hover:bg-amber/10"
            >
              ISOLADO: {LAYERS[isolate].short} ✕
            </button>
          )}
        </p>
        {/* tabs */}
        <div className="mt-3 flex border border-hairline" role="tablist" aria-label="Modo do painel">
          {(
            [
              { id: 'camadas', label: 'CAMADAS', Icon: Layers },
              { id: 'indice', label: 'ÍNDICE', Icon: ListFilter },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors',
                tab === t.id ? 'bg-overlay text-cyan' : 'text-faint hover:text-muted',
              )}
            >
              <t.Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'camadas' ? (
        <>
          {/* lâminas das 9 camadas */}
          <ul className="flex-1 overflow-y-auto px-3 py-3" aria-label="Camadas da aeronave">
            {LAYER_ORDER.map((id, i) => {
              const meta = LAYERS[id]
              const on = visible[id]
              const camada = camadas3d.find((c) => c.id === id)
              const n = camada?.componentes.length ?? 0
              const Icon = meta.icon
              return (
                <li key={id} className="mb-1.5">
                  <div
                    role="button"
                    tabIndex={0}
                    aria-pressed={on}
                    aria-label={`Camada ${i + 1}: ${meta.short} — ${on ? 'visível' : 'removida'}. Duplo-clique para isolar.`}
                    onClick={() => onToggleLayer(id)}
                    onDoubleClick={() => onIsolateLayer(isolate === id ? null : id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onToggleLayer(id)
                      }
                    }}
                    onMouseEnter={() => onPulseLayer(id)}
                    className={cn(
                      'group relative flex w-full cursor-pointer items-center gap-3 border px-3 py-2.5 text-left transition-all duration-300',
                      on ? 'border-hairline bg-raised hover:border-cyan-dim' : 'border-hairline/50 bg-transparent opacity-55 hover:opacity-90',
                      isolate === id && 'border-cyan bg-cyan/[0.06]',
                    )}
                    style={{ borderLeftColor: meta.color, borderLeftWidth: 3 }}
                  >
                    <span className="font-mono text-[10px] text-faint">{String(i + 1).padStart(2, '0')}</span>
                    <Icon className="h-4 w-4 shrink-0" style={{ color: on ? meta.color : '#54687E' }} aria-hidden="true" />
                    <span className="flex-1 leading-tight">
                      <span className={cn('block font-mono text-[10px] font-semibold uppercase tracking-[0.14em]', on ? 'text-ink' : 'text-muted')}>
                        {meta.short}
                      </span>
                      <span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-faint">{n} COMPONENTES</span>
                    </span>
                    <button
                      type="button"
                      aria-label={on ? `Remover camada ${meta.short}` : `Adicionar camada ${meta.short}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleLayer(id)
                      }}
                      className={cn(
                        'flex h-7 w-7 items-center justify-center border transition-colors',
                        on ? 'border-cyan-dim text-cyan hover:bg-cyan/10' : 'border-hairline text-faint hover:text-muted',
                      )}
                    >
                      {on ? <Eye className="h-3.5 w-3.5" aria-hidden="true" /> : <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>

          {/* ações em massa */}
          <div className="grid grid-cols-3 gap-1.5 border-t border-hairline p-3">
            <button
              type="button"
              onClick={onExplodeAll}
              className="border border-cyan-dim bg-cyan/10 px-1 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-cyan transition-colors hover:bg-cyan/20"
            >
              EXPLODIR TUDO
            </button>
            <button
              type="button"
              onClick={onCloseAll}
              className="border border-hairline px-1 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted transition-colors hover:border-cyan-dim hover:text-ink"
            >
              FECHAR TUDO
            </button>
            <button
              type="button"
              onClick={onOnlyExterior}
              className="border border-hairline px-1 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted transition-colors hover:border-cyan-dim hover:text-ink"
            >
              SÓ EXTERIOR
            </button>
          </div>
        </>
      ) : (
        <>
          {/* busca local do índice */}
          <div className="border-b border-hairline px-3 py-2.5">
            <label className="flex items-center gap-2 border border-hairline bg-raised px-2.5 py-2">
              <Search className="h-3.5 w-3.5 shrink-0 text-faint" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="BUSCAR COMPONENTE…"
                aria-label="Buscar componente"
                className="w-full bg-transparent font-mono text-[11px] uppercase tracking-[0.1em] text-ink placeholder:text-faint focus:outline-none"
              />
            </label>
          </div>
          {/* lista-índice por camada (navegável por teclado) */}
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {filtered.length === 0 && (
              <p className="px-1 py-4 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">NENHUM COMPONENTE ENCONTRADO</p>
            )}
            {filtered.map((c) => {
              const meta = LAYERS[c.id as LayerId]
              if (!meta) return null
              return (
                <section key={c.id} className="mb-4" aria-label={meta.short}>
                  <header className="mb-1.5 flex items-center gap-2 px-1">
                    <span className="h-1.5 w-1.5" style={{ backgroundColor: meta.color }} aria-hidden="true" />
                    <h4 className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em]" style={{ color: meta.color }}>
                      {meta.short}
                    </h4>
                    <span className="font-mono text-[9px] text-faint">{c.componentes.length}</span>
                  </header>
                  <ul>
                    {c.componentes.map((comp) => (
                      <li key={comp.id}>
                        <button
                          type="button"
                          onClick={() => onSelectComponent(c.id as LayerId, comp.id)}
                          className={cn(
                            'w-full border-l-2 px-2.5 py-1.5 text-left font-mono text-[11px] leading-snug transition-colors',
                            selectedId === comp.id
                              ? 'border-cyan bg-cyan/10 text-cyan'
                              : 'border-transparent text-muted hover:bg-overlay hover:text-ink',
                          )}
                        >
                          {comp.nome}
                          <span className="block text-[9px] uppercase tracking-[0.12em] text-faint">{comp.localizacao}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
