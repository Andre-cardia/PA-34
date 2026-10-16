import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Page } from '@playwright/test'
import { test, expect } from '../support/fixtures'
import { camadas, componente, instrumento, instrumentos } from '../support/helpers/catalog'

// Painel fiel à foto PR-FLM (spec-painel-fiel-prflm), etapas E1 e E2: layout canônico
// 1600×960, 54 hotspots (49 + 5 do pedestal), fallback vetorial, manches opcionais
// e enquadramento mobile no six-pack do piloto; na E2, render Blender VB×2 dia/noite.

// PANEL_ORDER é lido do próprio módulo: o spec não importa src/ (aliases do Vite).
const PANEL_DATA = readFileSync(new URL('../../src/components/cockpit/panel-data.ts', import.meta.url), 'utf8')
const PANEL_ORDER = [...(PANEL_DATA.match(/export const PANEL_ORDER: string\[\] = \[([\s\S]*?)\]/)?.[1] ?? '').matchAll(/'([a-z0-9_]+)'/g)].map((m) => m[1])
const VB_W = Number(PANEL_DATA.match(/export const VB_W = (\d+)/)?.[1])
const VB_H = Number(PANEL_DATA.match(/export const VB_H = (\d+)/)?.[1])
// Primeira parte do jogo do copiloto (instrumentos_copiloto tem `parts`).
const COPILOTO_PART0 = (PANEL_DATA.match(/export const COPILOTO_PARTS[^=]*= \[\s*circ\((\d+), (\d+), \d+\)/) ?? []).slice(1, 3).map(Number)
const OLD_RENDER = fileURLToPath(new URL('../../../_bmad-output/visual-review/painel-fiel/render-antigo/painel-noite.webp', import.meta.url))

const stage = (page: Page) => page.getByRole('group', { name: /Painel renderizado interativo/ })

async function openCockpit(page: Page, query = '') {
  await page.goto(`/cockpit${query}`)
  await expect(stage(page)).toBeVisible()
  await expect(page.locator('[data-hotspot]')).toHaveCount(PANEL_ORDER.length)
}

test.describe('Contrato do painel', () => {
  test('[P0] PANEL_ORDER tem 54 IDs únicos, iguais ao catálogo e ao DOM', async ({ page }) => {
    expect(VB_W).toBe(1600)
    expect(VB_H).toBe(960)
    expect(PANEL_ORDER).toHaveLength(54)
    expect(new Set(PANEL_ORDER).size).toBe(54)
    expect([...PANEL_ORDER].sort()).toEqual(instrumentos.map((i) => i.id).sort())
    await openCockpit(page)
    const dom = await page.locator('[data-hotspot]').evaluateAll((els) => els.map((e) => e.getAttribute('data-hotspot')))
    expect(dom).toEqual(PANEL_ORDER)
  })
})

test.describe('Deep-link ?i= para cada ID do PANEL_ORDER', () => {
  for (const id of PANEL_ORDER) {
    test(`[P0] ?i=${id} abre a ficha correta`, async ({ page }) => {
      const inst = instrumento(id)
      await page.goto(`/cockpit?i=${id}`)
      await expect(page.getByRole('dialog', { name: inst.nome, exact: true })).toBeVisible()
      await expect(page.getByRole('dialog')).toHaveCount(1)
      await expect(page.locator(`[data-hotspot="${id}"]`)).toHaveCount(1)
    })
  }

  test('[P1] ?i=nao_existe não abre ficha', async ({ page }) => {
    await openCockpit(page, '?i=nao_existe')
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
})

test.describe('Geometria dos hotspots', () => {
  test('[P0] centro de cada hotspot fica dentro do viewBox e da área da imagem', async ({ page }) => {
    await openCockpit(page)
    const result = await page.evaluate(
      ({ vbW, vbH }) => {
        const image = document.querySelector<SVGImageElement>('[data-rendered-panel="noite"] image')!
        const area = image.getBoundingClientRect()
        return [...document.querySelectorAll<SVGGElement>('[data-hotspot]')].map((g) => {
          const b = g.getBBox()
          const cx = b.x + b.width / 2
          const cy = b.y + b.height / 2
          const r = g.getBoundingClientRect()
          const sx = r.x + r.width / 2
          const sy = r.y + r.height / 2
          return {
            id: g.dataset.hotspot,
            inViewBox: cx >= 0 && cx <= vbW && cy >= 0 && cy <= vbH,
            inImage: sx >= area.left && sx <= area.right && sy >= area.top && sy <= area.bottom,
          }
        })
      },
      { vbW: VB_W, vbH: VB_H },
    )
    expect(result).toHaveLength(54)
    expect(result.filter((r) => !r.inViewBox || !r.inImage)).toEqual([])
  })

  test('[P0] elementFromPoint no centro de cada hotspot devolve o próprio hotspot (nenhum vizinho o encobre)', async ({ page }) => {
    await openCockpit(page)
    expect(COPILOTO_PART0).toHaveLength(2)
    const result = await page.evaluate((part0) => {
      const stageBox = document.querySelector('[role="group"][aria-label^="Painel renderizado interativo"]')!.getBoundingClientRect()
      return [...document.querySelectorAll<SVGGElement>('[data-hotspot]')].map((g) => {
        const id = g.dataset.hotspot!
        const b = (g.firstElementChild as SVGGraphicsElement).getBBox()
        const [cx, cy] = id === 'instrumentos_copiloto' ? part0 : [b.x + b.width / 2, b.y + b.height / 2]
        const p = new DOMPoint(cx, cy).matrixTransform(g.getScreenCTM()!)
        const visible = p.x >= stageBox.left && p.x <= stageBox.right && p.y >= stageBox.top && p.y <= stageBox.bottom
        const hit = document.elementFromPoint(p.x, p.y)?.closest('[data-hotspot]')?.getAttribute('data-hotspot') ?? null
        return { id, visible, hit }
      })
    }, COPILOTO_PART0)
    expect(result).toHaveLength(PANEL_ORDER.length)
    expect(result.filter((r) => !r.visible || r.hit !== r.id)).toEqual([])
  })
})

test.describe('Fallback vetorial', () => {
  test('[P0] com o render indisponível o fallback vetorial aparece e os hotspots seguem clicáveis', async ({ page }) => {
    await page.route('**/cockpit-render/*.webp', (route) => route.abort())
    await openCockpit(page)
    for (const mode of ['dia', 'noite']) {
      await expect(page.locator(`[data-rendered-panel="${mode}"]`)).toHaveAttribute('data-image-state', 'error')
      await expect(page.locator(`[data-vector-fallback="${mode}"]`)).toHaveCount(1)
    }
    // modo dia é o padrão: o fallback diurno é o visível
    await expect(page.locator('[data-vector-fallback="dia"]')).toBeVisible()
    await expect(page.locator('[data-rendered-panel="dia"] image')).toHaveAttribute('visibility', 'hidden')
    const inst = instrumento('altimetro')
    await page.locator('[data-hotspot="altimetro"]').click()
    await expect(page.getByRole('dialog', { name: inst.nome })).toBeVisible()
  })

  test('[P0] WebP do painel com dimensão ≠ VB×2 é recusado e cai no fallback vetorial', async ({ page }) => {
    await page.route('**/cockpit-render/painel-*.webp', (route) => route.fulfill({ path: OLD_RENDER, contentType: 'image/webp' }))
    await openCockpit(page)
    for (const mode of ['dia', 'noite']) {
      await expect(page.locator(`[data-rendered-panel="${mode}"]`)).toHaveAttribute('data-image-state', 'error')
    }
    await expect(page.locator('[data-vector-fallback="dia"]')).toBeVisible()
    await expect(page.locator('[data-rendered-panel="dia"] image')).toHaveAttribute('visibility', 'hidden')
  })

  test('[P0] WebP dos manches com dimensão ≠ VB×2 é recusado e cai no desenho vetorial', async ({ page }) => {
    await page.route('**/cockpit-render/manches-*.webp', (route) => route.fulfill({ path: OLD_RENDER, contentType: 'image/webp' }))
    await openCockpit(page)
    await page.getByRole('button', { name: 'Mostrar manches' }).click()
    for (const mode of ['dia', 'noite']) {
      await expect(page.locator(`[data-yokes-layer="${mode}"]`)).toHaveAttribute('data-image-state', 'error')
      await expect(page.locator(`[data-yokes-layer="${mode}"] image`)).toHaveCount(0)
    }
    await expect(page.locator('[data-yokes-layer="dia"] path').first()).toBeVisible()
  })
})

test.describe('Manches opcionais', () => {
  test('[P0] botão manches começa desligado e, ligado, não bloqueia clique num hotspot', async ({ page }) => {
    await openCockpit(page)
    const button = page.getByRole('button', { name: 'Mostrar manches' })
    await expect(button).toHaveAttribute('aria-pressed', 'false')
    await expect(page.locator('[data-yokes]')).toHaveCount(0)
    await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('[data-yokes="on"]')).toHaveCount(1)

    // Alvo fixo sob o manche do piloto (o mesmo de verificar-painel.mjs): em modo
    // raster a camada é um <image> sem isPointInFill, então não dá para procurar.
    const target = await page.evaluate(() => {
      const g = document.querySelector<SVGGElement>('[data-hotspot="piloto_automatico"]')!
      const r = g.getBoundingClientRect()
      const x = r.x + r.width / 2
      const y = r.y + r.height / 2
      const hit = document.elementFromPoint(x, y)?.closest('[data-hotspot]')?.getAttribute('data-hotspot')
      return { id: 'piloto_automatico', x, y, hit }
    })
    expect(target!.hit).toBe(target!.id)
    await page.mouse.click(target!.x, target!.y)
    await expect(page.getByRole('dialog', { name: instrumento(target!.id).nome })).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`[?&]i=${target!.id}`))
  })
})

