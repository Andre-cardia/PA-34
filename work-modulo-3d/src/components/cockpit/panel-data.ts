// panel-data — mapa geométrico do painel (PANEL_MAP), ordem de tabulação por
// zonas, categorias, tour guiado e ligações cruzadas (cockpit.md §2).
// Layout canônico medido sobre a foto PR-FLM (`blender/cockpit/referencia/
// painel-real-prflm.png`, 1024×640) retificada em vista frontal: x ≈ 1,56·xFoto + 10,
// y ≈ 1,6·yFoto. Cada hotspot fica sobre o componente real correspondente da foto;
// IDs preservados (deep-links ?i=), posições reagrupadas conforme a foto.

import { cockpitData, instrumentosCockpit } from '@/data'
import type { InstrumentoCockpit } from '@/data'

export const VB_W = 1600
export const VB_H = 960

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
  /** Mostradores internos (jogo do copiloto): arte e geometria Blender usam os mesmos. */
  parts?: HotspotCircle[]
}

const Z = {
  sixpack: 'PAINEL ESQ · SIX-PACK',
  esq: 'PAINEL ESQ · AUXILIARES',
  topo: 'TOPO · PLACAS E AVISOS',
  glare: 'GLARESHIELD',
  stack: 'CENTRO · STACK DE RÁDIOS',
  stackDir: 'CENTRO · ÁUDIO/XPDR/ADF',
  faixa: 'FAIXA DE ANUNCIADORES',
  motor: 'FAIXA CREME · MOTOR',
  ap: 'FAIXA CREME · PILOTO AUTOMÁTICO',
  pedestal: 'PEDESTAL · QUADRANTE',
  trem: 'FAIXA CREME · TREM DE POUSO',
  copiloto: 'PAINEL DIR · COPILOTO',
  dir: 'FAIXA CREME · DIREITA',
  lateral: 'PAINEL LATERAL ESQ · INTERRUPTORES',
} as const

const circ = (cx: number, cy: number, r: number): HotspotCircle => ({ kind: 'circle', cx, cy, r })
const rect = (x: number, y: number, w: number, h: number): HotspotRect => ({ kind: 'rect', x, y, w, h })
type Label = { x: number; y: number; anchor: 'start' | 'middle' | 'end' }
const above = (s: HotspotShape, dy = 6): Label =>
  s.kind === 'circle'
    ? { x: s.cx, y: s.cy - s.r - dy, anchor: 'middle' }
    : { x: s.x + s.w / 2, y: s.y - dy, anchor: 'middle' }
const below = (s: HotspotShape, dy = 12): Label =>
  s.kind === 'circle'
    ? { x: s.cx, y: s.cy + s.r + dy, anchor: 'middle' }
    : { x: s.x + s.w / 2, y: s.y + s.h + dy, anchor: 'middle' }
const right = (s: HotspotShape, dx = 6): Label =>
  s.kind === 'circle'
    ? { x: s.cx + s.r + dx, y: s.cy + 3, anchor: 'start' }
    : { x: s.x + s.w + dx, y: s.y + s.h / 2 + 3, anchor: 'start' }
const left = (s: HotspotShape, dx = 6): Label =>
  s.kind === 'circle'
    ? { x: s.cx - s.r - dx, y: s.cy + 3, anchor: 'end' }
    : { x: s.x - dx, y: s.y + s.h / 2 + 3, anchor: 'end' }
const insideR = (s: HotspotRect, dy = 0): Label => ({ x: s.x + s.w - 6, y: s.y + 10 + dy, anchor: 'end' })

function entry(id: string, zone: string, tag: string, shape: HotspotShape, place: (s: HotspotShape) => Label = above): [string, PanelEntry] {
  return [id, { id, zone, tag, shape, label: place(shape) }]
}

