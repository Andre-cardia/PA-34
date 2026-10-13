// Config do módulo 3D — metadados de camada (cor-chave, vetor de explosão,
// âncora SOP), presets de câmera e links cruzados com o Cockpit 2D.
// Cores-chave e deslocamentos conforme modelo3d.md §2; presets conforme §1/§6.

import type { LucideIcon } from 'lucide-react'
import {
  Plane,
  Shell,
  Flame,
  Fuel,
  Zap,
  Wind,
  CircleDot,
  Move3d,
  Monitor,
} from 'lucide-react'

export interface LayerMeta {
  /** id da camada (igual ao id em componentes_3d.json) */
  id: string
  /** nome curto para o rail */
  short: string
  /** cor-chave (hover/label/rail) */
  color: string
  /** ícone do rail */
  icon: LucideIcon
  /** vetor de deslocamento na explosão (unidades do modelo em 100%) */
  explode: [number, number, number]
  /** motores: avançam ±X conforme o lado (esq/dir) */
  spreadX?: number
  /** controles: superfícies se separam ±Z conforme o lado */
  spreadZ?: number
  /** âncora da página /sistemas (quando a camada tem sistema correspondente) */
  sopHref?: string
  /** chip de seção SOP exibido na ficha */
  sopChip?: string
}

// Ordem do rail (1–9), de fora para dentro (modelo3d.md §2)
export const LAYER_ORDER = [
  'exterior',
  'estrutura',
  'motores',
  'combustivel',
  'eletrico',
  'vacuo_pitot',
  'trem_pouso',
  'controles_voo',
  'avionics_cabine',
] as const

export type LayerId = (typeof LAYER_ORDER)[number]

export const LAYERS: Record<LayerId, LayerMeta> = {
  exterior: {
    id: 'exterior',
    short: 'CARENAGEM & EXTERIOR',
    color: '#3FE0FF',
    icon: Plane,
    explode: [0, 2.6, 0],
    sopChip: 'DESC.',
  },
  estrutura: {
    id: 'estrutura',
    short: 'ESTRUTURA PRIMÁRIA',
    color: '#8FA3B8',
    icon: Shell,
    explode: [0, 1.35, 0],
  },
  motores: {
    id: 'motores',
    short: 'MOTORES & HÉLICES',
    color: '#FFB020',
    icon: Flame,
    explode: [0, 0.4, 0],
    spreadX: 2.3,
    sopHref: '/sistemas#8-4',
    sopChip: 'SOP 8.4',
  },
  combustivel: {
    id: 'combustivel',
    short: 'COMBUSTÍVEL',
    color: '#3DDC97',
    icon: Fuel,
    explode: [0, -1.7, 0],
    sopHref: '/sistemas#8-1',
    sopChip: 'SOP 8.1',
  },
  eletrico: {
    id: 'eletrico',
    short: 'SISTEMA ELÉTRICO',
    color: '#5B9DFF',
    icon: Zap,
    explode: [0, 2.05, 0],
    sopHref: '/sistemas#8-2',
    sopChip: 'SOP 8.2',
  },
  vacuo_pitot: {
    id: 'vacuo_pitot',
    short: 'VÁCUO & PITOT-ESTÁTICO',
    color: '#B78CFF',
    icon: Wind,
    explode: [0, 2.4, 0],
    sopHref: '/sistemas#8-3',
    sopChip: 'SOP 8.3',
  },
  trem_pouso: {
    id: 'trem_pouso',
    short: 'TREM DE POUSO',
    color: '#FF4D4D',
    icon: CircleDot,
    explode: [0, -2.7, 0],
    sopHref: '/sistemas#8-5',
    sopChip: 'SOP 8.5',
  },
  controles_voo: {
    id: 'controles_voo',
    short: 'CONTROLES DE VOO',
    color: '#7DD3FC',
    icon: Move3d,
    explode: [0, -0.85, 0],
    spreadZ: 1.25,
  },
  avionics_cabine: {
    id: 'avionics_cabine',
    short: 'CABINE & AVIÔNICOS',
    color: '#3FE0FF',
    icon: Monitor,
    explode: [2.3, 0.65, 0],
    sopHref: '/sistemas#8-7',
    sopChip: 'SOP 8.7',
  },
}

