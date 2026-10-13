// Renderizador dos blocos de markdown do SOP (parse em ./markdown).
// Estilizado conforme design.md §3: body Inter muted, dados em mono.

import type { MdBlock } from './markdown'
import { renderInline } from './markdown'

export default function MarkdownBlocks({ blocks }: { blocks: MdBlock[] }) {
  return (
    <div className="space-y-5">
      {blocks.map((b, i) => {
        if (b.type === 'paragraph') {
          return (
            <p key={i} className="text-[15px] leading-relaxed text-muted md:text-base">
              {renderInline(b.text)}
            </p>
          )
        }
        if (b.type === 'list') {
          return (
            <ul key={i} className="space-y-2.5">
              {b.items.map((item, j) => (
                <li key={j} className="flex gap-3 text-[15px] leading-relaxed text-muted">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rotate-45 border border-cyan bg-cyan/30" aria-hidden="true" />
                  <span>{renderInline(item)}</span>
                </li>
              ))}
            </ul>
          )
        }
        if (b.type === 'quote') {
          return (
            <blockquote key={i} className="border-l-2 border-cyan/50 bg-cyan/[0.05] py-3 pl-4 pr-3 text-[15px] leading-relaxed text-muted">
              {renderInline(b.text)}
            </blockquote>
          )
        }
        return (
          <div key={i} className="overflow-x-auto border border-hairline">
            <table className="w-full text-left font-mono text-[13px]">
              <thead>
                <tr className="border-b border-hairline bg-panel">
                  {b.header.map((h, j) => (
                    <th key={j} className="px-3 py-2 font-medium uppercase tracking-[0.14em] text-faint">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline/60">
                {b.rows.map((r, j) => (
                  <tr key={j} className="transition-colors hover:bg-overlay">
                    {r.map((c, k) => (
                      <td key={k} className={k === 0 ? 'px-3 py-2 text-muted' : 'px-3 py-2 text-right text-ink'}>
                        {renderInline(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
