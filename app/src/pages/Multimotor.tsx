import { Link } from 'react-router'
import { motion } from 'framer-motion'
import PageHero from '@/components/ui-custom/PageHero'
import SectionHeader from '@/components/ui-custom/SectionHeader'
import VSChip from '@/components/ui-custom/VSChip'
import GlossarioSE from '@/components/multimotor/GlossarioSE'
import AssimetriaDemo from '@/components/multimotor/AssimetriaDemo'
import Embandeiramento from '@/components/multimotor/Embandeiramento'
import MotorCritico from '@/components/multimotor/MotorCritico'
import TetoCurvas from '@/components/multimotor/TetoCurvas'
import TrafegoIFR from '@/components/multimotor/TrafegoIFR'

const MECH = [0.7, 0, 0.2, 1] as const

function StatPerda() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="border border-hairline bg-raised/50 p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">Potência perdida</p>
        <p className="mt-2 font-display text-5xl font-semibold text-amber">−50%</p>
        <div className="mt-4 h-2 w-full bg-panel">
          <motion.div className="h-full bg-amber" initial={{ width: '100%' }} whileInView={{ width: '50%' }} viewport={{ once: true }} transition={{ duration: 1.2, ease: MECH }} />
        </div>
        <p className="mt-2 font-mono text-xs text-muted">1 de 2 motores em pane</p>
      </div>
      <div className="border border-hairline bg-raised/50 p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">Performance de subida perdida</p>
        <p className="mt-2 font-display text-5xl font-semibold text-red">−80 a −90%</p>
        <div className="mt-4 h-2 w-full bg-panel">
          <motion.div className="h-full bg-red" initial={{ width: '100%' }} whileInView={{ width: '15%' }} viewport={{ once: true }} transition={{ duration: 1.2, ease: MECH }} />
        </div>
        <p className="mt-2 font-mono text-xs text-muted">perda de potência + arrasto assimétrico</p>
      </div>
    </div>
  )
}

export default function Multimotor() {
  return (
    <>
      <PageHero
        secao="11"
        kicker="// SEÇÃO 11 — TÉCNICAS DE PILOTAGEM MULTIMOTOR"
        title="Voo Monomotor (OEI)"
        lead="Um motor a menos, 80–90% de performance de subida a menos — e um avião que quer guinar. A técnica que mantém o Seneca voando."
        breadcrumb={[{ label: 'HOME', to: '/' }, { label: 'MULTIMOTOR' }, { label: 'SOP 11' }]}
      />

      {/* intro stats */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 py-16 md:px-12 md:py-20">
          <StatPerda />
          <p className="mt-6 max-w-3xl text-[15px] leading-relaxed text-muted">
            Este capítulo trata da operação de aeronaves multimotoras leves (peso inferior a 6.000 lbs / 2.675 kg).
            A redundância de instrumentos e sistemas só é vantagem quando usada por um piloto com bom treinamento e
            proficiência — e, em caso de dúvida, o <strong className="text-ink">Manual de Voo tem autoridade máxima</strong>.
          </p>
        </div>
      </section>

      {/* glossário SE */}
      <section className="border-b border-hairline bg-panel/40">
        <div className="mx-auto max-w-[1280px] px-6 py-16 md:px-12 md:py-24">
          <SectionHeader kicker="// 11.1 — TERMOS E DEFINIÇÕES" title="Glossário SE — siglas do voo monomotor" measure="BLUE LINE 105 MPH" className="mb-10" />
          <GlossarioSE />
        </div>
      </section>

      {/* voo assimétrico */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 py-16 md:px-12 md:py-24">
          <SectionHeader kicker="// 11.1 / 11.2 — IDENTIFICAÇÃO DO MOTOR INOPERANTE" title="O voo assimétrico" measure="5° PARA O MOTOR BOM" className="mb-6" />
          <p className="mb-10 max-w-3xl text-[17px] leading-relaxed text-muted">
            Quando um motor se torna inoperante, o desequilíbrio de tração gera uma tendência de{' '}
            <strong className="text-ink">guinada para o lado do motor ruim</strong>. A regra de identificação:{' '}
            <span className="font-mono text-amber">"dead foot, dead engine"</span> — pé morto, motor morto. Simule a
            pane e execute a sequência da técnica:
          </p>
          <AssimetriaDemo />
        </div>
      </section>

      {/* embandeiramento */}
      <section className="border-b border-hairline bg-panel/40">
        <div className="mx-auto max-w-[1280px] px-6 py-16 md:px-12 md:py-24">
          <SectionHeader kicker="// 11.3 — EMBANDEIRAMENTO" title="Por que embandeirar a hélice" measure="PINO BATENTE 800 RPM" className="mb-10" />
          <Embandeiramento />
        </div>
      </section>

      {/* motor crítico */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 py-16 md:px-12 md:py-24">
          <SectionHeader kicker="// 11.4 — MOTOR CRÍTICO" title="O caso especial do Seneca I" measure="FATOR-P" className="mb-10" />
          <MotorCritico />
        </div>
      </section>

      {/* teto + curvas */}
      <section className="border-b border-hairline bg-panel/40">
        <div className="mx-auto max-w-[1280px] px-6 py-16 md:px-12 md:py-24">
          <SectionHeader kicker="// 11.5 / 11.6 — TETO DE SERVIÇO & CURVAS" title="Teto monomotor e curvas" measure="3.650 FT · 50 FT/MIN" className="mb-10" />
          <TetoCurvas />
        </div>
      </section>

      {/* tráfego + IFR */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 py-16 md:px-12 md:py-24">
          <SectionHeader kicker="// 11.7 / 11.8 — TRÁFEGO VISUAL & IFR MONOMOTOR" title="Aproximação e pouso monomotor" measure="FLAPS NA CURTA FINAL" className="mb-10" />
          <TrafegoIFR />
        </div>
      </section>

      {/* ponte emergências */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 py-16 md:px-12 md:py-24">
          <SectionHeader kicker="// TÉCNICA → PROCEDIMENTO" title="Dominada aqui, aplicada lá" className="mb-10" />
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { to: '/emergencias#12-1', t: '12.1', label: 'Identificação do motor em pane' },
              { to: '/emergencias#12-2', t: '12.2', label: 'Corte do motor — embandeiramento' },
              { to: '/emergencias#12-7', t: '12.7', label: 'Pouso monomotor' },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="group border border-hairline border-l-2 border-l-red/70 bg-raised/50 p-5 transition-colors hover:border-red/50 hover:bg-overlay"
              >
                <p className="font-mono text-xs tracking-[0.18em] text-red">{l.t}</p>
                <p className="mt-2 font-display text-lg font-semibold text-ink group-hover:text-cyan">{l.label}</p>
                <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-faint group-hover:text-cyan">Ver procedimento →</p>
              </Link>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <VSChip code="VMC" value="80 MPH" categoria="critica" definicao="Velocidade mínima de controle — linha radial vermelha." />
            <VSChip code="VYSE" value="105 MPH" categoria="mono" definicao="Melhor razão de subida monomotor — linha azul." />
            <VSChip code="VSSE" value="TREINO" categoria="normal" definicao="Velocidade de segurança monomotora em treinamento." />
          </div>
        </div>
      </section>
    </>
  )
}
