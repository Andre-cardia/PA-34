// FaseSection — uma das 16 fases do SOP 10 (procedimentos.md §4).
// Cabeçalho (chip SOP + H3 + objetivo + meta-chips) + ChecklistCard interativo
// ou cartão informativo (fases sem itens: 10.7 Subida, 10.13 Flight Patterns)
// + notas da fase como CalloutBanners.

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ProcedimentoNormal } from '@/data'
import CalloutBanner from '@/components/ui-custom/CalloutBanner'
import { CornerScrews } from '@/components/assets/PanelScrews'
import { cn } from '@/lib/utils'
import PhaseChecklist from './PhaseChecklist'
import { faseAnchor, useChecklistStats } from './checklistStore'

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

function notaVariant(nota: string): 'nota' | 'cuidado' | 'perigo' {
  if (/^\s*(WARNING|ADVERTÊNCIA)/i.test(nota)) return 'perigo'
  if (/^\s*(CAUTION|CAUTELA|ATENÇÃO)/i.test(nota)) return 'cuidado'
  return 'nota'
}

// --- Diagramas SVG draw-on para fases sem checklist ------------------------

function ClimbProfile() {
  const draw = {
    initial: { pathLength: 0 },
    whileInView: { pathLength: 1 },
    viewport: { once: true, margin: '-15% 0px' },
    transition: { duration: 1.4, ease: EASE },
  }
  return (
    <svg viewBox="0 0 640 230" className="mt-6 w-full max-w-2xl" role="img" aria-label="Perfil de subida padronizado">
      {/* solo */}
      <line x1="0" y1="200" x2="640" y2="200" stroke="#1E2C3D" strokeWidth="1.5" />
      {/* pista */}
      <rect x="36" y="196" width="120" height="4" fill="#16222F" stroke="#54687E" strokeWidth="1" />
      {/* trajetória de subida */}
      <motion.path d="M 156 196 L 330 84" stroke="#3FE0FF" strokeWidth="1.5" fill="none" strokeDasharray="5 4" {...draw} />
      <motion.path d="M 330 84 L 620 84" stroke="#3DDC97" strokeWidth="1.5" fill="none" {...draw} transition={{ ...draw.transition, delay: 0.9 }} />
      {/* marcos */}
      {[
        { x: 330, label: 'MSA', y: 64 },
        { x: 500, label: 'TA', y: 64 },
      ].map((m) => (
        <g key={m.label}>
          <circle cx={m.x} cy={84} r="3.5" fill="#0A1018" stroke="#FFB020" strokeWidth="1.5" />
          <text x={m.x} y={m.y} textAnchor="middle" fill="#FFB020" fontSize="11" fontFamily="'IBM Plex Mono', monospace" letterSpacing="2">
            {m.label}
          </text>
        </g>
      ))}
      <text x="52" y="182" fill="#54687E" fontSize="11" fontFamily="'IBM Plex Mono', monospace" letterSpacing="1.5">
        25" MP / 2500 RPM
      </text>
      <text x="200" y="130" fill="#3FE0FF" fontSize="11" fontFamily="'IBM Plex Mono', monospace" letterSpacing="1.5" transform="rotate(-27 200 130)">
        VI 120 MPH / 500 FT/MIN
      </text>
    </svg>
  )
}

function CircuitProfile() {
  return (
    <svg viewBox="0 0 640 230" className="mt-6 w-full max-w-2xl" role="img" aria-label="Perfil esquemático de circuito de tráfego">
      <motion.rect
        x="90" y="50" width="460" height="130" fill="none" stroke="#3FE0FF" strokeWidth="1.5" strokeDasharray="6 5"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: '-15% 0px' }}
        transition={{ duration: 1.6, ease: EASE }}
      />
      {/* pista */}
      <rect x="90" y="176" width="200" height="7" fill="#16222F" stroke="#54687E" strokeWidth="1" />
      {[
        { x: 320, y: 40, t: 'PERNA DO VENTO' },
        { x: 566, y: 122, t: 'BASE' },
        { x: 180, y: 40, t: 'TRAVÉS' },
        { x: 66, y: 122, t: 'SUBIDA' },
        { x: 400, y: 168, t: 'FINAL' },
      ].map((l) => (
        <text key={l.t} x={l.x} y={l.y} textAnchor="middle" fill="#54687E" fontSize="10" fontFamily="'IBM Plex Mono', monospace" letterSpacing="1.5">
          {l.t}
        </text>
      ))}
    </svg>
  )
}

