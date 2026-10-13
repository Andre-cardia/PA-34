import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  CALLOUTS_DECOLAGEM, CALLOUTS_SUBIDA, CALLOUTS_CRUZEIRO, CALLOUTS_DESCIDA,
  CALLOUTS_NDB_VOR, CALLOUTS_ILS, CALLOUTS_DESVIOS, type CalloutRow,
} from './data'

function Tabela({ rows, titulo }: { rows: CalloutRow[]; titulo: string }) {
  return (
    <div className="border border-hairline bg-raised/40">
      <p className="border-b border-hairline bg-panel px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">{titulo}</p>
      <div>
        {rows.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.03 }}
            className="grid grid-cols-[86px_1fr] items-baseline gap-3 border-b border-hairline/60 px-4 py-2.5 transition-colors last:border-0 hover:bg-overlay/70 md:grid-cols-[110px_1.2fr_1.4fr]"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">{r.fase}</span>
            <span className="text-[13px] text-muted">{r.condicao}</span>
            <span className={cn('col-span-2 flex items-center gap-2 font-mono text-[13px] font-medium md:col-span-1', r.critico ? 'text-amber' : 'text-cyan')}>
              {r.critico && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />}
              {r.callout}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

const TABS = [
  { id: 'ifr', label: 'IFR' },
  { id: 'vfr', label: 'VFR' },
  { id: 'desvios', label: 'DESVIOS (4.1)' },
] as const

export default function CalloutsTables() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('ifr')
  return (
    <div>
      <div className="mb-6 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'relative border px-5 py-2.5 font-mono text-xs uppercase tracking-[0.16em] transition-colors',
              tab === t.id ? 'border-cyan/60 bg-cyan/10 text-cyan' : 'border-hairline bg-raised text-muted hover:text-ink',
            )}
          >
            {t.label}
            {tab === t.id && <motion.span layoutId="callout-tab" className="absolute inset-x-0 -bottom-px h-0.5 bg-cyan" />}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {tab === 'ifr' && (
            <>
              <Tabela rows={CALLOUTS_DECOLAGEM} titulo="Acionamento, táxi, alinhamento e decolagem" />
              <Tabela rows={CALLOUTS_SUBIDA} titulo="Subida" />
              <Tabela rows={CALLOUTS_CRUZEIRO} titulo="Cruzeiro" />
              <Tabela rows={CALLOUTS_DESCIDA} titulo="Descida" />
              <Tabela rows={CALLOUTS_NDB_VOR} titulo="Aproximação NDB / VOR" />
              <Tabela rows={CALLOUTS_ILS} titulo="Aproximação ILS" />
            </>
          )}
          {tab === 'vfr' && (
            <>
              <Tabela rows={CALLOUTS_DECOLAGEM} titulo="Acionamento, táxi, alinhamento e decolagem" />
              <Tabela rows={CALLOUTS_DESCIDA} titulo="Descida (inclui callout VFR de 500 ft AGL)" />
            </>
          )}
          {tab === 'desvios' && <Tabela rows={CALLOUTS_DESVIOS} titulo="4.1 — Callouts de desvios (subida, cruzeiro, descida e aproximação)" />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
