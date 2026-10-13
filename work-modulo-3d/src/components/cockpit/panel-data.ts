// panel-data — mapa geométrico do painel (PANEL_MAP), ordem de tabulação por
// zonas, categorias, tour guiado e ligações cruzadas (cockpit.md §2).
// Coordenadas no viewBox 1600×955 definidas aqui (o design não fixa coordenadas
// exatas; zonas seguem `posicao_sugerida` do JSON).

import { cockpitData, instrumentosCockpit } from '@/data'
import type { InstrumentoCockpit } from '@/data'

export const VB_W = 1600
export const VB_H = 700

// ---------------------------------------------------------------------------
// Categorias (cores-chave do cockpit.md §1)
// ---------------------------------------------------------------------------

export interface CategoriaMeta {
  label: string
  color: string
}

export const CATEGORIES: Record<string, CategoriaMeta> = {
  voo: { label: 'VOO', color: '#3FE0FF' },
  motor: { label: 'MOTOR', color: '#FFB020' },
  avionics: { label: 'AVIONICS', color: '#5B9DFF' },
  navegacao: { label: 'NAVEGAÇÃO', color: '#B48CFF' },
  controle: { label: 'CONTROLE', color: '#8FA3B8' },
  aviso: { label: 'AVISO', color: '#FF4D4D' },
}

export const CATEGORY_ORDER = ['voo', 'motor', 'avionics', 'navegacao', 'controle', 'aviso']

export function catMeta(cat: string): CategoriaMeta {
  return CATEGORIES[cat] ?? { label: cat.toUpperCase(), color: '#8FA3B8' }
}

// ---------------------------------------------------------------------------
// Geometria dos hotspots
// ---------------------------------------------------------------------------

export interface HotspotCircle {
  kind: 'circle'
  cx: number
  cy: number
  r: number
}
export interface HotspotRect {
  kind: 'rect'
  x: number
  y: number
  w: number
  h: number
}
export type HotspotShape = HotspotCircle | HotspotRect

export interface PanelEntry {
  id: string
  zone: string // zona p/ o cabeçalho do drawer (ex.: "PAINEL ESQ · SIX-PACK")
  tag: string // rótulo curto da camada RÓTULOS
  shape: HotspotShape
  label: { x: number; y: number; anchor: 'start' | 'middle' | 'end' }
}

const Z = {
  sixpack: 'PAINEL ESQ · SIX-PACK',
  esq: 'PAINEL ESQ',
  interruptores: 'PAINEL ESQ · INTERRUPTORES',
  glare: 'GLARESHIELD',
  motor: 'CENTRO · MOTOR',
  radios: 'CENTRO · RÁDIOS',
  centroAux: 'CENTRO · AUX',
  trem: 'PAINEL DIR · TREM DE POUSO',
  copiloto: 'PAINEL DIR · COPILOTO',
  dir: 'PAINEL DIR',
} as const

const circ = (cx: number, cy: number, r: number): HotspotCircle => ({ kind: 'circle', cx, cy, r })
const rect = (x: number, y: number, w: number, h: number): HotspotRect => ({ kind: 'rect', x, y, w, h })
const right = (s: HotspotShape, dx = 6) =>
  s.kind === 'circle'
    ? { x: s.cx + s.r + dx, y: s.cy + 3, anchor: 'start' as const }
    : { x: s.x + s.w + dx, y: s.y + s.h / 2 + 3, anchor: 'start' as const }
const insideR = (s: HotspotRect, dy = 0) => ({ x: s.x + s.w - 6, y: s.y + 10 + dy, anchor: 'end' as const })

function entry(
  id: string,
  zone: string,
  tag: string,
  shape: HotspotShape,
  label: { x: number; y: number; anchor: 'start' | 'middle' | 'end' },
): [string, PanelEntry] {
  return [id, { id, zone, tag, shape, label }]
}

