// StaticFallback — fallback de performance (§8): prefer-reduced-motion,
// dispositivos fracos ou sem WebGL. Modelo estático (vista de 3 vistas SVG) +
// camadas como tiras horizontais empilhadas com todos os componentes
// clicáveis — mesma navegação e mesmas fichas, sem 3D.

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import PA34ThreeView from '@/components/assets/PA34ThreeView'
import { camadas3d } from '@/data'
import { cn } from '@/lib/utils'
import { LAYERS } from './config'
import type { LayerId } from './config'

interface FallbackProps {
  reason: string
  selectedId: string | null
  onSelectComponent: (camada: LayerId, compId: string) => void
}

export default function StaticFallback({ reason, selectedId, onSelectComponent }: FallbackProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return camadas3d
    return camadas3d
      .map((c) => ({
        ...c,
        componentes: c.componentes.filter(
          (comp) =>
            comp.nome.toLowerCase().includes(q) ||
            comp.localizacao.toLowerCase().includes(q) ||
            comp.funcao.toLowerCase().includes(q),
        ),
      }))
      .filter((c) => c.componentes.length > 0)
  }, [query])

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-8">
      {/* aviso de modo estático */}
      <div className="mb-6 border border-amber/40 bg-amber/[0.06] px-4 py-2.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber">
          MODO ESTÁTICO — {reason}. Conteúdo técnico completo disponível abaixo, sem o modelo 3D.
        </p>
      </div>

      {/* modelo estático (vistas técnicas SVG) */}
      <figure className="mb-8 border border-hairline bg-panel p-4">
        <PA34ThreeView className="h-auto w-full" />
        <figcaption className="mt-3 border-t border-hairline pt-3 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
          PA34-200 SENECA I — VISTAS TÉCNICAS (PLANTA · PERFIL · FRONTAL)
        </figcaption>
      </figure>

      {/* busca */}
      <label className="mb-6 flex items-center gap-2 border border-hairline bg-panel px-3 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="BUSCAR COMPONENTE…"
          aria-label="Buscar componente"
          className="w-full bg-transparent font-mono text-[12px] uppercase tracking-[0.1em] text-ink placeholder:text-faint focus:outline-none"
        />
      </label>

      {/* camadas como tiras horizontais estáticas empilhadas */}
      <div className="space-y-4">
        {filtered.map((c) => {
          const meta = LAYERS[c.id as LayerId]
          if (!meta) return null
          return (
            <section key={c.id} className="border border-hairline bg-panel" aria-label={c.nome}>
              <header
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-hairline px-4 py-3"
                style={{ borderLeftColor: meta.color, borderLeftWidth: 3 }}
              >
                <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: meta.color }}>
                  {meta.short}
                </h3>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                  {c.componentes.length} COMPONENTES
                </span>
                <p className="w-full text-[12px] leading-relaxed text-muted">{c.descricao}</p>
              </header>
              <ul className="grid grid-cols-1 gap-px bg-hairline/40 sm:grid-cols-2 lg:grid-cols-3">
                {c.componentes.map((comp) => (
                  <li key={comp.id} className="bg-panel">
                    <button
                      type="button"
                      onClick={() => onSelectComponent(c.id as LayerId, comp.id)}
                      aria-pressed={selectedId === comp.id}
                      className={cn(
                        'h-full w-full px-3.5 py-2.5 text-left transition-colors',
                        selectedId === comp.id ? 'bg-cyan/10 text-cyan' : 'text-muted hover:bg-overlay hover:text-ink',
                      )}
                    >
                      <span className="block font-mono text-[11px] font-medium leading-snug">{comp.nome}</span>
                      <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-faint">{comp.localizacao}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
