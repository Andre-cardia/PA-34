// Navbar — fixa em todas as páginas (design.md §7.1).
// sticky top-0 z-50, 64px → 56px após 80px; wordmark, chip SOP REV.13,
// links mono com traço cyan no ativo (layoutId), annunciator 3 GREEN, ⌘K, drawer mobile 01–09.

import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, Menu, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSearch } from '@/components/ui-custom/SearchContext'
import ThemeToggle from '@/components/ThemeToggle'

const PRIMARY = [
  { to: '/modelo-3d', label: 'MODELO 3D' },
  { to: '/cockpit', label: 'COCKPIT' },
  { to: '/especificacoes', label: 'ESPECIFICAÇÕES' },
  { to: '/sistemas', label: 'SISTEMAS' },
  { to: '/procedimentos', label: 'PROCEDIMENTOS' },
  { to: '/emergencias', label: 'EMERGÊNCIAS' },
]

const MORE = [
  { to: '/performance', label: 'PERFORMANCE' },
  { to: '/multimotor', label: 'MULTIMOTOR' },
  { to: '/seguranca', label: 'SEGURANÇA' },
]

const ALL_LINKS = [
  { to: '/', label: 'HOME', num: '00' },
  { to: '/modelo-3d', label: 'MODELO 3D', num: '01' },
  { to: '/cockpit', label: 'COCKPIT', num: '02' },
  { to: '/especificacoes', label: 'ESPECIFICAÇÕES', num: '03' },
  { to: '/performance', label: 'PERFORMANCE', num: '04' },
  { to: '/sistemas', label: 'SISTEMAS', num: '05' },
  { to: '/procedimentos', label: 'PROCEDIMENTOS', num: '06' },
  { to: '/multimotor', label: 'MULTIMOTOR', num: '07' },
  { to: '/emergencias', label: 'EMERGÊNCIAS', num: '08' },
  { to: '/seguranca', label: 'SEGURANÇA', num: '09' },
]