// prettier-ignore
const ENTRIES: [string, PanelEntry][] = [
  // ---- Glareshield curvo ---------------------------------------------------
  entry('termometro_oat', Z.glare, 'OAT', circ(110, 130, 19), right(circ(110, 130, 19), 8)),
  entry('bussola_magnetica', Z.glare, 'BÚSSOLA', rect(742, 75, 116, 34), { x: 866, y: 96, anchor: 'start' }),
  // ---- Painel esquerdo — instrumentos auxiliares --------------------------
  entry('aviso_estol', Z.esq, 'STALL', circ(195, 145, 15), { x: 195, y: 122, anchor: 'middle' }),
  // ---- Six-pack compacto (relógio e ADF na mesma fiada do topo, foto PR-FLM) -
  entry('relogio', Z.esq, 'RELÓGIO', circ(170, 310, 14), { x: 170, y: 288, anchor: 'middle' }),
  entry('velocimetro', Z.sixpack, 'ASI', circ(244, 310, 58), { x: 244, y: 244, anchor: 'middle' }),
  entry('horizonte_artificial', Z.sixpack, 'AI', circ(380, 310, 58), { x: 380, y: 244, anchor: 'middle' }),
  entry('altimetro', Z.sixpack, 'ALT', circ(516, 310, 58), { x: 516, y: 244, anchor: 'middle' }),
  entry('adf_indicador', Z.esq, 'ADF', circ(640, 310, 46), { x: 640, y: 256, anchor: 'middle' }),
  entry('coordenador_curva', Z.sixpack, 'TC', circ(244, 446, 58), { x: 244, y: 519, anchor: 'middle' }),
  entry('giro_direcional', Z.sixpack, 'DG', circ(380, 446, 58), { x: 380, y: 519, anchor: 'middle' }),
  entry('variometro', Z.sixpack, 'VSI', circ(516, 446, 58), { x: 516, y: 519, anchor: 'middle' }),
  // ---- Painel esquerdo — navegação e avisos (mesmo porte do six-pack, foto) --
  entry('indicador_vor_1', Z.esq, 'OBS 1', circ(230, 586, 54), { x: 230, y: 648, anchor: 'middle' }),
  entry('indicador_vor_2_gs', Z.esq, 'OBS 2/GS', circ(362, 586, 54), { x: 362, y: 648, anchor: 'middle' }),
  entry('avisos_eletricos_vacuo', Z.esq, 'OV/VAC', rect(440, 536, 140, 72), { x: 510, y: 621, anchor: 'middle' }),
  // piloto_automatico (Altimatic) — abaixo do six-pack/motor, no vão antes do pedestal (foto PR-FLM).
  entry('piloto_automatico', Z.esq, 'AP', rect(596, 620, 140, 50), { x: 666, y: 612, anchor: 'middle' }),
  // ---- Coluna de interruptores (esquerda) ---------------------------------
  entry('chave_master', Z.interruptores, 'MASTER', rect(68, 192, 84, 56), { x: 158, y: 223, anchor: 'start' }),
  entry('chaves_alternadores', Z.interruptores, 'ALT L–R', rect(68, 256, 84, 56), { x: 158, y: 287, anchor: 'start' }),
  entry('chaves_magnetos_partida', Z.interruptores, 'MAG/START', rect(68, 320, 84, 64), { x: 158, y: 355, anchor: 'start' }),
  entry('bombas_combustivel_eletricas', Z.interruptores, 'FUEL PUMPS', rect(68, 392, 84, 56), { x: 158, y: 423, anchor: 'start' }),
  entry('pitot_heat_luzes', Z.interruptores, 'PITOT/LUZES', rect(68, 456, 84, 64), { x: 158, y: 491, anchor: 'start' }),
  entry('freio_estacionamento', Z.interruptores, 'FREIO EST.', rect(68, 528, 84, 76), { x: 158, y: 569, anchor: 'start' }),
  // ---- Centro — instrumentos de motor junto à faixa inferior --------------
  // MP e Fuel Qty: mostrador único com 2 agulhas E/D (confirmado na foto).
  // RPM: DOIS mostradores redondos separados, 1 agulha cada (não 1 c/ 2 agulhas).
  entry('pressao_admissao', Z.motor, 'MP', circ(632, 496, 42), { x: 632, y: 446, anchor: 'middle' }),
  entry('tacometro_duplo', Z.motor, 'RPM L', circ(720, 496, 34), { x: 720, y: 454, anchor: 'middle' }),
  entry('tacometro_direito', Z.motor, 'RPM R', circ(800, 496, 34), { x: 800, y: 454, anchor: 'middle' }),
  entry('fluxo_combustivel_pressao', Z.motor, 'FF/PSI', circ(888, 496, 42), { x: 888, y: 446, anchor: 'middle' }),
  entry('egt', Z.motor, 'EGT', circ(622, 592, 27), { x: 622, y: 628, anchor: 'middle' }),
  entry('pressao_oleo', Z.motor, 'OIL P', circ(686, 592, 27), { x: 686, y: 628, anchor: 'middle' }),
  entry('temperatura_oleo', Z.motor, 'OIL T', circ(750, 592, 27), { x: 750, y: 628, anchor: 'middle' }),
  entry('cht', Z.motor, 'CHT', circ(814, 592, 27), { x: 814, y: 628, anchor: 'middle' }),
  entry('quantidade_combustivel', Z.motor, 'FUEL QTY', circ(878, 592, 27), { x: 878, y: 628, anchor: 'middle' }),
  // ---- Centro — auxiliares à esquerda do stack ----------------------------
  entry('luzes_marker', Z.centroAux, 'MARKER', rect(596, 380, 84, 46), { x: 638, y: 371, anchor: 'middle' }),
  // piloto_automatico realocado abaixo do six-pack (foto PR-FLM) — ver Z.esq mais abaixo.
  // ---- Coluna central de rádios compacta ----------------------------------
  // Coluna de rádios — GNS 530W (proporção real ~2,4:1) + 2º rádio (display
  // âmbar, visível na foto ao lado do GNS) + XPDR, cada um sua própria caixa.
  entry('painel_audio', Z.radios, 'ÁUDIO', rect(700, 140, 274, 36), insideR(rect(700, 140, 274, 36))),
  entry('navcom_1', Z.radios, 'GNS 530W', rect(700, 180, 274, 115), insideR(rect(700, 180, 274, 115))),
  entry('navcom_2', Z.radios, 'NAV/COM 2', rect(700, 299, 274, 38), insideR(rect(700, 299, 274, 38))),
  entry('adf_receptor', Z.radios, 'ADF REC', rect(700, 341, 274, 34), insideR(rect(700, 341, 274, 34))),
  entry('dme', Z.radios, 'DME', rect(700, 379, 274, 30), insideR(rect(700, 379, 274, 30))),
  entry('transponder', Z.radios, 'XPDR', rect(700, 413, 274, 30), insideR(rect(700, 413, 274, 30))),
  // ---- Painel direito — copiloto e auxiliares -----------------------------
  // Six-pack do copiloto com mostradores do mesmo porte dos do piloto (foto PR-FLM).
  entry('instrumentos_copiloto', Z.copiloto, 'COPILOTO', rect(996, 136, 336, 232), { x: 1164, y: 126, anchor: 'middle' }),
  entry('relogio_copiloto_acendedor', Z.copiloto, 'RELÓGIO/12V', rect(1346, 136, 188, 94), { x: 1440, y: 126, anchor: 'middle' }),
  entry('disjuntores', Z.dir, 'DISJUNTORES', rect(1346, 244, 188, 124), { x: 1440, y: 237, anchor: 'middle' }),
  // ---- Painel direito — trem de pouso -------------------------------------
  entry('seletor_trem', Z.trem, 'GEAR SEL', rect(1000, 384, 112, 150), { x: 1056, y: 375, anchor: 'middle' }),
  entry('luzes_trem_verdes', Z.trem, '3 GREEN', rect(1124, 384, 140, 70), { x: 1194, y: 375, anchor: 'middle' }),
  entry('luz_trem_vermelha', Z.trem, 'GEAR WARN', rect(1124, 464, 140, 70), { x: 1194, y: 458, anchor: 'middle' }),
  entry('extensao_emergencia_trem', Z.trem, 'EMERG GEAR', rect(1000, 544, 264, 60), { x: 1132, y: 618, anchor: 'middle' }),
  // Painel anunciador — consolida sinais de aviso hoje dispersos (SOP cita
  // "Caution Lights" perto do trem); não substitui os hotspots originais.
  entry('painel_anunciador', Z.trem, 'CAUTION', rect(1000, 610, 264, 60), { x: 1132, y: 601, anchor: 'middle' }),
  // ---- Painel direito — instrumentos e comandos inferiores ----------------
  entry('amperimetros', Z.dir, 'AMP L–R', circ(1322, 422, 36), { x: 1322, y: 378, anchor: 'middle' }),
  entry('indicador_vacuo', Z.dir, 'SUCÇÃO', circ(1422, 422, 36), { x: 1422, y: 378, anchor: 'middle' }),
  entry('estatica_alternada', Z.dir, 'EST. ALT', rect(1280, 474, 116, 84), { x: 1338, y: 468, anchor: 'middle' }),
  entry('aquecimento_desembacador', Z.dir, 'AQUEC/DESEMB', rect(1408, 474, 126, 84), { x: 1471, y: 468, anchor: 'middle' }),
]

