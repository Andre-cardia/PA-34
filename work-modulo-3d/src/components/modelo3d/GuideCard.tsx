// GuideCard — empty-state do painel de detalhes (§5.1): título "NENHUM
// COMPONENTE SELECIONADO", instruções de interação e mini-índice das 9 camadas
// clicável (seleciona o 1º componente da camada). Flutua no canto do canvas
// (desktop) e some quando há seleção ou em telas pequenas.

import { MousePointerClick, Move3d, ZoomIn } from 'lucide-react'
import { camadas3d } from '@/data'
import { LAYERS, LAYER_ORDER } from './config'
import type { LayerId } from './config'

interface GuideProps {
  onSelectComponent: (camada: LayerId, compId: string) => void
}

export default function GuideCard({ onSelectComponent }: GuideProps) {
  return (
    <aside
      aria-label="Guia rápido do modelo 3D"
      className="pointer-events-auto absolute right-4 top-14 hidden w-72 border border-hairline bg-panel/95 backdrop-blur-sm lg:block"
    >
      <header className="border-b border-hairline px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan">NENHUM COMPONENTE SELECIONADO</p>
      </header>
      <div className="space-y-2 px-4 py-3">
        <p className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          <MousePointerClick className="h-3.5 w-3.5 shrink-0 text-cyan" aria-hidden="true" />
          CLIQUE NUM COMPONENTE → FICHA
        </p>
        <p className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          <Move3d className="h-3.5 w-3.5 shrink-0 text-cyan" aria-hidden="true" />
          ARRASTE PARA ORBITAR
        </p>
        <p className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          <ZoomIn className="h-3.5 w-3.5 shrink-0 text-cyan" aria-hidden="true" />
          SCROLL PARA ZOOM
        </p>
      </div>
      <div className="border-t border-hairline px-4 py-3">
        <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-faint">MINI-ÍNDICE DE CAMADAS</p>
        <ul className="grid grid-cols-1 gap-0.5">
          {LAYER_ORDER.map((id) => {
            const meta = LAYERS[id]
            const first = camadas3d.find((c) => c.id === id)?.componentes[0]
            if (!first) return null
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onSelectComponent(id, first.id)}
                  className="flex w-full items-center gap-2 px-1 py-1 text-left font-mono text-[10px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-cyan"
                >
                  <span className="h-1.5 w-1.5 shrink-0" style={{ backgroundColor: meta.color }} aria-hidden="true" />
                  {meta.short}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
