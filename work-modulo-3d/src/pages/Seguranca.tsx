import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Megaphone, ShieldCheck } from 'lucide-react'
import PageHero from '@/components/ui-custom/PageHero'
import SectionHeader from '@/components/ui-custom/SectionHeader'
import CalloutBanner from '@/components/ui-custom/CalloutBanner'
import SpecTable, { DataRow } from '@/components/ui-custom/SpecTable'
import DocumentoCard from '@/components/seguranca/DocumentoCard'
import SafetyWindow from '@/components/seguranca/SafetyWindow'
import CalloutsTables from '@/components/seguranca/CalloutsTables'
import RegrasAccordion from '@/components/seguranca/RegrasAccordion'
import { CARTAZ } from '@/components/seguranca/data'

export default function Seguranca() {
  return (
    <>
      <PageHero
        secao="04"
        kicker="// SEÇÕES 01–04 + 09 — INTRODUÇÃO, CALLOUTS & SEGURANÇA"
        title="Operação & Segurança"
        lead="Antes do motor, o método: como usar este manual, falar na cabine e operar dentro das regras da VoeFloripa."
        breadcrumb={[{ label: 'HOME', to: '/' }, { label: 'SEGURANÇA' }, { label: 'SOP 04 + 09' }]}
      />

      {/* o documento */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 py-16 md:px-12 md:py-24">
          <SectionHeader kicker="// SEÇÕES 01–02 — O MANUAL" title="O documento e como usá-lo" measure="REV. 13" className="mb-10" />
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="font-display text-xl font-semibold text-ink">Propósito</h3>
                <p className="mt-2 text-[16px] leading-relaxed text-muted">
                  Este Manual de Treinamento — o <strong className="text-ink">Flight Standards Manual</strong> — assegura a
                  proficiência e o bom desempenho dos alunos no treinamento Multimotor. A VoeFloripa opera o PA34-200
                  Seneca I para treinamento <strong className="text-ink">multimotor e IFR</strong>, em consonância com a
                  NSMA 58-61 (RBHA 141).
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.08 }}
              >
                <h3 className="font-display text-xl font-semibold text-ink">O que ele padroniza</h3>
                <p className="mt-2 text-[16px] leading-relaxed text-muted">
                  Os procedimentos <strong className="text-ink">normais, anormais e de emergência</strong> a serem seguidos
                  por alunos e instrutores — visando padronizar as operações e maximizar a utilização dos recursos da
                  tripulação. Os procedimentos normais assumem todos os sistemas operando; irregularidades exigem o
                  checklist anormal ou de emergência apropriado.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.16 }}
              >
                <h3 className="font-display text-xl font-semibold text-ink">Convenções de destaque</h3>
                <div className="mt-3 space-y-3">
                  <CalloutBanner variant="nota" title="Nota">Texto informativo importante sobre a operação normal de um sistema.</CalloutBanner>
                  <CalloutBanner variant="cuidado" title="Caution! (Cautela)">Informação cuja não observância pode resultar em dano à aeronave, seus sistemas ou às pessoas envolvidas.</CalloutBanner>
                  <CalloutBanner variant="perigo" title="Warning! (Advertência)">Informações que, se não seguidas, causarão dano à aeronave, seus sistemas ou às pessoas envolvidas.</CalloutBanner>
                </div>
              </motion.div>
            </div>
            <div className="lg:col-span-5">
              <DocumentoCard />
            </div>
          </div>
        </div>
      </section>

      {/* callouts */}
      <section className="border-b border-hairline bg-panel/40">
        <div className="mx-auto max-w-[1280px] px-6 py-16 md:px-12 md:py-24">
          <SectionHeader kicker="// SEÇÃO 04 — STANDARD CALLOUTS" title="O roteiro da cabine" measure="CALLOUT ⇄ RESPOSTA" className="mb-6" />
          <div className="mb-10 max-w-3xl">
            <p className="text-[17px] leading-relaxed text-muted">
              Falas em voz alta padronizadas que asseguram que toda a tripulação esteja atenta à{' '}
              <strong className="text-ink">altitude, posição e instrumentos</strong>. O CM1 (assento esquerdo) confirma cada
              indicação; o CM2 (instrutor, assento direito) repete de volta toda palavra de comando.{' '}
              <strong className="text-cyan">Para todo callout é compulsória uma resposta.</strong>
            </p>
            <p className="mt-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-faint">
              <Megaphone className="h-3.5 w-3.5 text-cyan" /> Falas padronizadas em inglês são verbatim — não traduzir.
            </p>
          </div>

          {/* safety window */}
          <h3 className="mb-2 font-display text-2xl font-semibold text-ink">4.2 — Safety Window</h3>
          <p className="mb-6 max-w-3xl text-[15px] leading-relaxed text-muted">
            Aproximação estabilizada: <strong className="text-ink">1.000 ft AGL (IMC)</strong> ou{' '}
            <strong className="text-ink">500 ft AGL (VMC)</strong>, com o landing checklist completo. Fora dos parâmetros —{' '}
            <span className="font-mono text-amber">"NOT STABILIZED GO AROUND"</span>.
          </p>
          <SafetyWindow />

          {/* definições rápidas 4.3–4.7 */}
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <SpecTable>
              <DataRow label="4.3 — MSA" value='"MSA" NA SUBIDA E NA DESCIDA' dot="amber" />
              <DataRow label="4.4 — RESTRIÇÃO" value='"100ft TO ALTITUDE/LEVEL"' />
              <DataRow label="4.5 — V1/VR" value="CALLOUT 5 KT ANTES" dot="red" />
              <DataRow label="4.6 — ACCELERATION ALT." value="400 FT AGL" />
              <DataRow label="4.7 — ALTÍMETROS" value="AJUSTE CONJUNTO + CROSSCHECK" />
            </SpecTable>
            <CalloutBanner variant="cuidado" title="Regra de ouro dos switches">
              Sempre que um tripulante modificar a posição de um switch, controle ou frequência, a ação deve ser
              informada ao outro tripulante — troca de frequências, seleção de radiais, painel de áudio. Se o CM2 não
              realizar um callout requerido, o CM1 deverá fazê-lo.
            </CalloutBanner>
          </div>

          {/* tabelas */}
          <h3 className="mb-6 mt-14 font-display text-2xl font-semibold text-ink">4.8 — Tabelas de callouts</h3>
          <CalloutsTables />
        </div>
      </section>

      {/* regras de segurança */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 py-16 md:px-12 md:py-24">
          <SectionHeader kicker="// SEÇÃO 09 — REGRAS E POLÍTICA DE SEGURANÇA VOEFLORIPA" title="As regras da casa" measure="9.1 → 9.13 + ANEXO 13.1" className="mb-10" />
          <RegrasAccordion />
        </div>
      </section>

      {/* cartaz final */}
      <section>
        <div className="mx-auto max-w-[1280px] px-6 py-16 md:px-12 md:py-24">
          <SectionHeader kicker="// CARTAZ DE HANGAR — RESUMO" title="As 10 regras em uma parede" className="mb-10" />
          <motion.div
            initial={{ clipPath: 'inset(100% 0 0 0)' }}
            whileInView={{ clipPath: 'inset(0% 0 0 0)' }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="border border-hairline bg-raised/50"
          >
            <div className="grid md:grid-cols-2">
              {CARTAZ.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="group flex items-baseline gap-4 border-b border-hairline p-5 transition-colors hover:bg-overlay md:odd:border-r"
                >
                  <span className="font-mono text-sm text-faint transition-colors group-hover:text-cyan">{String(i + 1).padStart(2, '0')}</span>
                  <p className="text-[15px] leading-relaxed text-ink">{r}</p>
                </motion.div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-hairline px-5 py-4">
              <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
                <ShieldCheck className="h-3.5 w-3.5 text-green" /> Safety first — VoeFloripa SOP Rev.13
              </p>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">Resumo — texto completo na seção 09</p>
            </div>
          </motion.div>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/procedimentos"
              className="border border-cyan/60 bg-cyan/10 px-6 py-3.5 font-mono text-xs uppercase tracking-[0.16em] text-cyan transition-colors hover:bg-cyan/20"
            >
              Ir para os checklists →
            </Link>
            <Link
              to="/emergencias"
              className="border border-red/50 bg-red/10 px-6 py-3.5 font-mono text-xs uppercase tracking-[0.16em] text-red transition-colors hover:bg-red/20"
            >
              Revisar as emergências →
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
