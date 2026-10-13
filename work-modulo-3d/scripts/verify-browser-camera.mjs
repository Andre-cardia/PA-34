// Ensaios independentes de carregamento lento, demanda e gestos; Chrome CDP já iniciado.
import {writeFileSync,mkdirSync} from 'node:fs'
const port=process.env.CDP_PORT||'9228',base=process.env.APP_URL||'http://127.0.0.1:4173'
const output=process.env.REVIEW_OUTPUT||'./test-artifacts/browser-camera'
mkdirSync(output,{recursive:true})
const target=await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'}).then(r=>r.json())
const ws=new WebSocket(target.webSocketDebuggerUrl),pending=new Map(),errors=[]
let sequence=0,delayAsset=false,holdAsset=false
const heldRequests=[]
let assetPaused=null
ws.onmessage=event=>{const m=JSON.parse(event.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description);if(m.method==='Fetch.requestPaused'){const requestId=m.params.requestId;if(holdAsset){heldRequests.push(requestId);assetPaused?.()}else setTimeout(()=>call('Fetch.continueRequest',{requestId}).catch(e=>errors.push(String(e))),delayAsset?5500:0)}if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result)}}
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject})
function call(method,params={}){return new Promise((resolve,reject)=>{const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(new Error('Tempo excedido '+method))},35000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}))})}
async function evaluate(expression){const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value}
async function waitFor(expression,ms=25000){return evaluate(`new Promise((resolve,reject)=>{const end=performance.now()+${ms};function check(){if(${expression})return resolve(true);if(performance.now()>end)return reject(new Error('Estado não atingido'));requestAnimationFrame(check)}check()})`)}
async function settle(ms){return evaluate(`new Promise(resolve=>{const end=performance.now()+${ms};function check(){performance.now()>end?resolve(true):requestAnimationFrame(check)}check()})`)}
async function ready(){await waitFor("document.querySelector('canvas')&&performance.getEntriesByType('resource').some(e=>e.name.includes('@react-three_fiber.js'))");await evaluate(`(async()=>{const url=performance.getEntriesByType('resource').map(e=>e.name).find(u=>u.includes('@react-three_fiber.js'));const fiber=await import(url);return new Promise((resolve,reject)=>{const end=performance.now()+25000;function check(){const root=fiber._roots.get(document.querySelector('canvas'));let meshes=0;root?.store.getState().scene.traverse(o=>{if(o.userData.componenteId)meshes++});if(meshes)return resolve(true);if(performance.now()>end)return reject(new Error('Malhas não carregaram'));requestAnimationFrame(check)}check()})})()`)}
async function state(component='motor_esquerdo'){return evaluate(`(async()=>{const url=performance.getEntriesByType('resource').map(e=>e.name).find(u=>u.includes('@react-three_fiber.js'));const s=(await import(url))._roots.get(document.querySelector('canvas')).store.getState();s.scene.updateMatrixWorld(true);let bounds=null;s.scene.traverse(o=>{if(!o.isMesh||o.userData.componenteId!==${JSON.stringify(component)})return;o.geometry.computeBoundingBox();const b=o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);if(bounds)bounds.union(b);else bounds=b});return {position:s.camera.position.toArray(),frame:s.gl.info.render.frame,radius:s.camera.position.distanceTo(s.controls.target),target:s.controls.target.toArray(),componentCenter:bounds?.getCenter(s.camera.position.clone()).toArray(),focusDistance:bounds?s.controls.target.distanceTo(bounds.getCenter(s.camera.position.clone())):null}})()`)}
async function autoOff(){await evaluate("(()=>{const b=document.querySelector('button[aria-label=\"AUTO-ROT\"]');if(b?.getAttribute('aria-pressed')==='true')b.click()})()")}
async function clickLabel(label){const ok=await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===${JSON.stringify(label)});if(!b)return false;b.click();return true})()`);if(!ok)throw new Error('Controle ausente '+label)}
async function materials(){return evaluate(`(async()=>{const url=performance.getEntriesByType('resource').map(e=>e.name).find(u=>u.includes('@react-three_fiber.js'));const s=(await import(url))._roots.get(document.querySelector('canvas')).store.getState();const rows=[];s.scene.traverse(o=>{if(o.isMesh&&o.userData.componenteId)rows.push({id:o.uuid,layer:o.userData.camada,opacity:(Array.isArray(o.material)?o.material:[o.material]).map(m=>m.opacity)})});return rows})()`)}
const report={cases:[],errors}
async function test(name,fn){try{const data=await fn();report.cases.push({name,passed:true,...data})}catch(e){report.cases.push({name,passed:false,error:String(e)})}}
try{
 await call('Page.enable');await call('Runtime.enable');await call('Network.enable');await call('Network.setCacheDisabled',{cacheDisabled:true})
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false})
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]})
 await test('foco com GLB atrasado 5,5 segundos',async()=>{
  delayAsset=true;await call('Fetch.enable',{patterns:[{urlPattern:'*pa34-camadas.glb*',requestStage:'Request'}]})
  await call('Page.navigate',{url:`${base}/modelo-3d?camada=motores&c=motor_esquerdo&force3d=1&nointro=1`})
  await ready();await settle(2100);const s=await state();await call('Fetch.disable');delayAsset=false
  if(!Number.isFinite(s.focusDistance)||s.focusDistance>.08)throw new Error(JSON.stringify(s));return s
 })
 await test('parâmetros e isolamento ao limpar seleção',async()=>{
  if(!await evaluate("document.body.innerText.includes('SAIR DO ISOLADO')"))throw new Error('Pré-condição de isolamento ausente')
  await evaluate("[...document.querySelectorAll('[role=dialog] button')].find(b=>b.textContent.includes('SAIR DO ISOLADO')).click()")
  await settle(300);const baseline=await materials()
  await evaluate("[...document.querySelectorAll('[role=dialog] button')].find(b=>b.textContent.includes('ISOLAR COMPONENTE')).click()")
  await settle(300);const isolated=await materials()
  if(!isolated.some((row,i)=>row.layer!=='motores'&&row.opacity.some((v,j)=>v<baseline[i].opacity[j]*.1)))throw new Error('Isolamento não reduziu opacidades reais')
  const closed=await evaluate("(()=>{const b=document.querySelector('button[aria-label=\"Fechar painel\"]');if(!b)return false;b.click();return true})()")
  if(!closed)throw new Error('Ficha esperada ausente')
  // O Drawer sai com spring, não com duração fixa de 400 ms.
  await waitFor("!document.querySelector('[role=dialog]')",3000)
  const restored=await materials(),originals=new Map(baseline.map(row=>[row.id,row]))
  if(restored.length!==baseline.length||restored.some(row=>{const prior=originals.get(row.id);return !prior||row.opacity.length!==prior.opacity.length||row.opacity.some((v,i)=>!Number.isFinite(v)||Math.abs(v-prior.opacity[i])>.003)}))throw new Error('Fechar drawer não restaurou opacidades reais')
  const value=await evaluate("({query:location.search,dialog:!!document.querySelector('[role=dialog]')})")
  value.restoredMaterials=restored.length
  if(!value.query.includes('force3d=1')||!value.query.includes('nointro=1')||value.query.includes('camada=')||value.dialog)throw new Error(JSON.stringify(value));return value
 })
 await test('preset durante GLB bloqueado cancela foco antigo',async()=>{
  holdAsset=true
  let timer
  const paused=new Promise((resolve,reject)=>{assetPaused=resolve;timer=setTimeout(()=>reject(new Error('GLB não interceptado')),12000)})
  try{
   await call('Fetch.enable',{patterns:[{urlPattern:'*pa34-camadas.glb*',requestStage:'Request'}]})
   await call('Page.navigate',{url:`${base}/modelo-3d?camada=motores&c=motor_esquerdo&nointro=1`})
   await paused;clearTimeout(timer)
   await waitFor("document.querySelector('button[aria-label=\"Vista FRONTAL\"]')&&document.querySelector('#drawer-title')")
   await autoOff();await clickLabel('Vista FRONTAL');await settle(2200)
   const before=await state()
   if(before.componentCenter!==undefined&&before.componentCenter!==null)throw new Error('Malha carregou antes do preset')
   holdAsset=false;for(const requestId of heldRequests.splice(0))await call('Fetch.continueRequest',{requestId})
   await ready()
   const samples=[]
   for(let i=0;i<12;i++){await settle(250);const current=await state();samples.push(current);if(!Number.isFinite(current.focusDistance)||current.focusDistance<.15||(i>=8&&(current.position[0]-current.target[0]<current.radius*.9||Math.abs(current.position[2]-current.target[2])>current.radius*.1)))throw new Error('Foco antigo assumiu após preset: '+JSON.stringify({before,current}))}
   return {intercepted:true,before,samples}
  }finally{clearTimeout(timer);assetPaused=null;holdAsset=false;for(const requestId of heldRequests.splice(0))await call('Fetch.continueRequest',{requestId});await call('Fetch.disable')}
 })
 await call('Fetch.disable');delayAsset=false
 await call('Page.navigate',{url:`${base}/modelo-3d?nointro=1`})
 await ready();await autoOff();await settle(3300)
 await test('preset real sem seleção',async()=>{
  if(await evaluate("!!document.querySelector('[role=dialog]')"))throw new Error('Pré-condição sem seleção ausente')
  await clickLabel('Vista FRONTAL');await settle(2200);const frontal=await state()
  if(!Number.isFinite(frontal.radius)||frontal.position[0]-frontal.target[0]<frontal.radius*.9||Math.abs(frontal.position[2]-frontal.target[2])>frontal.radius*.1)throw new Error('Preset sem seleção não moveu câmera: '+JSON.stringify(frontal))
  await clickLabel('Vista 3/4');await settle(2200)
  return {frontal}
 })
 await test('labels desligados/religados em canvas parado',async()=>{
  const condition="document.querySelectorAll('[data-model-label]').length>0"
  await clickLabel('RÓTULOS');await waitFor(condition,2500)
  await clickLabel('RÓTULOS');await settle(35)
  await clickLabel('RÓTULOS');await waitFor(condition,2500)
  await clickLabel('RÓTULOS');return {reenabled:true}
 })
 await test('gesto de zoom durante ajuste automático',async()=>{
  await settle(2300)
  const label=await evaluate("[...document.querySelectorAll('button[aria-label]')].map(b=>b.getAttribute('aria-label')).find(s=>s==='Remover camada SISTEMA ELÉTRICO')")
  await clickLabel(label);const before=await state()
  const point=await evaluate("(()=>{const r=document.querySelector('canvas').getBoundingClientRect();return {x:r.left+r.width*.45,y:r.top+r.height*.65}})()")
  await call('Input.dispatchMouseEvent',{type:'mouseWheel',...point,deltaX:0,deltaY:-450})
  await settle(800);const after=await state()
  if(after.radius>=before.radius*.96)throw new Error(JSON.stringify({before,after}));return {before:before.radius,after:after.radius}
 })
 await test('todas camadas ocultas não mantém render ocioso',async()=>{
  await evaluate("[...document.querySelectorAll('button[aria-label]')].filter(b=>b.getAttribute('aria-label').startsWith('Remover camada ')).forEach(b=>b.click())")
  await autoOff();await settle(3200);const before=await state();await settle(550);const after=await state();const frames=after.frame-before.frame
  if(frames>3)throw new Error('Frames ociosos: '+frames);return {idleFrames:frames}
 })
 console.log(JSON.stringify(report,null,2));if(report.cases.some(c=>!c.passed)||errors.length)process.exitCode=1
}finally{await call('Fetch.disable').catch(()=>{});writeFileSync(`${output}/report.json`,JSON.stringify(report,null,2));ws.close();await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`).catch(()=>{})}
