import { useState } from 'react'
import { motion } from 'framer-motion'
import CalloutBanner from '@/components/ui-custom/CalloutBanner'
import { cn } from '@/lib/utils'

const MECH = [0.7, 0, 0.2, 1] as const

function Helice({ feathered }: { feathered: boolean }) {
  return (
    <svg viewBox="-120 -120 240 240" className="w-full max-w-[280px]" role="img" aria-label={feathered ? 'Hélice embandeirada' : 'Hélice em molinete'}>
      {/* fluxo de ar */}
      {[ -70, -35, 0, 35, 70 ].map((y, i) => (
        <motion.path
          key={y}
          d={feathered ? `M -110 ${y} L 110 ${y}` : `M -110 ${y} Q -40 ${y + 22} 0 ${y} T 110 ${y - 14}`}
          fill="none"
          stroke={feathered ? 'rgb(var(--c-green))' : 'rgb(var(--c-red))'}
          strokeWidth="1.6"
          strokeOpacity={feathered ? 0.7 : 0.55}
          strokeDasharray="6 5"
          initial={false}
          animate={{ d: feathered ? `M -110 ${y} L 110 ${y}` : `M -110 ${y} Q -40 ${y + 22} 0 ${y} T 110 ${y - 14}` }}
          transition={{ duration: 0.8, delay: i * 0.05, ease: MECH }}
        />
      ))}
      {/* pás (vista lateral): molinete = pás de face ao vento; embandeirada = pás de ponta (fina) */}
      <motion.g
        initial={false}
        animate={{ rotate: feathered ? 0 : [0, 360] }}
        transition={feathered ? { duration: 0.8, ease: MECH } : { duration: 0.5, repeat: Infinity, ease: 'linear' }}
        style={{ originX: '0px', originY: '0px' }}
      >
        <motion.rect
          x="-7" y="-92" width="14" height="92" rx="6"
          fill="rgb(var(--c-overlay))" stroke="rgb(var(--c-muted))" strokeWidth="1.5"
          initial={false}
          animate={{ width: feathered ? 5 : 14, x: feathered ? -2.5 : -7 }}
          transition={{ duration: 0.8, ease: MECH }}
        />
        <motion.rect
          x="-7" y="0" width="14" height="92" rx="6"
          fill="rgb(var(--c-overlay))" stroke="rgb(var(--c-muted))" strokeWidth="1.5"
          initial={false}
          animate={{ width: feathered ? 5 : 14, x: feathered ? -2.5 : -7 }}
          transition={{ duration: 0.8, ease: MECH }}
        />
      </motion.g>
      <circle r="12" fill="rgb(var(--c-raised))" stroke="rgb(var(--c-faint))" strokeWidth="1.5" />
      <circle r="4" fill="rgb(var(--c-faint))" />
      {/* etiqueta */}
      <text x="0" y="112" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="11" letterSpacing="2" fill={feathered ? 'rgb(var(--c-green))' : 'rgb(var(--c-red))'}>
        {feathered ? 'EMBANDEIRADA — ARRASTO MÍNIMO' : 'MOLINETE — ARRASTO CRÍTICO'}
      </text>
    </svg>
  )
}

function Barra({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{label}</span>
        <span className="font-mono text-sm font-semibold" style={{ color }}>{value.toLocaleString('pt-BR')} ft/min</span>
      </div>
      <div className="h-2 w-full bg-raised">
        <motion.div
          className="h-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${(value / max) * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: MECH }}
        />
      </div>
    </div>
  )
}

export default function Embandeiramento() {
  const [feathered, setFeathered] = useState(false)
  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="flex flex-col items-center gap-5 border border-hairline bg-panel/60 p-8 lg:col-span-5">
        <Helice feathered={feathered} />
        <button
          onClick={() => setFeathered(!feathered)}
          className={cn(
            'border px-5 py-2.5 font-mono text-xs uppercase tracking-[0.16em] transition-colors',
            feathered ? 'border-green/60 bg-green/10 text-green' : 'border-amber/60 bg-amber/10 text-amber hover:bg-amber/20',
          )}
        >
          {feathered ? '✓ Embandeirada — desfazer' : 'Embandeirar hélice'}
        </button>
      </div>
      <div className="space-y-8 lg:col-span-7">
        <p className="text-[17px] leading-relaxed text-muted">
          Ao perder um motor, o Seneca perde <strong className="text-ink">50% da tração total</strong> — mas, em
          performance aerodinâmica, a perda chega a <strong className="text-red">80%</strong>. A hélice do motor
          inoperante gera arrasto suficiente para prejudicar a navegabilidade e deve ser{' '}
          <strong className="text-ink">embandeirada</strong>.
        </p>
        <div className="space-y-5 border border-hairline bg-raised/50 p-6">
          <Barra label="Subida bimotor" value={1000} max={1000} color="rgb(var(--c-cyan))" />
          <Barra label="Subida monomotor (ou menos)" value={200} max={1000} color="rgb(var(--c-blue))" />
        </div>
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-2 border border-amber/50 bg-amber/10 px-3 py-1.5 font-mono text-xs tracking-[0.1em] text-amber">
            <span className="h-1.5 w-1.5 rounded-full bg-amber" /> ABAIXO DE 800 RPM NÃO EMBANDEIRA — PINO BATENTE
          </span>
          <span className="inline-flex items-center gap-2 border border-hairline bg-panel px-3 py-1.5 font-mono text-xs tracking-[0.1em] text-muted">
            DECISÃO CONSCIENTE, RÁPIDA E SEGURA
          </span>
        </div>
        <CalloutBanner variant="perigo" title="Atenção — motor errado">
          Já existiram acidentes em que a tripulação, na pressa de embandeirar a hélice do motor ruim, embandeirou a
          do motor bom. Faça um cross-check com os instrumentos e identifique claramente o motor em pane. Para
          treinamento, anuncie em voz alta:{' '}
          <em className="text-ink">"Motor em pane é o Esquerdo… Embandeirando pela manete esquerda."</em>
        </CalloutBanner>
      </div>
    </div>
  )
}
