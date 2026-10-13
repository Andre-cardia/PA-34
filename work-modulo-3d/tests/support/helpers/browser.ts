import type { Page } from '@playwright/test'

/** Faz getContext('webgl'|'webgl2') retornar null, simulando navegador sem WebGL. */
export async function disableWebGL(page: Page) {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null
      return (original as (...a: unknown[]) => unknown).call(this, type, ...args)
    } as typeof original
  })
}
