// Busca Rápida (⌘K / Ctrl+K) — palette modal estilo command (design.md §7.2).
// Indexa cockpit, componentes 3D, capítulos operacionais e páginas de conteúdo.
// Enter navega e abre o item já selecionado via deep-link (design.md §12).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, CornerDownLeft } from 'lucide-react'
import { instrumentosCockpit, camadas3d, procedimentosNormais, emergencias, sistemas } from '@/data'
import { cn } from '@/lib/utils'
import { SearchContext } from './SearchContext'

interface SearchItem {
  id: string
  titulo: string
  sub: string
  grupo: 'COCKPIT' | '3D' | 'SOP 05' | 'SOP 06–07' | 'SOP 08' | 'SOP 09' | 'SOP 10' | 'SOP 11' | 'SOP 12'
  href: string
}

const GRUPO_ORDER: SearchItem['grupo'][] = ['COCKPIT', '3D', 'SOP 05', 'SOP 06–07', 'SOP 08', 'SOP 09', 'SOP 10', 'SOP 11', 'SOP 12']

const INDEX: SearchItem[] = [
  ...instrumentosCockpit.map((i) => ({
    id: i.id,
    titulo: i.nome,
    sub: `${i.categoria} · ${i.descricao.slice(0, 90)}`,
    grupo: 'COCKPIT' as const,
    href: `/cockpit?i=${i.id}`,
  })),
  ...camadas3d.flatMap((c) =>
    c.componentes.map((comp) => ({
      id: comp.id,
      titulo: comp.nome,
      sub: `${c.nome} · ${comp.funcao.slice(0, 90)}`,
      grupo: '3D' as const,
      href: `/modelo-3d?camada=${c.id}&c=${comp.id}`,
    })),
  ),
  ...sistemas.map((s) => ({
    id: s.id,
    titulo: s.nome,
    sub: `Seção ${s.secao_sop} · ${s.resumo.slice(0, 90)}`,
    grupo: 'SOP 08' as const,
    href: `/sistemas#${s.id}`,
  })),
  ...procedimentosNormais.map((p) => ({
    id: p.id,
    titulo: p.nome,
    sub: `Seção ${p.secao_sop} · ${p.objetivo.slice(0, 90)}`,
    grupo: 'SOP 10' as const,
    href: `/procedimentos#${p.id.replace('.', '-')}`,
  })),
  ...emergencias.map((e) => ({
    id: e.id,
    titulo: e.titulo,
    sub: `Seção ${e.secao_sop} · ${e.situacao.slice(0, 90)}`,
    grupo: 'SOP 12' as const,
    href: `/emergencias#${e.id.replace('.', '-')}`,
  })),
  { id: 'especificacoes', titulo: 'Especificações e limitações', sub: 'Seção 05 · ficha técnica, pesos, velocidades e arcos', grupo: 'SOP 05', href: '/especificacoes' },
  { id: 'performance', titulo: 'Performance e planejamento de voo', sub: 'Seções 06–07 · V-speeds, distâncias e planejamento', grupo: 'SOP 06–07', href: '/performance' },
  { id: 'seguranca', titulo: 'Regras e política de segurança', sub: 'Seções 01–04 e 09 · standard callouts e política VoeFloripa', grupo: 'SOP 09', href: '/seguranca' },
  { id: 'safety-window', titulo: 'SAFETY WINDOW e regras 13.1', sub: 'Seção 13.1 · callouts, limites e janela de segurança', grupo: 'SOP 09', href: '/seguranca' },
  { id: 'vxe', titulo: 'Vxse · velocidade de melhor ângulo OEI', sub: 'Seções 05–07 · desempenho e voo assimétrico', grupo: 'SOP 06–07', href: '/performance' },
  { id: 'especificacoes-tecnicas', titulo: 'Especificações técnicas de referência', sub: 'Fonte primária · dimensões, pesos, capacidades e motorização', grupo: 'SOP 05', href: '/especificacoes' },
  { id: 'multimotor', titulo: 'Técnicas de pilotagem multimotor', sub: 'Seção 11 · voo assimétrico e operação OEI', grupo: 'SOP 11', href: '/multimotor' },
]

