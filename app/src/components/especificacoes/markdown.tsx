// Utilitários de markdown para os trechos do SOP (intro_generalidades.md via
// ?raw). Apenas funções (sem componentes) — ver miniMarkdown.tsx p/ render.

import type { ReactNode } from 'react'

export type MdBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'table'; header: string[]; rows: string[][] }

/** Extrai o corpo de uma seção "## 05 – ..." até o próximo heading de mesmo nível. */
export function extractSection(raw: string, headingPrefix: string): string {
  const lines = raw.split('\n')
  const start = lines.findIndex((l) => l.trimStart().startsWith(headingPrefix))
  if (start === -1) return ''
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) {
    if (/^#{1,2}\s/.test(lines[i]) || /^---\s*$/.test(lines[i])) {
      end = i
      break
    }
  }
  return lines.slice(start + 1, end).join('\n')
}

/** Extrai apenas os itens de lista ("- **Bimotora** — ...") de um trecho. */
export function extractListItems(section: string): string[] {
  return section
    .split('\n')
    .filter((l) => l.trimStart().startsWith('- '))
    .map((l) => l.trimStart().slice(2).trim())
}

export function parseBlocks(section: string): MdBlock[] {
  const lines = section.split('\n')
  const blocks: MdBlock[] = []
  let para: string[] = []
  let list: string[] = []
  let table: string[][] = []

  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: 'paragraph', text: para.join(' ') })
      para = []
    }
  }
  const flushList = () => {
    if (list.length) {
      blocks.push({ type: 'list', items: list })
      list = []
    }
  }
  const flushTable = () => {
    if (table.length) {
      const rows = table.filter((r) => !r.every((c) => /^:?-{2,}:?$/.test(c.trim())))
      if (rows.length) {
        blocks.push({ type: 'table', header: rows[0], rows: rows.slice(1) })
      }
      table = []
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line === '---') {
      flushPara()
      flushList()
      flushTable()
      continue
    }
    if (line.startsWith('|')) {
      flushPara()
      flushList()
      table.push(
        line
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((c) => c.trim()),
      )
      continue
    }
    flushTable()
    if (line.startsWith('- ')) {
      flushPara()
      list.push(line.slice(2).trim())
      continue
    }
    flushList()
    if (line.startsWith('>')) {
      flushPara()
      blocks.push({ type: 'quote', text: line.replace(/^>\s?/, '') })
      continue
    }
    para.push(line)
  }
  flushPara()
  flushList()
  flushTable()
  return blocks
}

/** Inline: **negrito** → strong ink; `código` → mono cyan. */
export function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-ink">
          {p.slice(2, -2)}
        </strong>
      )
    }
    if (p.startsWith('`') && p.endsWith('`')) {
      return (
        <code key={i} className="font-mono text-[0.85em] text-cyan">
          {p.slice(1, -1)}
        </code>
      )
    }
    return <span key={i}>{p}</span>
  })
}
