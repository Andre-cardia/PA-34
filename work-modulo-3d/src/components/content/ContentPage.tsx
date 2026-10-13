import type { ReactNode } from 'react'
import PageHero from '@/components/ui-custom/PageHero'

export interface ContentPageProps {
  secao: string
  title: string
  lead: string
  children: ReactNode
}

export function ContentPage({ secao, title, lead, children }: ContentPageProps) {
  return (
    <>
      <PageHero secao={secao} title={title} lead={lead} breadcrumb={[{ label: 'HOME', to: '/' }, { label: title }]} />
      <div className="mx-auto w-full max-w-content px-6 py-16 md:px-12 md:py-24">{children}</div>
    </>
  )
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function inlineText(value: string) {
  const tokens = value.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean)
  return tokens.map((token, index) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={`${token}-${index}`} className="font-semibold text-ink">{token.slice(2, -2)}</strong>
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return <code key={`${token}-${index}`} className="rounded-sm border border-hairline bg-abyss px-1.5 py-0.5 font-mono text-[0.9em] text-cyan">{token.slice(1, -1)}</code>
    }
    return <span key={`${token}-${index}`}>{token}</span>
  })
}

function MarkdownView({ source }: { source: string }) {
  const lines = source.replace(/\r/g, '').split('\n')
  const blocks: ReactNode[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index].trimEnd()
    if (!line.trim()) {
      index += 1
      continue
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line)
    if (heading) {
      const level = heading[1].length
      const text = heading[2].replace(/\*\*/g, '')
      const headingId = slugify(text)
      const numericAlias = headingId.match(/^\d+(?:-\d+)?/)?.[0]
      const Tag = level <= 2 ? 'h2' : 'h3'
      blocks.push(
        <Tag
          key={`heading-${index}`}
          id={headingId}
          className={level <= 2 ? 'mt-12 scroll-mt-24 font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl' : 'mt-8 scroll-mt-24 font-display text-xl font-semibold text-ink'}
        >
          {numericAlias && <span id={numericAlias} className="relative -top-24 block h-0" aria-hidden="true" />}
          {inlineText(text)}
        </Tag>,
      )
      index += 1
      continue
    }

    if (/^[-*_]{3,}$/.test(line.trim())) {
      blocks.push(<hr key={`rule-${index}`} className="my-8 border-hairline" />)
      index += 1
      continue
    }

    if (line.startsWith('>')) {
      const quote: string[] = []
      while (index < lines.length && lines[index].trim().startsWith('>')) {
        quote.push(lines[index].trim().replace(/^>\s?/, ''))
        index += 1
      }
      blocks.push(
        <aside key={`quote-${index}`} className="my-6 border-l-2 border-cyan bg-cyan/[0.06] px-5 py-4 text-[15px] leading-relaxed text-muted">
          {quote.map((item, quoteIndex) => <p key={`${item}-${quoteIndex}`}>{inlineText(item)}</p>)}
        </aside>,
      )
      continue
    }

    if (line.trimStart().startsWith('|')) {
      const tableLines: string[] = []
      while (index < lines.length && lines[index].trimStart().startsWith('|')) {
        tableLines.push(lines[index].trim())
        index += 1
      }
      const rows = tableLines
        .filter((row) => !/^\|?\s*:?-{2,}/.test(row.replace(/\|/g, '').trim()))
        .map((row) => row.replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim()))
      const [header, ...body] = rows
      if (header) {
        blocks.push(
          <div key={`table-${index}`} className="my-6 overflow-x-auto border-y border-hairline">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr>{header.map((cell, cellIndex) => <th key={`${cell}-${cellIndex}`} className="border-b border-hairline px-3 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{inlineText(cell)}</th>)}</tr>
              </thead>
              <tbody>
                {body.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}`} className="border-b border-hairline/60 last:border-b-0">
                    {row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`} className="px-3 py-3 text-sm leading-relaxed text-muted">{inlineText(cell)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        )
      }
      continue
    }

    if (/^\s*(?:[-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line)
      const items: string[] = []
      while (index < lines.length && /^\s*(?:[-*]|\d+\.)\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*(?:[-*]|\d+\.)\s+/, ''))
        index += 1
      }
      const ListTag = ordered ? 'ol' : 'ul'
      blocks.push(
        <ListTag key={`list-${index}`} className={`my-5 space-y-2 pl-5 text-[15px] leading-relaxed text-muted marker:text-cyan ${ordered ? 'list-decimal' : 'list-disc'}`}>
          {items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{inlineText(item)}</li>)}
        </ListTag>,
      )
      continue
    }

    const paragraph: string[] = [line]
    index += 1
    while (index < lines.length && lines[index].trim() && !/^(#{1,4})\s+/.test(lines[index]) && !lines[index].trimStart().startsWith('|') && !lines[index].trimStart().startsWith('>') && !/^\s*(?:[-*]|\d+\.)\s+/.test(lines[index])) {
      paragraph.push(lines[index].trim())
      index += 1
    }
    blocks.push(<p key={`paragraph-${index}`} className="my-4 max-w-4xl text-[15px] leading-relaxed text-muted">{inlineText(paragraph.join(' '))}</p>)
  }

  return <div className="prose-technical">{blocks}</div>
}

export { MarkdownView }

export function DataCards({ items }: { items: Array<{ label: string; value: ReactNode; tone?: 'cyan' | 'green' | 'amber' | 'red' | 'blue' }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="border border-hairline bg-raised p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">{item.label}</p>
          <p className={`mt-2 font-display text-2xl font-semibold ${item.tone === 'red' ? 'text-red' : item.tone === 'amber' ? 'text-amber' : item.tone === 'green' ? 'text-green' : item.tone === 'blue' ? 'text-blue' : 'text-cyan'}`}>{item.value}</p>
        </div>
      ))}
    </div>
  )
}
