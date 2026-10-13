// Layout — wrapper global: Navbar + <Outlet/> + Footer, transição de rota
// "porta de hangar" (design.md §5), scroll-to-top e Lenis (scroll suave).

import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import Lenis from 'lenis'
import Navbar from './Navbar'
import Footer from './Footer'
import { SearchProvider } from '@/components/ui-custom/SearchPalette'

// Número da seção SOP exibido no centro durante a transição (design.md §12)
const SECTION_BY_ROUTE: Record<string, string> = {
  '/': 'PA-34',
  '/modelo-3d': '3D',
  '/cockpit': '2D',
  '/especificacoes': '05',
  '/performance': '06',
  '/sistemas': '08',
  '/procedimentos': '10',
  '/multimotor': '11',
  '/emergencias': '12',
  '/seguranca': '01',
}

function HangarDoor({ section }: { section: string }) {
  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: '-100%' }}
      exit={{ y: '-100%' }}
      transition={{ duration: 0.45, delay: 0.4, ease: [0.7, 0, 0.2, 1] }}
      className="pointer-events-none fixed inset-0 z-[75] flex items-center justify-center border-b-2 border-cyan bg-panel"
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-3">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="font-display text-6xl font-bold tracking-tight text-ink"
        >
          {section}
        </motion.span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.08 }}
          className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan"
        >
          SOP VOEFLORIPA · REV.13
        </motion.span>
      </div>
      {/* hairlines decorativas da "porta" */}
      <span className="absolute inset-x-0 top-1/4 h-px bg-hairline/60" />
      <span className="absolute inset-x-0 top-2/4 h-px bg-hairline/60" />
      <span className="absolute inset-x-0 top-3/4 h-px bg-hairline/60" />
    </motion.div>
  )
}

export default function Layout() {
  const location = useLocation()
  const [door, setDoor] = useState<{ key: string; section: string } | null>(null)
  const [reduced, setReduced] = useState(false)
  const first = useRef(true)

  // Lenis — scroll suave global (desativado com reduced motion)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(media.matches)
    sync()
    media.addEventListener?.('change', sync)
    return () => media.removeEventListener?.('change', sync)
  }, [])

  useEffect(() => {
    if (reduced) return
    const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1 })
    let raf = 0
    const loop = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [reduced])

  // Transição de rota + scroll ao topo ou para um deep-link
  useEffect(() => {
    let outerFrame = 0
    let innerFrame = 0
    const route = location.pathname.replace(/\/+$/, '') || '/'
    const scrollToLocation = () => {
      if (location.hash) {
        try {
          const id = decodeURIComponent(location.hash.slice(1))
          const target = document.getElementById(id)
          if (target) {
            target.scrollIntoView({ block: 'start' })
          } else {
            window.scrollTo(0, 0)
          }
        } catch {
          window.scrollTo(0, 0)
        }
        return
      }
      window.scrollTo(0, 0)
    }
    outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(scrollToLocation)
    })

    if (first.current) {
      first.current = false
      return () => {
        cancelAnimationFrame(outerFrame)
        cancelAnimationFrame(innerFrame)
      }
    }
    if (reduced || route === '/emergencias') {
      const closeFrame = requestAnimationFrame(() => setDoor(null))
      return () => {
        cancelAnimationFrame(outerFrame)
        cancelAnimationFrame(innerFrame)
        cancelAnimationFrame(closeFrame)
      }
    }
    const section = SECTION_BY_ROUTE[route] ?? 'SOP'
    const openFrame = requestAnimationFrame(() => setDoor({ key: route, section }))
    const t = window.setTimeout(() => setDoor(null), 950)
    return () => {
      cancelAnimationFrame(outerFrame)
      cancelAnimationFrame(innerFrame)
      cancelAnimationFrame(openFrame)
      window.clearTimeout(t)
    }
  }, [location.pathname, location.hash, reduced])

  return (
    <MotionConfig reducedMotion="user">
      <SearchProvider>
        <div className="flex min-h-[100dvh] flex-col bg-abyss">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
          <AnimatePresence>{door && <HangarDoor key={door.key} section={door.section} />}</AnimatePresence>
        </div>
      </SearchProvider>
    </MotionConfig>
  )
}