function FaseInfoCard({ fase }: { fase: ProcedimentoNormal }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-15% 0px' }}
      transition={{ duration: 0.6, ease: EASE }}
      className="relative border border-hairline bg-raised p-6 md:p-8"
    >
      <CornerScrews />
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
        Fase sem checklist — perfil padronizado
      </p>
      <p className="mt-3 max-w-3xl text-[16px] leading-relaxed text-muted">{fase.objetivo}</p>
      {fase.id === '10.7' ? <ClimbProfile /> : <CircuitProfile />}
      {fase.notas && fase.notas.length > 0 && (
        <ul className="mt-6 space-y-3 border-t border-hairline pt-5">
          {fase.notas.map((n, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-muted">
              <span className="mt-[9px] h-1.5 w-1.5 shrink-0 bg-amber" aria-hidden="true" />
              {n}
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}

// --- Notas da fase ----------------------------------------------------------

function Notas({ notas }: { notas: string[] }) {
  const [open, setOpen] = useState(false)
  const many = notas.length > 3
  const visible = many && !open ? notas.slice(0, 2) : notas
  return (
    <div className="mt-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
        Notas da fase ({notas.length})
      </p>
      <div className="mt-3 space-y-3">
        {visible.map((n, i) => (
          <CalloutBanner key={i} variant={notaVariant(n)}>
            {n}
          </CalloutBanner>
        ))}
      </div>
      {many && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-3 flex items-center gap-2 border border-hairline px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted transition-colors hover:border-cyan-dim hover:text-cyan"
        >
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {open ? 'Recolher notas' : `Ver todas as notas (${notas.length})`}
        </button>
      )}
    </div>
  )
}

// --- Seção da fase ----------------------------------------------------------

export default function FaseSection({ fase }: { fase: ProcedimentoNormal }) {
  const stats = useChecklistStats()
  const stat = stats.fases.find((s) => s.id === fase.id)
  const totalItens = fase.checklist.reduce((acc, g) => acc + g.itens.length, 0)
  const hasItens = totalItens > 0
  const complete = !!stat?.complete

  return (
    <section id={faseAnchor(fase.id)} data-fase={fase.id} className="scroll-mt-[150px]">
      {/* cabeçalho da fase */}
      <motion.header
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-20% 0px' }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="border border-cyan-dim bg-cyan/[0.06] px-2 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-cyan">
            SOP {fase.secao_sop}
          </span>
          {hasItens && (
            <>
              <span className="border border-hairline px-2 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
                {totalItens} itens
              </span>
              <span className="border border-hairline px-2 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
                {fase.checklist.length} {fase.checklist.length === 1 ? 'grupo' : 'grupos'}
              </span>
            </>
          )}
          {complete && (
            <span className="border border-green/50 bg-green/10 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-green">
              Fase completa ✓
            </span>
          )}
        </div>
        <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink md:text-[28px]">
          {fase.nome}
        </h3>
        {hasItens && <p className="mt-3 max-w-3xl text-[16px] leading-relaxed text-muted">{fase.objetivo}</p>}
      </motion.header>

      {/* corpo da fase */}
      <motion.div
        initial={{ clipPath: 'inset(0 0 100% 0)' }}
        whileInView={{ clipPath: 'inset(0 0 0% 0)' }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 0.7, ease: EASE }}
        className={cn('mt-7')}
      >
        {hasItens ? <PhaseChecklist fase={fase} /> : <FaseInfoCard fase={fase} />}
      </motion.div>

      {/* notas (fases com checklist; as informativas já as exibem no cartão) */}
      {hasItens && fase.notas && fase.notas.length > 0 && <Notas notas={fase.notas} />}
    </section>
  )
}
