// Silhueta de vista superior do PA-34 Seneca I — GEOMETRIA REAL (mesma planta
// do PA34ThreeView: projeção ortográfica do modelo 3D, escala 56 px/m).
// Usada como watermark em heros e seções (stroke = currentColor).

import { TV, TV_EXTRAS } from './PA34ThreeViewData'

interface Props extends React.SVGAttributes<SVGSVGElement> {
  strokeWidth?: number
}

export default function PA34SilhouetteTop({ className, strokeWidth = 1.5, ...rest }: Props) {
  const v = TV.planta
  const groups = [v.feat, v.sil]
  return (
    <svg
      viewBox="70 360 540 700"
      fill="none"
      className={className}
      aria-hidden="true"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeLinecap="round"
      {...rest}
    >
      {groups.map((rec, i) =>
        [rec.corpo, rec.tanques, rec.helice, rec.trem].map((d, j) => (
          <path key={`${i}-${j}`} d={d} strokeWidth={i === 0 ? strokeWidth * 0.5 : strokeWidth} strokeOpacity={i === 0 ? 0.8 : 1} />
        )),
      )}
      {TV_EXTRAS.discosLinhas.slice(1).map((l) => (
        <line key={l.y1} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} strokeWidth={strokeWidth * 0.6} strokeDasharray="7 9" strokeOpacity={0.5} />
      ))}
    </svg>
  )
}
