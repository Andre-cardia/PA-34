import type { Page } from '@playwright/test'

/**
 * Faz getContext('webgl'|'webgl2') retornar null, simulando navegador sem WebGL.
 * Também fixa um hardware "capaz" (8 núcleos / 8 GB): o Modelo3D testa recursos
 * limitados antes de WebGL, e runners de CI com 2 núcleos cairiam nesse motivo.
 */
export async function disableWebGL(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8, configurable: true })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8, configurable: true })
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null
      return (original as (...a: unknown[]) => unknown).call(this, type, ...args)
    } as typeof original
  })
}
