// Alternador claro/escuro da Navbar. O painel 2D do cockpit é sempre escuro.

import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'

export default function ThemeToggle({ className, withLabel = false }: { className?: string; withLabel?: boolean }) {
  const { tema, toggle } = useTheme()
  const claro = tema === 'claro'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={!claro}
      aria-label={claro ? 'Ativar modo escuro' : 'Ativar modo claro'}
      title={claro ? 'Modo escuro' : 'Modo claro'}
      data-testid="theme-toggle"
      className={cn(
        'flex h-9 items-center justify-center gap-2 border border-hairline px-2.5 font-mono text-[11px] tracking-[0.14em] text-ink transition-colors hover:border-cyan hover:bg-cyan/10 hover:text-cyan',
        className,
      )}
    >
      {claro ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      {withLabel && <span>MODO</span>}
      <span className={withLabel ? '' : 'hidden sm:inline lg:hidden xl:inline'}>{claro ? 'ESCURO' : 'CLARO'}</span>
    </button>
  )
}
