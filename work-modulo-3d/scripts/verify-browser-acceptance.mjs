// Verificação independente via Chrome DevTools; não modifica a aplicação.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
const catalog = JSON.parse(readFileSync(new URL('../src/data/componentes_3d.json', import.meta.url), 'utf8'))
const port = process.env.CDP_PORT || '9228'
const base = process.env.APP_URL || 'http://127.0.0.1:4173'
const output = process.env.REVIEW_OUTPUT || './test-artifacts/browser-acceptance'
mkdirSync(output, { recursive: true })
const target = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' }).then(r => r.json())
if (!target) throw new Error('Chrome sem página para revisão')
const socket = new WebSocket(target.webSocketDebuggerUrl)
const pending = new Map()
let sequence = 0
let expectedAssetFailure = false
const exceptions = [], consoleErrors = [], requests = []
socket.onmessage = event => {
  const message = JSON.parse(event.data)
  if (message.method === 'Runtime.exceptionThrown') exceptions.push({ ...message.params.exceptionDetails, expectedAssetFailure })
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') consoleErrors.push(message.params.args.map(a => a.value ?? a.description))
  if (message.method === 'Network.requestWillBeSent') requests.push(message.params.request.url)
  if (message.id && pending.has(message.id)) {
    const item = pending.get(message.id)
    pending.delete(message.id)
    clearTimeout(item.timer)
    message.error ? item.reject(new Error(JSON.stringify(message.error))) : item.resolve(message.result)
  }
}
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject })
function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Tempo excedido: ${method}`)) }, 25000)
    pending.set(id, { resolve, reject, timer })
    socket.send(JSON.stringify({ id, method, params }))
  })
}
async function evaluate(expression) {
  const data = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (data.exceptionDetails) throw new Error(JSON.stringify(data.exceptionDetails))
  return data.result.value
}
async function waitFor(expression, timeout = 20000) {
  return evaluate(`new Promise((resolve,reject)=>{ const end=performance.now()+${timeout}; function check(){ if(${expression}) return resolve(true); if(performance.now()>end) return reject(new Error('Condição visual não atingida')); requestAnimationFrame(check) } check() })`)
}
async function settle() {
  await evaluate('new Promise(resolve=>{ const end=performance.now()+1800; function step(){performance.now()>end?resolve(true):requestAnimationFrame(step)}step()})')
}
async function sceneSnapshot() {
  return evaluate(`(async()=>{
    const url=performance.getEntriesByType('resource').map(r=>r.name).find(n=>n.includes('@react-three_fiber.js'));
    if(!url)throw new Error('Módulo R3F ausente no preview de desenvolvimento');
    const fiber=await import(url);
    const root=fiber._roots.get(document.querySelector('canvas'));
    if(!root)throw new Error('Cena R3F indisponível');
    const state=root.store.getState(); const parts=[]; const materials=new Map();
    state.scene.updateMatrixWorld(true);
    state.scene.traverse(object=>{
      if(!object.isMesh)return;
      let componentId=null,layerId=null,ancestor=object,visible=true;
      while(ancestor){
        componentId??=ancestor.userData.componentId??ancestor.userData.componenteId;
        layerId??=ancestor.userData.layerId??ancestor.userData.camada;
        visible=visible&&ancestor.visible; ancestor=ancestor.parent;
      }
      if(!componentId)return;
      const materialList=Array.isArray(object.material)?object.material:[object.material];
      for(const m of materialList)materials.set(m.uuid,{name:m.name,color:m.color?.getHexString(),map:!!m.map,transparent:m.transparent,opacity:m.opacity,metalness:m.metalness,roughness:m.roughness});
      const meshVisible=visible&&materialList.some(m=>m.visible&&m.opacity>0.01);
      const geometry=object.geometry;
      if(!geometry.boundingBox)geometry.computeBoundingBox();
      const box=geometry.boundingBox; let clipped=false;
      if(box)for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
        const point=box.min.clone().set(x,y,z).applyMatrix4(object.matrixWorld).project(state.camera);
        if(Math.abs(point.x)>1.02||Math.abs(point.y)>1.02||point.z>1||point.z< -1)clipped=true;
      }
      parts.push({name:object.name,componentId,layerId,opacity:Math.max(...materialList.map(m=>m.opacity)),visible:meshVisible,clipped,triangles:(geometry.index?.count??geometry.attributes.position?.count??0)/3,matrix:object.matrixWorld.toArray()});
    });
    return {parts,materials:[...materials.values()],components:[...new Set(parts.map(p=>p.componentId))],layers:[...new Set(parts.map(p=>p.layerId))],drawCalls:state.gl.info.render.calls,triangles:state.gl.info.render.triangles};
  })()`)
}
async function capture(name) {
  const data = await call('Page.captureScreenshot', { format: 'png', fromSurface: true })
  writeFileSync(`${output}/${name}.png`, Buffer.from(data.data, 'base64'))
}
async function clickLabel(label) {
  const result = await evaluate(`(()=>{ const button=[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===${JSON.stringify(label)}); if(!button)return false; button.click(); return true })()`)
  if (!result) throw new Error(`Controle não encontrado: ${label}`)
}
const summary = { viewports: [], layers: [], exceptions, consoleErrors, requests }
try {
  await call('Page.enable'); await call('Runtime.enable'); await call('Network.enable')
  await call('Network.setCacheDisabled', { cacheDisabled: true })
  await call('Emulation.setEmulatedMedia', { features: [{ name:'prefers-reduced-motion', value:'no-preference' }] })
  await call('Emulation.setDeviceMetricsOverride', { width:1440, height:1000, deviceScaleFactor:1, mobile:false })
  await call('Page.navigate', { url:`${base}/modelo-3d?nointro=1` })
  await waitFor("document.querySelector('canvas') && document.body.innerText.includes('CAMADAS')")
  await waitFor("!document.querySelector('[role=status]') && performance.getEntriesByType('resource').some(e=>e.name.includes('pa34-camadas.glb'))")
  await waitFor("performance.now() > 2600 && !document.body.innerText.includes('CATÁLOGO: 9 CAMADAS')")
  await settle()
  const autorot = await evaluate("(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('AUTO-ROT')); if(b && b.getAttribute('aria-pressed')==='true')b.click(); return !!b})()")
  summary.autoRotateControl = autorot
  await capture('01-montado')
  summary.scene = await sceneSnapshot()
  if (process.env.EXPECT_COMPLETE === '1' && (summary.scene.components.length !== 68 || summary.scene.layers.length !== 9)) throw new Error('Cobertura incompleta de componentes/camadas na cena montada')
  const controls = await evaluate("[...document.querySelectorAll('button[aria-label]')].map(b=>b.getAttribute('aria-label')).filter(t=>/^(Adicionar|Remover) camada /.test(t))")
  for (const original of controls) {
    const label = original.replace(/^(Adicionar|Remover) camada /, '')
    const current = await evaluate(`(()=>{const b=[...document.querySelectorAll('button[aria-label]')].find(b=>b.getAttribute('aria-label').endsWith(${JSON.stringify('camada ' + label)}));return b?.getAttribute('aria-label')})()`)
    if (!current) throw new Error(`Camada ausente: ${label}`)
    const beforeScene = await sceneSnapshot()
    await clickLabel(current)
    await settle()
    const afterScene = await sceneSnapshot()
    const beforeVisible = beforeScene.parts.filter(p=>p.visible).length
    const afterVisible = afterScene.parts.filter(p=>p.visible).length
    if (beforeVisible === afterVisible) throw new Error(`Toggle alterou UI mas não a geometria visível: ${label}`)
    const after = await evaluate(`(()=>{const b=[...document.querySelectorAll('button[aria-label]')].find(b=>b.getAttribute('aria-label').endsWith(${JSON.stringify('camada ' + label)}));return b?.getAttribute('aria-label')})()`)
    if (after === current) throw new Error(`Toggle não mudou: ${label}`)
    summary.layers.push({ label, before:current, after, beforeVisible, afterVisible })
    await clickLabel(after)
    await settle()
  }
  async function clickText(text) {
    const found=await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.replace(/\\s+/g,' ').trim()===${JSON.stringify(text)});if(!b)return false;b.click();return true})()`)
    if(!found)throw new Error(`Botão ausente: ${text}`)
  }
  const assembled=await sceneSnapshot()
  await clickText('EXPLODIR TUDO')
  await settle()
  await capture('02-explodido')
  const exploded=await sceneSnapshot()
  summary.explosion={moved:exploded.parts.filter((p,i)=>p.matrix.some((v,j)=>Math.abs(v-assembled.parts[i].matrix[j])>.01)).length,clipped:exploded.parts.filter(p=>p.visible&&p.clipped).map(p=>p.componentId)}
  if(!summary.explosion.moved)throw new Error('Explosão não deslocou peças')
  if(summary.explosion.clipped.length)throw new Error('Explosão recortada: '+summary.explosion.clipped.join(', '))
  await clickText('FECHAR TUDO')
  await settle()
  const restored=await sceneSnapshot()
  summary.explosion.restored=restored.parts.every((p,i)=>p.matrix.every((v,j)=>Math.abs(v-assembled.parts[i].matrix[j])<.01))
  if(!summary.explosion.restored)throw new Error('Recomposição não restaurou as posições')
  async function toggleXray(){const found=await evaluate("(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('RAIO-X'));if(!b)return false;b.click();return true})()");if(!found)throw new Error('Controle raio-X ausente');await settle()}
  await toggleXray()
  const transparentScene=await sceneSnapshot()
  summary.xray={exteriorReduced:transparentScene.parts.filter((p,i)=>p.layerId==='exterior'&&p.opacity<restored.parts[i].opacity*.5).length}
  if(!summary.xray.exteriorReduced)throw new Error('Raio-X não tornou a pele transparente')
  await toggleXray()
  const opaqueScene=await sceneSnapshot()
  summary.xray.restored=opaqueScene.parts.every((p,i)=>Math.abs(p.opacity-restored.parts[i].opacity)<.01)
  if(!summary.xray.restored)throw new Error('Raio-X não restaurou opacidades autorais')
  for (const width of [1440,768,390]) {
    await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width===390})
    await settle()
    const viewport=await evaluate(`({width:${width},canvas:!!document.querySelector('canvas'),overflow:document.documentElement.scrollWidth>innerWidth+1})`)
    const scene=await sceneSnapshot()
    viewport.clippedComponents=[...new Set(scene.parts.filter(p=>p.visible&&p.clipped).map(p=>p.componentId))]
    summary.viewports.push(viewport)
    await capture(`viewport-${width}`)
    if(viewport.clippedComponents.length)throw new Error(`Viewport ${width} recortado: ${viewport.clippedComponents.join(', ')}`)
  }
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
  await call('Page.navigate',{url:`${base}/modelo-3d?nointro=1`})
  await waitFor("document.body.innerText.includes('MOVIMENTO REDUZIDO')")
  summary.reducedMotion = await evaluate("({canvas:!!document.querySelector('canvas'),text:document.body.innerText.includes('MOVIMENTO REDUZIDO')})")
  await capture('movimento-reduzido')
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]})
  const injected = await call('Page.addScriptToEvaluateOnNewDocument', { source: `const originalGetContext=HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext=function(kind,...args){ if(['webgl','webgl2','experimental-webgl'].includes(kind))return null; return originalGetContext.call(this,kind,...args) }` })
  await call('Page.navigate',{url:`${base}/modelo-3d?nointro=1`})
  await waitFor("document.body.innerText.includes('WEBGL INDISPONÍVEL')")
  summary.noWebGL = await evaluate("({canvas:!!document.querySelector('canvas'),text:document.body.innerText.includes('WEBGL INDISPONÍVEL')})")
  await capture('sem-webgl')
  await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:injected.identifier})
  expectedAssetFailure=true
  await call('Network.setBlockedURLs',{urls:['*pa34-camadas.glb*']})
  await call('Page.navigate',{url:`${base}/modelo-3d?nointro=1`})
  await waitFor("document.body.innerText.includes('FALHA AO CARREGAR A MALHA')")
  summary.assetFailure=await evaluate("({canvas:!!document.querySelector('canvas'),message:document.body.innerText.includes('FALHA AO CARREGAR A MALHA'),componentControls:document.querySelectorAll('button').length})")
  const lastComponent=catalog.camadas.at(-1).componentes.at(-1)
  const fallbackPoint=await evaluate(`(()=>{const b=[...document.querySelectorAll('section button')].find(b=>b.querySelector('span')?.textContent===${JSON.stringify(lastComponent.nome)});if(!b)throw new Error('Último componente ausente no fallback');b.scrollIntoView({block:'center',behavior:'instant'});return true})()`)
  await settle()
  const point=await evaluate(`(()=>{const b=[...document.querySelectorAll('section button')].find(b=>b.querySelector('span')?.textContent===${JSON.stringify(lastComponent.nome)});const r=b.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;return {x,y,reachable:x>=0&&x<innerWidth&&y>=0&&y<innerHeight&&b.contains(document.elementFromPoint(x,y)),scrolled:[...document.querySelectorAll('*')].some(e=>e.scrollTop>0)}})()`)
  if(!fallbackPoint||!point.reachable||!point.scrolled)throw new Error('Último componente não alcançável por rolagem: '+JSON.stringify(point))
  await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x,y:point.y})
  await call('Input.dispatchMouseEvent',{type:'mousePressed',x:point.x,y:point.y,button:'left',clickCount:1})
  await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:point.x,y:point.y,button:'left',clickCount:1})
  await waitFor(`document.querySelector('#drawer-title')?.textContent===${JSON.stringify(lastComponent.nome)}`)
  summary.assetFailure.lastComponent={id:lastComponent.id,selected:true,...point}
  await capture('falha-ativo')
  await call('Network.setBlockedURLs',{urls:[]})
  summary.unexpectedExceptions=exceptions.filter(e=>!e.expectedAssetFailure||!/Could not load|Failed to fetch|pa34-camadas\\.glb/.test(e.exception?.description??''))
  summary.remoteDecoders = requests.filter(url=>/draco|decoder/i.test(url) && !url.startsWith(base) && !url.startsWith('blob:'))
  console.log(JSON.stringify({ ...summary, exceptions: exceptions.length, consoleErrors: consoleErrors.length, scene: summary.scene ? { components:summary.scene.components.length, layers:summary.scene.layers.length, meshes:summary.scene.parts.length, materials:summary.scene.materials.length, drawCalls:summary.scene.drawCalls, triangles:summary.scene.triangles } : null, requests: `${requests.length} requisições registradas no relatório` }, null, 2))
  if (summary.unexpectedExceptions.length || summary.remoteDecoders.length || summary.viewports.some(v=>v.overflow || !v.canvas)) process.exitCode = 1
} finally {
  await call('Network.setBlockedURLs',{urls:[]}).catch(()=>{})
  writeFileSync(`${output}/report.json`,JSON.stringify(summary,null,2))
  socket.close()
  await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`).catch(()=>{})
}
