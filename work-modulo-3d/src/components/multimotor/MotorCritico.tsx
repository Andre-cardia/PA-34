import { motion } from 'framer-motion'

function DiscoRotacao({ sentido, label }: { sentido: 'horario' | 'anti'; label: string }) {
  const horario = sentido === 'horario'
  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="-70 -70 140 140" className="h-28 w-28">
        <circle r="52" fill="none" stroke="#1E2C3D" strokeWidth="1.5" />
        <motion.g
          animate={{ rotate: horario ? 360 : -360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '0px', originY: '0px' }}
        >
          <path d="M 0 -52 A 52 52 0 0 1 45 -26" fill="none" stroke="#3FE0FF" strokeWidth="3" markerEnd="url(#mcArrow)" />
          <line x1="-30" y1="0" x2="30" y2="0" stroke="#93A6BB" strokeWidth="4" strokeLinecap="round" />
        </motion.g>
        <defs>
          <marker id="mcArrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="#3FE0FF" />
          </marker>
        </defs>
        <circle r="5" fill="#E8F0F7" />
      </svg>
      <div className="text-center">
        <p className="font-mono text-xs tracking-[0.14em] text-ink">{label}</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{horario ? 'sentido horário' : 'contra-rotativo'}</p>
      </div>
    </div>
  )
}

export default function MotorCritico() {
  return (
    <div className="grid min-w-0 items-center gap-10 lg:grid-cols-12">
      <div className="min-w-0 lg:col-span-7">
        <p className="text-[17px] leading-relaxed text-muted">
          Motor crítico só existe para aeronaves cujas hélices <strong className="text-ink">giram na mesma direção</strong>.
          É o motor cuja falha acarreta o maior efeito negativo para a manutenção do voo: pelo <strong className="text-ink">Fator-P</strong>,
          a pá que desce do motor direito está mais distante do centro de gravidade, produzindo maior momento — assim,
          num bimotor comum, <strong className="text-ink">a falha do motor esquerdo</strong> resulta na maior tração assimétrica.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-muted">
          Para corrigir isso, alguns multimotores — <strong className="text-cyan">como o Seneca I</strong> — são fabricados
          com o <strong className="text-ink">motor direito contra-rotativo</strong>: o grau de tração assimétrica passa a ser
          o mesmo nos dois lados.
        </p>
        <motion.div
          initial={{ scale: 1.2, rotate: -4, opacity: 0 }}
          whileInView={{ scale: 1, rotate: -2, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 flex max-w-full min-w-0 flex-wrap items-center gap-3 border-2 border-green/70 bg-green/[0.08] px-4 py-4 sm:px-6"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-green" />
          <div className="min-w-0">
            <p className="font-display text-xl font-semibold tracking-tight text-green md:text-2xl">SENECA I: MOTORES CONTRA-ROTATIVOS</p>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">Nenhum motor é mais crítico que o outro</p>
          </div>
        </motion.div>
      </div>
      <div className="flex min-w-0 flex-wrap items-center justify-center gap-4 border border-hairline bg-panel/60 p-6 sm:gap-10 sm:p-10 lg:col-span-5">
        <DiscoRotacao sentido="horario" label="MOTOR ESQ. — IO-360" />
        <div className="font-mono text-2xl text-faint">⇄</div>
        <DiscoRotacao sentido="anti" label="MOTOR DIR. — LIO-360" />
      </div>
    </div>
  )
}