export const PANEL_MAP: Record<string, PanelEntry> = Object.fromEntries(ENTRIES)

// Ordem de tabulação seguindo as zonas do cockpit.md §2
export const PANEL_ORDER: string[] = [
  'bussola_magnetica', 'termometro_oat',
  'relogio', 'adf_indicador', 'aviso_estol',
  'chave_master', 'chaves_alternadores', 'chaves_magnetos_partida',
  'bombas_combustivel_eletricas', 'pitot_heat_luzes', 'freio_estacionamento',
  'velocimetro', 'horizonte_artificial', 'altimetro',
  'coordenador_curva', 'giro_direcional', 'variometro',
  'indicador_vor_1', 'indicador_vor_2_gs', 'avisos_eletricos_vacuo',
  'luzes_marker', 'piloto_automatico',
  'painel_audio', 'navcom_1', 'navcom_2', 'adf_receptor', 'dme', 'transponder',
  'pressao_admissao', 'tacometro_duplo', 'tacometro_direito', 'fluxo_combustivel_pressao',
  'egt', 'pressao_oleo', 'temperatura_oleo', 'cht', 'quantidade_combustivel',
  'instrumentos_copiloto', 'relogio_copiloto_acendedor', 'disjuntores',
  'seletor_trem', 'luzes_trem_verdes', 'luz_trem_vermelha', 'extensao_emergencia_trem', 'painel_anunciador',
  'amperimetros', 'indicador_vacuo', 'estatica_alternada', 'aquecimento_desembacador',
]

