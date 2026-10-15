import type { Page } from '@playwright/test'
import { test, expect } from '../support/fixtures'
import { camadas, componente, instrumento } from '../support/helpers/catalog'

// Painel de camadas e ficha do módulo 3D (spec-acessibilidade-painel-camadas):
// rail com dois botões reais por camada, ficha sem desfoque e sheet mobile modal.
// O rail só existe no app-frame 3D: force3d + nointro, como no restante do CI.
const APP_3D = '/modelo-3d?force3d&nointro=1'
const ELETRICO = 'SISTEMA ELÉTRICO'

const rail = (page: Page) => page.getByRole('list', { name: 'Camadas da aeronave' })

// No Chromium headless o WebGL é software: a auto-rotação mantém o frameloop
// rodando e, com vários workers, satura a thread principal. Os testes de UI a
// desligam; a cena em si continua coberta pelos roteiros CDP. Pelo mesmo motivo
// este arquivo roda em ordem, num worker por projeto: transições de isolamento
// e foco de câmera em paralelo esgotavam o timeout de ação.
test.describe.configure({ mode: 'default' })

async function open3D(page: Page, query = '') {
  await page.goto(`${APP_3D}${query}`)
  const autoRot = page.getByRole('button', { name: 'AUTO-ROT' })
  await expect(autoRot).toHaveAttribute('aria-pressed', 'true')
  // dispatchEvent: com a ficha aberta o overlay cobre a barra inferior.
  await autoRot.dispatchEvent('click')
  await expect(autoRot).toHaveAttribute('aria-pressed', 'false')
}

