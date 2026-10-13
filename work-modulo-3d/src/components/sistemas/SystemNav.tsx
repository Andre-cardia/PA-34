// Navegador de sistemas — barra sticky abaixo da Navbar (sistemas.md §2).
// 7 chips-lâmina na cor-chave de cada estação; scroll-spy marca a estação
// visível; clique rola suave até a âncora #8-X. Extra: deep-link p/ o 3D.

import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Box } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Sistema } from '@/data'
import { metaFor } from './config'

interface Props {
  sistemas: Sistema[]
  activeId: string
  onSelect: (sistema: Sistema) => void
}

export default function SystemNav({ sistemas, activeId, onSelect }: Props) {
  const active = sistemas.find((s) => s.id === activeId) ?? sistemas[0]
  const activeMeta = metaFor(active)

  return (
    <motion.div
      initial={{ y: '-100%' }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-14 z-40 border-b border-hairline bg-panel/90 backdrop-blur-[12px]"
    >
      <div className="scrollbar-none mx-auto flex max-w-content items-stretch gap-1 overflow-x-auto px-3 md:px-8">
        {sistemas.map((s) => {
          const meta = metaFor(s)
          const isActive = s.id === activeId
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s)}
              className={cn(
                'relative flex shrink-0 items-center gap-2 px-3 py-3 font-mono text-[11px] tracking-[0.1em] transition-colors duration-300',
                isActive ? 'text-ink' : 'text-faint hover:text-muted',
              )}
              aria-current={isActive ? 'true' : undefined}
            >
              <span
                className="h-1.5 w-1.5 shrink-0"
                style={{ backgroundColor: meta.color, opacity: isActive ? 1 : 0.35 }}
                aria-hidden="true"
              />
              <span className="text-faint">{s.secao_sop}</span>
              <span className="hidden sm:inline">{meta.short}</span>
              {isActive && (
                <motion.span
                  layoutId="sistemas-chip-underline"
                  className="absolute inset-x-2 bottom-0 h-0.5"
                  style={{ backgroundColor: meta.color, boxShadow: `0 0 8px ${meta.color}` }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
            </button>
          )
        })}
        {/* extra à direita: abrir a camada da estação atual no modelo 3D */}
        <div className="ml-auto hidden items-center pl-4 md:flex">
          <Link
            to={`/modelo-3d?camada=${activeMeta.camada3d}`}
            className="flex items-center gap-2 border border-hairline px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition-colors hover:border-cyan-dim hover:text-cyan"
          >
            <Box className="h-3.5 w-3.5" aria-hidden="true" />
            Abrir no modelo 3D
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