// Jogo do copiloto como na foto: ASI, AI, ALT (este mais baixo, junto ao
// glareshield); TC, DG com avião laranja, VSI. Mesmo porte do jogo do piloto.
export const COPILOTO_PARTS: HotspotCircle[] = [
  circ(1210, 192, 44), // ASI
  circ(1306, 178, 40), // AI
  circ(1420, 240, 44), // ALT
  circ(1196, 314, 44), // TC
  circ(1302, 316, 42), // DG
  circ(1372, 344, 32), // VSI
]

// Coordenadas medidas sobre a foto PR-FLM (ver cabeçalho). O teste e2e
// (cockpit-painel.spec.ts) confere, com elementFromPoint, que o centro de cada
// hotspot devolve o próprio hotspot (nenhum vizinho o encobre).
// prettier-ignore
const ENTRIES: [string, PanelEntry][] = [
  // ---- Topo: bússola no arco do para-brisa, avisos junto às placas ----------
  entry('bussola_magnetica', Z.glare, 'BÚSSOLA', rect(732, 10, 58, 58), right),
  entry('luz_trem_vermelha', Z.topo, 'GEAR WARN', rect(478, 128, 28, 26)),
  entry('painel_anunciador', Z.topo, 'CAUTION', rect(568, 109, 97, 45)),
  // ---- Painel do piloto — coluna auxiliar esquerda --------------------------
  entry('aviso_estol', Z.esq, 'STALL', circ(200, 171, 9)),
  entry('relogio', Z.esq, 'RELÓGIO', circ(186, 236, 28), left),
  entry('termometro_oat', Z.esq, 'OAT', circ(182, 331, 37), left),
  // ---- Six-pack do piloto: ASI, AI, ALT, CDI/GS (fiada de cima) --------------
  entry('velocimetro', Z.sixpack, 'ASI', circ(275, 221, 46)),
  entry('horizonte_artificial', Z.sixpack, 'AI', circ(384, 208, 44)),
  entry('altimetro', Z.sixpack, 'ALT', circ(500, 206, 47)),
  entry('indicador_vor_1', Z.sixpack, 'OBS 1', circ(606, 208, 47)),
  // ---- Fiada de baixo: TC, HSI quadrado, VSI e o furo vago (ADF) -------------
  entry('coordenador_curva', Z.sixpack, 'TC', circ(288, 334, 44), below),
  entry('giro_direcional', Z.sixpack, 'HSI/DG', rect(341, 280, 106, 104), below),
  entry('variometro', Z.sixpack, 'VSI', circ(501, 328, 45), below),
  entry('adf_indicador', Z.sixpack, 'ADF', circ(607, 330, 47), below),
  // ---- Stack central: áudio, GNS colorido (CDI/DME na régua), NAV/COM 2 ------
  entry('painel_audio', Z.stack, 'ÁUDIO', rect(696, 117, 200, 43)),
  entry('navcom_1', Z.stack, 'GNS 530W', rect(696, 163, 200, 133), (s) => insideR(s as HotspotRect)),
  entry('indicador_vor_2_gs', Z.stack, 'CDI 2/GS', rect(696, 299, 98, 16), below),
  entry('dme', Z.stack, 'DME', rect(798, 299, 98, 16), below),
  entry('navcom_2', Z.stack, 'NAV/COM 2', rect(696, 319, 200, 62), (s) => insideR(s as HotspotRect)),
  // ---- Stack direito: marker/áudio, transponder laranja, ADF -----------------
  entry('luzes_marker', Z.stackDir, 'MARKER', rect(910, 110, 215, 44)),
  entry('transponder', Z.stackDir, 'XPDR', rect(910, 158, 215, 60), (s) => insideR(s as HotspotRect)),
  entry('adf_receptor', Z.stackDir, 'ADF REC', rect(910, 222, 215, 58), (s) => insideR(s as HotspotRect)),
  // ---- Painel do copiloto ---------------------------------------------------
  // Topo em y=170: os quatro cantos ficam dentro de PLATES.painel (GLARE_CONTOUR
  // passa por y≈167,8 em x=1468).
  ['instrumentos_copiloto', { ...entry('instrumentos_copiloto', Z.copiloto, 'COPILOTO', rect(1150, 170, 318, 208))[1], parts: COPILOTO_PARTS }],
  entry('relogio_copiloto_acendedor', Z.copiloto, 'RELÓGIO/12V', rect(1472, 226, 72, 146)),
  // ---- Faixa escura de anunciadores (mini-mostradores e placas) --------------
  entry('pressao_oleo', Z.faixa, 'OIL P', rect(141, 413, 115, 38)),
  entry('temperatura_oleo', Z.faixa, 'OIL T', rect(260, 413, 115, 38)),
  entry('fluxo_combustivel_pressao', Z.faixa, 'FF/PSI', rect(462, 413, 122, 38)),
  entry('cht', Z.faixa, 'CHT', rect(589, 413, 123, 38)),
  entry('amperimetros', Z.faixa, 'AMP L–R', rect(910, 403, 108, 56)),
  entry('indicador_vacuo', Z.faixa, 'SUCÇÃO', circ(1052, 429, 31)),
  entry('egt', Z.faixa, 'EGT', circ(1146, 429, 31)),
  entry('aquecimento_desembacador', Z.faixa, 'AQUEC/DESEMB', rect(1289, 406, 172, 58)),
  // ---- Faixa creme: piloto automático, motor ---------------------------------
  entry('piloto_automatico', Z.ap, 'AP', rect(186, 509, 108, 59), below),
  entry('avisos_eletricos_vacuo', Z.ap, 'OV/VAC', rect(330, 552, 31, 32), below),
  entry('pressao_admissao', Z.motor, 'MP', circ(462, 539, 44), below),
  entry('tacometro_duplo', Z.motor, 'RPM L', circ(559, 536, 44), below),
  entry('tacometro_direito', Z.motor, 'RPM R', circ(659, 534, 44), below),
  // ---- Trem de pouso (à esquerda do quadrante) ------------------------------
  entry('luzes_trem_verdes', Z.trem, '3 GREEN', rect(707, 469, 49, 20)),
  entry('seletor_trem', Z.trem, 'GEAR SEL', rect(708, 494, 48, 80), left),
  entry('extensao_emergencia_trem', Z.trem, 'EMERG GEAR', rect(700, 582, 55, 46), left),
  // ---- Pedestal: quadrante de 6 manetes, ALT AIR, COWL FLAP ------------------
  entry('manetes_potencia', Z.pedestal, 'POTÊNCIA', rect(762, 482, 54, 124)),
  entry('manetes_helice', Z.pedestal, 'HÉLICE', rect(820, 482, 54, 124)),
  entry('manetes_mistura', Z.pedestal, 'MISTURA', rect(878, 482, 54, 124)),
  entry('ar_alternativo', Z.pedestal, 'ALT AIR', rect(762, 614, 172, 44), below),
  entry('cowl_flaps', Z.pedestal, 'COWL FLAP', rect(746, 712, 160, 110), right),
  // ---- Faixa creme à direita: estática, combustível, disjuntores -------------
  entry('estatica_alternada', Z.dir, 'EST. ALT', rect(938, 480, 66, 99), below),
  entry('quantidade_combustivel', Z.dir, 'FUEL QTY', circ(1055, 528, 44), below),
  entry('disjuntores', Z.dir, 'DISJUNTORES', rect(1118, 483, 328, 87), below),
  // ---- Console lateral esquerdo (junto à porta) e freio ----------------------
  entry('chave_master', Z.lateral, 'MASTER', rect(13, 464, 78, 51), right),
  entry('chaves_alternadores', Z.lateral, 'ALT L–R', rect(13, 522, 78, 51), right),
  entry('chaves_magnetos_partida', Z.lateral, 'MAG/START', rect(13, 579, 78, 64), right),
  entry('bombas_combustivel_eletricas', Z.lateral, 'FUEL PUMPS', rect(13, 650, 78, 51), right),
  entry('pitot_heat_luzes', Z.lateral, 'PITOT/LUZES', rect(13, 707, 78, 51), right),
  entry('freio_estacionamento', Z.ap, 'FREIO EST.', rect(140, 604, 82, 46), below),
]

