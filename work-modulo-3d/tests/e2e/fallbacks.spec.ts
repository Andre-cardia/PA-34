import { test, expect } from '../support/fixtures'

// Caminhos que o AGENTS.md exige preservar: movimento reduzido e ausência de WebGL.

test.describe('Movimento reduzido', () => {
  test.use({ reducedMotion: 'reduce' })

  test('[P0] home usa a vista estática no lugar do canvas @mobile', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('img', { name: 'Vista técnica estática do Seneca I' })).toBeVisible()
    await expect(page.locator('canvas')).toHaveCount(0)
  })

  test('[P0] módulo 3D entra em modo estático com o motivo', async ({ page }) => {
    await page.goto('/modelo-3d')
    await expect(page.getByText('MODO ESTÁTICO — MOVIMENTO REDUZIDO ATIVADO', { exact: false })).toBeVisible()
    await expect(page.locator('canvas')).toHaveCount(0)
  })
})

test.describe('Sem WebGL', () => {
  test('[P0] módulo 3D mostra fallback estático', async ({ page, noWebGL }) => {
    void noWebGL
    await page.goto('/modelo-3d')
    await expect(page.getByText('WEBGL INDISPONÍVEL', { exact: false })).toBeVisible()
    await expect(page.locator('canvas')).toHaveCount(0)
  })

  test('[P0] home mostra a vista estática', async ({ page, noWebGL }) => {
    void noWebGL
    await page.goto('/')
    await expect(page.getByRole('img', { name: 'Vista técnica estática do Seneca I' })).toBeVisible()
  })
})
