// Vista 3 faces (perfil, frontal, planta) do PA-34 Seneca I — estilo blueprint.
// Geometria REAL extraída do modelo 3D do site (PA34-200T, projeção ortográfica
// com remoção de linhas ocultas — ver PA34ThreeViewData.ts). Escala uniforme
// 56 px/m; cotas nominais do POH. viewBox 1600×1060.
// Aceita `progress` (MotionValue 0..1) para stroke-draw por scroll (home §5);
// sem `progress`, renderiza estático.

import { motion, useMotionValue, useTransform } from 'framer-motion'
import type { MotionValue } from 'framer-motion'
import { TV, TV_EXTRAS } from './PA34ThreeViewData'
import type { TvGroup } from './PA34ThreeViewData'

interface Props {
  progress?: MotionValue<number>
  className?: string
  /** parte em glow cyan (hover das labels na home §5) */
  glow?: 'helice' | 'trem' | 'tanques' | null
}

const GLOW = 'drop-shadow(0 0 7px rgb(var(--c-cyan) / 0.95))'
const GROUPS: TvGroup[] = ['corpo', 'tanques', 'helice', 'trem']

/** uma vista: silhueta (traço forte) + arestas vivas (traço fino), por grupo */
function ViewPaths({ view, p, glow }: { view: keyof typeof TV; p: MotionValue<number>; glow: Props['glow'] }) {
  const v = TV[view]
  return (
    <>
      {GROUPS.map((g) => (
        <motion.path
          key={`f-${g}`}
          d={v.feat[g]}
          pathLength={1}
          stroke="rgb(var(--c-cyan))"
          strokeWidth={0.7}
          strokeOpacity={0.75}
          style={{ pathLength: p, opacity: p, filter: glow === g ? GLOW : 'none' }}
        />
      ))}
      {GROUPS.map((g) => (
        <motion.path
          key={`s-${g}`}
          d={v.sil[g]}
          pathLength={1}
          stroke="rgb(var(--c-cyan-hi))"
          strokeWidth={1.5}
          style={{ pathLength: p, opacity: p, filter: glow === g ? GLOW : 'none' }}
        />
      ))}
    </>
  )
}