test.describe('Mobile 390×844', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('[P0] começa enquadrado no six-pack do piloto @mobile', async ({ page }) => {
    await openCockpit(page)
    const box = await stage(page).boundingBox()
    expect(box).not.toBeNull()
    for (const id of ['velocimetro', 'horizonte_artificial', 'altimetro']) {
      await expect
        .poll(async () => {
          const r = await page.locator(`[data-hotspot="${id}"]`).boundingBox()
          return !!r && r.x >= box!.x && r.y >= box!.y && r.x + r.width <= box!.x + box!.width && r.y + r.height <= box!.y + box!.height
        }, { message: `${id} visível no palco` })
        .toBe(true)
    }
    // enquadramento aproximado: zoom acima do ajuste inicial
    await expect(page.getByText(/^ZOOM (\d+)%$/)).not.toHaveText('ZOOM 100%')
  })
})

test.describe('Render Blender (E2)', () => {
  test('[P0] painel e manches usam o render VB×2 dia/noite, alinhado aos hotspots', async ({ page }) => {
    await openCockpit(page)
    for (const mode of ['dia', 'noite']) {
      await expect(page.locator(`[data-rendered-panel="${mode}"]`)).toHaveAttribute('data-image-state', 'ready')
    }
    await expect(page.locator('[data-vector-fallback]')).toHaveCount(0)
    await page.getByRole('button', { name: 'Mostrar manches' }).click()
    for (const mode of ['dia', 'noite']) {
      await expect(page.locator(`[data-yokes-layer="${mode}"]`)).toHaveAttribute('data-image-state', 'ready')
    }
    const sizes = await page.evaluate(async () => {
      const out: { href: string; w: number; h: number }[] = []
      for (const img of document.querySelectorAll<SVGImageElement>('[data-rendered-panel] image, [data-yokes-layer] image')) {
        const im = new Image()
        im.src = img.getAttribute('href')!
        await im.decode()
        out.push({ href: im.src, w: im.naturalWidth, h: im.naturalHeight })
      }
      return out
    })
    expect(sizes).toHaveLength(4)
    for (const s of sizes) expect([s.w, s.h], s.href).toEqual([VB_W * 2, VB_H * 2])
  })
})