// ---------------------------------------------------------------------------
// Contexto global
// ---------------------------------------------------------------------------

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <SearchContext.Provider value={{ open }}>
      {children}
      <SearchPalette open={isOpen} onClose={close} />
    </SearchContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export default function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    const reset = window.setTimeout(() => {
      setQuery('')
      setActive(0)
    }, 0)
    return () => window.clearTimeout(reset)
  }, [open])

  const results = useMemo(() => {
    const q = norm(query.trim())
    const pool = q
      ? INDEX.filter((i) => norm(`${i.titulo} ${i.sub} ${i.id}`).includes(q))
      : INDEX
    const grouped = new Map<SearchItem['grupo'], SearchItem[]>()
    for (const g of GRUPO_ORDER) {
      const items = pool.filter((i) => i.grupo === g).slice(0, q ? 6 : 3)
      if (items.length) grouped.set(g, items)
    }
    return grouped
  }, [query])

  const flat = useMemo(() => GRUPO_ORDER.flatMap((g) => results.get(g) ?? []), [results])

  useEffect(() => {
    const reset = window.setTimeout(() => setActive(0), 0)
    return () => window.clearTimeout(reset)
  }, [flat.length])

  useEffect(() => {
    if (!open) return
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus())
    const onModalKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const root = dialogRef.current
      if (!root) return
      const focusable = Array.from(root.querySelectorAll<HTMLElement>('button, input, [tabindex]:not([tabindex="-1"])')).filter((el) => !el.hasAttribute('disabled'))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onModalKey)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onModalKey)
      restoreFocusRef.current?.focus()
      restoreFocusRef.current = null
    }
  }, [open, onClose])

  const go = useCallback(
    (item: SearchItem) => {
      onClose()
      navigate(item.href)
    },
    [navigate, onClose],
  )

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && flat[active]) {
      go(flat[active])
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[95] bg-abyss/60 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Busca rápida"
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            ref={dialogRef}
            className="fixed left-1/2 top-[14dvh] z-[96] w-[min(640px,calc(100vw-32px))] -translate-x-1/2 border border-hairline bg-raised shadow-2xl shadow-black/70"
          >
            <div className="flex items-center gap-3 border-b border-hairline px-4">
              <Search className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Buscar instrumento, componente, procedimento…"
                className="h-12 w-full bg-transparent font-mono text-sm text-ink placeholder:text-faint focus:outline-none"
                aria-label="Termo de busca"
              />
              <kbd className="shrink-0 border border-hairline px-1.5 py-0.5 font-mono text-[10px] text-faint">ESC</kbd>
            </div>
            <div className="max-h-[52dvh] overflow-y-auto p-2">
              {flat.length === 0 && (
                <p className="px-3 py-8 text-center font-mono text-xs uppercase tracking-[0.14em] text-faint">
                  Nenhum resultado no SOP
                </p>
              )}
              {GRUPO_ORDER.map((g) => {
                const items = results.get(g)
                if (!items) return null
                return (
                  <div key={g} className="mb-1">
                    <p className="px-3 pb-1 pt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-faint">{g}</p>
                    {items.map((item) => {
                      const idx = flat.findIndex((candidate) => candidate.grupo === item.grupo && candidate.id === item.id)
                      return (
                        <button
                          key={`${item.grupo}-${item.id}`}
                          type="button"
                          onClick={() => go(item)}
                          onMouseEnter={() => setActive(idx)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left transition-colors',
                            idx === active ? 'bg-overlay' : 'bg-transparent',
                          )}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-mono text-[13px] text-ink">{item.titulo}</span>
                            <span className="block truncate font-mono text-[11px] text-faint">{item.sub}</span>
                          </span>
                          {idx === active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-cyan" aria-hidden="true" />}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between border-t border-hairline px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              <span>↑↓ navegar · Enter abrir</span>
              <span>{INDEX.length} itens indexados</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
