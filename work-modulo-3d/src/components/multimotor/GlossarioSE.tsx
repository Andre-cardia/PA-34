import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import CalloutBanner from '@/components/ui-custom/CalloutBanner'
import { SIGLAS_SE } from './data'

const DOT: Record<string, string> = {
  critica: 'bg-red',
  mono: 'bg-blue',
  normal: 'bg-green',
  cautela: 'bg-amber',
}

function Linha({ sigla, definicao, dot, i }: { sigla: string; definicao: string; dot: string; i: number }) {
  const [open, setOpen] = useState(false)
  const longa = definicao.length > 150
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-5% 0px' }}
      transition={{ duration: 0.4, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="group flex items-start gap-4 border-b border-hairline py-3.5 transition-colors hover:bg-overlay/60"
    >
      <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${DOT[dot]}`} aria-hidden="true" />
      <span className="w-16 shrink-0 font-mono text-sm font-semibold tracking-[0.08em] text-cyan">{sigla}</span>
      <div className="min-w-0 flex-1">
        <p className={`text-[15px] leading-relaxed text-muted ${!open && longa ? 'line-clamp-2' : ''}`}>{definicao}</p>
        {longa && (
          <button
            onClick={() => setOpen(!open)}
            className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-cyan/80 transition-colors hover:text-cyan"
          >
            {open ? '− Recolher' : '+ Ler mais'}
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default function GlossarioSE() {
  const [q, setQ] = useState('')
  const filtradas = useMemo(
    () => SIGLAS_SE.filter((s) => (s.sigla + ' ' + s.definicao).toLowerCase().includes(q.toLowerCase())),
    [q],
  )
  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <div className="mb-6 flex items-center gap-3 border border-hairline bg-panel px-4 py-3">
          <Search className="h-4 w-4 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="FILTRAR SIGLA OU DEFINIÇÃO…"
            className="w-full bg-transparent font-mono text-xs uppercase tracking-[0.14em] text-ink placeholder:text-faint focus:outline-none"
            aria-label="Filtrar siglas"
          />
        </div>
        <div className="border-t border-hairline">
          {filtradas.map((s, i) => (
            <Linha key={s.sigla} {...s} i={i} />
          ))}
          {filtradas.length === 0 && (
            <p className="py-8 text-center font-mono text-xs uppercase tracking-[0.14em] text-faint">Nenhuma sigla encontrada</p>
          )}
        </div>
      </div>
      <div className="lg:col-span-4">
        <div className="lg:sticky lg:top-24">
          <CalloutBanner variant="cuidado" title="Para efeitos práticos">
            Jamais insistir em manter voo nivelado em velocidades próximas à VMC, pois poderemos perder o controle da
            aeronave. Próxima à VMC, o ângulo de ataque será tão alto e o arrasto tão grande que, na prática, não
            haverá ganho de altitude ("embarrigamento"). É aconselhável ceder o nariz e usar a tração do motor
            remanescente para uma trajetória de descida mais conveniente.
          </CalloutBanner>
        </div>
      </div>
    </div>
  )
}
