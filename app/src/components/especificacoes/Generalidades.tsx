// Seção 7 — Generalidades do documento (design/especificacoes.md §7).
// Coluna 1: texto do SOP 05 (intro_generalidades.md via ?raw). Coluna 2:
// CalloutBanner NOTA com a relação manual/POH (trecho do SOP 02) + link /seguranca.

import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import SectionHeader from '@/components/ui-custom/SectionHeader'
import CalloutBanner from '@/components/ui-custom/CalloutBanner'
import introRaw from '@/data/intro_generalidades.md?raw'
import MarkdownBlocks from './miniMarkdown'
import { extractSection, parseBlocks } from './markdown'

const SECTION_05 = parseBlocks(extractSection(introRaw, '## 05'))

// Parágrafo do SOP 02 que trata da relação manual × POH (texto-fonte, sem negrito md)
const POH_PARAGRAPH = (
  introRaw.split('\n').find((l) => l.includes("Pilot's Operating Handbook")) ?? ''
).replace(/\*\*/g, '')

export default function Generalidades() {
  return (
    <section className="border-t border-hairline bg-panel py-[72px] md:py-[120px]">
      <div className="mx-auto max-w-content px-6 md:px-12">
        <SectionHeader
          kicker="// SEÇÃO 05 — GENERALIDADES"
          title="Do documento original"
          measure="SOP VOEFLORIPA · REV.13"
        />

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-8% 0px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7"
          >
            <MarkdownBlocks blocks={SECTION_05} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-8% 0px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5"
          >
            <CalloutBanner variant="nota" title="MANUAL × POH">
              <p>{POH_PARAGRAPH}</p>
              <Link
                to="/seguranca"
                className="mt-4 inline-flex items-center gap-1.5 font-mono text-[13px] uppercase tracking-[0.1em] text-cyan hover:underline"
              >
                Introdução & uso do manual <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </CalloutBanner>

            <div className="mt-6 border border-hairline bg-raised p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">Fonte desta página</p>
              <ul className="mt-3 space-y-2 font-mono text-[12px] leading-relaxed text-muted">
                <li>SOP VOEFLORIPA — REV. 13 (20/10/2024)</li>
                <li>Cap. 05 — Generalidades · 5.1 — Especificações</li>
                <li>Material de estudo — não substitui o POH/SOP oficial.</li>
              </ul>
            </div>
          </motion.div>
        </div>

        <p className="mt-16 text-center font-mono text-[11px] uppercase tracking-[0.3em] text-faint">
          Current track — REV.13
        </p>
      </div>
    </section>
  )
}
