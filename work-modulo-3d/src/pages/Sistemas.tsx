// SISTEMAS — /sistemas — SOP 08.1–08.7 (sistemas.md).
// A página mais técnica do site: 7 estações de estudo com diagramas SVG
// animados, 45 componentes em acordeões, banners NOTA/CUIDADO/PERIGO,
// navegador sticky com scroll-spy e mapa cruzado com o modelo 3D.

import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import PageHero from '@/components/ui-custom/PageHero'
import { sistemas } from '@/data'
import type { Sistema } from '@/data'
import { metaFor } from '@/components/sistemas/config'
import SystemNav from '@/components/sistemas/SystemNav'
import SystemStation from '@/components/sistemas/SystemStation'
import CrossMap from '@/components/sistemas/CrossMap'

export default function Sistemas() {
  const [activeId, setActiveId] = useState(sistemas[0].id)
  const location = useLocation()

  // scroll-spy: banda central do viewport define a estação ativa
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const found = sistemas.find((s) => metaFor(s).anchor === e.target.id)
            if (found) setActiveId(found.id)
          }
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    )
    for (const s of sistemas) {
      const el = document.getElementById(metaFor(s).anchor)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  // deep-link: /sistemas#8-1 … #8-7 (modelo 3D / cockpit) e também
  // /sistemas#{id} (busca ⌘K — SearchPalette usa o id do sistema)
  useEffect(() => {
    const hash = location.hash.replace('#', '')
    if (!hash) return
    const target = sistemas.find((s) => metaFor(s).anchor === hash || s.id === hash)
    if (!target) return
    const anchor = metaFor(target).anchor
    const t = window.setTimeout(() => {
      document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' })
    }, 500)
    return () => window.clearTimeout(t)
  }, [location.hash])

  const scrollTo = useCallback((s: Sistema) => {
    setActiveId(s.id)
    const meta = metaFor(s)
    document.getElementById(meta.anchor)?.scrollIntoView({ behavior: 'smooth' })
    window.history.replaceState(null, '', `#${meta.anchor}`)
  }, [])

  return (
    <>
      <PageHero
        secao="08"
        kicker="// SEÇÃO 08 — SISTEMAS AVANÇADOS"
        title="Sistemas"
        lead="Sete sistemas, um avião. Do combustível ao desembaciador — funcionamento, componentes e limitações direto do SOP."
        breadcrumb={[{ label: 'HOME', to: '/' }, { label: 'SISTEMAS' }, { label: '08.1–08.7' }]}
      />

      <SystemNav sistemas={sistemas} activeId={activeId} onSelect={scrollTo} />

      {sistemas.map((s) => (
        <SystemStation key={s.id} sistema={s} meta={metaFor(s)} />
      ))}

      <CrossMap />
    </>
  )
}