export const PANEL_MAP: Record<string, PanelEntry> = Object.fromEntries(ENTRIES)

// Ordem de tabulação seguindo as zonas do cockpit.md §2
export const PANEL_ORDER: string[] = [
  'bussola_magnetica', 'luz_trem_vermelha', 'painel_anunciador',
  'aviso_estol', 'relogio', 'termometro_oat',
  'velocimetro', 'horizonte_artificial', 'altimetro', 'indicador_vor_1',
  'coordenador_curva', 'giro_direcional', 'variometro', 'adf_indicador',
  'painel_audio', 'navcom_1', 'indicador_vor_2_gs', 'dme', 'navcom_2',
  'luzes_marker', 'transponder', 'adf_receptor',
  'instrumentos_copiloto', 'relogio_copiloto_acendedor',
  'pressao_oleo', 'temperatura_oleo', 'fluxo_combustivel_pressao', 'cht',
  'amperimetros', 'indicador_vacuo', 'egt', 'aquecimento_desembacador',
  'piloto_automatico', 'avisos_eletricos_vacuo',
  'pressao_admissao', 'tacometro_duplo', 'tacometro_direito',
  'luzes_trem_verdes', 'seletor_trem', 'extensao_emergencia_trem',
  'manetes_potencia', 'manetes_helice', 'manetes_mistura', 'ar_alternativo', 'cowl_flaps',
  'estatica_alternada', 'quantidade_combustivel', 'disjuntores',
  'chave_master', 'chaves_alternadores', 'chaves_magnetos_partida',
  'bombas_combustivel_eletricas', 'pitot_heat_luzes', 'freio_estacionamento',
]

