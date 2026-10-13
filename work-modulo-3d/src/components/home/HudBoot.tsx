// HudBoot — "tela de inicialização de aviônico" do hero (home.md §1).
// Cobre o hero com linhas mono de boot e se dissolve em ~1.8s.

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const LINES = ['INICIALIZANDO SISTEMAS…', 'GYRO ✓', '3 GREEN ✓', 'SOP REV.13 CARREGADO ✓']

export default function HudBoot() {
  const [done, setDone] = useState(false)
  const [skip] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
  )

  useEffect(() => {
    const t = window.setTimeout(() => setDone(true), skip ? 100 : 1750)
    return () => window.clearTimeout(t)
  }, [skip])

  if (skip) return null

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: done ? 0 : 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-abyss"
      aria-hidden="true"
    >
      <div className="font-mono text-xs uppercase tracking-[0.22em] text-cyan">
        {LINES.map((line, i) => (
          <motion.p
            key={line}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: 0.25 + i * 0.32 }}
            className="py-1"
          >
            <span className="mr-2 text-faint">{String(i + 1).padStart(2, '0')}</span>
            {line}
          </motion.p>
        ))}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.3, delay: 0.25, ease: [0.7, 0, 0.2, 1] }}
          className="mt-3 h-px origin-left bg-cyan-dim"
        />
      </div>
    </motion.div>
  )
}
