// Config da página SISTEMAS — metadados visuais por sistema (sistemas.md).
// Textos técnicos NÃO vivem aqui: vêm de src/data/sistemas.json.

import type { Sistema } from '@/data'

export type DiagramKey =
  | 'fuel'
  | 'electrical'
  | 'vacuum'
  | 'propsync'
  | 'gear'
  | 'baggage'
  | 'hvac'

export interface CrossLink {
  tipo: '3d' | 'cockpit'
  to: string
}

export interface SystemMeta {
  /** âncora estável: #8-1 … #8-7 (sistemas.md — Notas) */
  anchor: string
  /** rótulo curto para o chip da barra sticky */
  short: string
  /** cor-chave da estação (cor da camada 3D equivalente) */
  color: string
  /** id da camada no modelo 3D (componentes_3d.json) */
  camada3d: string
  /** qual diagrama renderizar */
  diagram: DiagramKey
  /** índice de notas_limitacoes destacado junto ao diagrama (excluído da lista do rodapé) */
  notaDestaque?: { index: number; variant: 'cuidado' | 'perigo'; title: string }
  /** link cruzado por índice de componente (existe no 3D / cockpit) */
  crossLinks?: Record<number, CrossLink>
}

const M3D = (camada: string): CrossLink => ({ tipo: '3d', to: `/modelo-3d?camada=${camada}` })
const CKP = (instrumento: string): CrossLink => ({ tipo: 'cockpit', to: `/cockpit?i=${instrumento}` })

export const SYSTEM_META: Record<string, SystemMeta> = {
  combustivel: {
    anchor: '8-1',
    short: 'COMBUSTÍVEL',
    color: '#3DDC97',
    camada3d: 'combustivel',
    diagram: 'fuel',
    // sistemas.md §8.1: CalloutBanner PERIGO ao lado do toggle de crossfeed
    notaDestaque: { index: 1, variant: 'perigo', title: 'PERIGO — CROSSFEED' },
    crossLinks: {
      0: M3D('combustivel'),
      2: M3D('combustivel'),
      3: M3D('combustivel'),
      4: M3D('combustivel'),
      8: CKP('fuel-flow'),
      9: CKP('pressao-combustivel'),
    },
  },
  eletrico: {
    anchor: '8-2',
    short: 'ELÉTRICO',
    color: '#5B9DFF',
    camada3d: 'eletrico',
    diagram: 'electrical',
    crossLinks: {
      0: M3D('eletrico'),
      1: CKP('amperimetros'),
      2: M3D('eletrico'),
      3: M3D('eletrico'),
      4: CKP('overvoltage-light'),
    },
  },
  vacuo: {
    anchor: '8-3',
    short: 'VÁCUO',
    color: '#A78BFA',
    camada3d: 'vacuo_pitot',
    diagram: 'vacuum',
    crossLinks: {
      0: M3D('vacuo_pitot'),
      3: CKP('horizonte-artificial'),
      4: CKP('suction'),
    },
  },
  'sincronizador-helices': {
    anchor: '8-4',
    short: 'HÉLICES',
    color: '#FFB020',
    camada3d: 'motores',
    diagram: 'propsync',
    crossLinks: {
      1: M3D('motores'),
      3: M3D('motores'),
    },
  },
  'trem-de-pouso': {
    anchor: '8-5',
    short: 'TREM DE POUSO',
    color: '#FF4D4D',
    camada3d: 'trem_pouso',
    diagram: 'gear',
    crossLinks: {
      0: CKP('seletora-trem'),
      1: CKP('luzes-trem'),
      4: M3D('trem_pouso'),
      6: M3D('trem_pouso'),
    },
  },
  'bagageiro-nariz': {
    anchor: '8-6',
    short: 'BAGAGEIRO',
    color: '#8FA3B8',
    camada3d: 'exterior',
    diagram: 'baggage',
    // sistemas.md §8.6: ênfase no banner — fechadura verificada na inspeção pré-voo
    notaDestaque: { index: 1, variant: 'cuidado', title: 'CUIDADO — TRAVAMENTO DA PORTA' },
    crossLinks: {
      0: M3D('exterior'),
      1: M3D('exterior'),
    },
  },
  hvac: {
    anchor: '8-7',
    short: 'HVAC',
    color: '#3FE0FF',
    camada3d: 'avionics_cabine',
    diagram: 'hvac',
    crossLinks: {
      0: M3D('avionics_cabine'),
      3: CKP('controles-calor'),
    },
  },
}

export function metaFor(sistema: Sistema): SystemMeta {
  return SYSTEM_META[sistema.id]
}

/**
 * Auto-classificação dos banners (sistemas.md, template da estação, item 3):
 * contém "NUNCA"/"NÃO" → PERIGO · "deve"/"somente" → CUIDADO · demais → NOTA.
 */
export function classifyNota(text: string): 'nota' | 'cuidado' | 'perigo' {
  if (/\bNUNCA\b/.test(text) || /\bNÃO\b/.test(text) || /^Não\s/.test(text)) return 'perigo'
  if (/\b(deve|devem|somente|proibid)/i.test(text)) return 'cuidado'
  return 'nota'
}
