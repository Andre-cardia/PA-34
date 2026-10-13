import { test as base, expect } from '@playwright/test'
import { disableWebGL } from '../helpers/browser'

// Fixtures do site: coleta erros de runtime por teste e falha se houver
// exceções não esperadas. `noWebGL` injeta a ausência de WebGL antes de navegar.
// O callback do fixture se chama `provide` (não `use`) para não acionar react-hooks/rules-of-hooks.
type SiteFixtures = {
  pageErrors: string[]
  noWebGL: void
}

export const test = base.extend<SiteFixtures>({
  pageErrors: [
    async ({ page }, provide) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await provide(errors)
      expect(errors, 'Exceções de runtime na página').toEqual([])
    },
    { auto: true },
  ],
  noWebGL: async ({ page }, provide) => {
    await disableWebGL(page)
    await provide()
  },
})

export { expect }
