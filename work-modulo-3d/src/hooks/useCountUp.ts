// Count-up mono sincronizado com gauge sweep (design.md §5.2).

import { useEffect, useRef, useState } from 'react'

export function useCountUp(target: number, opts?: { duration?: number; decimals?: number; start?: boolean }) {
  const { duration = 1200, decimals = 0, start = true } = opts ?? {}
  const [value, setValue] = useState(0)
  const raf = useRef(0)

  useEffect(() => {
    if (!start) return
    if (!Number.isFinite(target) || !Number.isFinite(duration) || duration <= 0) {
      const immediate = window.setTimeout(() => setValue(target), 0)
      return () => window.clearTimeout(immediate)
    }
    const precision = Number.isInteger(decimals) && decimals >= 0 && decimals <= 20 ? decimals : 0
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      const immediate = window.setTimeout(() => setValue(target), 0)
      return () => window.clearTimeout(immediate)
    }

    let t0: number | null = null
    const tick = (now: number) => {
      if (t0 === null) t0 = now
      const t = Math.min(1, (now - t0) / duration)
      const e = 1 - Math.pow(1 - t, 3) * (1 - 0.3 * t)
      setValue(Number((target * e).toFixed(precision)))
      if (t < 1) raf.current = requestAnimationFrame(tick)
      else setValue(target)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration, decimals, start])

  return value
}
