// Seção 2 — Cartão de identidade da aeronave (design/especificacoes.md §2).
// Esquerda: plaqueta de fabricante (raised + parafusos, SpecRows aeronave.* +
// bullets do SOP 05). Direita: three-view com draw-on por scrub e tags de
// componentes com glow; clique em "motores" → /modelo-3d?camada=motores.

import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import SectionHeader from '@/components/ui-custom/SectionHeader'
import SpecTable, { DataRow } from '@/components/ui-custom/SpecTable'
import PA34ThreeView from '@/components/assets/PA34ThreeView'
import { CornerScrews } from '@/components/assets/PanelScrews'
import { especificacoes } from '@/data'
import introRaw from '@/data/intro_generalidades.md?raw'
import { cn } from '@/lib/utils'
import { extractListItems, extractSection, renderInline } from './markdown'

type Part = 'helice' | 'trem' | 'tanques'

interface Tag {
  part: Part
  text: string
  pos: string
  to?: string
}

const TAGS: Tag[] = [
  { part: 'helice', text: 'MOTORES 2× LYCOMING', pos: 'left-[4%] top-[22%]', to: '/modelo-3d?camada=motores' },
  { part: 'tanques', text: 'TANQUES ALARES 2×2', pos: 'left-[2%] top-[50%]' },
  { part: 'trem', text: 'TREM TRICICLO RETRÁTIL', pos: 'left-[14%] top-[76%]' },
]

const SOP05_BULLETS = extractListItems(extractSection(introRaw, '## 05'))

export default function IdentidadeAeronave() {
  const navigate = useNavigate()
  const [glow, setGlow] = useState<Part | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.9', 'end 0.45'] })
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.6 })
  const tagsOpacity = useTransform(progress, [0.88, 1], [0, 1])

  const a = especificacoes.aeronave

  return (
    <section className="border-t border-hairline bg-abyss py-[72px] md:py-[120px]">
      <div className="mx-auto max-w-content px-6 md:px-12">
        <SectionHeader
          kicker="// SEÇÃO 5.1 — FICHA DE MATRÍCULA"
          title="Identidade da aeronave"
          measure="PA34-200 · SENECA I"
        />

        <div ref={ref} className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
          {/* plaqueta */}
          <motion.div
            initial={{ opacity: 0, rotateY: 8, transformPerspective: 900 }}
            whileInView={{ opacity: 1, rotateY: 0 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative border border-hairline bg-raised p-7 md:p-8 lg:col-span-5"
          >
            <CornerScrews />
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
                Plaqueta de identidade
              </p>
              <span className="border border-hairline px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan">
                SOP 5.1
              </span>
            </div>
            <p className="mt-6 font-display text-[30px] font-semibold leading-none tracking-[-0.01em] text-ink md:text-[34px]">
              {a.modelo.replace('Piper ', '').toUpperCase()}
            </p>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.22em] text-cyan">
              {a.fabricante} aircraft
            </p>

            <SpecTable className="mt-7">
              <DataRow label="Modelo" value={a.modelo} />
              <DataRow label="Fabricante" value={a.fabricante} />
              <DataRow label="Ocupantes máx." value={a.capacidade_maxima_ocupantes} />
            </SpecTable>

            <p className="mb-3 mt-7 font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
              Resumo da aeronave — cap. 5.1
            </p>
            <ul className="space-y-2.5">
              {SOP05_BULLETS.map((item, j) => (
                <li key={j} className="flex gap-3 text-[14px] leading-relaxed text-muted">
                  <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rotate-45 border border-cyan bg-cyan/30" aria-hidden="true" />
                  <span>{renderInline(item)}</span>
                </li>
              ))}
            </ul>

            <p className="mt-7 border-t border-hairline pt-4 text-[13px] leading-relaxed text-faint">
              {a.descricao}
            </p>
          </motion.div>

          {/* three-view */}
          <div className="relative lg:col-span-7">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
              {'// VISTA 3 FACES — COTAS EM METROS'}
            </p>
            <PA34ThreeView progress={progress} glow={glow} className="w-full" />
            <motion.div style={{ opacity: tagsOpacity }}>
              {TAGS.map((t, i) => (
                <motion.button
                  key={t.part}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.9 + i * 0.08 }}
                  onMouseEnter={() => setGlow(t.part)}
                  onMouseLeave={() => setGlow(null)}
                  onFocus={() => setGlow(t.part)}
                  onBlur={() => setGlow(null)}
                  onClick={() => t.to && navigate(t.to)}
                  className={cn(
                    'absolute flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors duration-300',
                    t.pos,
                    glow === t.part ? 'text-cyan' : 'text-faint hover:text-muted',
                    t.to && 'cursor-pointer',
                  )}
                  aria-label={t.to ? `${t.text} — abrir no modelo 3D` : t.text}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rotate-45 border',
                      glow === t.part ? 'border-cyan bg-cyan/40' : 'border-faint',
                    )}
                    aria-hidden="true"
                  />
                  {t.text}
                  {t.to && <ArrowUpRight className="h-3 w-3" aria-hidden="true" />}
                </motion.button>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
