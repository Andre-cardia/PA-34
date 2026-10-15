// GuideCard — empty-state do painel de detalhes (§5.1): título "NENHUM
// COMPONENTE SELECIONADO" e instruções de interação. As camadas ficam só no
// rail (sem índice duplicado). Flutua no canto do canvas (desktop) e some
// quando há seleção ou em telas pequenas.

import { Crosshair, MousePointerClick, Move3d, ZoomIn } from 'lucide-react'

const TIPS = [
  { Icon: MousePointerClick, text: 'Clique num componente para abrir a ficha' },
  { Icon: Move3d, text: 'Arraste para orbitar' },
  { Icon: ZoomIn, text: 'Role para aproximar ou afastar' },
  { Icon: Crosshair, text: 'Para isolar, passe o mouse numa camada do rail e use o botão de mira' },
] as const

export default function GuideCard() {
  return (
    <aside
      aria-label="Guia rápido do modelo 3D"
      className="pointer-events-auto absolute right-4 top-14 hidden w-72 border border-hairline bg-panel/95 backdrop-blur-sm lg:block"
    >
      <header className="border-b border-hairline px-4 py-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-cyan">NENHUM COMPONENTE SELECIONADO</p>
      </header>
      <ul className="space-y-2.5 px-4 py-3">
        {TIPS.map(({ Icon, text }) => (
          <li key={text} className="flex items-start gap-2.5 text-[13px] leading-snug text-muted">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-cyan" aria-hidden="true" />
            {text}
          </li>
        ))}
      </ul>
      <p className="border-t border-hairline px-4 py-2.5 font-mono text-[11px] leading-relaxed text-faint">
        TECLAS: 1–9 CAMADAS · E EXPLODIR · X RAIO-X · R CÂMERA · ESC SAIR
      </p>
    </aside>
  )
}
