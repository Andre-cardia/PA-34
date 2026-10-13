// Stub de página — usado pelas rotas que serão implementadas pelos page agents.
// Mantém o chrome visual (PageHero) para navegação consistente durante o scaffold.

import PageHero from '@/components/ui-custom/PageHero'

interface Props {
  secao: string
  title: string
  lead: string
}

export default function PageStub({ secao, title, lead }: Props) {
  return (
    <>
      <PageHero secao={secao} title={title} lead={lead} breadcrumb={[{ label: 'HOME', to: '/' }, { label: title }]} />
      <section className="mx-auto max-w-content px-6 py-24 md:px-12">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-faint">
          // MÓDULO EM MONTAGEM — CONTEÚDO DO SOP SENDO INSTALADO
        </p>
      </section>
    </>
  )
}
