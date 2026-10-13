// CalloutBanner — avisos operacionais (design.md §7.5).
// Variantes: NOTA (cyan), CUIDADO (amber), PERIGO (red). Rail 3px + fundo tonal 8%.

import { AlertTriangle, Info, OctagonAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

type Variant = 'nota' | 'cuidado' | 'perigo'

const STYLES: Record<Variant, { rail: string; bg: string; text: string; label: string; Icon: typeof Info }> = {
  nota: { rail: 'bg-cyan', bg: 'bg-cyan/[0.08]', text: 'text-cyan', label: 'NOTA', Icon: Info },
  cuidado: { rail: 'bg-amber', bg: 'bg-amber/[0.08]', text: 'text-amber', label: 'CUIDADO', Icon: AlertTriangle },
  perigo: { rail: 'bg-red', bg: 'bg-red/[0.08]', text: 'text-red', label: 'PERIGO', Icon: OctagonAlert },
}

interface Props {
  variant: Variant
  title?: string
  children: React.ReactNode
  className?: string
}

export default function CalloutBanner({ variant, title, children, className }: Props) {
  const s = STYLES[variant]
  return (
    <motion.aside
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn('relative flex gap-4 overflow-hidden py-4 pl-5 pr-5', s.bg, className)}
      role={variant === 'perigo' ? 'alert' : 'note'}
    >
      <span className={cn('absolute inset-y-0 left-0 w-[3px]', s.rail)} aria-hidden="true" />
      <s.Icon className={cn('mt-0.5 h-5 w-5 shrink-0', s.text)} strokeWidth={1.75} aria-hidden="true" />
      <div>
        <p className={cn('font-mono text-xs font-semibold uppercase tracking-[0.22em]', s.text)}>
          {title ?? s.label}
        </p>
        <div className="mt-2 text-[15px] leading-relaxed text-muted">{children}</div>
      </div>
    </motion.aside>
  )
}
