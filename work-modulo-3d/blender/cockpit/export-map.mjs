// Exporta o mapa canônico e somente a serigrafia existente; nunca a chapa SVG.
// panel-map.json = instrumentos (IDs/formas/rótulos) + geometria das chapas,
// placas e manches, tudo lido de panel-data.ts/artwork.tsx (map-source.mjs).
import { createServer } from 'vite'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { loadPanelSource } from './map-source.mjs'
const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../..')
const server = await createServer({ root, server: { middlewareMode: true }, appType: 'custom' })
try {
  const { panel, art, map } = await loadPanelSource(server)
  const { PANEL_ORDER, VB_W, VB_H } = panel
  const { ArtDefs, renderArt, Placards, HorimetroArt, PedestalBasePrint } = art
  await mkdir(resolve(here, 'masters'), { recursive: true })
  await writeFile(resolve(here, 'panel-map.json'), JSON.stringify(map, null, 2) + '\n')
  for (const night of [false, true]) {
    // Impressos sem ID (placas, horímetro, placa da base do pedestal) entram no
    // mesmo atlas, em grupo próprio; a chapa, a faixa creme e o pedestal não.
    const extras = React.createElement('g', { key: '__impressos', 'data-decal-extra': 'impressos' },
      React.createElement(Placards), React.createElement(HorimetroArt, { night }), React.createElement(PedestalBasePrint))
    const svg = React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: VB_W * 2, height: VB_H * 2, viewBox: `0 0 ${VB_W} ${VB_H}` },
      React.createElement(ArtDefs), extras, ...PANEL_ORDER.map(id => React.createElement('g', { key: id, 'data-decal-instrument': id }, renderArt(id, { night, sweep: false }))))
    await writeFile(resolve(here, `masters/serigrafia-${night ? 'noite' : 'dia'}.svg`), renderToStaticMarkup(svg))
  }
  const fingerprints = {}
  for (const file of ['export-map.mjs','map-source.mjs','../../src/components/cockpit/panel-data.ts','../../src/components/cockpit/artwork.tsx','../../src/components/cockpit/panel-geometry.ts','panel-map.json','masters/serigrafia-dia.svg','masters/serigrafia-noite.svg']) {
    const bytes=await readFile(resolve(here,file));fingerprints[file]={bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}
  }
  await writeFile(resolve(here,'masters/export-provenance.json'),JSON.stringify(fingerprints,null,2)+'\n')
} finally { await server.close() }
