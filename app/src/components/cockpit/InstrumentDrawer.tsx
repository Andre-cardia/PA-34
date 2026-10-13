// InstrumentDrawer — ficha do instrumento (cockpit.md §4): miniatura vetorial
// com gauge sweep, FUNÇÃO, OPERAÇÃO & LIMITES com valores destacados,
// ligações cruzadas e navegação anterior/próximo dentro da categoria.

import { useMemo } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, ArrowRight, Box, ExternalLink } from 'lucide-react'
import Drawer from '@/components/ui-custom/Drawer'
import { instrumentosCockpit } from '@/data'
import { PANEL_MAP, RELATED, catMeta, instrumentById } from './panel-data'
import { MiniArt } from './artwork'

export interface InstrumentDrawerProps {
  id: string | null
  night: boolean
  onClose: () => void
  onSelect: (id: string) => void
}

// ---------------------------------------------------------------------------
// Texto rico — realça arcos, linhas e valores do campo `operacao`
// ---------------------------------------------------------------------------

const RX =
  /(arco verde|arco amarelo|arco branco|linha azul|linha vermelha|radial vermelho|\bVne\b|\bVmc\b|\bVyse\b|\d+(?:[.,]\d+)?\s?(?:MPH|kt|RPM|PSI|inHg|GPH|°F|°C|ft\/min|fpm|ft|gal|kHz|MHz|NM|MB|V|A)(?![\w.%,]))/gi

function chipColor(match: string): { color: string; swatch: boolean } {
  const m = match.toLowerCase()
  if (m === 'arco verde') return { color: '#3DDC97', swatch: true }
  if (m === 'arco amarelo') return { color: '#FFB020', swatch: true }
  if (m === 'arco branco') return { color: '#E9E4D8', swatch: true }
  if (m === 'linha azul' || m === 'vyse') return { color: '#5B9DFF', swatch: true }
  if (m.includes('vermelh') || m === 'vne' || m === 'vmc') return { color: '#FF4D4D', swatch: true }
  return { color: '#3FE0FF', swatch: false }
}

function RichOp({ text }: { text: string }) {
  const parts = text.split(RX)
  return (
    <p className="text-[13px] leading-relaxed text-muted">
      {parts.map((part, i) => {
        if (i % 2 === 0) return part
        const { color, swatch } = chipColor(part)
        return (
          <span
            key={i}
            className="mx-0.5 inline-flex translate-y-[-1px] items-center gap-1 border px-1 py-px font-mono text-[10px] uppercase"
            style={{ color, borderColor: `${color}55`, background: `${color}0F` }}
          >
            {swatch && <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden="true" />}
            {part}
          </span>
        )
      })}
    </p>
  )
}

// ---------------------------------------------------------------------------

export default function InstrumentDrawer({ id, night, onClose, onSelect }: InstrumentDrawerProps) {
  const inst = id ? instrumentById[id] : undefined
  const entry = id ? PANEL_MAP[id] : undefined

  const catSiblings = useMemo(
    () => (inst ? instrumentosCockpit.filter((i) => i.categoria === inst.categoria).map((i) => i.id) : []),
    [inst],
  )
  const globalIdx = id ? instrumentosCockpit.findIndex((i) => i.id === id) : -1
  const catIdx = id ? catSiblings.indexOf(id) : -1
  const prevId = catIdx > 0 ? catSiblings[catIdx - 1] : null
  const nextId = catIdx >= 0 && catIdx < catSiblings.length - 1 ? catSiblings[catIdx + 1] : null
  const rel = id ? RELATED[id] : undefined
  const meta = inst ? catMeta(inst.categoria) : undefined

  return (
    <Drawer open={id !== null} onClose={onClose} chip={meta?.label} title={inst?.nome ?? ''}>
      {inst && entry && meta && (
        <div className="flex flex-col gap-5">
          {/* subtítulo EN + zona */}
          <div className="-mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">{inst.nome_en}</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.18em]" style={{ color: meta.color }}>
              {entry.zone}
            </span>
          </div>

          {/* miniatura com gauge sweep */}
          <div className="border border-hairline bg-panel p-2">
            <MiniArt key={inst.id} id={inst.id} night={night} sweep className="mx-auto block h-44 w-full max-w-[260px]" />
            <p className="mt-1 text-center font-mono text-[8px] uppercase tracking-[0.22em] text-faint">
              Indicação típica de cruzeiro
            </p>
          </div>

          {/* função */}
          <section>
            <h4 className="border-b border-hairline pb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">
              Função
            </h4>
            <p className="mt-2.5 text-[13px] leading-relaxed text-muted">{inst.descricao}</p>
          </section>

          {/* operação */}
          <section>
            <h4 className="border-b border-hairline pb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">
              Operação &amp; limites
            </h4>
            <div className="mt-2.5">
              <RichOp text={inst.operacao} />
            </div>
          </section>

          {/* ligações */}
          {rel && (rel.links?.length || rel.instruments?.length) && (
            <section>
              <h4 className="border-b border-hairline pb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">
                Ligações
              </h4>
              <div className="mt-3 flex flex-col gap-2">
                {rel.links?.map((l) =>
                  l.is3d ? (
                    <Link
                      key={l.href}
                      to={l.href}
                      className="flex items-center justify-between border border-cyan-dim bg-cyan/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-cyan transition-colors hover:bg-cyan/20"
                    >
                      <span className="flex items-center gap-2">
                        <Box className="h-3.5 w-3.5" aria-hidden="true" />
                        {l.label}
                      </span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  ) : (
                    <Link
                      key={l.href}
                      to={l.href}
                      className="flex items-center gap-2 border border-hairline px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:border-cyan-dim hover:text-cyan"
                    >
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      {l.label}
                    </Link>
                  ),
                )}
                {rel.instruments && rel.instruments.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {rel.instruments.map((rid) => {
                      const ri = instrumentById[rid]
                      if (!ri) return null
                      const rmeta = catMeta(ri.categoria)
                      return (
                        <button
                          key={rid}
                          type="button"
                          onClick={() => onSelect(rid)}
                          className="flex items-center gap-1.5 border border-hairline px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-faint transition-colors hover:text-ink"
                          style={{ borderLeftColor: rmeta.color, borderLeftWidth: 2 }}
                        >
                          {ri.nome}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* navegação anterior / próximo na categoria */}
          <div className="mt-2 flex items-center justify-between border-t border-hairline pt-4">
            <button
              type="button"
              disabled={!prevId}
              onClick={() => prevId && onSelect(prevId)}
              className="flex items-center gap-1.5 border border-hairline px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted transition-colors enabled:hover:border-cyan-dim enabled:hover:text-cyan disabled:opacity-35"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Anterior
            </button>
            <span className="font-mono text-[10px] tracking-[0.18em] text-faint">
              {globalIdx + 1}/{instrumentosCockpit.length}
            </span>
            <button
              type="button"
              disabled={!nextId}
              onClick={() => nextId && onSelect(nextId)}
              className="flex items-center gap-1.5 border border-hairline px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted transition-colors enabled:hover:border-cyan-dim enabled:hover:text-cyan disabled:opacity-35"
            >
              Próximo <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </Drawer>
  )
}
