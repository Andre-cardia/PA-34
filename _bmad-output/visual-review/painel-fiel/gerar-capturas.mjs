// Capturas da spec-painel-fiel-prflm. E2: foto PR-FLM, render antigo (cópia em
// render-antigo/, layout 1600×700), render Blender novo (dia/noite, 1440 e 390, com e
// sem manches) e comparações foto × antigo × novo. Arquivos E1 (vetor) são refeitos
// forçando o fallback (WebPs bloqueados), para manter a comparação foto × vetor.
// Uso (da raiz): APP_URL=http://127.0.0.1:4175 node _bmad-output/visual-review/painel-fiel/gerar-capturas.mjs
import { readFileSync, mkdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(resolve('work-modulo-3d/package.json'))
const { chromium } = require('@playwright/test')

const APP = (process.env.APP_URL ?? 'http://127.0.0.1:5173').replace(/\/$/, '')
const OUT = resolve('_bmad-output/visual-review/painel-fiel')
mkdirSync(OUT, { recursive: true })
const dataUrl = (file, mime) => `data:${mime};base64,${readFileSync(resolve(file)).toString('base64')}`
const FOTO = dataUrl('work-modulo-3d/blender/cockpit/referencia/painel-real-prflm.png', 'image/png')
const OLD = Object.fromEntries(['dia', 'noite'].map((m) => [m, dataUrl(`_bmad-output/visual-review/painel-fiel/render-antigo/painel-${m}.webp`, 'image/webp')]))
const NEW = Object.fromEntries(['dia', 'noite'].map((m) => [m, dataUrl(`work-modulo-3d/public/cockpit-render/painel-${m}.webp`, 'image/webp')]))
const NEW_YOKES = Object.fromEntries(['dia', 'noite'].map((m) => [m, dataUrl(`work-modulo-3d/public/cockpit-render/manches-${m}.webp`, 'image/webp')]))

const browser = await chromium.launch({ headless: true })
const written = []
const shot = async (target, name, opts = {}) => {
  const path = join(OUT, name)
  await target.screenshot({ path, ...opts })
  written.push(name)
}

async function imagePage(html, width, height) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  await page.setContent(`<!doctype html><html><body style="margin:0;background:#111">${html}</body></html>`)
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode())))
  return page
}

async function openCockpit(width, height, night, { vector = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'reduce', locale: 'pt-BR' })
  const page = await ctx.newPage()
  if (vector) await page.route('**/cockpit-render/*.webp', (r) => r.abort())
  await page.goto(`${APP}/cockpit`)
  await page.locator('[data-hotspot]').first().waitFor()
  await page.waitForFunction(() => document.querySelectorAll('[data-rendered-panel][data-image-state="loading"]').length === 0)
  if (!vector) await page.waitForFunction(() => document.querySelectorAll('[data-rendered-panel][data-image-state="ready"]').length === 2)
  if (!night) await page.locator('button[title="Modo dia"]').click()
  await page.mouse.move(1, 1)
  await page.waitForTimeout(900)
  return { ctx, page }
}

// 1) Foto de referência e render antigo (WebP 3200×1400, recusado por dimensão no site)
{
  const p = await imagePage(`<img id="i" src="${FOTO}" style="display:block">`, 1024, 640)
  await shot(p.locator('#i'), '01-foto-prflm.png')
  await p.close()
  for (const m of ['dia', 'noite']) {
    const q = await imagePage(`<img id="i" src="${OLD[m]}" style="display:block;width:1600px;height:700px">`, 1600, 700)
    await shot(q.locator('#i'), `02-render-antigo-${m}.png`)
    await q.close()
  }
}

// 2) Painel vetorial novo no site, dia e noite, em 1440 e 390 de largura
const isolated = {}
for (const [width, height] of [[1440, 1000], [390, 844]]) {
  for (const night of [false, true]) {
    const mode = night ? 'noite' : 'dia'
    const { ctx, page } = await openCockpit(width, height, night, { vector: true })
    const stage = page.getByRole('group', { name: /Painel renderizado interativo/ })
    await shot(stage, `03-vetor-${width}-${mode}.png`)
    if (width === 390) {
      await shot(page, `03-vetor-${width}-${mode}-pagina.png`)
      await page.getByRole('button', { name: 'Recentrar o painel' }).click()
      await page.waitForTimeout(700)
      await shot(stage, `03-vetor-${width}-${mode}-reset.png`)
    }
    if (width === 1440) {
      await page.getByRole('button', { name: 'Mostrar manches' }).click()
      await page.waitForTimeout(500)
      await shot(stage, `04-vetor-1440-${mode}-manches.png`)
      await page.getByRole('button', { name: 'Mostrar manches' }).click()
      // Painel vetorial isolado em 1600×960 (mesmo DOM, sem hotspots nem palco)
      await page.evaluate(() => {
        const svg = document.querySelector('[aria-label^="Painel renderizado"] svg')
        const clone = svg.cloneNode(true)
        clone.querySelectorAll('[data-hotspot], [data-cockpit-label]').forEach((n) => n.remove())
        const g = clone.querySelector(':scope > g[transform]')
        g.removeAttribute('transform')
        clone.querySelectorAll('.ck-render-illumination').forEach((n) => {
          n.style.transition = 'none'
        })
        clone.setAttribute('viewBox', '0 0 1600 960')
        clone.setAttribute('width', '1600')
        clone.setAttribute('height', '960')
        clone.setAttribute('class', '')
        clone.setAttribute('style', 'display:block;background:#0d1011')
        clone.id = 'isolado'
        document.body.replaceChildren(clone)
        document.body.style.margin = '0'
      })
      await page.setViewportSize({ width: 1600, height: 960 })
      await page.waitForTimeout(300)
      await shot(page.locator('#isolado'), `05-vetor-isolado-1600x960-${mode}.png`)
      isolated[mode] = dataUrl(join(OUT, `05-vetor-isolado-1600x960-${mode}.png`), 'image/png')
    }
    await ctx.close()
  }
}

