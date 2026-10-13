// HUD scramble — "boot de aviônico": caracteres embaralhados que se resolvem
// (design.md §5.4). Apenas H1 de página e hero (<20 chars recomendado).

import { useEffect, useState } from 'react'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/\\|=+-*#'

export function useScramble(text: string, opts?: { duration?: number; delay?: number; enabled?: boolean }) {
  const { duration = 800, delay = 0, enabled = true } = opts ?? {}
  const [output, setOutput] = useState(text)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!enabled || reduced) {
      setOutput(text)
      return
    }
    let raf = 0
    let start: number | null = null
    const timer = window.setTimeout(() => {
      const tick = (now: number) => {
        if (start === null) start = now
        const t = Math.min(1, (now - start) / duration)
        const settled = Math.floor(t * text.length)
        let out = text.slice(0, settled)
        for (let i = settled; i < text.length; i++) {
          const ch = text[i]
          out += ch === ' ' || ch === '-' ? ch : CHARS[Math.floor(Math.random() * CHARS.length)]
        }
        setOutput(out)
        if (t < 1) raf = requestAnimationFrame(tick)
        else setOutput(text)
      }
      raf = requestAnimationFrame(tick)
    }, delay)
    return () => {
      window.clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [text, duration, delay, enabled])

  return output
}
