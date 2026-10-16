// Seção 7 — CTA final (home.md §7): split de palavras + botão pulsante +
// silhueta watermark 8% + grid.

import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import PA34SilhouetteTop from '@/components/assets/PA34SilhouetteTop'

const TITLE = 'Pronto para abrir a carenagem?'

export default function FinalCta() {
  const words = TITLE.split(' ')
  return (
    <section className="blueprint-grid relative overflow-hidden bg-panel py-[88px] md:py-[140px]">
      {/* watermark */}
      <PA34SilhouetteTop className="pointer-events-none absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 text-cyan opacity-[0.08]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgb(var(--c-panel))_90%)]" aria-hidden="true" />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 text-center">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-cyan">{'// CLEARED FOR TAKEOFF'}</p>
        <h2 className="mt-5 font-display text-[32px] font-semibold leading-tight tracking-[-0.01em] text-ink md:text-[44px]">
          {words.map((w, i) => (
            <motion.span
              key={`${w}-${i}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20% 0px' }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="inline-block"
            >
              {w}
              {i < words.length - 1 ? '\u00A0' : ''}
            </motion.span>
          ))}
        </h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-10"
        >
          <motion.div
            animate={{ boxShadow: ['0 0 0px rgb(var(--c-cyan) / 0)', '0 0 28px rgb(var(--c-cyan) / 0.22)', '0 0 0px rgb(var(--c-cyan) / 0)'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Link
              to="/modelo-3d"
              className="group inline-flex items-center gap-3 bg-cyan px-8 py-4 font-mono text-sm font-semibold uppercase tracking-[0.18em] text-abyss"
            >
              Iniciar pelo modelo 3D
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Link
            to="/emergencias"
            className="mt-6 inline-block font-mono text-xs uppercase tracking-[0.18em] text-muted underline decoration-hairline underline-offset-8 transition-colors hover:text-red hover:decoration-red"
          >
            ou vá direto às emergências (SOP 12)
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
