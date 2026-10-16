// Fonte única do mapa canônico: importa panel-data.ts, panel-geometry.ts e artwork.tsx via Vite SSR.
// Usado por export-map.mjs (grava panel-map.json) e verify-assets.mjs (confere).
// Nenhuma coordenada é escrita à mão aqui: tudo vem dos módulos do cockpit.
export async function loadPanelSource(server) {
  const panel = await server.ssrLoadModule('/src/components/cockpit/panel-data.ts')
  const art = await server.ssrLoadModule('/src/components/cockpit/artwork.tsx')
  const geo = await server.ssrLoadModule('/src/components/cockpit/panel-geometry.ts')
  const { PANEL_MAP, PANEL_ORDER, VB_W, VB_H, GLARE_CONTOUR, PLATES, TRIMS, PLACARDS, HORIMETRO, PLATE_SCREWS, PEDESTAL_BASE } = panel
  const geometry = {
    glare: GLARE_CONTOUR,
    pad: geo.offsetLine(GLARE_CONTOUR, 14),
    plates: PLATES,
    trims: TRIMS,
    placards: PLACARDS.map(({ x, y, w, h, tone }) => ({ x, y, w, h, tone: tone ?? 'black' })),
    horimetro: HORIMETRO,
    screws: PLATE_SCREWS,
    pedestalBase: PEDESTAL_BASE,
    yokes: geo.YOKES.map((y) => {
      const g = geo.yokeGeometry(y)
      return { ...g, arms: g.arms.map((a) => geo.sampleSegs(a)) }
    }),
  }
  const map = { width: VB_W, height: VB_H, instruments: PANEL_ORDER.map((id) => PANEL_MAP[id]), geometry }
  return { panel, art, map }
}
