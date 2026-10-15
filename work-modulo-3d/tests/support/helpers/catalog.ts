import { readFileSync } from 'node:fs'

// Dados reais do site (sem faker): os testes devem refletir IDs do Seneca I.
const read = <T>(file: string): T =>
  JSON.parse(readFileSync(new URL(`../../../src/data/${file}`, import.meta.url), 'utf8')) as T

type Componente = { id: string; nome: string; localizacao: string }
type Camada = { id: string; nome: string; componentes: Componente[] }
type Instrumento = { id: string; nome: string }

export const camadas = read<{ camadas: Camada[] }>('componentes_3d.json').camadas
export const instrumentos = read<{ instrumentos: Instrumento[] }>('cockpit_instruments.json').instrumentos

export function componente(camadaId: string, compId: string) {
  const camada = camadas.find((c) => c.id === camadaId)
  const comp = camada?.componentes.find((c) => c.id === compId)
  if (!camada || !comp) throw new Error(`Componente inexistente no catálogo: ${camadaId}/${compId}`)
  return { camada, comp }
}

export function instrumento(id: string) {
  const inst = instrumentos.find((i) => i.id === id)
  if (!inst) throw new Error(`Instrumento inexistente no catálogo: ${id}`)
  return inst
}
