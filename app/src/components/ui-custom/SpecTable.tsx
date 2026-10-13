// SpecTable / DataRow — ficha técnica "label ........ valor" (design.md §7.6).
// Valores com limite ganham dot colorido. Hover: fundo overlay + valor acende.

import { cn } from '@/lib/utils'

type Dot = 'green' | 'amber' | 'red' | 'blue' | 'cyan'

const DOT_BG: Record<Dot, string> = {
  green: 'bg-green',
  amber: 'bg-amber',
  red: 'bg-red',
  blue: 'bg-blue',
  cyan: 'bg-cyan',
}

interface RowProps {
  label: string
  value: React.ReactNode
  dot?: Dot
  className?: string
}

export function DataRow({ label, value, dot, className }: RowProps) {
  return (
    <div
      className={cn(
        'group -mx-3 flex items-baseline rounded-sm px-3 py-2.5 transition-colors duration-300 hover:bg-overlay',
        className,
      )}
    >
      <span className="shrink-0 font-mono text-xs uppercase tracking-[0.14em] text-muted">{label}</span>
      <span className="dot-leader" aria-hidden="true" />
      {dot && (
        <span className={cn('mr-2 inline-block h-1.5 w-1.5 shrink-0 translate-y-[-1px] rounded-full', DOT_BG[dot])} aria-hidden="true" />
      )}
      <span className="shrink-0 text-right font-mono text-[15px] text-ink transition-colors duration-300 group-hover:text-cyan">
        {value}
      </span>
    </div>
  )
}

export default function SpecTable({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('divide-y divide-hairline/60 border-y border-hairline', className)}>{children}</div>
}