function Annunciator() {
  const reducedMotion = !!useReducedMotion()
  return (
    <span className="hidden items-center gap-2 border border-hairline px-2.5 py-1.5 min-[1400px]:flex" aria-label="Indicador visual simulado do trem de pouso: três verdes">
      <span className="whitespace-nowrap font-mono text-[10px] font-medium tracking-[0.22em] text-green">3 GREEN · SIM</span>
      <span className="flex gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0.15 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: [0.15, 1, 0.15, 1, 0.15, 1] }}
            transition={reducedMotion ? undefined : { duration: 0.9, delay: 0.4 + i * 0.12, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }}
            className="h-2 w-2 bg-green [box-shadow:0_0_8px_rgb(var(--c-green) / 0.7)]"
          />
        ))}
      </span>
    </span>
  )
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const location = useLocation()
  const search = useSearch()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setDrawerOpen(false)
      setMoreOpen(false)
    })
    return () => cancelAnimationFrame(frame)
  }, [location.pathname, location.search, location.hash])

  useEffect(() => {
    if (drawerOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [drawerOpen])

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const closeOnDesktop = () => {
      if (media.matches) setDrawerOpen(false)
    }
    closeOnDesktop()
    media.addEventListener?.('change', closeOnDesktop)
    return () => media.removeEventListener?.('change', closeOnDesktop)
  }, [])

  useEffect(() => {
    if (!drawerOpen) return
    const previous = document.activeElement as HTMLElement | null
    const drawer = drawerRef.current
    const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const focusables = drawer ? Array.from(drawer.querySelectorAll<HTMLElement>(selector)) : []
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const frame = requestAnimationFrame(() => closeButtonRef.current?.focus())
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setDrawerOpen(false)
        return
      }
      if (event.key !== 'Tab' || focusables.length === 0) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
      if (previous && document.contains(previous)) previous.focus()
    }
  }, [drawerOpen])

  useEffect(() => {
    if (!moreOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setMoreOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [moreOpen])

  const moreActive = MORE.some((l) => l.to === location.pathname)

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 border-b border-hairline bg-panel/90 backdrop-blur-[12px] transition-[height] duration-300',
          scrolled ? 'h-14' : 'h-16',
        )}
      >
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-4 px-4 md:px-8">
          {/* wordmark */}
          <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="PA-34 Seneca — início">
            <span className="font-display text-base font-bold tracking-tight text-ink">
              PA-34 <span className="text-cyan">//</span> SENECA
            </span>
            <span className="hidden border border-hairline px-1.5 py-0.5 font-mono text-[10px] tracking-[0.14em] text-faint sm:inline-block">
              SOP REV.13
            </span>
          </Link>

          {/* links desktop */}
          <nav className="hidden items-center gap-0 lg:flex" aria-label="Navegação principal">
            {PRIMARY.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn(
                    'relative whitespace-nowrap px-2 py-2 font-mono text-[11px] tracking-[0.06em] transition-colors duration-300 xl:px-2.5 xl:text-xs xl:tracking-[0.1em] 2xl:px-3 2xl:tracking-[0.12em]',
                    isActive ? 'text-cyan' : 'text-muted hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {l.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute inset-x-2 -bottom-[1px] xl:inset-x-2.5 2xl:inset-x-3 h-0.5 bg-cyan"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
            {/* dropdown MAIS */}
            <div className="relative" onMouseLeave={() => setMoreOpen(false)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setMoreOpen(false) }}>
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                onMouseEnter={() => setMoreOpen(true)}
                className={cn(
                  'flex items-center gap-1 whitespace-nowrap px-2 py-2 font-mono text-[11px] tracking-[0.06em] transition-colors xl:px-2.5 xl:text-xs xl:tracking-[0.1em] 2xl:px-3 2xl:tracking-[0.12em]',
                  moreActive ? 'text-cyan' : 'text-muted hover:text-ink',
                )}
                aria-expanded={moreOpen}
                aria-haspopup="true"
              >
                MAIS <ChevronDown className={cn('h-3 w-3 transition-transform', moreOpen && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-full mt-1 w-52 border border-hairline bg-raised py-1 shadow-xl shadow-black/20"
                  >
                    {MORE.map((l) => (
                      <NavLink
                        key={l.to}
                        to={l.to}
                        className={({ isActive }) =>
                          cn(
                            'block px-4 py-2.5 font-mono text-xs tracking-[0.12em] transition-colors',
                            isActive ? 'bg-overlay text-cyan' : 'text-muted hover:bg-overlay hover:text-ink',
                          )
                        }
                      >
                        {l.label}
                      </NavLink>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* direita */}
          <div className="flex shrink-0 items-center gap-2 xl:gap-3">
            <Annunciator />
            <ThemeToggle />
            <button
              type="button"
              onClick={search.open}
              className="hidden items-center gap-2 border border-hairline px-2.5 py-1.5 font-mono text-[11px] tracking-[0.14em] text-muted transition-colors hover:border-cyan-dim hover:text-cyan sm:flex"
              aria-label="Abrir busca rápida"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">BUSCA</span>
              <kbd className="text-faint">⌘K</kbd>
            </button>
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex h-9 w-9 items-center justify-center border border-hairline text-ink lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* drawer mobile full-screen */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[70] flex flex-col bg-panel lg:hidden"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            tabIndex={-1}
          >
            <div className="flex h-16 items-center justify-between border-b border-hairline px-4">
              <span className="font-display text-base font-bold text-ink">
                PA-34 <span className="text-cyan">//</span> SENECA
              </span>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex h-9 w-9 items-center justify-center border border-hairline text-ink"
                aria-label="Fechar menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-6 py-8" aria-label="Menu móvel">
              {ALL_LINKS.map((l, i) => (
                <motion.div
                  key={l.to}
                  initial={{ opacity: 0, x: -32 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] }}
                >
                  <NavLink
                    to={l.to}
                    end={l.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'flex items-baseline gap-4 border-b border-hairline/60 py-4',
                        isActive ? 'text-cyan' : 'text-ink',
                      )
                    }
                  >
                    <span className="font-mono text-xs text-faint">{l.num}</span>
                    <span className="font-display text-2xl font-semibold tracking-tight">{l.label}</span>
                  </NavLink>
                </motion.div>
              ))}
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                onClick={() => {
                  setDrawerOpen(false)
                  search.open()
                }}
                className="mt-8 flex w-full items-center justify-center gap-2 border border-cyan-dim py-3 font-mono text-xs uppercase tracking-[0.22em] text-cyan"
              >
                <Search className="h-4 w-4" /> Busca rápida ⌘K
              </motion.button>
              <ThemeToggle withLabel className="mt-3 h-auto w-full py-3" />
            </nav>
            <div className="border-t border-hairline px-6 py-4 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              SOP VOEFLORIPA REV.13 — MATERIAL DE ESTUDO
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
