// ComponentDrawer — ficha operacional do componente clicado (Drawer compartilhado):
// chips camada + SOP, LOCALIZAÇÃO / FUNÇÃO / OPERAÇÃO (dados), ações
// ISOLAR / VER NO SISTEMA / VER NO COCKPIT 2D e navegação ‹ ANTERIOR / PRÓXIMO ›.

import { Link } from 'react-router'
import { ArrowLeft, ArrowRight, BookOpenText, Crosshair, Gauge } from 'lucide-react'
import Drawer from '@/components/ui-custom/Drawer'
import { DataRow } from '@/components/ui-custom/SpecTable'
import { camadas3d } from '@/data'
import { COCKPIT_LINKS, LAYERS } from './config'
import type { LayerId } from './config'

interface FichaProps {
  camadaId: LayerId | null
  compId: string | null
  isolated: boolean
  onClose: () => void
  onNavigate: (camada: LayerId, compId: string) => void
  onIsolate: (camada: LayerId | null) => void
}

export default function ComponentDrawer({ camadaId, compId, isolated, onClose, onNavigate, onIsolate }: FichaProps) {
  const camada = camadas3d.find((c) => c.id === camadaId) ?? null
  const comp = camada?.componentes.find((c) => c.id === compId) ?? null
  const meta = camadaId ? LAYERS[camadaId] : null

  const idx = camada && comp ? camada.componentes.findIndex((c) => c.id === comp.id) : -1
  const prev = camada && idx > 0 ? camada.componentes[idx - 1] : null
  const next = camada && idx >= 0 && idx < camada.componentes.length - 1 ? camada.componentes[idx + 1] : null

  const cockpit = comp ? COCKPIT_LINKS[comp.id] : undefined

  return (
    <Drawer
      open={!!comp}
      onClose={onClose}
      title={comp?.nome}
      chip={camada && meta ? `FICHA OPERACIONAL // ${camada.nome}` : undefined}
    >
      {comp && camada && meta && (
        <div>
          {/* chips: camada (cor-chave) + âncora SOP + índice na camada */}
          <div className="mb-5 flex flex-wrap gap-1.5">
            <span
              className="border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em]"
              style={{ borderColor: meta.color, color: meta.color }}
            >
              {meta.short}
            </span>
            {meta.sopChip && (
              <span className="border border-hairline px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                {meta.sopChip}
              </span>
            )}
            <span className="border border-hairline px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
              {String(idx + 1).padStart(2, '0')}/{String(camada.componentes.length).padStart(2, '0')}
            </span>
          </div>

          {/* localização */}
          <div className="mb-5">
            <DataRow label="LOCALIZAÇÃO" value={comp.localizacao} />
          </div>

          {/* função */}
          <section className="mb-5" aria-label="Função">
            <h4 className="mb-2 border-l-2 pl-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan" style={{ borderColor: meta.color }}>
              FUNÇÃO
            </h4>
            <p className="text-[13px] leading-relaxed text-muted">{comp.funcao}</p>
          </section>

          {/* operação */}
          <section className="mb-5" aria-label="Operação">
            <h4 className="mb-2 border-l-2 pl-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan" style={{ borderColor: meta.color }}>
              OPERAÇÃO
            </h4>
            <p className="text-[13px] leading-relaxed text-muted">{comp.detalhes_operacionais}</p>
          </section>

          {/* contexto da camada */}
          <section className="mb-6 border border-hairline bg-raised p-3" aria-label="Sobre a camada">
            <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-faint">SOBRE A CAMADA</p>
            <p className="text-[12px] leading-relaxed text-muted">{camada.descricao}</p>
          </section>

          {/* ações */}
          <div className="mb-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onIsolate(isolated ? null : (camadaId as LayerId))}
              className="flex items-center justify-center gap-2 border border-cyan-dim bg-cyan/10 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-cyan transition-colors hover:bg-cyan/20"
            >
              <Crosshair className="h-4 w-4" aria-hidden="true" />
              {isolated ? 'SAIR DO ISOLADO (ESC)' : 'ISOLAR COMPONENTE'}
            </button>
            {meta.sopHref && (
              <Link
                to={meta.sopHref}
                className="flex items-center justify-center gap-2 border border-hairline px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted transition-colors hover:border-cyan-dim hover:text-cyan"
              >
                <BookOpenText className="h-4 w-4" aria-hidden="true" />
                VER NO SISTEMA ({meta.sopChip})
              </Link>
            )}
            {cockpit && (
              <Link
                to={`/cockpit?i=${cockpit}`}
                className="flex items-center justify-center gap-2 border border-hairline px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted transition-colors hover:border-cyan-dim hover:text-cyan"
              >
                <Gauge className="h-4 w-4" aria-hidden="true" />
                VER NO COCKPIT 2D
              </Link>
            )}
          </div>

          {/* navegação dentro da camada */}
          <div className="grid grid-cols-2 gap-2 border-t border-hairline pt-4">
            <button
              type="button"
              disabled={!prev}
              onClick={() => prev && onNavigate(camadaId as LayerId, prev.id)}
              className="flex items-center gap-1.5 border border-hairline px-2 py-2 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-muted transition-colors enabled:hover:border-cyan-dim enabled:hover:text-ink disabled:opacity-30"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{prev ? prev.nome : '—'}</span>
            </button>
            <button
              type="button"
              disabled={!next}
              onClick={() => next && onNavigate(camadaId as LayerId, next.id)}
              className="flex items-center justify-end gap-1.5 border border-hairline px-2 py-2 text-right font-mono text-[10px] uppercase tracking-[0.1em] text-muted transition-colors enabled:hover:border-cyan-dim enabled:hover:text-ink disabled:opacity-30"
            >
              <span className="truncate">{next ? next.nome : '—'}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </Drawer>
  )
}
