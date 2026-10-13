import { test, expect } from '../support/fixtures'
import { componente, instrumento } from '../support/helpers/catalog'

test.describe('Deep-links do cockpit (?i=)', () => {
  test('[P0] ?i= abre a ficha do instrumento e fechar remove a query @mobile', async ({ page }) => {
    // Given
    const inst = instrumento('velocimetro')
    // When
    await page.goto(`/cockpit?i=${inst.id}`)
    // Then
    const ficha = page.getByRole('dialog', { name: inst.nome })
    await expect(ficha).toBeVisible()
    await ficha.getByRole('button', { name: 'Fechar painel' }).click()
    await expect(ficha).toBeHidden()
    await expect(page).not.toHaveURL(/[?&]i=/)
  })

  test('[P1] ?i= inválido não abre ficha', async ({ page }) => {
    await page.goto('/cockpit?i=nao_existe')
    await expect(page.getByRole('group', { name: /Painel renderizado interativo/ })).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
})

test.describe('Deep-links do módulo 3D (?camada=&c=)', () => {
  // Fallback estático usa as mesmas fichas e deep-links, sem depender de GPU no runner.
  test.use({ reducedMotion: 'reduce' })

  test('[P0] ?camada=&c= abre a ficha do componente', async ({ page }) => {
    const { camada, comp } = componente('estrutura', 'longarina_principal')
    await page.goto(`/modelo-3d?camada=${camada.id}&c=${comp.id}`)
    await expect(page.getByRole('dialog', { name: comp.nome })).toBeVisible()
  })

  test('[P1] componente fora da camada indicada é ignorado', async ({ page }) => {
    await page.goto('/modelo-3d?camada=exterior&c=longarina_principal')
    await expect(page.getByText(/MODO ESTÁTICO/)).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
})
