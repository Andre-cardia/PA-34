import { test, expect } from '../support/fixtures'

// Rotas de conteúdo: cada página renderiza seu título (h1) sem exceção de runtime.
// O h1 usa efeito scramble; toHaveText aguarda o texto final.
const paginas = [
  { path: '/especificacoes', titulo: 'Especificações & Limitações' },
  { path: '/performance', titulo: 'Performance' },
  { path: '/sistemas', titulo: 'Sistemas' },
  { path: '/procedimentos', titulo: 'Procedimentos Normais' },
  { path: '/multimotor', titulo: 'Voo Monomotor (OEI)' },
  { path: '/seguranca', titulo: 'Operação & Segurança' },
]

test.describe('Rotas de conteúdo', () => {
  for (const { path, titulo } of paginas) {
    test(`[P0] ${path} renderiza "${titulo}" @mobile`, async ({ page }) => {
      // Given / When
      await page.goto(path)
      // Then
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(titulo)
    })
  }

  test('[P0] /emergencias renderiza o hero e a lista de procedimentos', async ({ page }) => {
    await page.goto('/emergencias')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText('Os 21 procedimentos')).toBeVisible()
  })

  test('[P1] rota desconhecida redireciona para a home', async ({ page }) => {
    // Movimento reduzido evita carregar o GLB; o h1 da home só recebe texto após a montagem 3D.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/rota-inexistente')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { level: 2, name: 'O documento, virado site.' })).toBeVisible()
  })
})

test.describe('Conteúdo Markdown', () => {
  test('[P1] performance extrai seções do performance.md', async ({ page }) => {
    await page.goto('/performance')
    await expect(page.getByText('VA — Velocidade de Manobra')).toBeVisible()
  })

  test('[P1] especificações exibem texto vindo de intro_generalidades.md', async ({ page }) => {
    await page.goto('/especificacoes')
    await expect(page.getByText('Do documento original')).toBeVisible()
  })
})