test.describe('Rail de camadas (desktop)', () => {
  test.skip(({ isMobile }) => isMobile, 'Rail lateral só existe em ≥ lg')

  test('[P0] 9 linhas de altura igual, nomes numa linha e ações em massa sem quebra', async ({ page }) => {
    await open3D(page)
    const rows = rail(page).locator(':scope > li')
    await expect(rows).toHaveCount(camadas.length)
    const metrics = await rows.evaluateAll((items) =>
      items.map((li) => {
        const name = li.querySelector<HTMLElement>('.truncate')!
        return {
          height: Math.round(li.getBoundingClientRect().height),
          nameLines: Math.round(name.getBoundingClientRect().height / parseFloat(getComputedStyle(name).lineHeight)),
          truncated: name.scrollWidth > name.clientWidth,
        }
      }),
    )
    expect(new Set(metrics.map((m) => m.height)).size, JSON.stringify(metrics)).toBe(1)
    expect(metrics.every((m) => m.nameLines === 1), JSON.stringify(metrics)).toBe(true)
    // Em 1440 os nomes cabem inteiros (truncar com title é só a salvaguarda).
    expect(metrics.some((m) => m.truncated), JSON.stringify(metrics)).toBe(false)
    for (const label of ['EXPLODIR TUDO', 'FECHAR TUDO', 'SÓ EXTERIOR']) {
      const lines = await page.getByRole('button', { name: label, exact: true }).evaluate((b) => {
        const range = document.createRange()
        range.selectNodeContents(b)
        return new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size
      })
      expect(lines, label).toBe(1)
    }
  })

  test('[P0] teclado: exatamente duas paradas de Tab por camada (isolar, olho)', async ({ page }) => {
    // 18 Tabs, cada um dispara o pulso da camada no WebGL por software do runner.
    test.slow()
    await open3D(page)
    await page.getByRole('tab', { name: 'ÍNDICE' }).focus()
    const stops: string[] = []
    for (let i = 0; i < camadas.length * 2; i++) {
      await page.keyboard.press('Tab')
      stops.push(await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName ?? ''))
    }
    const labels = await rail(page).locator(':scope > li').evaluateAll((items) =>
      items.flatMap((li) => [...li.querySelectorAll('button')].map((b) => b.getAttribute('aria-label') ?? '')),
    )
    expect(labels).toHaveLength(camadas.length * 2)
    expect(stops).toEqual(labels)
    expect(stops.filter((s) => s.startsWith('Isolar '))).toHaveLength(camadas.length)
    expect(stops.filter((s) => /^(Remover|Adicionar) camada /.test(s))).toHaveLength(camadas.length)
    await expect(rail(page).locator('li[tabindex], li [role=button]')).toHaveCount(0)
  })

  for (const key of ['Enter', 'Space'] as const) {
    test(`[P0] ${key} no olho alterna exatamente uma vez`, async ({ page }) => {
      await open3D(page)
      await page.getByRole('button', { name: `Remover camada ${ELETRICO}` }).focus()
      await page.keyboard.press(key)
      const added = page.getByRole('button', { name: `Adicionar camada ${ELETRICO}` })
      await expect(added).toBeFocused()
      await expect(added).toHaveAttribute('aria-pressed', 'false')
      await expect(page.getByText('8/9 VISÍVEIS')).toBeVisible()
      await page.keyboard.press(key)
      await expect(page.getByRole('button', { name: `Remover camada ${ELETRICO}` })).toHaveAttribute('aria-pressed', 'true')
      await expect(page.getByText('9/9 VISÍVEIS')).toBeVisible()
    })
  }

  test('[P0] isolar pelo botão da linha, repetir desfaz; duplo-clique na linha continua isolando', async ({ page }) => {
    await open3D(page)
    const isolar = page.getByRole('button', { name: `Isolar ${ELETRICO}` })
    const chip = page.getByRole('button', { name: `Sair do isolado: ${ELETRICO}` })

    await isolar.click()
    await expect(isolar).toHaveAttribute('aria-pressed', 'true')
    await expect(chip).toBeVisible()
    // Isolar não pode alternar a visibilidade da própria camada (stopPropagation).
    await expect(page.getByText('9/9 VISÍVEIS')).toBeVisible()
    await expect(page.getByRole('button', { name: `Remover camada ${ELETRICO}` })).toHaveAttribute('aria-pressed', 'true')
    await isolar.click()
    await expect(isolar).toHaveAttribute('aria-pressed', 'false')
    await expect(chip).toBeHidden()

    await isolar.focus()
    await page.keyboard.press('Enter')
    await expect(isolar).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Enter')
    await expect(isolar).toHaveAttribute('aria-pressed', 'false')

    // Duplo-clique na área do nome (fora dos botões) não altera a visibilidade final.
    await rail(page).locator(':scope > li').filter({ hasText: ELETRICO }).locator('.truncate').dblclick()
    await expect(isolar).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: `Remover camada ${ELETRICO}` })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(isolar).toHaveAttribute('aria-pressed', 'false')
  })
})

