// usePanZoom — zoom (1–4×) com roda/pinch centrado no cursor, pan por arrasto,
// tween out-expo p/ centralizar instrumentos (cockpit.md §1 "Palco").

import { useCallback, useEffect, useRef, useState } from 'react'
import { VB_W, VB_H } from './panel-data'

export interface View {
  k: number // multiplicador sobre o fit (1–4)
  x: number // px na tela
  y: number
}

const K_MIN = 1
const K_MAX = 4
const MARGIN = 80

export function usePanZoom() {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [view, setViewState] = useState<View>({ k: 1, x: 0, y: 0 })
  const viewRef = useRef(view)
  const sizeRef = useRef(size)
  const raf = useRef(0)
  const reduced = useRef(false)
  viewRef.current = view
  sizeRef.current = size

  const base = size.w > 0 ? Math.min(size.w / VB_W, size.h / VB_H) : 0

  const clampView = useCallback((v: View, w: number, h: number): View => {
    const b = Math.min(w / VB_W, h / VB_H)
    const cw = VB_W * b * v.k
    const ch = VB_H * b * v.k
    let { x, y } = v
    if (cw <= w) x = (w - cw) / 2
    else x = Math.min(MARGIN, Math.max(w - cw - MARGIN, x))
    if (ch <= h) y = (h - ch) / 2
    else y = Math.min(MARGIN, Math.max(h - ch - MARGIN, y))
    return { k: v.k, x, y }
  }, [])

  const setView = useCallback(
    (v: View) => {
      setViewState(clampView(v, sizeRef.current.w, sizeRef.current.h))
    },
    [clampView],
  )

  const cancelTween = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current)
    raf.current = 0
  }, [])

  const animateTo = useCallback(
    (to: View, duration = 600) => {
      cancelTween()
      const { w, h } = sizeRef.current
      const target = clampView(to, w, h)
      const from = viewRef.current
      if (duration <= 0 || reduced.current) {
        setViewState(target)
        return
      }
      let t0: number | null = null
      const tick = (now: number) => {
        if (t0 === null) t0 = now
        const t = Math.min(1, (now - t0) / duration)
        const e = t === 1 ? 1 : 1 - Math.pow(2, -10 * t) // out-expo
        setViewState({
          k: from.k + (target.k - from.k) * e,
          x: from.x + (target.x - from.x) * e,
          y: from.y + (target.y - from.y) * e,
        })
        if (t < 1) raf.current = requestAnimationFrame(tick)
        else raf.current = 0
      }
      raf.current = requestAnimationFrame(tick)
    },
    [cancelTween, clampView],
  )

  const fit = useCallback(
    (k = 1): View => {
      const { w, h } = sizeRef.current
      const b = Math.min(w / VB_W, h / VB_H)
      return { k, x: (w - VB_W * b * k) / 2, y: (h - VB_H * b * k) / 2 }
    },
    [],
  )

  const reset = useCallback(
    (animate = true) => animateTo(fit(1), animate ? 500 : 0),
    [animateTo, fit],
  )

  const zoomAt = useCallback(
    (cx: number, cy: number, factor: number, animate = false) => {
      const cur = viewRef.current
      const k2 = Math.min(K_MAX, Math.max(K_MIN, cur.k * factor))
      if (k2 === cur.k) return
      const s = k2 / cur.k
      const to = { k: k2, x: cx - (cx - cur.x) * s, y: cy - (cy - cur.y) * s }
      if (animate) animateTo(to, 220)
      else setView(to)
    },
    [animateTo, setView],
  )

  const panBy = useCallback(
    (dx: number, dy: number) => {
      const cur = viewRef.current
      setView({ k: cur.k, x: cur.x + dx, y: cur.y + dy })
    },
    [setView],
  )

  /** Centraliza um ponto do painel (coords do viewBox).
   *  mode 'min': não reduz o zoom atual (usa max(k, kAtual)); 'exact': força k. */
  const centerOn = useCallback(
    (px: number, py: number, k: number, duration = 600, mode: 'min' | 'exact' = 'min') => {
      const { w, h } = sizeRef.current
      const b = Math.min(w / VB_W, h / VB_H)
      const kk = Math.min(K_MAX, Math.max(K_MIN, mode === 'min' ? Math.max(k, viewRef.current.k) : k))
      animateTo({ k: kk, x: w / 2 - px * b * kk, y: h / 2 - py * b * kk }, duration)
    },
    [animateTo],
  )

  // medição do container
  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      setSize({ w: r.width, h: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // centraliza no primeiro tamanho válido
  const initialized = useRef(false)
  useEffect(() => {
    if (size.w > 0 && !initialized.current) {
      initialized.current = true
      setViewState(fit(1))
    } else if (size.w > 0 && viewRef.current.k === 1) {
      setViewState((v) => clampView(v, size.w, size.h))
    }
  }, [size, fit, clampView])

  // zoom pela roda (listener nativo p/ preventDefault)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      cancelTween()
      const r = el.getBoundingClientRect()
      const cur = viewRef.current
      const factor = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0016))
      const k2 = Math.min(K_MAX, Math.max(K_MIN, cur.k * factor))
      if (k2 === cur.k) return
      const s = k2 / cur.k
      const cx = e.clientX - r.left
      const cy = e.clientY - r.top
      setViewState(
        clampView({ k: k2, x: cx - (cx - cur.x) * s, y: cy - (cy - cur.y) * s }, r.width, r.height),
      )
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [cancelTween, clampView])

  // arrasto (pan) + pinch
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<
    | { mode: 'pan'; sx: number; sy: number; vx: number; vy: number }
    | { mode: 'pinch'; dist0: number; k0: number; vx: number; vy: number; mx: number; my: number }
    | null
  >(null)

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      cancelTween()
      const el = ref.current
      if (!el) return
      el.setPointerCapture(e.pointerId)
      const r = el.getBoundingClientRect()
      pointers.current.set(e.pointerId, { x: e.clientX - r.left, y: e.clientY - r.top })
      const cur = viewRef.current
      if (pointers.current.size === 1) {
        const p = [...pointers.current.values()][0]
        gesture.current = { mode: 'pan', sx: p.x, sy: p.y, vx: cur.x, vy: cur.y }
      } else if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()]
        gesture.current = {
          mode: 'pinch',
          dist0: Math.max(10, Math.hypot(a.x - b.x, a.y - b.y)),
          k0: cur.k,
          vx: cur.x,
          vy: cur.y,
          mx: (a.x + b.x) / 2,
          my: (a.y + b.y) / 2,
        }
      }
    },
    [cancelTween],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const el = ref.current
      const g = gesture.current
      if (!el || !g || !pointers.current.has(e.pointerId)) return
      const r = el.getBoundingClientRect()
      pointers.current.set(e.pointerId, { x: e.clientX - r.left, y: e.clientY - r.top })
      if (g.mode === 'pan' && pointers.current.size === 1) {
        const p = [...pointers.current.values()][0]
        setViewState(clampView({ k: viewRef.current.k, x: g.vx + (p.x - g.sx), y: g.vy + (p.y - g.sy) }, r.width, r.height))
      } else if (g.mode === 'pinch' && pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()]
        const dist = Math.max(10, Math.hypot(a.x - b.x, a.y - b.y))
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        const k2 = Math.min(K_MAX, Math.max(K_MIN, g.k0 * (dist / g.dist0)))
        const s = k2 / g.k0
        setViewState(
          clampView(
            { k: k2, x: mid.x - (g.mx - g.vx) * s, y: mid.y - (g.my - g.vy) * s },
            r.width,
            r.height,
          ),
        )
      }
    },
    [clampView],
  )

  const endPointer = useCallback((e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size === 1) {
      // continua como pan com o dedo restante
      const p = [...pointers.current.values()][0]
      const cur = viewRef.current
      gesture.current = { mode: 'pan', sx: p.x, sy: p.y, vx: cur.x, vy: cur.y }
    } else if (pointers.current.size === 0) {
      gesture.current = null
    }
  }, [])

  useEffect(() => () => cancelTween(), [cancelTween])

  return {
    ref,
    view,
    base,
    size,
    zoomAt,
    panBy,
    centerOn,
    reset,
    animateTo,
    handlers: { onPointerDown, onPointerMove, onPointerUp: endPointer, onPointerCancel: endPointer },
  }
}
