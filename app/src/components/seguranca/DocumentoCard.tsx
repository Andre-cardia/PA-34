import { motion } from 'framer-motion'
import CalloutBanner from '@/components/ui-custom/CalloutBanner'

export default function DocumentoCard() {
  return (
    <div className="lg:sticky lg:top-24">
      <motion.div
        initial={{ rotateY: 8, opacity: 0 }}
        whileInView={{ rotateY: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative border border-hairline bg-raised p-8"
        style={{ perspective: 800 }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">Flight Standards Manual</p>
        <h3 className="mt-4 font-display text-2xl font-bold leading-tight tracking-tight text-ink">
          STANDARD OPERATION<br />PROCEDURES
        </h3>
        <div className="mt-6 space-y-2.5 border-t border-hairline pt-5 font-mono text-sm">
          <div className="flex justify-between"><span className="text-muted">AERONAVE</span><span className="text-ink">PA34-200 SENECA I</span></div>
          <div className="flex justify-between"><span className="text-muted">ESCOLA</span><span className="text-ink">VOEFLORIPA (VFL)</span></div>
          <div className="flex justify-between"><span className="text-muted">REVISÃO</span><span className="text-cyan">REV. 13 — 20/10/2024</span></div>
          <div className="flex justify-between"><span className="text-muted">BASE</span><span className="text-ink">SBFL — HERCÍLIO LUZ</span></div>
        </div>
        <motion.div
          initial={{ scale: 1.4, opacity: 0, rotate: -10 }}
          whileInView={{ scale: 1, opacity: 1, rotate: -8 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute right-6 top-6 border-2 border-green/80 px-3 py-1 font-mono text-xs font-semibold tracking-[0.2em] text-green"
        >
          CONTROLADO
        </motion.div>
      </motion.div>
      <div className="mt-5">
        <CalloutBanner variant="nota" title="Hierarquia de documentos">
          Utilizado em conjunto com o POH (Pilot's Operating Handbook). Em caso de dúvida, o{' '}
          <strong className="text-ink">Manual de Voo da aeronave tem autoridade máxima</strong> — e nenhum manual
          substitui o bom julgamento do piloto.
        </CalloutBanner>
      </div>
    </div>
  )
}