// 6 hotspots sugeridos que pulsam em sequência no estado ocioso (cockpit.md §3)
export const SUGGESTED: string[] = [
  'velocimetro',
  'horizonte_artificial',
  'pressao_admissao',
  'tacometro_duplo',
  'tacometro_direito',
  'luzes_trem_verdes',
]

// Tour guiado — 8 paradas no scan do instrutor (cockpit.md §5)
export interface TourStop {
  id: string
  titulo?: string
}
export const TOUR_STOPS: TourStop[] = [
  { id: 'velocimetro' },
  { id: 'horizonte_artificial' },
  { id: 'altimetro' },
  { id: 'giro_direcional' },
  { id: 'variometro' },
  { id: 'pressao_admissao', titulo: 'Manifold & RPM' },
  { id: 'quantidade_combustivel', titulo: 'Combustível' },
  { id: 'luzes_trem_verdes', titulo: 'Anunciadores' },
]

// ---------------------------------------------------------------------------
// Ligações cruzadas do drawer (cockpit.md §4.5)
// ---------------------------------------------------------------------------

export interface RelatedLink {
  label: string
  href: string
  is3d?: boolean
}

interface Related {
  links?: RelatedLink[]
  instruments?: string[] // ids de outros instrumentos do painel
}

const M3D = '/modelo-3d'