test.describe('Contrato de links do cockpit', () => {
  const CONFIG = readFileSync(new URL('../../src/components/modelo3d/config.ts', import.meta.url), 'utf8')
  const linksBlock = CONFIG.match(/export const COCKPIT_LINKS[^=]*= \{([\s\S]*?)\n\}/)?.[1] ?? ''
  const COCKPIT_LINKS = [...linksBlock.matchAll(/^\s*([a-z0-9_]+): '([a-z0-9_]+)'/gm)].map((m) => [m[1], m[2]] as const)
  const relatedBlock = PANEL_DATA.match(/export const RELATED[^=]*= \{([\s\S]*?)\n\}/)?.[1] ?? ''
  const RELATED_3D = [...relatedBlock.matchAll(/\?camada=([a-z0-9_]+)&c=([a-z0-9_]+)/g)].map((m) => [m[1], m[2]] as const)

  test('[P0] COCKPIT_LINKS: chaves são componentes 3D e valores são instrumentos do cockpit', () => {
    expect(COCKPIT_LINKS.length).toBeGreaterThan(0)
    const comps = new Set(camadas.flatMap((c) => c.componentes.map((k) => k.id)))
    const insts = new Set(instrumentos.map((i) => i.id))
    expect(COCKPIT_LINKS.filter(([k]) => !comps.has(k)).map(([k]) => k)).toEqual([])
    expect(COCKPIT_LINKS.filter(([, v]) => !insts.has(v)).map(([, v]) => v)).toEqual([])
  })

  test('[P0] RELATED: todo ?camada=X&c=Y nomeia um componente existente', () => {
    expect(RELATED_3D.length).toBeGreaterThan(0)
    const missing = RELATED_3D.filter(([camada, c]) => {
      try {
        componente(camada, c)
        return false
      } catch {
        return true
      }
    })
    expect(missing).toEqual([])
  })
})
