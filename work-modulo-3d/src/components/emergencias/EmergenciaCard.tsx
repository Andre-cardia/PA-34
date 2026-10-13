// EmergenciaCard — card QRH de um procedimento (design/emergencias.md §3).
// Header red-rail + SITUAÇÃO em itálico técnico + PASSOS numerados (termos-chave
// em bold cyan) + NOTAS CRÍTICAS (CalloutBanner PERIGO/CUIDADO auto-classificado)
// + footer com link cruzado. COPIAR + expandir/recolher (aria-expanded).

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, ChevronDown, Copy, Info } from 'lucide-react'
import type { Emergencia } from '@/data'
import CalloutBanner from '@/components/ui-custom/CalloutBanner'
import { cn } from '@/lib/utils'
import { buildCopyText, CROSS_LINKS, emergenciaAnchor, highlightPassos, notaVariante } from './emergenciasUtils'

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

interface Props {
  em: Emergencia
  expanded: boolean
  onToggle: () => void
  index: number
}

export default function EmergenciaCard({ em, expanded, onToggle, index }: Props) {
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<number | null>(null)
  const link = CROSS_LINKS[em.id]

  useEffect(() => () => {
    if (copyTimer.current) window.clearTimeout(copyTimer.current)
  }, [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildCopyText(em))
      setCopied(true)
      if (copyTimer.current) window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => {
        setCopied(false)
        copyTimer.current = null
      }, 2000)
    } catch {
      /* clipboard indisponível */
    }
  }

  return (
    <motion.article
      id={emergenciaAnchor(em.id)}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-15% 0px' }}
      transition={{ duration: 0.6, delay: (index % 4) * 0.05, ease: EASE }}
      className="relative scroll-mt-[150px] border border-hairline bg-raised"
      aria-label={`SOP ${em.secao_sop} — ${em.titulo}`}
    >
      {/* red rail */}
      <span className="absolute inset-y-0 left-0 w-[3px] bg-red/70" aria-hidden="true" />

      {/* header */}
      <div className="flex items-start gap-2 py-4 pl-6 pr-4 md:pl-7">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={`corpo-${emergenciaAnchor(em.id)}`}
          className="flex min-w-0 flex-1 items-start gap-3 text-left md:gap-4"
        >
          <span className="mt-1 shrink-0 border border-red/50 bg-red/10 px-2 py-1 font-mono text-[11px] font-medium tracking-[0.14em] text-red">
            SOP {em.secao_sop}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[19px] font-semibold leading-tight text-ink md:text-[22px]">
              {em.titulo}
            </span>
            <span className="mt-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
              {em.passos.length} {em.passos.length === 1 ? 'passo' : 'passos'} · {em.notas_criticas.length}{' '}
              {em.notas_criticas.length === 1 ? 'nota crítica' : 'notas críticas'}
            </span>
          </span>
          <ChevronDown
            className={cn('mt-1.5 h-4 w-4 shrink-0 text-faint transition-transform duration-300', expanded && 'rotate-180')}
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          onClick={copy}
          className="mt-1 flex shrink-0 items-center gap-1.5 border border-hairline px-2 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-faint transition-colors hover:border-cyan-dim hover:text-cyan"
          aria-label={`Copiar procedimento ${em.secao_sop}`}
        >
          {copied ? <Check className="h-3 w-3 text-green" /> : <Copy className="h-3 w-3" />}
          <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
        </button>
      </div>

      {/* situação truncada quando recolhido */}
      {!expanded && (
        <div className="border-t border-hairline/60 px-6 py-3 md:pl-7">
          <p className="text-[14px] italic leading-relaxed text-muted line-clamp-2">{em.situacao}</p>
        </div>
      )}

      {/* corpo */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={`corpo-${emergenciaAnchor(em.id)}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.15 }}
              className="border-t border-hairline px-6 py-6 md:pl-7"
            >
              {/* situação */}
              <div className="flex gap-3 border border-hairline/60 bg-panel px-4 py-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber" strokeWidth={1.75} aria-hidden="true" />
                <p className="text-[15px] italic leading-relaxed text-muted">{em.situacao}</p>
              </div>

              <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_310px]">
                {/* passos */}
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">Passos</p>
                  <ol className="mt-4 space-y-3.5">
                    {em.passos.map((p, i) => (
                      <li key={i} className="flex gap-3.5">
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center border border-red/60 font-mono text-xs font-medium text-red"
                          aria-hidden="true"
                        >
                          {i + 1}
                        </span>
                        <p className="font-mono text-[15px] leading-[1.6] text-ink/90">
                          {highlightPassos(p, 'font-semibold text-cyan')}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
                {/* notas críticas */}
                {em.notas_criticas.length > 0 && (
                  <aside>
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">Notas críticas</p>
                    <div className="mt-4 space-y-3">
                      {em.notas_criticas.map((n, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.35, delay: 0.2 + i * 0.06, ease: EASE }}
                        >
                          <CalloutBanner variant={notaVariante(n)}>{n}</CalloutBanner>
                        </motion.div>
                      ))}
                    </div>
                  </aside>
                )}
              </div>

              {/* footer: link cruzado */}
              {link && (
                <div className="mt-7 border-t border-hairline pt-4">
                  <Link
                    to={link.to}
                    className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-cyan transition-colors hover:text-glow-cyan"
                  >
                    {link.label}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}