// 3) Lado a lado foto × vetor novo (mesma altura) e sobreposição pela retificação
//    declarada em panel-data.ts: x ≈ 1,56·xFoto + 10, y ≈ 1,6·yFoto.
const label = (t) => `<div style="font:600 18px/1 ui-monospace,monospace;color:#eee;padding:10px 12px">${t}</div>`
for (const mode of ['dia', 'noite']) {
  const html = `<div id="c" style="display:flex;gap:16px;padding:12px;background:#111;width:max-content">
    <div>${label('FOTO PR-FLM (referência)')}<img src="${FOTO}" style="display:block;height:640px"></div>
    <div>${label(`VETOR NOVO E1 — ${mode.toUpperCase()} (1600×960)`)}<img src="${isolated[mode]}" style="display:block;height:640px"></div></div>`
  const p = await imagePage(html, 2200, 720)
  await shot(p.locator('#c'), `06-lado-a-lado-foto-x-vetor-${mode}.png`)
  await p.close()
}
{
  const html = `<div id="c" style="position:relative;width:1600px;height:960px;background:#000">
    <img src="${isolated.dia}" style="position:absolute;left:0;top:0;width:1600px;height:960px">
    <img src="${FOTO}" style="position:absolute;left:10px;top:0;width:${1024 * 1.56}px;height:${640 * 1.6}px;opacity:.5"></div>`
  const p = await imagePage(html, 1600, 960)
  await shot(p.locator('#c'), '07-sobreposicao-foto-50pct-sobre-vetor-dia.png')
  await p.close()
}

// 4) E2 — render Blender novo no site (1440 e 390, dia/noite, com e sem manches)
for (const [width, height] of [[1440, 1000], [390, 844]]) {
  for (const night of [false, true]) {
    const mode = night ? 'noite' : 'dia'
    const { ctx, page } = await openCockpit(width, height, night)
    const stage = page.getByRole('group', { name: /Painel renderizado interativo/ })
    await shot(stage, `08-render-novo-${width}-${mode}.png`)
    if (width === 390) {
      await page.getByRole('button', { name: 'Recentrar o painel' }).click()
      await page.waitForTimeout(700)
      await shot(stage, `08-render-novo-${width}-${mode}-reset.png`)
    }
    await page.getByRole('button', { name: 'Mostrar manches' }).click()
    await page.waitForFunction(() => [...document.querySelectorAll('[data-yokes-layer]')].every((g) => g.getAttribute('data-image-state') === 'ready'))
    await page.waitForTimeout(400)
    await shot(stage, `08-render-novo-${width}-${mode}-manches.png`)
    await ctx.close()
  }
}

// 5) Foto × render antigo × render novo, lado a lado (mesma altura), dia e noite
for (const mode of ['dia', 'noite']) {
  const html = `<div id="c" style="display:flex;gap:16px;padding:12px;background:#111;width:max-content">
    <div>${label('FOTO PR-FLM (referência)')}<img src="${FOTO}" style="display:block;height:600px"></div>
    <div>${label(`RENDER ANTIGO — ${mode.toUpperCase()} (1600×700)`)}<div style="height:600px;display:flex;align-items:center;background:#0d1011"><img src="${OLD[mode]}" style="display:block;height:420px"></div></div>
    <div>${label(`RENDER NOVO E2 — ${mode.toUpperCase()} (1600×960)`)}<div style="position:relative;height:600px;width:1000px;background:#0d1011"><img src="${NEW[mode]}" style="position:absolute;inset:0;height:600px"></div></div></div>`
  const p = await imagePage(html, 3000, 680)
  await shot(p.locator('#c'), `09-lado-a-lado-foto-antigo-novo-${mode}.png`)
  await p.close()
  const html2 = `<div id="c" style="display:flex;gap:16px;padding:12px;background:#111;width:max-content">
    <div>${label('FOTO PR-FLM (referência)')}<img src="${FOTO}" style="display:block;height:640px"></div>
    <div>${label(`RENDER NOVO E2 + MANCHES — ${mode.toUpperCase()}`)}<div style="position:relative;height:640px;width:1067px;background:#0d1011"><img src="${NEW[mode]}" style="position:absolute;inset:0;height:640px"><img src="${NEW_YOKES[mode]}" style="position:absolute;inset:0;height:640px"></div></div></div>`
  const q = await imagePage(html2, 2200, 720)
  await shot(q.locator('#c'), `10-lado-a-lado-foto-x-render-manches-${mode}.png`)
  await q.close()
}
{
  const html = `<div id="c" style="position:relative;width:1600px;height:960px;background:#000">
    <img src="${NEW.dia}" style="position:absolute;left:0;top:0;width:1600px;height:960px">
    <img src="${FOTO}" style="position:absolute;left:10px;top:0;width:${1024 * 1.56}px;height:${640 * 1.6}px;opacity:.5"></div>`
  const p = await imagePage(html, 1600, 960)
  await shot(p.locator('#c'), '11-sobreposicao-foto-50pct-sobre-render-dia.png')
  await p.close()
}

await browser.close()
console.log(written.join('\n'))
