// Executar na raiz: node _bmad-output/visual-review/restabelecimento-3d/verificar-integracao.mjs
// Requer Chrome CDP 9338 e work-modulo-3d servido na porta 3000.
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
const base = process.env.APP_URL ?? 'http://127.0.0.1:3000'
const cdp = `http://127.0.0.1:${process.env.CDP_PORT ?? 9338}`
const evidencias = []
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
function exigir(ok, nome, dados) {
  if (!ok) throw new Error(`${nome}: ${JSON.stringify(dados)}`)
  evidencias.push({ nome, dados })
}
const anteriores = JSON.parse(readFileSync('_bmad-output/verificacao-final-retomada/fontes-sha256.json'))
const diferentes = Object.entries(anteriores).filter(([path, info]) => hash(readFileSync(path)) !== info.sha256).map(([path]) => path)
exigir(diferentes.length === 0, '22 fontes 3D aprovadas intactas', diferentes)
const resposta = await fetch(`${base}/models/pa34-camadas.glb`)
const recebido = hash(Buffer.from(await resposta.arrayBuffer()))
exigir(resposta.ok && recebido === '11776870db30eca87b4fefc1060315b245c3df1ccff37975c11aaa643e15c71a', 'Servidor entrega o GLB aprovado', recebido)
const tab = await fetch(`${cdp}/json/new?about:blank`, { method: 'PUT' }).then(r => r.json())
const socket = new WebSocket(tab.webSocketDebuggerUrl)
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject })
let seq = 0
const pendentes = new Map()
socket.onmessage = e => {
  const m = JSON.parse(e.data), p = pendentes.get(m.id)
  if (!p) return
  clearTimeout(p.timer); pendentes.delete(m.id)
  m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result)
}
const call = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++seq
  const timer = setTimeout(() => { pendentes.delete(id); reject(new Error(`Timeout: ${method}`)) }, 25000)
  pendentes.set(id, { resolve, reject, timer })
  socket.send(JSON.stringify({ id, method, params }))
})
async function avaliar(expression) {
  const r = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails))
  return r.result.value
}
async function esperar(expression) {
  await avaliar(`new Promise((resolve,reject)=>{const fim=performance.now()+20000;function checar(){if(${expression})resolve(true);else if(performance.now()>fim)reject(new Error('Condição não atingida'));else setTimeout(checar,50)}checar()})`)
}
async function link(path) {
  const clicou = await avaliar(`(()=>{const el=[...document.querySelectorAll('a')].find(a=>a.getAttribute('href')===${JSON.stringify(path)}); if(!el)return false;el.click();return true})()`)
  exigir(clicou, `Link interno ${path} encontrado`, clicou)
  await esperar(`location.pathname===${JSON.stringify(path)}`)
}
const palco = "document.querySelector('[aria-label^=\"Painel vetorial\"] svg > g[transform]')"
const titulo = "document.querySelector('[role=\"dialog\"] h3')?.textContent"
try {
  await call('Page.enable'); await call('Runtime.enable')
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
  await call('Page.navigate', { url: base })
  await esperar("document.querySelector('canvas') && performance.getEntriesByType('resource').some(r=>r.name.includes('/models/pa34-camadas.glb'))")
  exigir(true, 'Home carrega canvas e solicita modelo aprovado', await avaliar('location.pathname'))
  await link('/modelo-3d')
  await esperar("document.querySelector('canvas') && document.querySelectorAll('button[aria-label^=\"Remover camada\"]').length===9")
  await link('/cockpit')
  await esperar("document.querySelectorAll('[data-hotspot]').length===56 && document.querySelector('[data-panel-shape=\"curved-shell\"]')")
  exigir(true, 'Navegação 3D → cockpit novo sem recarregar', true)
  await avaliar("window.__integracaoMontagem=123;history.pushState({},'', '/cockpit?i=altimetro');dispatchEvent(new PopStateEvent('popstate'))")
  await esperar(`${titulo}==='Altímetro'`)
  await esperar(`${palco}?.getAttribute('transform')?.includes('scale')`)
  const inicial = await avaliar(`${palco}?.getAttribute('transform')`)
  await avaliar("history.pushState({},'', '/cockpit?i=navcom_1');dispatchEvent(new PopStateEvent('popstate'))")
  await esperar(`${titulo}==='NAV/COM nº 1'`)
  await esperar(`${palco}?.getAttribute('transform')!==${JSON.stringify(inicial)}`)
  exigir(await avaliar('window.__integracaoMontagem===123'), 'Troca reativa de deep-link e foco sem reload', true)
  await call('Emulation.setDeviceMetricsOverride', { width: 768, height: 1000, deviceScaleFactor: 1, mobile: false })
  await esperar(`innerWidth===768 && ${titulo}==='NAV/COM nº 1'`)
  const resize = await avaliar(`(()=>{const el=${palco};const r=el.getBoundingClientRect();return {transform:el.getAttribute('transform'),visivel:r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight,titulo:${titulo}}})()`)
  exigir(resize.visivel && resize.transform && resize.titulo==='NAV/COM nº 1', 'Resize preserva seleção e palco acessível', resize)
  await avaliar("history.pushState({},'', '/cockpit');dispatchEvent(new PopStateEvent('popstate'))")
  await esperar("!document.querySelector('[role=\"dialog\"]')")
  exigir(true, 'Remover query fecha seleção sem reload', true)
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
  await link('/modelo-3d')
  await esperar("document.querySelector('canvas') && document.querySelectorAll('button[aria-label^=\"Remover camada\"]').length===9")
  const controle = await avaliar("(()=>{const b=document.querySelector('button[aria-label=\"Remover camada COMBUSTÍVEL\"]');b.click();return true})()")
  await esperar("document.querySelector('button[aria-label=\"Adicionar camada COMBUSTÍVEL\"]')")
  exigir(controle && await avaliar("!document.querySelector('[role=\"dialog\"]')"), 'Retorno ao 3D preserva controles e não deixa drawer', true)
  await avaliar("document.querySelector('button[aria-label=\"Adicionar camada COMBUSTÍVEL\"]').click()")
  writeFileSync('_bmad-output/visual-review/restabelecimento-3d/integracao.json', JSON.stringify({ status: 'aprovado', origem: base, evidencias }, null, 2))
  console.log(JSON.stringify({ status: 'aprovado', evidencias }, null, 2))
} finally {
  socket.close()
  await fetch(`${cdp}/json/close/${tab.id}`)
}
