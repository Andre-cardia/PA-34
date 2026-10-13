// PageHero — topo das páginas de conteúdo (design.md §7.3).
// Faixa ~55vh: kicker seção SOP, H1 com scramble, lead, número-fantasma,
// grid blueprint + silhueta do PA-34 com draw-on, breadcrumb mono.

import { useRef } from 'react'
import { Link } from 'react-router'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useScramble } from '@/hooks/useScramble'
import PA34SilhouetteTop from '@/components/assets/PA34SilhouetteTop'

interface Crumb {
  label: string
  to?: string
}

interface Props {
  secao: string // ex.: "08"
  kicker?: string // default: "// SEÇÃO {secao} — SOP VOEFLORIPA"
  title: string
  lead: string
  breadcrumb: Crumb[]
}

export default function PageHero({ secao, kicker, title, lead, breadcrumb }: Props) {
  const scrambled = useScramble(title, { duration: 800 })
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const ghostY = useTransform(scrollYProgress, [0, 1], [0, 60])

  return (
    <header ref={ref} className="blueprint-grid relative flex min-h-[55dvh] flex-col justify-end overflow-hidden border-b border-hairline bg-panel">
      {/* silhueta decorativa */}
      <PA34SilhouetteTop className="pointer-events-none absolute -right-24 -top-16 h-[560px] w-[560px] text-cyan opacity-[0.07] max-md:right-[-180px]" />
      {/* número-fantasma */}
      <motion.span
        style={{ y: ghostY }}
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 right-6 select-none font-display text-[200px] font-bold leading-none text-faint/10 md:text-[320px]"
      >
        {secao}
      </motion.span>
      {/* fade inferior */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-abyss/80 to-transparent" aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-content px-6 pb-16 pt-28 md:px-12">
        {/* breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
          {breadcrumb.map((c, i) => (
            <span key={c.label} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3 w-3" aria-hidden="true" />}
              {c.to ? (
                <Link to={c.to} className="transition-colors hover:text-cyan">
                  {c.label}
                </Link>
              ) : (
                <span className="text-muted">{c.label}</span>
              )}
            </span>
          ))}
        </nav>

        <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-cyan">
          {kicker ?? `// SEÇÃO ${secao} — SOP VOEFLORIPA`}
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink md:text-[56px]">
          {scrambled}
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 max-w-2xl text-[17px] leading-relaxed text-muted md:text-[19px]"
        >
          {lead}
        </motion.p>
      </div>
    </header>
  )
}
