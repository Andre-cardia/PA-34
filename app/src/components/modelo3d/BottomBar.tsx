// BottomBar — barra inferior (64px, panel + hairline): presets de vista,
// slider global de explosão 0–100%, toggles AUTO-ROT / RÓTULOS / RAIO-X e
// RESET CÂMERA (modelo3d.md §1). Mobile: colapsa p/ ícones + slider full-width.

import { Camera, Rotate3d, ScanEye, Tags, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VIEW_PRESETS } from './config'

interface BarProps {
  explodePct: number // 0–100
  onExplode: (pct: number) => void
  autoRotate: boolean
  onToggleAutoRotate: () => void
  showLabels: boolean
  onToggleLabels: () => void
  xray: boolean
  onToggleXray: () => void
  activeView: string | null
  onView: (id: string) => void
  onResetCamera: () => void
}

function Toggle({ on, onClick, label, icon: Icon, kbd }: { on: boolean; onClick: () => void; label: string; icon: typeof Tags; kbd?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        'flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors',
        on ? 'border-cyan-dim bg-cyan/10 text-cyan' : 'border-hairline text-faint hover:border-cyan-dim hover:text-muted',
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
      {kbd && <kbd className="hidden border border-current px-1 text-[9px] opacity-60 lg:inline">{kbd}</kbd>}
    </button>
  )
}

export default function BottomBar(props: BarProps) {
  const { explodePct, onExplode, autoRotate, onToggleAutoRotate, showLabels, onToggleLabels, xray, onToggleXray, activeView, onView, onResetCamera } = props

  return (
    <div className="flex h-16 items-center gap-3 border-t border-hairline bg-panel px-3 md:px-4">
      {/* presets de vista */}
      <div className="flex items-center gap-1" role="group" aria-label="Presets de vista">
        <Video className="mr-1 hidden h-4 w-4 text-faint md:block" aria-hidden="true" />
        {VIEW_PRESETS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onView(v.id)}
            aria-pressed={activeView === v.id}
            className={cn(
              'border px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors',
              activeView === v.id
                ? 'border-cyan-dim bg-cyan/10 text-cyan'
                : 'border-transparent text-faint hover:border-hairline hover:text-muted',
            )}
          >
            <span className="hidden md:inline">{v.label}</span>
            <span className="md:hidden">{v.label.slice(0, 1)}</span>
          </button>
        ))}
      </div>

      <span className="hidden h-6 w-px bg-hairline sm:block" aria-hidden="true" />

      {/* slider global de explosão */}
      <label className="flex min-w-0 flex-1 items-center gap-3">
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          EXPLOSÃO <span className="text-cyan">{String(explodePct).padStart(3, '0')}%</span>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={explodePct}
          onChange={(e) => onExplode(Number(e.target.value))}
          aria-label="Explosão do modelo (0 a 100 por cento)"
          className="h-1 w-full min-w-16 cursor-pointer appearance-none bg-hairline accent-cyan [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-cyan"
        />
      </label>

      <span className="hidden h-6 w-px bg-hairline sm:block" aria-hidden="true" />

      {/* crédito do modelo 3D (GPL-2.0) */}
      <a
        href="/NOTICE-MODELO-3D.txt"
        target="_blank"
        rel="noreferrer"
        title="Atribuição do modelo 3D (GPL-2.0)"
        className="hidden shrink-0 font-mono text-[9px] uppercase tracking-[0.1em] text-faint transition-colors hover:text-cyan xl:block"
      >
        GEOMETRIA: FLIGHTGEAR SENECAII · GPL-2.0
      </a>

      <span className="hidden h-6 w-px bg-hairline sm:block" aria-hidden="true" />

      {/* toggles */}
      <div className="flex items-center gap-1.5">
        <Toggle on={autoRotate} onClick={onToggleAutoRotate} label="AUTO-ROT" icon={Rotate3d} />
        <Toggle on={showLabels} onClick={onToggleLabels} label="RÓTULOS" icon={Tags} />
        <Toggle on={xray} onClick={onToggleXray} label="RAIO-X" icon={ScanEye} kbd="X" />
        <button
          type="button"
          onClick={onResetCamera}
          className="flex items-center gap-1.5 border border-hairline px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:border-cyan-dim hover:text-cyan"
        >
          <Camera className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">RESET CÂMERA</span>
          <kbd className="hidden border border-current px-1 text-[9px] opacity-60 lg:inline">R</kbd>
        </button>
      </div>
    </div>
  )
}
