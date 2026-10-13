// Primitivos compartilhados dos diagramas SVG da página SISTEMAS:
// draw-on (stroke-draw cyan/cor-chave), fluxo animado por dash-offset,
// shell de painel, nós clicáveis e lightbox dos esquemas originais do SOP.

import { memo, useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Maximize2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE_MECH, EASE_OUT } from './utils'

// ---------------------------------------------------------------------------
// DrawPath — traço que se desenha ao entrar no viewport (blueprint draw-on)
// ---------------------------------------------------------------------------

interface DrawPathProps {
  d: string
  color: string
  width?: number
  delay?: number
  duration?: number
  dashed?: boolean
  opacity?: number
}

export function DrawPath({ d, color, width = 1.5, delay = 0, duration = 1.2, dashed = false, opacity = 1 }: DrawPathProps) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeDasharray={dashed ? '5 6' : undefined}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration, delay, ease: EASE_MECH, opacity: { duration: 0.25, delay } }}
    />
  )
}

// ---------------------------------------------------------------------------
// FlowPath — linha de fluxo contínuo (dash-offset em loop). Componente
// isolado + memo: animação perpétua não re-renderiza o diagrama (react-dev).
// `active` liga/desliga o fluxo (ex.: seletora OFF).
// ---------------------------------------------------------------------------

interface FlowPathProps {
  d: string
  color: string
  width?: number
  active?: boolean
  /** segundos por ciclo do traço */
  period?: number
  /** sentido inverso do fluxo */
  reverse?: boolean
}

export const FlowPath = memo(function FlowPath({
  d,
  color,
  width = 2,
  active = true,
  period = 1.4,
  reverse = false,
}: FlowPathProps) {
  const reduced = useReducedMotion()
  if (!active) return null
  if (reduced) {
    // prefers-reduced-motion: fluxo vira linha estática (sem loop)
    return (
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray="2 10"
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    )
  }
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeDasharray="2 10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, strokeDashoffset: reverse ? [0, 12] : [0, -12] }}
      transition={{
        opacity: { duration: 0.4 },
        strokeDashoffset: { repeat: Infinity, duration: period, ease: 'linear' },
      }}
      style={{ filter: `drop-shadow(0 0 4px ${color})` }}
    />
  )
})

// ---------------------------------------------------------------------------
// DiagramNode — nó do diagrama (retângulo com rótulo mono), aparece com
// spring scale; opcionalmente clicável (rola até o componente na lista).
// ---------------------------------------------------------------------------

interface DiagramNodeProps {
  x: number
  y: number
  w: number
  h: number
  label: string
  sub?: string
  color: string
  delay?: number
  active?: boolean
  onClick?: () => void
  ariaLabel?: string
}

export function DiagramNode({ x, y, w, h, label, sub, color, delay = 0, active = true, onClick, ariaLabel }: DiagramNodeProps) {
  const inner = (
    <>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="#101926"
        stroke={active ? color : '#1E2C3D'}
        strokeWidth={1.5}
        style={active ? { filter: `drop-shadow(0 0 6px ${color}55)` } : undefined}
      />
      <text
        x={x + w / 2}
        y={sub ? y + h / 2 - 4 : y + h / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={active ? '#E8F0F7' : '#54687E'}
        fontSize={11}
        fontFamily="'IBM Plex Mono', ui-monospace, monospace"
        fontWeight={600}
        letterSpacing="0.08em"
      >
        {label}
      </text>
      {sub && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 12}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#54687E"
          fontSize={9}
          fontFamily="'IBM Plex Mono', ui-monospace, monospace"
          letterSpacing="0.1em"
        >
          {sub}
        </text>
      )}
    </>
  )
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.6 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ type: 'spring', stiffness: 320, damping: 22, delay }}
      style={{ transformOrigin: '50% 50%', cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      aria-label={ariaLabel ?? (onClick ? label : undefined)}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      {inner}
    </motion.g>
  )
}

// ---------------------------------------------------------------------------
// DiagramShell — cartão-painel do diagrama (hairline, grid, header mono)
// ---------------------------------------------------------------------------

interface DiagramShellProps {
  title: string
  right?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function DiagramShell({ title, right, children, footer, className }: DiagramShellProps) {
  return (
    <div className={cn('overflow-hidden border border-hairline bg-panel', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-2.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">{title}</p>
        {right}
      </div>
      <div className="blueprint-grid-dense relative">{children}</div>
      {footer && <div className="border-t border-hairline px-4 py-3">{footer}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// SopImage — thumbnail do esquema original do SOP + lightbox.
// Filtro escuro (invert + hue-rotate) integra a página clara ao tema (sistemas.md).
// ---------------------------------------------------------------------------

const SOP_FILTER = 'invert(0.92) hue-rotate(180deg)'

interface SopImageProps {
  src: string
  alt: string
  caption?: string
  className?: string
}

export function SopImage({ src, alt, caption = 'Esquema original — SOP VoeFloripa REV.13', className }: SopImageProps) {
  const [open, setOpen] = useState(false)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, close])

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group/sop relative block w-full overflow-hidden border border-hairline bg-raised transition-colors hover:border-cyan-dim"
        aria-label={`${alt} — ampliar esquema original do SOP`}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-44 w-full object-cover object-top opacity-80 transition-opacity duration-300 group-hover/sop:opacity-100"
          style={{ filter: SOP_FILTER }}
        />
        <span className="absolute bottom-2 right-2 flex items-center gap-1.5 border border-hairline bg-abyss/85 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted backdrop-blur-sm transition-colors group-hover/sop:text-cyan">
          <Maximize2 className="h-3 w-3" aria-hidden="true" />
          Ampliar
        </span>
      </button>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{caption}</p>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-abyss/85 p-4 backdrop-blur-md md:p-10"
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label={alt}
          >
            <motion.figure
              initial={{ scale: 0.94, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 16 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="relative max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={src}
                alt={alt}
                className="max-h-[80dvh] w-auto max-w-full border border-hairline bg-panel object-contain"
                style={{ filter: SOP_FILTER }}
              />
              <figcaption className="mt-3 flex items-center justify-between gap-4">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{caption}</span>
                <button
                  type="button"
                  onClick={close}
                  className="flex items-center gap-2 border border-hairline px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted transition-colors hover:border-red hover:text-red"
                  aria-label="Fechar esquema ampliado"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Fechar
                </button>
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
