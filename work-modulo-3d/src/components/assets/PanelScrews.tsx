// Parafusos de painel (fenda/cruz) em 4 variações, cinza #54687E (design.md §10).
// Uso: <CornerScrews /> dentro de um container `relative` (cards estilo placa de painel).

import type { CSSProperties } from 'react'

type Variant = 'slot-h' | 'slot-v' | 'phillips' | 'slot-diag'

function ScrewHead({ variant, size = 10, style }: { variant: Variant; size?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" style={style} aria-hidden="true">
      <circle cx="6" cy="6" r="5" stroke="rgb(var(--c-faint))" strokeWidth="1" />
      <circle cx="6" cy="6" r="5" stroke="rgb(var(--c-panel))" strokeWidth="0.5" transform="translate(0.4 0.4)" opacity={0.6} />
      {variant === 'slot-h' && <path d="M 2.5 6 L 9.5 6" stroke="rgb(var(--c-faint))" strokeWidth="1.1" />}
      {variant === 'slot-v' && <path d="M 6 2.5 L 6 9.5" stroke="rgb(var(--c-faint))" strokeWidth="1.1" />}
      {variant === 'slot-diag' && <path d="M 3.5 3.5 L 8.5 8.5" stroke="rgb(var(--c-faint))" strokeWidth="1.1" />}
      {variant === 'phillips' && (
        <>
          <path d="M 2.8 6 L 9.2 6" stroke="rgb(var(--c-faint))" strokeWidth="1.1" />
          <path d="M 6 2.8 L 6 9.2" stroke="rgb(var(--c-faint))" strokeWidth="1.1" />
        </>
      )}
    </svg>
  )
}

const CORNERS: { variant: Variant; style: CSSProperties }[] = [
  { variant: 'phillips', style: { position: 'absolute', top: 8, left: 8 } },
  { variant: 'slot-h', style: { position: 'absolute', top: 8, right: 8 } },
  { variant: 'slot-diag', style: { position: 'absolute', bottom: 8, left: 8 } },
  { variant: 'slot-v', style: { position: 'absolute', bottom: 8, right: 8 } },
]

export function CornerScrews({ size = 10 }: { size?: number }) {
  return (
    <>
      {CORNERS.map((c) => (
        <ScrewHead key={c.variant} variant={c.variant} size={size} style={{ ...c.style, opacity: 0.7, pointerEvents: 'none' }} />
      ))}
    </>
  )
}

export default ScrewHead