// ---------------------------------------------------------------------------
// Chapas do painel (frontal, mesmo sistema de coordenadas dos hotspots)
// Polígonos medidos sobre a foto; o fallback vetorial e o Blender usam estes.
// ---------------------------------------------------------------------------

export type Pt = [number, number]

function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, n = 18): Pt[] {
  const out: Pt[] = []
  for (let i = 0; i < n; i++) {
    const t = i / n
    const u = 1 - t
    out.push([
      Math.round((u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0]) * 10) / 10,
      Math.round((u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]) * 10) / 10,
    ])
  }
  return out
}

/**
 * Contorno superior do glareshield (esquerda → direita), simétrico. Rodada 2:
 * cantos mais fechados que descem até y≈340 junto às laterais, como na foto; o
 * acolchoado é desenhado mais alto (traço grosso) sobre esta linha.
 */
export const GLARE_CONTOUR: Pt[] = [
  ...cubic([12, 340], [12, 230], [110, 150], [280, 121]),
  ...cubic([280, 121], [382, 104], [620, 86], [800, 86]),
  ...cubic([800, 86], [980, 86], [1218, 104], [1320, 121]),
  ...cubic([1320, 121], [1490, 150], [1588, 230], [1588, 340]),
  [1588, 340],
]

export const PLATES = {
  /** Chapa preta acetinada (inclui a faixa escura de anunciadores até y=472). */
  painel: [...GLARE_CONTOUR, [1582, 384], [1576, 472], [24, 472], [18, 384]] as Pt[],
  /** Faixa escura de anunciadores entre os frisos cromados. */
  faixaEscura: [[24, 384], [1576, 384], [1576, 472], [24, 472]] as Pt[],
  /** Subchapa rebaixada do six-pack do piloto. */
  sixpack: [[224, 154], [666, 154], [666, 392], [224, 392]] as Pt[],
  /** Subchapa do copiloto. */
  copiloto: [[1142, 126], [1470, 126], [1470, 382], [1142, 382]] as Pt[],
  /** Baia cinza-grafite do stack de rádios. */
  stack: [[686, 104], [1134, 104], [1134, 384], [686, 384]] as Pt[],
  /** Faixa inferior creme em relevo (degrau à esquerda para piloto automático e freio). */
  faixaCreme: [[100, 472], [1548, 472], [1548, 598], [100, 598]] as Pt[],
  /**
   * Pedestal creme: quadrante e ALT AIR em cima; pescoço chanfrado; parte
   * inferior (cowl flap e placas) mais estreita, descendo até a borda (foto).
   */
  pedestal: [[748, 472], [944, 472], [944, 604], [922, 640], [920, 694], [906, 708], [904, 960], [742, 960], [740, 708], [734, 694], [734, 640], [742, 604]] as Pt[],
  /** Degrau do pedestal onde ficam as bolas dos cowl flaps (foto). */
  pedestalDegrau: [[740, 708], [906, 708], [904, 724], [742, 724]] as Pt[],
  /** Parede lateral esquerda creme em perspectiva (atrás do console). */
  paredeEsq: [[0, 316], [12, 340], [18, 384], [24, 472], [100, 472], [100, 598], [152, 606], [118, 640], [0, 664]] as Pt[],
  /** Parede lateral direita creme em perspectiva. */
  paredeDir: [[1600, 316], [1588, 340], [1582, 384], [1576, 472], [1548, 472], [1548, 598], [1500, 606], [1530, 640], [1600, 664]] as Pt[],
  /**
   * Console lateral esquerdo dos interruptores, creme e inclinado: a borda
   * junto à porta (esquerda) é mais alta que a borda junto ao painel.
   */
  consoleLateral: [[2, 444], [100, 458], [106, 768], [2, 792]] as Pt[],
}