test.describe('Rail de camadas (desktop) — clique na linha', () => {
  test.skip(({ isMobile }) => isMobile, 'Rail lateral só existe em ≥ lg')

  test('[P0] clique simples na linha alterna a visibilidade', async ({ page }) => {
    await open3D(page)
    const name = rail(page).locator(':scope > li').filter({ hasText: ELETRICO }).locator('.truncate')
    await name.click()
    await expect(page.getByText('8/9 VISÍVEIS')).toBeVisible()
    await expect(page.getByRole('button', { name: `Adicionar camada ${ELETRICO}` })).toBeVisible()
    await name.click()
    await expect(page.getByText('9/9 VISÍVEIS')).toBeVisible()
  })

  test('[P0] ficha aberta pelo ÍNDICE: Shift+Tab envolve e Esc devolve o foco ao item', async ({ page }) => {
    const { comp } = componente('eletrico', 'bateria')
    await open3D(page)
    await page.getByRole('tab', { name: 'ÍNDICE' }).click()
    const item = page.getByRole('button', { name: new RegExp(`^${comp.nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) })
    await item.focus()
    await page.keyboard.press('Enter')
    const ficha = page.getByRole('dialog', { name: comp.nome })
    const close = ficha.getByRole('button', { name: 'Fechar painel' })
    await expect(close).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    expect(await ficha.evaluate((d) => d.contains(document.activeElement) && document.activeElement !== d.querySelector('[aria-label="Fechar painel"]'))).toBe(true)
    await page.keyboard.press('Tab')
    await expect(close).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(ficha).toBeHidden()
    await expect(item).toBeFocused()
  })
})

test.describe('Ficha do componente', () => {
  test('[P0] chip curto, título legível, localização longa quebra e o modelo não é desfocado @mobile', async ({ page }) => {
    const { camada, comp } = componente('eletrico', 'bateria')
    await open3D(page, `&camada=${camada.id}&c=${comp.id}`)
    const ficha = page.getByRole('dialog', { name: comp.nome })
    await expect(ficha).toBeVisible()
    await expect(ficha.getByText(ELETRICO, { exact: true })).toBeVisible()
    // Nome curto no chip; o nome completo fica só em SOBRE A CAMADA.
    await expect(ficha.locator('#drawer-title').locator('xpath=..').getByText(camada.nome, { exact: true })).toHaveCount(0)
    await expect(ficha.getByRole('region', { name: 'Sobre a camada' })).toContainText(camada.nome)
    await expect(ficha.getByRole('button', { name: 'Fechar painel' })).toBeFocused()

    const title = await ficha.locator('#drawer-title').evaluate((h) => ({ width: h.getBoundingClientRect().width, dialog: h.closest('[role=dialog]')!.getBoundingClientRect().width }))
    expect(title.width).toBeGreaterThan(title.dialog * 0.6)

    const loc = ficha.getByRole('region', { name: 'Localização' })
    await expect(loc).toContainText(comp.localizacao)
    const overflow = await loc.evaluate((el) => {
      const p = el.querySelector('p')!
      const body = el.closest('[role=dialog]')!.querySelector<HTMLElement>('.overflow-y-auto')!
      return { p: p.scrollWidth - p.clientWidth, body: body.scrollWidth - body.clientWidth }
    })
    expect(overflow).toEqual({ p: 0, body: 0 })

    const backdrop = await page.evaluate(() => {
      const overlay = [...document.querySelectorAll<HTMLElement>('div[aria-hidden="true"]')].find((d) => getComputedStyle(d).position === 'fixed' && d.style.opacity !== '0' && d.className.includes('z-[80]'))
      return overlay ? getComputedStyle(overlay).backdropFilter : 'missing'
    })
    expect(backdrop).toBe('none')

    await expect(ficha.getByRole('button', { name: 'SAIR DO ISOLADO' })).toBeVisible()
    await ficha.getByRole('button', { name: 'SAIR DO ISOLADO' }).click()
    await expect(ficha.getByRole('button', { name: 'ISOLAR CAMADA' })).toBeVisible()
  })

  test.describe('modo estático', () => {
    test.use({ reducedMotion: 'reduce' })

    test('[P0] sem botão de isolamento; demais ações presentes @mobile', async ({ page }) => {
      const { camada, comp } = componente('eletrico', 'bateria')
      await page.goto(`/modelo-3d?camada=${camada.id}&c=${comp.id}`)
      const ficha = page.getByRole('dialog', { name: comp.nome })
      await expect(ficha).toBeVisible()
      await expect(ficha.getByRole('button', { name: /ISOLAR|ISOLADO/ })).toHaveCount(0)
      await expect(ficha.getByRole('link', { name: /VER NO SISTEMA/ })).toBeVisible()
      await expect(ficha.getByRole('button', { name: /alternadores/i })).toBeEnabled()
      await expect(ficha.getByRole('button', { name: 'Fechar painel' })).toBeVisible()
    })
  })

  test('[P1] cockpit mantém o cabeçalho e o desfoque padrão do Drawer @mobile', async ({ page }) => {
    const inst = instrumento('velocimetro')
    await page.goto(`/cockpit?i=${inst.id}`)
    const ficha = page.getByRole('dialog', { name: inst.nome })
    await expect(ficha).toBeVisible()
    const layout = await ficha.locator('#drawer-title').evaluate((h) => {
      const chip = h.previousElementSibling as HTMLElement | null
      const hb = h.getBoundingClientRect()
      const cb = chip?.getBoundingClientRect()
      return { inline: !!cb && Math.abs(cb.top + cb.height / 2 - (hb.top + hb.height / 2)) < 4, fontSize: getComputedStyle(h).fontSize }
    })
    expect(layout).toEqual({ inline: true, fontSize: '18px' })
    const blur = await page.evaluate(() => {
      const overlay = [...document.querySelectorAll<HTMLElement>('div[aria-hidden="true"]')].find((d) => d.className.includes('z-[80]'))
      return overlay ? getComputedStyle(overlay).backdropFilter : 'missing'
    })
    expect(blur).toContain('blur')
  })
})

test.describe('Sheet de camadas (mobile)', () => {
  test.skip(({ isMobile }) => !isMobile, 'Sheet só existe em < lg')

  const openSheet = async (page: Page) => {
    await open3D(page)
    await page.getByRole('button', { name: 'Abrir painel de camadas' }).click()
    const sheet = page.getByRole('dialog', { name: 'Painel de camadas' })
    await expect(sheet).toBeVisible()
    return sheet
  }

  test('[P0] ocupa ~50dvh, modelo visível acima e foco no fechar @mobile', async ({ page }) => {
    const sheet = await openSheet(page)
    await expect(sheet.getByRole('button', { name: 'Fechar painel de camadas' })).toBeFocused()
    const ratio = await sheet.evaluate((el) => el.getBoundingClientRect().height / window.innerHeight)
    expect(ratio).toBeGreaterThan(0.4)
    expect(ratio).toBeLessThan(0.6)
  })

  test('[P0] Tab no último volta ao primeiro; Shift+Tab no primeiro vai ao último @mobile', async ({ page }) => {
    const sheet = await openSheet(page)
    const close = sheet.getByRole('button', { name: 'Fechar painel de camadas' })
    const last = sheet.getByRole('button', { name: 'SÓ EXTERIOR', exact: true })
    await expect(close).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(last).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(close).toBeFocused()
  })

  for (const how of ['Escape', '✕', 'overlay'] as const) {
    test(`[P0] fechar por ${how} devolve o foco ao botão CAMADAS @mobile`, async ({ page }) => {
      const sheet = await openSheet(page)
      if (how === 'Escape') await page.keyboard.press('Escape')
      else if (how === '✕') await sheet.getByRole('button', { name: 'Fechar painel de camadas' }).click()
      else {
        // Ponto do overlay acima do sheet, derivado da geometria (não de coordenadas fixas).
        const top = await sheet.evaluate((el) => el.getBoundingClientRect().top)
        await page.mouse.click(10, Math.max(80, top / 2))
      }
      await expect(sheet).toBeHidden()
      await expect(page.getByRole('button', { name: 'Abrir painel de camadas' })).toBeFocused()
    })
  }

  test('[P0] com camada isolada, o primeiro Esc fecha o sheet e o seguinte desfaz o isolamento @mobile', async ({ page }) => {
    const sheet = await openSheet(page)
    await sheet.getByRole('button', { name: `Isolar ${ELETRICO}` }).click()
    await expect(sheet.getByRole('button', { name: `Sair do isolado: ${ELETRICO}` })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
    await page.getByRole('button', { name: 'Abrir painel de camadas' }).click()
    await expect(sheet.getByRole('button', { name: `Isolar ${ELETRICO}` })).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Abrir painel de camadas' }).click()
    await expect(sheet.getByRole('button', { name: `Isolar ${ELETRICO}` })).toHaveAttribute('aria-pressed', 'false')
  })
})