export default function PA34ThreeView({ progress, className, glow = null }: Props) {
  const fallback = useMotionValue(1)
  const p = progress ?? fallback
  // Cada vista se desenha numa fatia do progresso
  const pSide = useTransform(p, [0, 0.4], [0, 1], { clamp: true })
  const pFront = useTransform(p, [0.2, 0.62], [0, 1], { clamp: true })
  const pTop = useTransform(p, [0.42, 0.88], [0, 1], { clamp: true })
  const pDim = useTransform(p, [0.82, 1], [0, 1], { clamp: true })

  return (
    <svg viewBox="0 0 1600 1060" fill="none" className={className} role="img" aria-label="Vista em três faces do PA-34 Seneca I — geometria real">
      {/* ============ PERFIL (superior esquerdo) ============ */}
      <g strokeLinejoin="round" strokeLinecap="round">
        <ViewPaths view="perfil" p={pSide} glow={glow} />
        {/* disco de hélice (tracejado) + cubo */}
        <motion.line
          x1={TV_EXTRAS.discosLinhas[0].x1} y1={TV_EXTRAS.discosLinhas[0].y1}
          x2={TV_EXTRAS.discosLinhas[0].x2} y2={TV_EXTRAS.discosLinhas[0].y2}
          stroke="rgb(var(--c-cyan))" strokeWidth={0.9} strokeDasharray="7 9" strokeOpacity={0.5}
          pathLength={1} style={{ pathLength: pSide, opacity: pSide, filter: glow === 'helice' ? GLOW : 'none' }}
        />
        <motion.circle
          cx={TV_EXTRAS.hubPerfil.cx} cy={TV_EXTRAS.hubPerfil.cy} r={TV_EXTRAS.hubPerfil.r}
          stroke="rgb(var(--c-cyan-hi))" strokeWidth={1.2}
          pathLength={1} style={{ pathLength: pSide, opacity: pSide, filter: glow === 'helice' ? GLOW : 'none' }}
        />
      </g>

      {/* ============ FRONTAL (superior direito) ============ */}
      <g strokeLinejoin="round" strokeLinecap="round">
        <ViewPaths view="frontal" p={pFront} glow={glow} />
        {TV_EXTRAS.discosCirculos.map((c) => (
          <motion.circle
            key={c.cx}
            cx={c.cx} cy={c.cy} r={c.r}
            stroke="rgb(var(--c-cyan))" strokeWidth={0.9} strokeDasharray="7 9" strokeOpacity={0.5}
            pathLength={1} style={{ pathLength: pFront, opacity: pFront, filter: glow === 'helice' ? GLOW : 'none' }}
          />
        ))}
      </g>

      {/* ============ PLANTA (inferior esquerdo) ============ */}
      <g strokeLinejoin="round" strokeLinecap="round">
        <ViewPaths view="planta" p={pTop} glow={glow} />
        {TV_EXTRAS.discosLinhas.slice(1).map((l) => (
          <motion.line
            key={l.y1}
            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke="rgb(var(--c-cyan))" strokeWidth={0.9} strokeDasharray="7 9" strokeOpacity={0.5}
            pathLength={1} style={{ pathLength: pTop, opacity: pTop, filter: glow === 'helice' ? GLOW : 'none' }}
          />
        ))}
      </g>

      {/* ============ LINHAS DE SOLO ============ */}
      {TV_EXTRAS.solo.map((l) => (
        <motion.line
          key={l.x1}
          x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke="rgb(var(--c-faint))" strokeWidth={1} strokeDasharray="2 7"
          pathLength={1} style={{ pathLength: pDim, opacity: pDim }}
        />
      ))}

      {/* ============ COTAS + RÓTULOS + BLOCO DE TÍTULO ============ */}
      <g stroke="rgb(var(--c-faint))" strokeWidth={1} fontFamily="'IBM Plex Mono', monospace">
        {/* comprimento — sob o perfil */}
        <motion.g style={{ opacity: pDim }}>
          <path d="M 90 296 L 90 336 M 570 296 L 570 336 M 86 330 L 574 330" />
          <path d="M 86 330 L 100 326 M 86 330 L 100 334 M 574 330 L 560 326 M 574 330 L 560 334" />
          <text x="330" y="322" fill="rgb(var(--c-muted))" fontSize="16" textAnchor="middle" stroke="none" letterSpacing="2">COMPRIMENTO 8,72 m</text>
        </motion.g>
        {/* altura — entre perfil e frontal */}
        <motion.g style={{ opacity: pDim }}>
          <path d="M 668 290 L 706 290 M 668 117 L 706 117 M 700 294 L 700 113" />
          <path d="M 700 294 L 696 280 M 700 294 L 704 280 M 700 113 L 696 127 M 700 113 L 704 127" />
          <text x="676" y="204" fill="rgb(var(--c-muted))" fontSize="16" textAnchor="middle" stroke="none" letterSpacing="2" transform="rotate(-90 676 204)">ALTURA 3,02 m</text>
        </motion.g>
        {/* envergadura — à esquerda da planta */}
        <motion.g style={{ opacity: pDim }}>
          <path d="M 66 380 L 30 380 M 66 1036 L 30 1036 M 52 376 L 52 1040" />
          <path d="M 52 376 L 48 390 M 52 376 L 56 390 M 52 1040 L 48 1026 M 52 1040 L 56 1026" />
          <text x="34" y="708" fill="rgb(var(--c-muted))" fontSize="16" textAnchor="middle" stroke="none" letterSpacing="2" transform="rotate(-90 34 708)">ENVERGADURA 11,86 m</text>
        </motion.g>
        {/* rótulos das vistas */}
        <motion.g style={{ opacity: pDim }} fontSize="14" fill="rgb(var(--c-faint))" stroke="none" letterSpacing="4">
          <text x="90" y="100">PERFIL</text>
          <text x="747" y="100">FRONTAL</text>
          <text x="90" y="362">PLANTA</text>
        </motion.g>
        {/* bloco de título (canto inferior direito) */}
        <motion.g style={{ opacity: pDim }} stroke="none">
          <text x="747" y="440" fill="rgb(var(--c-ink))" fontSize="24" letterSpacing="5">PA-34-200 SENECA I</text>
          <text x="747" y="468" fill="rgb(var(--c-cyan))" fontSize="13" letterSpacing="3">VISTAS TÉCNICAS — GEOMETRIA REAL DO MODELO 3D</text>
          <path d="M 747 488 L 1510 488" stroke="rgb(var(--c-cyan-dim))" strokeWidth={1} />
          <g fill="rgb(var(--c-muted))" fontSize="12" letterSpacing="2">
            <text x="747" y="516">PROJEÇÃO ORTOGRÁFICA · REMOÇÃO DE LINHAS OCULTAS</text>
            <text x="747" y="540">ESCALA GRÁFICA UNIFORME NAS 3 VISTAS</text>
            <text x="747" y="564">COTAS NOMINAIS: POH PIPER PA-34-200</text>
            <text x="747" y="588">GEOMETRIA: PA34-200T · FLIGHTGEAR FGADDON · GPL-2.0</text>
          </g>
          {/* barra de escala 0—2 m */}
          <g stroke="rgb(var(--c-faint))" strokeWidth={1}>
            <path d="M 747 636 L 859 636 M 747 630 L 747 642 M 803 630 L 803 642 M 859 630 L 859 642" />
          </g>
          <g fill="rgb(var(--c-faint))" fontSize="11" letterSpacing="1" textAnchor="middle">
            <text x="747" y="656">0</text>
            <text x="803" y="656">1</text>
            <text x="859" y="656">2 m</text>
          </g>
        </motion.g>
      </g>
    </svg>
  )
}