/** Frisos cromados horizontais da faixa de anunciadores. */
export const TRIMS: [number, number, number][] = [
  [24, 1576, 384],
  [24, 1576, 472],
]

/** Placas impressas sobre a chapa (texto copiado da foto; valores já existentes nos dados). */
export interface Placard {
  x: number
  y: number
  w: number
  h: number
  lines: string[]
  tone?: 'black' | 'blackBright' | 'white' | 'silver'
}
export const PLACARDS: Placard[] = [
  { x: 306, y: 136, w: 56, h: 26, lines: ['MIN. SINGLE ENGINE', 'CONTROL SPEED', '80 M.P.H.'] },
  { x: 368, y: 124, w: 66, h: 34, lines: ['BEST SINGLE ENGINE', 'RATE OF CLIMB', 'SPEED', '105 M.P.H.'] },
  { x: 524, y: 114, w: 36, h: 16, lines: ['PR-FLM'], tone: 'white' },
  // Placa de limites do trem: preta com letras brancas, como na foto.
  { x: 930, y: 288, w: 190, h: 52, lines: ['GEAR DOWN     150 MPH MAX', 'GEAR UP       125 MPH MAX', 'EXTENDED      150 MPH MAX'], tone: 'blackBright' },
  { x: 930, y: 346, w: 190, h: 16, lines: ['WARNING — THIS AIRCRAFT IS NOT APPROVED', 'FOR FLIGHT IN ICING CONDITIONS'] },
  { x: 930, y: 366, w: 190, h: 14, lines: ['SEE AIRPLANE FLIGHT MANUAL'] },
  { x: 556, y: 452, w: 156, h: 17, lines: ['LANDING: GEAR DOWN 3 GREEN · MIXTURE RICH', 'PROPELLER FULL FORWARD · FUEL PUMPS ON'] },
  { x: 1121, y: 574, w: 122, h: 18, lines: ['ALL CIRCUIT BREAKERS', 'PUSH TO RESET'] },
  // Horímetro no centro da faixa escura (só arte, sem ID; ver HORIMETRO).
  { x: 640, y: 584, w: 56, h: 16, lines: ['EMERGENCY GEAR', 'PULL TO RELEASE'] },
]

