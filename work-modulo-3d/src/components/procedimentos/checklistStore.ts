// Store local dos checklists das 16 fases (procedimentos.md §4).
// Persistência por fase em localStorage (chave `checklist:10.X`); componentes
// da página sincronizam via CustomEvent (mesma aba) e `storage` (abas irmãs).

import { useCallback, useEffect, useMemo, useState } from 'react'
import { procedimentosNormais } from '@/data'

export const CHECKLIST_EVENT = 'pa34:checklist-update'

export const checklistKey = (faseId: string) => `checklist:${faseId}`

export function readChecked(faseId: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(checklistKey(faseId))
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const fase = procedimentosNormais.find((item) => item.id === faseId)
    if (!fase) return {}
    const validKeys = new Set(fase.checklist.flatMap((grupo, gi) => grupo.itens.map((_, ii) => `${gi}:${ii}`)))
    return Object.fromEntries(Object.entries(parsed).filter(([key, value]) => validKeys.has(key) && value === true)) as Record<string, boolean>
  } catch {
    return {}
  }
}

function writeChecked(faseId: string, state: Record<string, boolean>) {
  try {
    if (Object.keys(state).length > 0) {
      localStorage.setItem(checklistKey(faseId), JSON.stringify(state))
    } else {
      localStorage.removeItem(checklistKey(faseId))
    }
  } catch {
    /* storage indisponível */
  }
  window.dispatchEvent(new CustomEvent(CHECKLIST_EVENT))
}

export function clearAllChecklists() {
  try {
    for (const f of procedimentosNormais) localStorage.removeItem(checklistKey(f.id))
  } catch {
    /* noop */
  }
  window.dispatchEvent(new CustomEvent(CHECKLIST_EVENT))
}

export interface FaseStat {
  id: string
  total: number
  done: number
  complete: boolean
}

export interface ChecklistStats {
  fases: FaseStat[]
  totalItens: number
  totalDone: number
}

const FLAT_COUNT = new Map(
  procedimentosNormais.map((f) => [f.id, f.checklist.reduce((acc, g) => acc + g.itens.length, 0)]),
)

export function computeStats(): ChecklistStats {
  const fases = procedimentosNormais.map((f) => {
    const total = FLAT_COUNT.get(f.id) ?? 0
    const checked = readChecked(f.id)
    const done = Math.min(Object.values(checked).filter(Boolean).length, total)
    return { id: f.id, total, done, complete: total > 0 && done === total }
  })
  return {
    fases,
    totalItens: fases.reduce((acc, f) => acc + f.total, 0),
    totalDone: fases.reduce((acc, f) => acc + f.done, 0),
  }
}

function subscribe(update: () => void) {
  window.addEventListener(CHECKLIST_EVENT, update)
  window.addEventListener('storage', update)
  return () => {
    window.removeEventListener(CHECKLIST_EVENT, update)
    window.removeEventListener('storage', update)
  }
}

export function useChecklistStats(): ChecklistStats {
  const [stats, setStats] = useState<ChecklistStats>(computeStats)
  useEffect(() => subscribe(() => setStats(computeStats())), [])
  return stats
}

export const faseAnchor = (id: string) => id.replace('.', '-')

export function usePhaseChecklist(faseId: string) {
  const [state, setState] = useState(() => ({ id: faseId, checked: readChecked(faseId) }))
  // ajuste durante o render se a fase mudar (evita setState em effect)
  if (state.id !== faseId) {
    setState({ id: faseId, checked: readChecked(faseId) })
  }
  const checked = state.id === faseId ? state.checked : readChecked(faseId)

  useEffect(
    () => subscribe(() => setState({ id: faseId, checked: readChecked(faseId) })),
    [faseId],
  )

  const toggle = useCallback(
    (key: string) => {
      const cur = readChecked(faseId)
      const next = { ...cur }
      if (next[key]) delete next[key]
      else next[key] = true
      writeChecked(faseId, next)
    },
    [faseId],
  )

  const markAll = useCallback(
    (keys: string[]) => {
      writeChecked(faseId, Object.fromEntries(keys.map((k) => [k, true])))
    },
    [faseId],
  )

  const reset = useCallback(() => writeChecked(faseId, {}), [faseId])

  return useMemo(() => ({ checked, toggle, markAll, reset }), [checked, toggle, markAll, reset])
}
