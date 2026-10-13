// Regressão visual dos rótulos: Chrome CDP local e servidor Vite já ativos.
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
const port = process.env.CDP_PORT || '9228'
const base = process.env.APP_URL || 'http://127.0.0.1:3000'
const output = process.env.REVIEW_OUTPUT || './test-artifacts/browser-labels'
mkdirSync(output, { recursive: true })
const target = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' }).then(r => r.json())
const ws = new WebSocket(target.webSocketDebuggerUrl)
const pending = new Map()
let sequence = 0
ws.onmessage = event => {
  const m = JSON.parse(event.data), p = pending.get(m.id)
  if (!p) return
  clearTimeout(p.timer); pending.delete(m.id)
  m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result)
}
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(method)) }, 25000)
    pending.set(id, { resolve, reject, timer }); ws.send(JSON.stringify({ id, method, params }))
  })
}
async function evaluate(expression) {
  const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails))
  return r.result.value
}
async function waitFor(condition) {
  await evaluate(`new Promise((resolve,reject)=>{const end=performance.now()+20000;function tick(){if(${condition})return resolve(true);if(performance.now()>end)return reject(new Error('Condição não atingida'));requestAnimationFrame(tick)}tick()})`)
}
const labels = "[...document.querySelectorAll('[data-model-label]')]"
const report = []
try {
  await call('Page.enable'); await call('Runtime.enable')
  await call('Emulation.setDeviceMetricsOverride', { width: 1191, height: 850, deviceScaleFactor: 1, mobile: false })
  await call('Page.navigate', { url: `${base}/modelo-3d?force3d=1&nointro=1` })
  await waitFor("document.querySelector('canvas') && [...document.querySelectorAll('button')].some(b=>b.getAttribute('aria-label')==='RÓTULOS')")
  await evaluate("document.querySelector('button[aria-label=\"RÓTULOS\"]').click()")
  await waitFor(`${labels}.length>0`)
  for (const width of [1191, 390]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 850, deviceScaleFactor: 1, mobile: width < 500 })
    await evaluate(`(async()=>{const url=performance.getEntriesByType('resource').map(r=>r.name).find(n=>n.includes('@react-three_fiber.js'));const fiber=await import(url);window.labelScene=fiber._roots.get(document.querySelector('canvas')).store.getState()})()`)
    await evaluate('new Promise(resolve=>setTimeout(resolve,2800))')
    let previous = null
    for (const distance of [6, 18]) {
      await evaluate(`(()=>{const s=window.labelScene;const target=s.controls.target;const direction=s.camera.position.clone().sub(target).normalize();s.camera.position.copy(target).addScaledVector(direction,${distance});s.controls.update();s.invalidate()})()`)
      await evaluate('new Promise(resolve=>setTimeout(resolve,400))')
      const actualDistance = await evaluate('window.labelScene.camera.position.distanceTo(window.labelScene.controls.target)')
      assert(Math.abs(actualDistance-distance) < .1, 'Distância de ensaio sobrescrita')
      const metrics = await evaluate(`${labels}.map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {id:e.dataset.modelLabel,width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom,visible:s.visibility==='visible',font:s.fontSize,text:e.textContent}})`)
      assert(metrics.length > 0 && metrics.length <= 6, 'Quantidade de etiquetas inválida')
      for (const m of metrics) {
        assert(m.width <= 157 && m.width > 0, 'Etiqueta larga: ' + JSON.stringify(m))
        assert.equal(m.font, '10px')
        assert(m.height <= 90, 'Etiqueta alta demais: ' + JSON.stringify(m))
      }
      if (previous) {
        const common = metrics.filter(m => previous.some(p => p.id === m.id))
        assert(common.length > 0, 'Sem etiqueta comum para comparar escala')
        for (const m of common) {
          const p = previous.find(p => p.id === m.id)
          assert(Math.abs(m.width-p.width) < 1 && Math.abs(m.height-p.height) < 1, 'Escala variou com zoom')
        }
      }
      const shown = metrics.filter(m => m.visible)
      assert(shown.length > 0, 'Nenhuma etiqueta visível')
      for (let i=0;i<shown.length;i++) for (let j=i+1;j<shown.length;j++) {
        const a=shown[i], b=shown[j]
        assert(!(a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top), 'Etiquetas sobrepostas')
      }
      previous = metrics
      report.push({ viewport: width, distance, actualDistance, metrics })
      const image = await call('Page.captureScreenshot', { format: 'png' })
      writeFileSync(`${output}/labels-${width}-${distance}.png`, Buffer.from(image.data, 'base64'))
    }
  }
  await evaluate("document.querySelector('button[aria-label=\"RÓTULOS\"]').click()")
  await waitFor(`${labels}.length===0`)
  await evaluate("document.querySelector('button[aria-label=\"RÓTULOS\"]').click()")
  await waitFor(`${labels}.length>0`)
  console.log('PASS: rótulos compactos, 10px, largura até 156px, desktop/móvel, perto/longe e toggle')
} finally {
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2))
  ws.close()
  await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`).catch(() => {})
}
