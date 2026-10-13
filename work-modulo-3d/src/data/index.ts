// Camada de dados do site — todo conteúdo técnico vem dos arquivos do SOP
// (design.md §9). Não editar valores aqui; a fonte é /src/data/*.json|md.

import especificacoesJson from './especificacoes.json'
import sistemasJson from './sistemas.json'
import procedimentosJson from './procedimentos_normais.json'
import emergenciasJson from './emergencias.json'
import cockpitJson from './cockpit_instruments.json'
import componentes3dJson from './componentes_3d.json'

// ---------------------------------------------------------------------------
// Tipos leves
// ---------------------------------------------------------------------------

export interface Sistema {
  id: string
  nome: string
  secao_sop: string
  resumo: string
  funcionamento: string
  componentes: { nome: string; funcao: string; detalhes?: string }[]
  notas_limitacoes: string[]
}

export interface ChecklistItem {
  item: string
  acao: string
}

export interface ChecklistGrupo {
  grupo: string
  itens: ChecklistItem[]
}

export interface ProcedimentoNormal {
  id: string
  nome: string
  secao_sop: string
  objetivo: string
  checklist: ChecklistGrupo[]
  notas?: string[]
}

export interface Emergencia {
  id: string
  titulo: string
  secao_sop: string
  situacao: string
  passos: string[]
  notas_criticas: string[]
}

export interface InstrumentoCockpit {
  id: string
  nome: string
  nome_en: string
  categoria: string
  posicao_sugerida: string
  descricao: string
  operacao: string
}

export interface Componente3D {
  id: string
  nome: string
  localizacao: string
  funcao: string
  detalhes_operacionais: string
}

export interface Camada3D {
  id: string
  nome: string
  descricao: string
  componentes: Componente3D[]
}

export type Especificacoes = typeof especificacoesJson

// ---------------------------------------------------------------------------
// Exports tipados
// ---------------------------------------------------------------------------

export const especificacoes = especificacoesJson as Especificacoes
export const sistemas = sistemasJson as Sistema[]
export const procedimentosNormais = procedimentosJson as ProcedimentoNormal[]
export const emergencias = emergenciasJson as Emergencia[]
export const cockpitData = cockpitJson as {
  aeronave: string
  referencia: string
  observacoes: string[]
  instrumentos: InstrumentoCockpit[]
}
export const instrumentosCockpit = cockpitData.instrumentos
export const componentes3dData = componentes3dJson as {
  aeronave: string
  referencia: string
  notas_uso: string
  camadas: Camada3D[]
}
export const camadas3d = componentes3dData.camadas

// Contadores úteis (home, navbar, busca)
export const counts = {
  instrumentos: instrumentosCockpit.length,
  componentes3d: camadas3d.reduce((acc, c) => acc + c.componentes.length, 0),
  camadas3d: camadas3d.length,
  procedimentos: procedimentosNormais.length,
  emergencias: emergencias.length,
  sistemas: sistemas.length,
}
