// QrhView — "Modo QRH" (design/emergencias.md §3, interaction especial).
// Vista de impressão: fundo claro #E9E4D8, texto escuro, mono puro, sem
// animações — layout de bolso para estudo/impressão. IMPRIMIR usa window.print
// com folha de estilo de impressão injetada (esconde o chrome do site).

import { Printer, X } from 'lucide-react'
import { emergencias } from '@/data'
import { highlightPassos, notaVariante } from './emergenciasUtils'

interface Props {
  onClose: () => void
}

export default function QrhView({ onClose }: Props) {
  return (
    <section className="qrh-view bg-[#E9E4D8] py-14 text-[#16222F]" aria-label="Modo QRH — vista de impressão">
      {/* esconde navbar/footer na impressão */}
      <style>{'@media print { header, footer { display: none !important; } body { background: #E9E4D8 !important; } body::after { display: none !important; } }'}</style>

      <div className="mx-auto max-w-[900px] px-6 md:px-12">
        {/* cabeçalho do modo */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#16222F] pb-5 print:border-[#16222F]">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#8A1F1F]">
              // SEÇÃO 12 — SOP REV.13 · MODO QRH
            </p>
            <h2 className="mt-2 font-mono text-2xl font-bold uppercase tracking-tight">
              Emergências — PA34-200 Seneca I
            </h2>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[#16222F]/60">
              21 procedimentos · quick reference handbook · material de estudo
            </p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 border-2 border-[#16222F] bg-[#16222F] px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-[#E9E4D8] transition-colors hover:bg-transparent hover:text-[#16222F]"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              Imprimir
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 border-2 border-[#16222F]/40 px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-[#16222F]/80 transition-colors hover:border-[#16222F] hover:text-[#16222F]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Sair do modo QRH
            </button>
          </div>
        </div>

        {/* os 21 procedimentos, sempre expandidos */}
        <div className="mt-8 space-y-8">
          {emergencias.map((e) => (
            <article key={e.id} className="break-inside-avoid border-2 border-[#16222F]/70 bg-[#E9E4D8]">
              <header className="flex flex-wrap items-baseline gap-3 border-b border-[#16222F]/40 px-5 py-3">
                <span className="font-mono text-sm font-bold tracking-[0.1em] text-[#8A1F1F]">SOP {e.secao_sop}</span>
                <h3 className="font-mono text-base font-bold uppercase leading-snug">{e.titulo}</h3>
                <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-[#16222F]/60">
                  {e.passos.length} {e.passos.length === 1 ? 'passo' : 'passos'}
                </span>
              </header>
              <div className="px-5 py-4">
                <p className="font-mono text-[12.5px] italic leading-relaxed text-[#16222F]/75">{e.situacao}</p>
                <ol className="mt-4 space-y-2.5">
                  {e.passos.map((p, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-[#8A1F1F] font-mono text-[11px] font-bold text-[#8A1F1F]">
                        {i + 1}
                      </span>
                      <span className="font-mono text-[13px] leading-[1.6]">
                        {highlightPassos(p, 'font-bold text-[#8A1F1F]')}
                      </span>
                    </li>
                  ))}
                </ol>
                {e.notas_criticas.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-[#16222F]/30 pt-3">
                    {e.notas_criticas.map((n, i) => (
                      <p key={i} className="flex gap-2 font-mono text-[12px] leading-relaxed">
                        <span
                          className={
                            notaVariante(n) === 'perigo'
                              ? 'shrink-0 font-bold uppercase text-[#8A1F1F]'
                              : 'shrink-0 font-bold uppercase text-[#7A5A00]'
                          }
                        >
                          {notaVariante(n) === 'perigo' ? '■ PERIGO:' : '■ CUIDADO:'}
                        </span>
                        <span>{n}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        <p className="mt-10 border-t border-[#16222F]/40 pt-4 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-[#16222F]/60">
          Material de estudo — não substitui o POH/Manual de Voo · SOP VoeFloripa REV.13
        </p>
      </div>
    </section>
  )
}