export function isLayerId(id: string | null): id is LayerId {
  return !!id && (LAYER_ORDER as readonly string[]).includes(id)
}

// ---------------------------------------------------------------------------
// Presets de vista (barra inferior) — posição da câmera + alvo
// ---------------------------------------------------------------------------

export interface ViewPreset {
  id: string
  label: string
  position: [number, number, number]
  target: [number, number, number]
}

export const VIEW_PRESETS: ViewPreset[] = [
  { id: 'frontal', label: 'FRONTAL', position: [11.5, 1.0, 0], target: [0, 0, 0] },
  { id: 'perfil', label: 'PERFIL', position: [0.4, 1.1, 11.5], target: [0, 0, 0] },
  { id: 'topo', label: 'TOPO', position: [0.3, 12, 0.9], target: [0, 0, 0] },
  { id: '3/4', label: '3/4', position: [7.5, 2.8, 8.5], target: [0, 0, 0] },
  { id: 'cabine', label: 'CABINE', position: [3.4, 1.5, 1.6], target: [0.9, 0.25, 0] },
]

export const DEFAULT_VIEW = VIEW_PRESETS[3] // 3/4

// ---------------------------------------------------------------------------
// Deep-links "VER NO COCKPIT 2D" — componente 3D → instrumento do cockpit
// (ids conferidos contra cockpit_instruments.json)
// ---------------------------------------------------------------------------

export const COCKPIT_LINKS: Record<string, string> = {
  seis_pack_piloto: 'horizonte_artificial',
  radios_coluna: 'navcom_1',
  amperimetros_comp: 'amperimetros',
  barramento_disjuntores: 'disjuntores',
  reles_partida_master: 'chave_master',
  indicador_succao_comp: 'indicador_vacuo',
  estatica_alternada_comp: 'estatica_alternada',
  tubo_pitot: 'pitot_heat_luzes',
  seletoras_valvulas: 'seletoras_combustivel',
  bombas_eletricas: 'bombas_combustivel_eletricas',
  bombas_mecanicas: 'fluxo_combustivel_pressao',
  sensores_quantidade: 'quantidade_combustivel',
  helice_esquerda: 'manetes_helice',
  helice_direita: 'manetes_helice',
  governadores_magnetos: 'chaves_magnetos_partida',
  cowl_flaps_comp: 'cowl_flaps',
  admissao_ar_alternativo: 'ar_alternativo',
  motor_esquerdo: 'tacometro_duplo',
  motor_direito: 'tacometro_duplo',
  flaps_superficies: 'flaps_alavanca',
  compensadores_comp: 'compensadores',
  freios: 'freio_estacionamento',
  sistema_emergencia: 'extensao_emergencia_trem',
  indicacao_aviso_trem: 'luzes_trem_verdes',
  aquecimento_ventilacao: 'aquecimento_desembacador',
}

// ---------------------------------------------------------------------------
// Constantes de interação
// ---------------------------------------------------------------------------

/** velocidade do lerp do slider de explosão (12%/frame, modelo3d.md §7) */
export const EXPLODE_LERP = 0.12
/** auto-rotação: pausa ao interagir, retoma após 6s ocioso (§7) */
export const AUTOROT_IDLE_MS = 6000
/** Limitar a densidade de etiquetas para não encobrir a aeronave. */
export const MAX_LABELS = 6
/** zoom mín/máx do OrbitControls (§6) */
export const ZOOM_MIN = 2.5
export const ZOOM_MAX = 80 // enquadramento responsivo dos limites explodidos em telas estreitas
