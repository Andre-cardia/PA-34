// search — busca local de instrumentos (toolbar + índice lateral)
import { instrumentosCockpit } from '@/data'
import type { InstrumentoCockpit } from '@/data'
import { catMeta } from './panel-data'

export function searchInstruments(q: string, limit = 10): InstrumentoCockpit[] {
  const n = q.trim().toLowerCase()
  if (!n) return []
  return instrumentosCockpit
    .filter(
      (i) =>
        i.nome.toLowerCase().includes(n) ||
        i.nome_en.toLowerCase().includes(n) ||
        i.id.replace(/_/g, ' ').includes(n) ||
        catMeta(i.categoria).label.toLowerCase().includes(n),
    )
    .slice(0, limit)
}
