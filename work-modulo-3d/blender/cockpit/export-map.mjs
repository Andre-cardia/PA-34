// Exporta o mapa canônico e somente a serigrafia existente; nunca a chapa SVG.
import { createServer } from 'vite'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../..')
const server = await createServer({ root, server: { middlewareMode: true }, appType: 'custom' })
try {
  const { PANEL_MAP, PANEL_ORDER, VB_W, VB_H } = await server.ssrLoadModule('/src/components/cockpit/panel-data.ts')
  const { ArtDefs, renderArt } = await server.ssrLoadModule('/src/components/cockpit/artwork.tsx')
  await mkdir(resolve(here, 'masters'), { recursive: true })
  await writeFile(resolve(here, 'panel-map.json'), JSON.stringify({ width: VB_W, height: VB_H, instruments: PANEL_ORDER.map(id => PANEL_MAP[id]) }, null, 2) + '\n')
  for (const night of [false, true]) {
    const svg = React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: VB_W * 2, height: VB_H * 2, viewBox: `0 0 ${VB_W} ${VB_H}` },
      React.createElement(ArtDefs), ...PANEL_ORDER.map(id => React.createElement('g', { key: id, 'data-decal-instrument': id }, renderArt(id, { night, sweep: false }))))
    await writeFile(resolve(here, `masters/serigrafia-${night ? 'noite' : 'dia'}.svg`), renderToStaticMarkup(svg))
  }
  const fingerprints = {}
  for (const file of ['export-map.mjs','../../src/components/cockpit/panel-data.ts','../../src/components/cockpit/artwork.tsx','panel-map.json','masters/serigrafia-dia.svg','masters/serigrafia-noite.svg']) {
    const bytes=await readFile(resolve(here,file));fingerprints[file]={bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}
  }
  await writeFile(resolve(here,'masters/export-provenance.json'),JSON.stringify(fingerprints,null,2)+'\n')
} finally { await server.close() }