/**
 * Mostrador redondo no centro da faixa escura, sob o stack (foto): contador
 * digital em caixa de aro vinho, com cara de horímetro (Hobbs). Nenhum dos 54
 * IDs corresponde a ele; é desenhado só como arte, sem hotspot.
 */
export const HORIMETRO = { plate: { x: 728, y: 392, w: 166, h: 74 }, cx: 811, cy: 430, r: 31 }

/** Fixadores da chapa (fallback vetorial e Blender usam a mesma lista). */
export const PLATE_SCREWS: Pt[] = [[232, 162], [658, 162], [232, 384], [658, 384], [1150, 134], [1440, 166], [1150, 374], [1462, 374], [110, 590], [1540, 590], [754, 690], [930, 650]]

/** Base do pedestal (foto, sem texto legível): placa preta e alavanca. Só arte, sem ID. */
export const PEDESTAL_BASE = {
  placa: { x: 784, y: 862, w: 70, h: 21 },
  alavanca: { x: 826, y: 908, w: 24, h: 52 },
  punho: { x: 830, y: 902, w: 16, h: 12 },
}

function inPolygon(x: number, y: number, poly: Pt[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** Ponto sobre uma superfície creme (rótulos trocam de cor para contraste). */
export function isOverCream(x: number, y: number): boolean {
  return [PLATES.faixaCreme, PLATES.pedestal, PLATES.consoleLateral, PLATES.paredeEsq, PLATES.paredeDir].some((p) => inPolygon(x, y, p))
}

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
// Scan da foto: six-pack do piloto (T básico), depois a faixa creme de motor e
// o quadrante, terminando nas luzes de trem junto à manete de potência.
export const TOUR_STOPS: TourStop[] = [
  { id: 'velocimetro' },
  { id: 'horizonte_artificial' },
  { id: 'altimetro' },
  { id: 'giro_direcional' },
  { id: 'variometro' },
  { id: 'pressao_admissao', titulo: 'Manifold & RPM' },
  { id: 'manetes_potencia', titulo: 'Quadrante de manetes' },
  { id: 'luzes_trem_verdes', titulo: 'Trem baixado e travado' },
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
  manetes_potencia: { links: [{ label: 'Motores — Modelo 3D', href: `${M3D}?camada=motores&c=motor_esquerdo`, is3d: true }], instruments: ['pressao_admissao', 'manetes_helice', 'manetes_mistura', 'luzes_trem_verdes'] },
  manetes_helice: { links: [{ label: 'Hélices Hartzell — Modelo 3D', href: `${M3D}?camada=motores&c=helice_esquerda`, is3d: true }, { label: 'Hélice de velocidade constante — Sistemas', href: '/sistemas' }], instruments: ['tacometro_duplo', 'tacometro_direito', 'manetes_potencia'] },
  manetes_mistura: { links: [{ label: 'Sistema de injeção — Modelo 3D', href: `${M3D}?camada=motores&c=sistema_injecao`, is3d: true }], instruments: ['fluxo_combustivel_pressao', 'egt', 'manetes_potencia'] },
  ar_alternativo: { links: [{ label: 'Admissão de ar alternativo — Modelo 3D', href: `${M3D}?camada=motores&c=admissao_ar_alternativo`, is3d: true }], instruments: ['pressao_admissao', 'tacometro_duplo'] },
  cowl_flaps: { links: [{ label: 'Cowl flaps — Modelo 3D', href: `${M3D}?camada=motores&c=cowl_flaps_comp`, is3d: true }], instruments: ['cht', 'temperatura_oleo'] },
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