// prettier-ignore
export const RELATED: Record<string, Related> = {
  velocimetro: { links: [{ label: 'Tubo de pitot — Modelo 3D', href: `${M3D}?camada=vacuo_pitot&c=tubo_pitot`, is3d: true }, { label: 'V-speeds — Performance', href: '/performance' }], instruments: ['altimetro', 'estatica_alternada'] },
  horizonte_artificial: { links: [{ label: 'Bombas de vácuo — Modelo 3D', href: `${M3D}?camada=vacuo_pitot&c=bombas_vacuo`, is3d: true }], instruments: ['indicador_vacuo', 'giro_direcional'] },
  altimetro: { links: [{ label: 'Tomadas estáticas — Modelo 3D', href: `${M3D}?camada=vacuo_pitot&c=tomadas_estaticas`, is3d: true }], instruments: ['estatica_alternada', 'variometro'] },
  giro_direcional: { instruments: ['bussola_magnetica', 'indicador_vacuo'] },
  coordenador_curva: { instruments: ['horizonte_artificial', 'giro_direcional'] },
  variometro: { instruments: ['altimetro'] },
  bussola_magnetica: { instruments: ['giro_direcional'] },
  relogio: { instruments: ['quantidade_combustivel'] },
  termometro_oat: { links: [{ label: 'Performance & planejamento', href: '/performance' }] },
  pressao_admissao: { links: [{ label: 'Motores — Modelo 3D', href: `${M3D}?camada=motores&c=motor_esquerdo`, is3d: true }], instruments: ['tacometro_duplo'] },
  tacometro_duplo: { links: [{ label: 'Hélices Hartzell — Modelo 3D', href: `${M3D}?camada=motores&c=helice_esquerda`, is3d: true }], instruments: ['pressao_admissao', 'tacometro_direito'] },
  tacometro_direito: { links: [{ label: 'Hélices Hartzell — Modelo 3D', href: `${M3D}?camada=motores&c=helice_direita`, is3d: true }], instruments: ['pressao_admissao', 'tacometro_duplo'] },
  painel_anunciador: { instruments: ['luz_trem_vermelha', 'avisos_eletricos_vacuo', 'amperimetros', 'indicador_vacuo'] },
  fluxo_combustivel_pressao: { links: [{ label: 'Sistema de injeção — Modelo 3D', href: `${M3D}?camada=motores&c=sistema_injecao`, is3d: true }], instruments: ['bombas_combustivel_eletricas', 'egt'] },
  egt: { instruments: ['cht'] },
  pressao_oleo: { links: [{ label: 'Radiador de óleo — Modelo 3D', href: `${M3D}?camada=motores&c=radiador_oleo`, is3d: true }], instruments: ['temperatura_oleo', 'cht'] },
  temperatura_oleo: { instruments: ['pressao_oleo'] },
  cht: { instruments: ['egt'] },
  quantidade_combustivel: { links: [{ label: 'Tanques — Modelo 3D', href: `${M3D}?camada=combustivel&c=tanque_principal_esq`, is3d: true }], instruments: ['relogio'] },
  amperimetros: { links: [{ label: 'Alternadores — Modelo 3D', href: `${M3D}?camada=eletrico&c=alternadores`, is3d: true }], instruments: ['chaves_alternadores', 'avisos_eletricos_vacuo'] },
  indicador_vacuo: { links: [{ label: 'Sistema de vácuo — Modelo 3D', href: `${M3D}?camada=vacuo_pitot&c=indicador_succao_comp`, is3d: true }], instruments: ['horizonte_artificial', 'avisos_eletricos_vacuo'] },
  indicador_vor_1: { instruments: ['navcom_1', 'indicador_vor_2_gs'] },
  indicador_vor_2_gs: { instruments: ['navcom_2', 'luzes_marker'] },
  adf_indicador: { instruments: ['adf_receptor'] },
  luzes_marker: { instruments: ['indicador_vor_2_gs'] },
  navcom_1: { instruments: ['indicador_vor_1', 'painel_audio'] },
  navcom_2: { instruments: ['indicador_vor_2_gs', 'painel_audio'] },
  adf_receptor: { instruments: ['adf_indicador', 'painel_audio'] },
  dme: { instruments: ['navcom_1'] },
  transponder: { links: [{ label: 'Antenas — Modelo 3D', href: `${M3D}?camada=avionics_cabine&c=antenas`, is3d: true }], instruments: ['painel_audio'] },
  painel_audio: { instruments: ['navcom_1'] },
  piloto_automatico: { links: [{ label: 'Sistemas — SOP 08', href: '/sistemas' }] },
  seletor_trem: { links: [{ label: 'Trem de pouso — Modelo 3D', href: `${M3D}?camada=trem_pouso&c=bomba_hidraulica_trem`, is3d: true }], instruments: ['luzes_trem_verdes', 'extensao_emergencia_trem'] },
  luzes_trem_verdes: { instruments: ['seletor_trem', 'luz_trem_vermelha'] },
  luz_trem_vermelha: { instruments: ['seletor_trem', 'pressao_admissao'] },
  extensao_emergencia_trem: { links: [{ label: 'Extensão de emergência — Modelo 3D', href: `${M3D}?camada=trem_pouso&c=sistema_emergencia`, is3d: true }], instruments: ['seletor_trem'] },
  freio_estacionamento: { links: [{ label: 'Freios — Modelo 3D', href: `${M3D}?camada=trem_pouso&c=freios`, is3d: true }] },
  chave_master: { links: [{ label: 'Bateria — Modelo 3D', href: `${M3D}?camada=eletrico&c=bateria`, is3d: true }], instruments: ['aviso_estol', 'amperimetros'] },
  chaves_alternadores: { instruments: ['amperimetros', 'avisos_eletricos_vacuo'] },
  chaves_magnetos_partida: { links: [{ label: 'Magnetos — Modelo 3D', href: `${M3D}?camada=motores&c=governadores_magnetos`, is3d: true }], instruments: ['chave_master'] },
  bombas_combustivel_eletricas: { links: [{ label: 'Bombas elétricas — Modelo 3D', href: `${M3D}?camada=combustivel&c=bombas_eletricas`, is3d: true }], instruments: ['fluxo_combustivel_pressao'] },
  pitot_heat_luzes: { instruments: ['velocimetro', 'aviso_estol'] },
  estatica_alternada: { links: [{ label: 'Estática alternada — Modelo 3D', href: `${M3D}?camada=vacuo_pitot&c=estatica_alternada_comp`, is3d: true }], instruments: ['altimetro', 'velocimetro'] },
  disjuntores: { links: [{ label: 'Barramento e disjuntores — Modelo 3D', href: `${M3D}?camada=eletrico&c=barramento_disjuntores`, is3d: true }] },
  aquecimento_desembacador: { links: [{ label: 'Aquecimento e ventilação — Modelo 3D', href: `${M3D}?camada=avionics_cabine&c=aquecimento_ventilacao`, is3d: true }] },
  aviso_estol: { links: [{ label: 'Emergências — SOP 12', href: '/emergencias' }], instruments: ['pitot_heat_luzes', 'chave_master'] },
  avisos_eletricos_vacuo: { instruments: ['chaves_alternadores', 'indicador_vacuo'] },
  relogio_copiloto_acendedor: { instruments: ['amperimetros', 'relogio'] },
  instrumentos_copiloto: { links: [{ label: 'Six-pack do piloto — Modelo 3D', href: `${M3D}?camada=avionics_cabine&c=seis_pack_piloto`, is3d: true }], instruments: ['horizonte_artificial', 'indicador_vacuo'] },
}

// ---------------------------------------------------------------------------
// Acessos utilitários
// ---------------------------------------------------------------------------

export const instrumentById: Record<string, InstrumentoCockpit> = Object.fromEntries(
  instrumentosCockpit.map((i) => [i.id, i]),
)

export const REFERENCIA = cockpitData.referencia
export const OBSERVACOES = cockpitData.observacoes
export const AERONAVE = cockpitData.aeronave

export function shapeCenter(s: HotspotShape): { x: number; y: number } {
  return s.kind === 'circle' ? { x: s.cx, y: s.cy } : { x: s.x + s.w / 2, y: s.y + s.h / 2 }
}

export function shapeBBox(s: HotspotShape): { x: number; y: number; w: number; h: number } {
  return s.kind === 'circle'
    ? { x: s.cx - s.r, y: s.cy - s.r, w: s.r * 2, h: s.r * 2 }
    : { x: s.x, y: s.y, w: s.w, h: s.h }
}

/** Normaliza id vindo da URL (aceita hífens) e valida contra o JSON. */
export function resolveInstrumentId(raw: string | null): string | null {
  if (!raw) return null
  const norm = raw.trim().toLowerCase().replace(/-/g, '_')
  return instrumentById[norm] ? norm : null
}
