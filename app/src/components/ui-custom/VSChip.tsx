// VSChip — pílula de V-speed (design.md §7.7).
// Código Grotesk 600 + valor mono + dot por categoria; tooltip com definição no hover.

import { cn } from '@/lib/utils'

type Categoria = 'critica' | 'mono' | 'normal' | 'cautela'

const DOT: Record<Categoria, string> = {
  critica: 'bg-red',
  mono: 'bg-blue',
  normal: 'bg-green',
  cautela: 'bg-amber',
}

interface Props {
  code: string // ex.: "VMC"
  value: string // ex.: "80 MPH"
  categoria: Categoria
  definicao?: string
  className?: string
}

export default function VSChip({ code, value, categoria, definicao, className }: Props) {
  return (
    <span
      className={cn(
        'group/vs relative inline-flex cursor-default items-center gap-2 border border-hairline bg-panel px-3 py-1.5 transition-colors duration-300 hover:border-cyan-dim hover:bg-overlay',
        className,
      )}
      tabIndex={0}
      aria-label={definicao ? `${code} ${value} — ${definicao}` : `${code} ${value}`}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', DOT[categoria])} aria-hidden="true" />
      <span className="font-display text-sm font-semibold tracking-wide text-ink">{code}</span>
      <span className="font-mono text-[13px] text-muted">{value}</span>
      {definicao && (
        <span
          className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-56 -translate-x-1/2 border border-hairline bg-raised px-3 py-2 font-mono text-xs leading-relaxed text-muted opacity-0 shadow-xl shadow-black/50 transition-opacity duration-200 group-hover/vs:opacity-100 group-focus-visible/vs:opacity-100"
          role="tooltip"
        >
          {definicao}
        </span>
      )}
    </span>
  )
}
