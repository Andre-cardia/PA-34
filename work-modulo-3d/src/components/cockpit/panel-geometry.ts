// panel-geometry — geometria pura (sem React) compartilhada pelo fallback vetorial
// (artwork.tsx) e pelo Blender (export-map.mjs → panel-map.json → build_panel.py).
import type { Pt } from './panel-data'

/** Desloca uma polilinha pela normal (para o acolchoado do glareshield). */
export function offsetLine(pts: Pt[], d: number): Pt[] {
  return pts.map(([x, y], i) => {
    const [x0, y0] = pts[Math.max(0, i - 1)]
    const [x1, y1] = pts[Math.min(pts.length - 1, i + 1)]
    const len = Math.hypot(x1 - x0, y1 - y0) || 1
    // normal apontando para dentro do painel (para baixo no topo)
    return [Math.round((x - ((y1 - y0) / len) * d) * 10) / 10, Math.round((y + ((x1 - x0) / len) * d) * 10) / 10]
  })
}

// Manches em W com logo Piper (camada opcional "mostrar manches"), na posição da foto.
export const YOKES = [
  { hub: { x: 360, y: 476 }, left: 168, right: 548 },
  { hub: { x: 1272, y: 444 }, left: 1094, right: 1474 },
]

export type Seg = ['M' | 'L', Pt] | ['C', Pt, Pt, Pt] | ['Q', Pt, Pt]
type Rr = { x: number; y: number; w: number; h: number; rx: number }

/**
 * Geometria única dos manches: o SVG de fallback e o Blender (via export-map)
 * usam exatamente os mesmos segmentos, retângulos e polígonos.
 */
export function yokeGeometry({ hub, left, right }: (typeof YOKES)[number]) {
  const top = hub.y - 160
  const w = 26
  // braço do lado `edge`: sign −1 (esquerda) ou +1 (direita)
  const arm = (edge: number, sign: number): Seg[] => {
    const H = (d: number) => hub.x + sign * d // a partir do cubo
    const E = (d: number) => edge - sign * d // a partir do punho
    return [
      ['M', [H(40), hub.y + 6]],
      ['C', [H(90), hub.y + 22], [E(30), hub.y + 12], [E(12), hub.y - 30]],
      ['L', [E(0), top + 30]],
      ['Q', [E(-4), top], [E(18), top - 2]],
      ['L', [E(w + 6), top + 4]],
      ['L', [E(w), hub.y - 48]],
      ['C', [E(w + 20), hub.y - 22], [H(80), hub.y - 22], [H(40), hub.y - 30]],
    ]
  }
  const grip = (edge: number, sign: number): Pt[] => {
    const E = (d: number) => edge - sign * d
    return [[E(-4), top + 2], [E(30), top - 2], [E(26), top + 60], [E(2), top + 64]]
  }
  return {
    hub,
    column: { x: hub.x - 9, y: hub.y + 22, w: 18, h: 64 },
    arms: [arm(left, -1), arm(right, 1)],
    grips: [grip(left, -1), grip(right, 1)],
    hubBox: { x: hub.x - 42, y: hub.y - 44, w: 84, h: 76, rx: 14 } as Rr,
    rings: [0, 1, 2].map((i) => ({ x: hub.x - 34 + i * 5, y: hub.y - 36 + i * 5, w: 68 - i * 10, h: 60 - i * 10, rx: 10 - i * 2 }) as Rr),
    logo: { x: hub.x - 18, y: hub.y - 22, w: 36, h: 32, rx: 4 } as Rr,
    star: [[hub.x, hub.y - 20], [hub.x + 4, hub.y - 6], [hub.x + 16, hub.y - 6], [hub.x + 4, hub.y - 2], [hub.x, hub.y + 10], [hub.x - 4, hub.y - 2], [hub.x - 16, hub.y - 6], [hub.x - 4, hub.y - 6]] as Pt[],
    bar: { x: hub.x - 2.5, y: hub.y - 18, w: 5, h: 24, rx: 2 } as Rr,
  }
}

/** Amostra os segmentos de um braço como polígono (Blender). */
export function sampleSegs(segs: Seg[], n = 16): Pt[] {
  const out: Pt[] = []
  let cur: Pt = [0, 0]
  for (const s of segs) {
    if (s[0] === 'M' || s[0] === 'L') {
      cur = s[1]
      out.push(cur)
      continue
    }
    const p0 = cur
    for (let i = 1; i <= n; i++) {
      const t = i / n
      const u = 1 - t
      if (s[0] === 'C') {
        const [, a, b, c] = s
        out.push([u * u * u * p0[0] + 3 * u * u * t * a[0] + 3 * u * t * t * b[0] + t * t * t * c[0], u * u * u * p0[1] + 3 * u * u * t * a[1] + 3 * u * t * t * b[1] + t * t * t * c[1]])
      } else if (s[0] === 'Q') {
        const [, a, c] = s
        out.push([u * u * p0[0] + 2 * u * t * a[0] + t * t * c[0], u * u * p0[1] + 2 * u * t * a[1] + t * t * c[1]])
      }
    }
    cur = out[out.length - 1]
  }
  return out.map(([x, y]) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100])
}
