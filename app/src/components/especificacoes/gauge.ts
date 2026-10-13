// Utilitários de gauge SVG — arcos polares e parse de faixas "500–2200 RPM"
// vindas de especificacoes.json (strings do SOP, travessão/en-dash).

export function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

/** Arco circular entre dois ângulos (0° = topo, horário positivo). */
export function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const s = polarToXY(cx, cy, r, startAngle)
  const e = polarToXY(cx, cy, r, endAngle)
  const large = Math.abs(endAngle - startAngle) > 180 ? 1 : 0
  const sweep = endAngle >= startAngle ? 1 : 0
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} ${sweep} ${e.x.toFixed(2)} ${e.y.toFixed(2)}`
}

/** Extrai [min, max] de strings tipo "500–2200 RPM", "14–35 PSI" ou "76 a 190 MPH". */
export function parseRange(s: string): [number, number] {
  const m = s.replace(/\./g, '').replace(',', '.').match(/(\d+(?:\.\d+)?)\s*(?:[–-]|\ba\b)\s*(\d+(?:\.\d+)?)/)
  if (!m) throw new Error(`Faixa inválida: ${s}`)
  return [Number(m[1]), Number(m[2])]
}

/** Extrai o primeiro número de strings tipo "2700 RPM" / "217" / "245 °F". */
export function parseFirstNumber(s: string): number {
  const m = s.replace(/\./g, '').replace(',', '.').match(/(\d+(?:\.\d+)?)/)
  if (!m) throw new Error(`Valor inválido: ${s}`)
  return Number(m[1])
}

/** Mapeia valor → ângulo do mostrador (varredura total `sweep` a partir de startAngle). */
export function valueToAngle(v: number, min: number, max: number, startAngle: number, sweep: number) {
  const t = Math.min(1, Math.max(0, (v - min) / (max - min)))
  return startAngle + t * sweep
}
