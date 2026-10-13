// Count-up mono sincronizado com gauge sweep (design.md §5.2).

import { useEffect, useRef, useState } from 'react'

export function useCountUp(target: number, opts?: { duration?: number; decimals?: number; start?: boolean }) {
  const { duration = 1200, decimals = 0, start = true } = opts ?? {}
  const [value, setValue] = useState(0)
  const raf = useRef(0)

  useEffect(() => {
    if (!start) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setValue(target)
      return
    }
    let t0: number | null = null
    const tick = (now: number) => {
      if (t0 === null) t0 = now
      const t = Math.min(1, (now - t0) / duration)
      // ease mecânico aproximado (cubic-bezier 0.7,0,0.2,1)
      const e = 1 - Math.pow(1 - t, 3) * (1 - 0.3 * t)
      setValue(Number((target * e).toFixed(decimals)))
      if (t < 1) raf.current = requestAnimationFrame(tick)
      else setValue(target)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration, decimals, start])

  return value
}
