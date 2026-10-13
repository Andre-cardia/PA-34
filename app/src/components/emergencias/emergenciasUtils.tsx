// Utilitários da página /emergencias (design/emergencias.md):
// classificação por sistema afetado (palavras-chave do título/situação),
// auto-classificação das notas críticas, links cruzados por id e texto COPIAR.

import type { Emergencia } from '@/data'

export type Categoria = 'MOTOR' | 'TREM' | 'ELÉTRICO' | 'VÁCUO' | 'GELO' | 'FOGO' | 'OUTROS'

export const CATEGORIAS: Categoria[] = ['MOTOR', 'TREM', 'ELÉTRICO', 'VÁCUO', 'GELO', 'FOGO', 'OUTROS']

const RE_MOTOR = /motor|monomotor|hélice|helice|combustível|combustivel/

export function classificar(e: Emergencia): Categoria {
  const titulo = e.titulo.toLowerCase()
  const t = `${e.titulo} ${e.situacao}`.toLowerCase()
  if (/fogo/.test(t)) return 'FOGO'
  if (/gelo/.test(t)) return 'GELO'
  // o título manda: "Falha do Motor na Decolagem" é MOTOR mesmo citando o trem
  if (RE_MOTOR.test(titulo)) return 'MOTOR'
  if (/trem/.test(t)) return 'TREM'
  if (/elétric|eletric|alternador|bateria|sobrevoltagem/.test(t)) return 'ELÉTRICO'
  if (/vácuo|vacuo|suction/.test(t)) return 'VÁCUO'
  if (RE_MOTOR.test(t)) return 'MOTOR'
  return 'OUTROS'
}

// Notas críticas: contém "NUNCA"/"jamais"/"acidente" → PERIGO; demais → CUIDADO.
export function notaVariante(nota: string): 'perigo' | 'cuidado' {
  return /nunca|jamais|acidente/i.test(nota) ? 'perigo' : 'cuidado'
}

// Links cruzados contextuais — mapeamento fixo por id (design/emergencias.md §3.5).
export const CROSS_LINKS: Record<string, { label: string; to: string }> = {
  '12.1': { label: 'TÉCNICA: VOO ASSIMÉTRICO', to: '/multimotor' },
  '12.2': { label: 'TÉCNICA: EMBANDEIRAMENTO', to: '/multimotor' },
  '12.3': { label: 'TÉCNICA: VOO ASSIMÉTRICO', to: '/multimotor' },
  '12.4': { label: 'SISTEMA 8.1 — COMBUSTÍVEL', to: '/sistemas#8-1' },
  '12.5': { label: 'TÉCNICA: DECOLAGEM & V1', to: '/multimotor' },
  '12.6': { label: 'TÉCNICA: EMBANDEIRAMENTO', to: '/multimotor' },
  '12.7': { label: 'TÉCNICA: VOO MONOMOTOR', to: '/multimotor' },
  '12.8': { label: 'TÉCNICA: VOO MONOMOTOR', to: '/multimotor' },
  '12.9': { label: 'SISTEMA 8.5 — TREM DE POUSO', to: '/sistemas#8-5' },
  '12.10': { label: 'SISTEMA 8.5 — TREM DE POUSO', to: '/sistemas#8-5' },
  '12.11': { label: 'SISTEMA 8.5 — TREM DE POUSO', to: '/sistemas#8-5' },
  '12.12': { label: 'SISTEMA 8.2 — ELÉTRICO', to: '/sistemas#8-2' },
  '12.13': { label: 'SISTEMA 8.3 — VÁCUO', to: '/sistemas#8-3' },
  '12.20': { label: 'COCKPIT 2D — PAINEL', to: '/cockpit' },
}

export const emergenciaAnchor = (id: string) => id.replace('.', '-')

// Texto plano do procedimento para o botão COPIAR.
export function buildCopyText(e: Emergencia): string {
  const lines = [
    `SOP ${e.secao_sop} — ${e.titulo.toUpperCase()}`,
    '',
    `SITUAÇÃO: ${e.situacao}`,
    '',
    'PASSOS:',
    ...e.passos.map((p, i) => `${i + 1}. ${p}`),
  ]
  if (e.notas_criticas.length > 0) {
    lines.push('', 'NOTAS CRÍTICAS:', ...e.notas_criticas.map((n) => `- ${n}`))
  }
  return lines.join('\n')
}

// Termos-chave destacados em bold cyan nos passos (Vyse 105, X FEED, 3 GREEN...).
const KEY_SRC =
  '("(?:[^"]+)"|PAN PAN|MAYDAY|MEMORY ITEMS|BLUE LINE|RED LINE|X ?FEED|CROSSFEED|3 GREEN|VMCA|VMC|Vyse|Vxse|VLE|V1\\/VR|MÍN|MÁX RPM|\\b\\d[\\d.,]*\\s?(?:MPH|mph|RPM|ft|AGL|kt|pol\\.?\\s?Hg)\\b)'
const KEY_SPLIT = new RegExp(KEY_SRC, 'g')
const KEY_TEST = new RegExp(`^${KEY_SRC}$`)

export function highlightPassos(texto: string, strongClass: string) {
  const parts = texto.split(KEY_SPLIT)
  return parts.map((p, i) =>
    KEY_TEST.test(p) ? (
      <strong key={i} className={strongClass}>
        {p}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  )
}
