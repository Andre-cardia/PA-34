// SectionHeader — kicker mono cyan + H2 + hairline com "cota" técnica
// (design.md §7.4): linha com terminais |—| e medida decorativa em mono.

import { motion } from 'framer-motion'

interface Props {
  kicker: string
  title: string
  measure?: string // ex.: "SPAN 11,86 m"
  className?: string
}

export default function SectionHeader({ kicker, title, measure, className }: Props) {
  return (
    <div className={className}>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-cyan"
      >
        {kicker}
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="mt-3 font-display text-[28px] font-semibold tracking-[-0.01em] text-ink md:text-[40px]"
      >
        {title}
      </motion.h2>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="mt-6 flex items-center gap-3"
        aria-hidden="true"
      >
        <span className="h-2 w-px bg-faint" />
        <span className="h-px flex-1 bg-hairline" />
        {measure && (
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-faint">{measure}</span>
        )}
        <span className="h-2 w-px bg-faint" />
      </motion.div>
    </div>
  )
}
