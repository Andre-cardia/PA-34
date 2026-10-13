// Footer — design.md §7.10: 4 colunas + barra inferior com annunciator.

import { Link } from 'react-router'
import { useSearch } from '@/components/ui-custom/SearchPalette'

const SOP_INDEX = [
  { to: '/seguranca', label: '01–04 · Introdução & Callouts' },
  { to: '/especificacoes', label: '05 · Generalidades & Limitações' },
  { to: '/performance', label: '06–07 · Performance & Planejamento' },
  { to: '/sistemas', label: '08 · Sistemas Avançados' },
  { to: '/procedimentos', label: '10 · Procedimentos Normais' },
  { to: '/multimotor', label: '11 · Pilotagem Multimotor' },
  { to: '/emergencias', label: '12 · Emergências' },
]

const MODULES = [
  { to: '/modelo-3d', label: 'Desenho Técnico 3D' },
  { to: '/cockpit', label: 'Cockpit 2D' },
]

export default function Footer() {
  const search = useSearch()
  return (
    <footer className="border-t border-hairline bg-panel">
      <div className="mx-auto grid max-w-content gap-10 px-6 py-16 md:grid-cols-2 md:px-12 lg:grid-cols-4">
        {/* 1 — wordmark */}
        <div>
          <p className="font-display text-lg font-bold text-ink">
            PA-34 <span className="text-cyan">//</span> SENECA
          </p>
          <p className="mt-3 max-w-[220px] text-sm leading-relaxed text-muted">
            Manual técnico interativo — PA34-200 Seneca I
          </p>
          <p className="mt-4 inline-block border border-hairline px-2 py-1 font-mono text-[10px] tracking-[0.14em] text-faint">
            SOP REV.13
          </p>
        </div>
        {/* 2 — índice SOP */}
        <nav aria-label="Índice do SOP">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">Índice SOP</p>
          <ul className="mt-4 space-y-2.5">
            {SOP_INDEX.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="font-mono text-xs text-muted transition-colors hover:text-cyan">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {/* 3 — módulos */}
        <nav aria-label="Módulos interativos">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">Módulos</p>
          <ul className="mt-4 space-y-2.5">
            {MODULES.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="font-mono text-xs text-muted transition-colors hover:text-cyan">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={search.open}
                className="font-mono text-xs text-muted transition-colors hover:text-cyan"
              >
                Busca rápida ⌘K
              </button>
            </li>
          </ul>
        </nav>
        {/* 4 — ficha mono */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">Ficha</p>
          <dl className="mt-4 space-y-2.5 font-mono text-xs">
            <div>
              <dt className="inline text-faint">FONTE: </dt>
              <dd className="inline text-muted">SOP VOEFLORIPA REV.13</dd>
            </div>
            <div>
              <dt className="inline text-faint">AERONAVE: </dt>
              <dd className="inline text-muted">PIPER PA34-200 SENECA I</dd>
            </div>
            <div>
              <dt className="inline text-faint">USO: </dt>
              <dd className="inline text-muted">MATERIAL DE ESTUDO</dd>
            </div>
          </dl>
        </div>
      </div>
      {/* barra inferior */}
      <div className="border-t border-hairline">
        <div className="mx-auto flex max-w-content flex-col items-start justify-between gap-3 px-6 py-4 font-mono text-[10px] uppercase tracking-[0.14em] text-faint md:flex-row md:items-center md:px-12">
          <span>CURRENT TRACK — REV.13</span>
          <span className="text-center">Material de estudo — não substitui o POH/SOP oficial.</span>
          <span className="flex items-center gap-2 text-green">
            3 GREEN
            <span className="flex gap-1" aria-hidden="true">
              <span className="h-1.5 w-1.5 bg-green" />
              <span className="h-1.5 w-1.5 bg-green" />
              <span className="h-1.5 w-1.5 bg-green" />
            </span>
          </span>
        </div>
      </div>
    </footer>
  )
}
