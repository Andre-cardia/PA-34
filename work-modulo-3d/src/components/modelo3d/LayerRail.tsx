// LayerRail — rail esquerdo: 9 lâminas de camada com cor-chave, pulso no modelo
// ao hover e dois botões reais por linha (isolar ◎ e olho). A linha aceita
// clique (alternar) e duplo-clique (isolar) do mouse, sem parada de Tab (§1–§3).
// Aba ÍNDICE: lista-índice dos 68 componentes agrupados por camada com busca
// local (acessibilidade/teclado — design.md §11).

import { useMemo, useState } from 'react'
import { Crosshair, Eye, EyeOff, Layers, ListFilter, Search } from 'lucide-react'
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
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-cyan">// CAMADAS DA AERONAVE</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-faint" aria-live="polite">
            {visibleCount}/9 VISÍVEIS
          </p>
          {isolate && (
            <button
              type="button"
              onClick={() => onIsolateLayer(null)}
              aria-label={`Sair do isolado: ${LAYERS[isolate].short}`}
              className="border border-amber/60 px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.06em] text-amber transition-colors hover:bg-amber/10"
            >
              ISOLADO: {LAYERS[isolate].short} ✕
            </button>
          )}
        </div>
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
                'flex flex-1 items-center justify-center gap-1.5 px-2 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors',
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
        <div className="flex min-h-0 flex-1 flex-col">
          {/* lâminas das 9 camadas: a linha responde a clique (alternar) e duplo-clique
              (isolar) do mouse; no teclado só os dois botões reais recebem foco. */}
          <ul className="min-h-0 shrink space-y-1 overflow-y-auto px-2 py-2" aria-label="Camadas da aeronave">
            {LAYER_ORDER.map((id, i) => {
              const meta = LAYERS[id]
              const on = visible[id]
              const isolated = isolate === id
              const camada = camadas3d.find((c) => c.id === id)
              const n = camada?.componentes.length ?? 0
              const Icon = meta.icon
              return (
                <li
                  key={id}
                  onClick={() => onToggleLayer(id)}
                  onDoubleClick={() => onIsolateLayer(isolated ? null : id)}
                  onMouseEnter={() => onPulseLayer(id)}
                  onFocus={() => onPulseLayer(id)}
                  title={`${meta.short} — ${n} componentes · tecla ${i + 1} · duplo-clique isola`}
                  className={cn(
                    'group flex h-11 cursor-pointer select-none items-center gap-1 border border-l-[3px] pl-2 pr-1 transition-colors duration-200',
                    on ? 'border-hairline bg-raised hover:border-cyan-dim' : 'border-hairline/40 bg-transparent hover:border-hairline',
                    isolated && 'border-cyan bg-cyan/[0.06] hover:border-cyan',
                  )}
                  style={{ borderLeftColor: on ? meta.color : `${meta.color}55` }}
                >
                  <span className="w-3.5 shrink-0 font-mono text-[10px] tabular-nums text-faint" aria-hidden="true">
                    {i + 1}
                  </span>
                  <Icon className="h-4 w-4 shrink-0" style={{ color: on ? meta.color : '#54687E' }} aria-hidden="true" />
                  <span
                    className={cn(
                      'ml-1 min-w-0 flex-1 truncate font-mono text-[12px] font-medium uppercase tracking-normal',
                      on ? 'text-ink' : 'text-faint',
                    )}
                    title={meta.short}
                  >
                    {meta.short}
                  </span>
                  <span className="mr-1 shrink-0 font-mono text-[11px] tabular-nums text-faint">
                    <span aria-hidden="true">{n}</span>
                    <span className="sr-only">{n} componentes</span>
                  </span>
                  <button
                    type="button"
                    /* sem "camada" no rótulo: roteiros CDP acham o olho por endsWith("camada X") */
                    aria-label={`Isolar ${meta.short}`}
                    aria-pressed={isolated}
                    onClick={(e) => {
                      e.stopPropagation()
                      onIsolateLayer(isolated ? null : id)
                    }}
                    onDoubleClick={(e) => e.stopPropagation()}
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center border transition-[color,background-color,border-color,opacity]',
                      isolated
                        ? 'border-cyan bg-cyan/15 text-cyan'
                        : 'border-hairline text-muted hover:border-cyan-dim hover:text-cyan [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:focus-visible:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100',
                    )}
                  >
                    <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={on ? `Remover camada ${meta.short}` : `Adicionar camada ${meta.short}`}
                    aria-pressed={on}
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleLayer(id)
                    }}
                    onDoubleClick={(e) => e.stopPropagation()}
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center border transition-colors',
                      on ? 'border-cyan-dim text-cyan hover:bg-cyan/10' : 'border-hairline text-faint hover:text-muted',
                    )}
                  >
                    {on ? <Eye className="h-3.5 w-3.5" aria-hidden="true" /> : <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />}
                  </button>
                </li>
              )
            })}
          </ul>

          {/* ações em massa: logo abaixo da lista (sem vão) e fixas quando a lista rola (sheet mobile) */}
          <div className="grid shrink-0 grid-cols-2 gap-1.5 border-t border-hairline px-2 py-2.5">
            <button
              type="button"
              onClick={onExplodeAll}
              className="col-span-2 whitespace-nowrap border border-cyan-dim bg-cyan/10 px-2 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-cyan transition-colors hover:bg-cyan/20"
            >
              EXPLODIR TUDO
            </button>
            <button
              type="button"
              onClick={onCloseAll}
              className="whitespace-nowrap border border-hairline px-2 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted transition-colors hover:border-cyan-dim hover:text-ink"
            >
              FECHAR TUDO
            </button>
            <button
              type="button"
              onClick={onOnlyExterior}
              className="whitespace-nowrap border border-hairline px-2 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted transition-colors hover:border-cyan-dim hover:text-ink"
            >
              SÓ EXTERIOR
            </button>
          </div>
        </div>
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
              <p className="px-1 py-4 font-mono text-[11px] uppercase tracking-[0.12em] text-faint">NENHUM COMPONENTE ENCONTRADO</p>
            )}
            {filtered.map((c) => {
              const meta = LAYERS[c.id as LayerId]
              if (!meta) return null
              return (
                <section key={c.id} className="mb-4" aria-label={meta.short}>
                  <header className="mb-1.5 flex items-center gap-2 px-1">
                    <span className="h-1.5 w-1.5" style={{ backgroundColor: meta.color }} aria-hidden="true" />
                    <h4 className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: meta.color }}>
                      {meta.short}
                    </h4>
                    <span className="font-mono text-[11px] text-faint">{c.componentes.length}</span>
                  </header>
                  <ul>
                    {c.componentes.map((comp) => (
                      <li key={comp.id}>
                        <button
                          type="button"
                          onClick={() => onSelectComponent(c.id as LayerId, comp.id)}
                          className={cn(
                            'w-full border-l-2 px-2.5 py-1.5 text-left font-mono text-[12px] leading-snug transition-colors',
                            selectedId === comp.id
                              ? 'border-cyan bg-cyan/10 text-cyan'
                              : 'border-transparent text-muted hover:bg-overlay hover:text-ink',
                          )}
                        >
                          {comp.nome}
                          <span className="block text-[11px] uppercase tracking-[0.04em] text-faint">{comp.localizacao}</span>
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
