// FilosofiaChecklist — Seção 2 de /procedimentos (procedimentos.md §2).
// Texto do SOP 03 (Uso do Checklist) extraído de intro_generalidades.md via
// ?raw; card-manifesto com 3 princípios datilografados + CalloutBanner NOTA
// com a regra de ouro do documento.

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { BookOpenCheck, Brain, ListChecks } from 'lucide-react'
import introRaw from '@/data/intro_generalidades.md?raw'
import SectionHeader from '@/components/ui-custom/SectionHeader'
import CalloutBanner from '@/components/ui-custom/CalloutBanner'
import { CornerScrews } from '@/components/assets/PanelScrews'

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

// ---------------------------------------------------------------------------
// Parser mínimo do markdown do SOP 03 (parágrafos, listas "- ", blockquote ">")
// ---------------------------------------------------------------------------

type Block = { type: 'p'; text: string } | { type: 'ul'; items: string[] } | { type: 'quote'; text: string }

function parseBlocks(md: string): Block[] {
  const blocks: Block[] = []
  let para: string[] = []
  let list: string[] = []
  const flushPara = () => {
    if (para.length) blocks.push({ type: 'p', text: para.join(' ') })
    para = []
  }
  const flushList = () => {
    if (list.length) blocks.push({ type: 'ul', items: list })
    list = []
  }
  for (const raw of md.split('\n')) {
    const line = raw.trim()
    if (!line) {
      flushPara()
      flushList()
      continue
    }
    if (line.startsWith('- ')) {
      flushPara()
      list.push(line.slice(2))
      continue
    }
    if (line.startsWith('>')) {
      flushPara()
      flushList()
      blocks.push({ type: 'quote', text: line.replace(/^>\s?/, '') })
      continue
    }
    flushList()
    para.push(line)
  }
  flushPara()
  flushList()
  return blocks
}

function extractSecao03(raw: string): Block[] {
  const m = raw.match(/## 03[^\n]*\n([\s\S]*?)(?=\n---|\n## |$)/)
  return parseBlocks(m?.[1] ?? '')
}

const BLOCKS = extractSecao03(introRaw)
const QUOTE = BLOCKS.find((b): b is Extract<Block, { type: 'quote' }> => b.type === 'quote')
const FLOW_BLOCKS = BLOCKS.filter((b) => b.type !== 'quote')

// Negrito inline do markdown (**...**)
function renderInline(text: string) {
  const parts = text.split(/\*\*([^*]+)\*\*/g)
  return parts.map((p, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-ink">
        {p}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  )
}

// ---------------------------------------------------------------------------
// Princípios datilografados (typewriter mono, ~18 chars/s)
// ---------------------------------------------------------------------------

function useTypewriter(text: string, start: boolean, delay = 0, charsPerSec = 18) {
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!start || reduced) return
    let i = 0
    let interval = 0
    const timer = window.setTimeout(() => {
      interval = window.setInterval(() => {
        i += 1
        setN(i)
        if (i >= text.length) window.clearInterval(interval)
      }, 1000 / charsPerSec)
    }, delay)
    return () => {
      window.clearTimeout(timer)
      window.clearInterval(interval)
    }
  }, [start, reduced, text, delay, charsPerSec])
  const len = reduced ? text.length : n
  return { typed: text.slice(0, len), doneTyping: len >= text.length }
}

const PRINCIPLES = [
  { Icon: BookOpenCheck, text: 'LEIA → EXECUTE' },
  { Icon: ListChecks, text: 'ITEM = AÇÃO' },
  { Icon: Brain, text: 'SEM MEMÓRIA, SÓ CHECKLIST' },
]

function TypeLine({ Icon, text, start, delay }: { Icon: typeof Brain; text: string; start: boolean; delay: number }) {
  const { typed, doneTyping } = useTypewriter(text, start, delay)
  return (
    <li className="flex items-center gap-3 border-b border-hairline/60 py-3.5 last:border-b-0">
      <Icon className="h-4 w-4 shrink-0 text-cyan" strokeWidth={1.75} aria-hidden="true" />
      <span className="font-mono text-sm font-medium tracking-[0.12em] text-ink">
        {typed}
        {!doneTyping && <span className="animate-caret-blink text-cyan">▮</span>}
      </span>
    </li>
  )
}

// ---------------------------------------------------------------------------

export default function FilosofiaChecklist() {
  const manifestoRef = useRef<HTMLDivElement>(null)
  const manifestoInView = useInView(manifestoRef, { once: true, margin: '-20% 0px' })

  return (
    <section className="border-b border-hairline bg-abyss py-[72px] md:py-[120px]">
      <div className="mx-auto max-w-content px-6 md:px-12">
        <SectionHeader
          kicker="// SEÇÃO 03 — SOP REV.13"
          title="Filosofia do checklist"
          measure="READ AND DO · DO AND READ"
        />
        <div className="mt-14 grid gap-12 lg:grid-cols-12">
          {/* texto do SOP 03 */}
          <div className="lg:col-span-7">
            {FLOW_BLOCKS.map((b, i) =>
              b.type === 'ul' ? (
                <motion.ul
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-10% 0px' }}
                  transition={{ duration: 0.55, delay: 0.08 * i, ease: EASE }}
                  className="mb-6 space-y-2.5"
                >
                  {b.items.map((it, j) => (
                    <li key={j} className="flex gap-3 text-[16px] leading-relaxed text-muted">
                      <span className="mt-[10px] h-1.5 w-1.5 shrink-0 bg-cyan" aria-hidden="true" />
                      <span>{renderInline(it)}</span>
                    </li>
                  ))}
                </motion.ul>
              ) : b.type === 'p' ? (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-10% 0px' }}
                  transition={{ duration: 0.55, delay: 0.08 * i, ease: EASE }}
                  className="mb-6 text-[16px] leading-relaxed text-muted"
                >
                  {renderInline(b.text)}
                </motion.p>
              ) : null,
            )}
          </div>
          {/* card-manifesto */}
          <div className="lg:col-span-5">
            <motion.div
              ref={manifestoRef}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15% 0px' }}
              transition={{ duration: 0.6, ease: EASE }}
              className="relative border border-hairline bg-raised p-6"
            >
              <CornerScrews />
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">Manifesto de cabine</p>
              <ul className="mt-4">
                {PRINCIPLES.map((p, i) => (
                  <TypeLine key={p.text} Icon={p.Icon} text={p.text} start={manifestoInView} delay={300 + i * 900} />
                ))}
              </ul>
            </motion.div>
            {QUOTE && (
              <CalloutBanner variant="nota" title="Regra de ouro — SOP 03" className="mt-6">
                {renderInline(QUOTE.text)}
              </CalloutBanner>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
