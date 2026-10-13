// Parser de src/data/performance.md (SOP 06–07) — transforma o markdown
// estruturado em dados tipados para as visualizações da página /performance.
// Nenhum valor é hardcoded: tudo vem do arquivo-fonte.

import raw from '@/data/performance.md?raw'

export interface PerfRow {
  label: string
  value: string
}

export interface PerfTable {
  id: string
  title: string
  colLabel: string
  colValue: string
  rows: PerfRow[]
}

export interface PerfSection {
  id: string
  title: string
  tables: PerfTable[]
  bullets: string[]
  paragraphs: string[]
}

export interface Abbrev {
  code: string
  short: string
  long?: string
}

export interface PlanItem {
  title: string
  body: string
}

export interface Planning {
  intro: string
  items: PlanItem[]
  formsIntro: string
  forms: PlanItem[]
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const stripBold = (s: string) => s.replace(/\*\*/g, '')

/** Divide o markdown em seções por headings (`#`/`##`), mantendo `###` no corpo. */
function splitSections(md: string): { level: number; title: string; body: string[] }[] {
  const out: { level: number; title: string; body: string[] }[] = []
  let cur: { level: number; title: string; body: string[] } | null = null
  for (const line of md.split('\n')) {
    const h = line.match(/^(#{1,2})\s+(.*)$/)
    if (h) {
      if (cur) out.push(cur)
      cur = { level: h[1].length, title: h[2].trim(), body: [] }
    } else if (cur) {
      cur.body.push(line)
    }
  }
  if (cur) out.push(cur)
  return out
}

function parseBody(body: string[]): { tables: { colLabel: string; colValue: string; rows: PerfRow[] }[]; bullets: string[]; paragraphs: string[] } {
  const tables: { colLabel: string; colValue: string; rows: PerfRow[] }[] = []
  const bullets: string[] = []
  const paragraphs: string[] = []
  let table: string[][] | null = null

  const flush = () => {
    if (!table) return
    const rows = table
      .filter((r) => !r.every((c) => /^:?-{2,}:?$/.test(c.trim())))
      .map((r) => ({ label: stripBold(r[0] ?? ''), value: stripBold(r[1] ?? '') }))
    if (rows.length > 1) {
      tables.push({ colLabel: rows[0].label, colValue: rows[0].value, rows: rows.slice(1) })
    }
    table = null
  }

  for (const rawLine of body) {
    const line = rawLine.trim()
    if (line.startsWith('|')) {
      const cells = line.replace(/^\||\|$/g, '').split('|').map((c) => c.trim())
      table = table ?? []
      table.push(cells)
      continue
    }
    flush()
    if (line.startsWith('- ')) bullets.push(stripBold(line.slice(2).trim()).replace(/;$/, '.'))
    else if (line && !line.startsWith('>') && line !== '---' && !line.startsWith('###')) paragraphs.push(stripBold(line))
  }
  flush()
  return { tables, bullets, paragraphs }
}

const ALL = splitSections(raw)

// Seções numeradas/tabeladas do cap. 06
export const perfSections: PerfSection[] = ALL.map((s) => {
  const parsed = parseBody(s.body)
  return {
    id: slug(s.title),
    title: s.title,
    tables: parsed.tables.map((t, i) => ({
      id: `${slug(s.title)}-${i + 1}`,
      title: s.title,
      colLabel: t.colLabel,
      colValue: t.colValue,
      rows: t.rows,
    })),
    bullets: parsed.bullets,
    paragraphs: parsed.paragraphs,
  }
})

export const sectionById = (id: string) => perfSections.find((s) => s.id === id)

// Atalhos tipados para as seções do cap. 06 (ids confirmados contra o markdown)
export const SEC = {
  velocidades: sectionById('velocidades')!,
  va: sectionById('velocidade-de-manobra-va')!,
  tremFlap: sectionById('velocidades-de-trem-de-pouso-e-flap')!,
  subida: sectionById('velocidades-de-subida')!,
  vmc: sectionById('velocidade-minima-de-controle-vmc')!,
  estol: sectionById('velocidades-de-estol-power-off')!,
  alcance: sectionById('alcance')!,
  decolagem: sectionById('distancias-de-decolagem')!,
  pouso: sectionById('distancia-de-pouso')!,
  tetos: sectionById('tetos-operacionais')!,
  graficos: sectionById('graficos-e-tabelas-de-performance')!,
}

// Âncoras da página (ids de seção usados pela régua e pelos VSchips do hero)
export const ANCHORS = {
  velocidades: 'va',
  va: 'va',
  tremFlap: 'trem-flap',
  subida: 'subida',
  vmc: 'vmc',
  estol: 'estol',
  distancias: 'distancias',
  tabelas: 'tabelas',
  planejamento: 'planejamento',
  glossario: 'glossario',
} as const

export function scrollToAnchor(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ---------------------------------------------------------------------------
// 6.2 — Abreviaturas & definições
// ---------------------------------------------------------------------------

const sec62 = ALL.find((s) => s.title.startsWith('6.2'))

function parseAbreviaturas(body: string[]): Abbrev[] {
  const out: Abbrev[] = []
  for (const line of body) {
    const m = line.trim().match(/^- \*\*(.+?)\*\*\s*[–-]\s*(.+)$/)
    if (m) out.push({ code: m[1].trim(), short: m[2].trim().replace(/\.$/, '') })
  }
  return out
}

function parseDefinicoes(body: string[]): { key: string; text: string }[] {
  const out: { key: string; text: string }[] = []
  for (const line of body) {
    const m = line.trim().match(/^- \*\*(.+?):\*\*\s*(.+)$/)
    if (m) out.push({ key: m[1].trim(), text: m[2].trim() })
  }
  return out
}

const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '')

function findDef(defs: { key: string; text: string }[], code: string): string | undefined {
  const n = norm(code)
  const exact = defs.find((d) => norm(d.key) === n)
  if (exact) return exact.text
  // chaves compostas ("VNE/MNE") ou com parênteses ("VC/CAS (velocidade...)")
  const fuzzy = defs.find((d) => {
    const dk = norm(d.key)
    return dk.startsWith(n) || n.startsWith(dk.split(/(?=M?NE)/)[0])
  })
  return fuzzy?.text
}

export const abbreviations: Abbrev[] = (() => {
  if (!sec62) return []
  const body = sec62.body.join('\n')
  const abrMatch = body.split('### Abreviaturas')[1]?.split('### Definições')[0] ?? ''
  const defMatch = body.split('### Definições')[1] ?? ''
  const defs = parseDefinicoes(defMatch.split('\n'))
  return parseAbreviaturas(abrMatch.split('\n')).map((a) => ({ ...a, long: findDef(defs, a.code) }))
})()

/** Busca de definição longa por código (para tooltips da régua/acordeões). */
export const definitionOf = (code: string) => abbreviations.find((a) => norm(a.code) === norm(code))?.long

// ---------------------------------------------------------------------------
// 07 — Planejamento de voo
// ---------------------------------------------------------------------------

function parsePlanItem(bullet: string): PlanItem {
  const m = bullet.match(/^\*\*(.+?)\*\*\s*(.*)$/)
  if (m) return { title: m[1].trim(), body: stripBold(m[2]).trim().replace(/;$/, '.') }
  return { title: stripBold(bullet).replace(/;$/, '.'), body: '' }
}

export const planning: Planning = (() => {
  const sec = ALL.find((s) => s.title.startsWith('07'))
  if (!sec) return { intro: '', items: [], formsIntro: '', forms: [] }
  const bullets = sec.body.filter((l) => l.trim().startsWith('- ')).map((l) => l.trim().slice(2))
  const paras = sec.body.map((l) => l.trim()).filter((l) => l && !l.startsWith('- ') && !l.startsWith('#') && l !== '---')
  return {
    intro: stripBold(paras[0] ?? ''),
    items: bullets.slice(0, 5).map(parsePlanItem),
    formsIntro: stripBold(paras[1] ?? ''),
    forms: bullets.slice(5).map(parsePlanItem),
  }
})()

/** Extrai o primeiro número de um valor ("229 metros" → 229, "18.000 ft" → 18000). */
export const numOf = (value: string) => Number(value.replace(/\./g, '').match(/\d+/)?.[0] ?? 0)
