import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
const port=process.env.CDP_PORT||'9228',base=process.env.APP_URL||'http://127.0.0.1:4173'
const output=process.env.REVIEW_OUTPUT||'./test-artifacts/browser-selection'
mkdirSync(output,{recursive:true})
const catalog=JSON.parse(readFileSync(new URL('../src/data/componentes_3d.json',import.meta.url),'utf8'))
const target=await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'}).then(r=>r.json())
const ws=new WebSocket(target.webSocketDebuggerUrl),pending=new Map(),errors=[]
let id=0
ws.onmessage=event=>{const m=JSON.parse(event.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result)}}
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject})
function call(method,params={}){return new Promise((resolve,reject)=>{const key=++id;const timer=setTimeout(()=>{pending.delete(key);reject(new Error('Tempo excedido '+method))},30000);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params}))})}
async function evaluate(expression){const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value}
async function waitFor(expression){return evaluate(`new Promise((resolve,reject)=>{const end=performance.now()+20000;function check(){if(${expression})return resolve(true);if(performance.now()>end)return reject(new Error('Estado não atingido'));requestAnimationFrame(check)}check()})`)}
async function settle(ms=600){return evaluate(`new Promise(resolve=>{const end=performance.now()+${ms};function step(){performance.now()>end?resolve(true):requestAnimationFrame(step)}step()})`)}
async function geometry(component){return evaluate(`(async()=>{const url=performance.getEntriesByType('resource').map(e=>e.name).find(u=>u.includes('@react-three_fiber.js'));if(!url)return null;const r=(await import(url))._roots.get(document.querySelector('canvas'));if(!r)return null;const state=r.store.getState();let meshes=0,highlighted=0;const materials=[];state.scene.traverse(o=>{if(!o.isMesh||o.userData.componenteId!==${JSON.stringify(component)})return;meshes++;for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.push({type:m.type,opacity:m.opacity,emissiveIntensity:m.emissiveIntensity,base:m.userData.baseEmissiveIntensity});if(m.emissiveIntensity-(m.userData.baseEmissiveIntensity??0)>.53)highlighted++}});return {meshes,highlighted,materials,camera:state.camera.position.toArray()}})()`)}
async function isolationSnapshot(){return evaluate(`(async()=>{const url=performance.getEntriesByType('resource').map(e=>e.name).find(u=>u.includes('@react-three_fiber.js'));const state=(await import(url))._roots.get(document.querySelector('canvas')).store.getState();const rows=[];state.scene.traverse(o=>{if(!o.isMesh||!o.userData.componenteId)return;let visible=true;for(let p=o;p;p=p.parent)visible=visible&&p.visible;rows.push({id:o.uuid,layer:o.userData.camada,visible,opacity:(Array.isArray(o.material)?o.material:[o.material]).map(m=>m.opacity)})});return rows})()`)}
function assertIsolation(before,after,layer){
  if(!before.length||before.length!==after.length)throw new Error('Isolamento alterou quantidade de malhas')
  const previous=new Map(before.map(row=>[row.id,row]));let target=0,dimmed=0
  for(const row of after){
    const prior=previous.get(row.id)
    if(!prior||row.opacity.length!==prior.opacity.length)throw new Error('Isolamento substituiu geometria/materiais')
    const factor=row.layer===layer?1:.06
    if(prior.visible&&row.visible!==prior.visible)throw new Error('Isolamento removeu malha em vez de preservar contexto')
    row.opacity.forEach((opacity,i)=>{if(!Number.isFinite(opacity)||Math.abs(opacity-prior.opacity[i]*factor)>.003)throw new Error('Opacidade de isolamento incorreta: '+row.layer)})
    if(prior.visible&&prior.opacity.some(n=>n>.01)){if(row.layer===layer)target++;else dimmed++}
  }
  if(!target||!dimmed)throw new Error('Ensaio sem geometria alvo/contexto')
  return {target,dimmed,meshCount:after.length}
}
async function focusConverged(component){return evaluate(`(async()=>{const url=performance.getEntriesByType('resource').map(e=>e.name).find(u=>u.includes('@react-three_fiber.js'));const fiber=await import(url);return new Promise((resolve,reject)=>{const end=performance.now()+15000;let stableSince=null,last=null;function check(){const s=fiber._roots.get(document.querySelector('canvas'))?.store.getState();let bounds=null;s?.scene.updateMatrixWorld(true);s?.scene.traverse(o=>{if(!o.isMesh||o.userData.componenteId!==${JSON.stringify(component)})return;if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();const b=o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);if(bounds)bounds.union(b);else bounds=b});const center=bounds?.getCenter(s.camera.position.clone()),distance=center&&s.controls?.target.distanceTo(center);last={focusDistance:distance,componentCenter:center?.toArray(),target:s?.controls?.target.toArray()};if(Number.isFinite(distance)&&distance<.08){stableSince??=performance.now();if(performance.now()-stableSince>300)return resolve(last)}else stableSince=null;if(performance.now()>end)return reject(new Error('Foco não convergiu: '+JSON.stringify(last)));requestAnimationFrame(check)}check()})})()`)}
async function clickText(text){const ok=await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)});if(!b)return false;b.click();return true})()`);if(!ok)throw new Error('Botão ausente: '+text)}
async function clickLabel(label){const ok=await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===${JSON.stringify(label)});if(!b)return false;b.click();return true})()`);if(!ok)throw new Error('Controle ausente: '+label)}
const report={components:[],layers:[],pointerRegressions:[],errors}
try{
  await call('Page.enable');await call('Runtime.enable')
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false})
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]})
  for(const layer of catalog.camadas){
    const first=layer.componentes[0]
    await call('Page.navigate',{url:`${base}/modelo-3d?camada=${layer.id}&c=${first.id}`})
    await waitFor(`document.querySelector('#drawer-title')?.textContent===${JSON.stringify(first.nome)}&&document.querySelector('canvas')`)
    await waitFor("performance.getEntriesByType('resource').some(e=>e.name.includes('pa34-camadas.glb'))")
    for(let i=0;i<layer.componentes.length;i++){
      const component=layer.componentes[i]
      if(i){const click=await evaluate(`(()=>{const b=[...document.querySelectorAll('[role=dialog] button')].find(b=>b.textContent.trim()===${JSON.stringify(component.nome)});if(!b)return false;b.click();return true})()`);if(!click)throw new Error('Navegação ausente: '+component.id)}
      await waitFor(`document.querySelector('#drawer-title')?.textContent===${JSON.stringify(component.nome)}`)
      const focus=await focusConverged(component.id)
      const state=await geometry(component.id)
      report.components.push({id:component.id,layer:layer.id,...state,...focus})
      if(!state?.meshes||!state.highlighted)throw new Error('Seleção sem geometria destacada: '+component.id)
    }
    const initiallyIsolated=await evaluate("document.body.innerText.includes('SAIR DO ISOLADO')")
    if(initiallyIsolated){
      await evaluate("[...document.querySelectorAll('[role=dialog] button')].find(b=>b.textContent.includes('SAIR DO ISOLADO')).click()")
      await waitFor("document.body.innerText.includes('ISOLAR CAMADA')")
    }
    await settle()
    const beforeIsolation=await isolationSnapshot()
    const isolated=await evaluate("(()=>{const b=[...document.querySelectorAll('[role=dialog] button')].find(b=>b.textContent.includes('ISOLAR CAMADA'));if(!b)return false;b.click();return true})()")
    if(!isolated)throw new Error('Isolamento ausente '+layer.id)
    await waitFor("document.body.innerText.includes('SAIR DO ISOLADO')")
    await settle()
    const isolatedGeometry=assertIsolation(beforeIsolation,await isolationSnapshot(),layer.id)
    await evaluate("[...document.querySelectorAll('[role=dialog] button')].find(b=>b.textContent.includes('SAIR DO ISOLADO')).click()")
    await waitFor("document.body.innerText.includes('ISOLAR CAMADA')")
    await settle()
    const restoredGeometry=await isolationSnapshot(),originals=new Map(beforeIsolation.map(row=>[row.id,row]))
    if(restoredGeometry.length!==beforeIsolation.length)throw new Error('Retorno do isolamento alterou quantidade de malhas')
    for(const row of restoredGeometry){const prior=originals.get(row.id);if(!prior||row.visible!==prior.visible||row.opacity.length!==prior.opacity.length||row.opacity.some((value,i)=>!Number.isFinite(value)||Math.abs(value-prior.opacity[i])>.003))throw new Error('Retorno do isolamento não restaurou materiais')}
    report.layers.push({id:layer.id,deepLink:true,navigation:true,isolationControl:true,isolatedGeometry,restored:true})
  }
  await call('Page.navigate',{url:`${base}/modelo-3d?camada=invalida&c=nao-existe`})
  await waitFor("document.querySelector('canvas')&&document.body.innerText.includes('CAMADAS')")
  report.invalidQuery=await evaluate("({canvas:!!document.querySelector('canvas'),dialog:!!document.querySelector('[role=dialog]')})")
  if(report.invalidQuery.dialog)throw new Error('Query inválida abriu ficha incorreta')
  await waitFor("!document.querySelector('[role=status]') && performance.getEntriesByType('resource').some(e=>e.name.includes('pa34-camadas.glb'))")
  await settle()
  await evaluate("(()=>{const b=document.querySelector('button[aria-label=\"AUTO-ROT\"]');if(b?.getAttribute('aria-pressed')==='true')b.click()})()")
  async function pointerRegression(name,requiredLayer=null){
  await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1})
  const pick=await evaluate(`(async()=>{const url=performance.getEntriesByType('resource').map(e=>e.name).find(u=>u.includes('@react-three_fiber.js'));const canvas=document.querySelector('canvas');const state=(await import(url))._roots.get(canvas).store.getState();const rect=canvas.getBoundingClientRect();state.scene.updateMatrixWorld(true);for(const y of [0,-.1,.1,-.2,.2,-.3,.3,-.4,.4,-.5,.5])for(const x of [0,-.1,.1,-.2,.2,-.3,.3,-.4,.4,-.5,.5,-.6,.6]){state.raycaster.setFromCamera({x,y},state.camera);const hit=state.raycaster.intersectObject(state.scene,true).find(h=>{if(!h.object.userData.componenteId)return false;let o=h.object;while(o){if(!o.visible)return false;o=o.parent}return true});const cx=rect.left+(x+1)*rect.width/2,cy=rect.top+(1-y)*rect.height/2;if(hit&&(!${JSON.stringify(requiredLayer)}||hit.object.userData.camada===${JSON.stringify(requiredLayer)})&&document.elementFromPoint(cx,cy)===canvas)return {component:hit.object.userData.componenteId,mesh:hit.object.uuid,matrix:hit.object.matrixWorld.toArray(),x:cx,y:cy}}return null})()`)
  if(!pick)throw new Error('Nenhuma peça visível disponível para clique de ponteiro')
  await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:pick.x,y:pick.y})
  const hoverName=catalog.camadas.flatMap(l=>l.componentes).find(c=>c.id===pick.component).nome
  await waitFor(`[...document.querySelectorAll('div.whitespace-nowrap')].some(e=>e.className.includes('bg-abyss')&&e.textContent.trim()===${JSON.stringify(hoverName)})`)
  await call('Input.dispatchMouseEvent',{type:'mousePressed',x:pick.x,y:pick.y,button:'left',clickCount:1})
  await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:pick.x,y:pick.y,button:'left',clickCount:1})
  const pickedName=catalog.camadas.flatMap(l=>l.componentes).find(c=>c.id===pick.component).nome
  await waitFor(`document.querySelector('#drawer-title')?.textContent===${JSON.stringify(pickedName)}`)
  const focus=await focusConverged(pick.component)
  report.pointerRegressions.push({name,component:pick.component,title:pickedName,hover:true,...focus})
  return pick
  }
  async function closeSelection(){await clickLabel('Fechar painel');await waitFor("!document.querySelector('[role=dialog]')");await settle(2400)}
  await pointerRegression('initial');await closeSelection()
  const exteriorLabel=await evaluate("[...document.querySelectorAll('button[aria-label]')].map(b=>b.getAttribute('aria-label')).find(s=>s.startsWith('Remover camada ')&&s.includes('EXTERIOR'))")
  if(!exteriorLabel)throw new Error('Controle exterior ausente')
  await clickLabel(exteriorLabel);await settle();await clickLabel(exteriorLabel.replace('Remover','Adicionar'));await settle()
  await pointerRegression('hide/show','exterior');await closeSelection()
  await clickLabel('RAIO-X');await settle();await clickLabel('RAIO-X');await settle()
  await pointerRegression('xray on/off','exterior');await closeSelection()
  // Isolate a different layer so exterior raycasting is explicitly disabled then restored.
  await call('Page.navigate',{url:`${base}/modelo-3d?camada=motores&c=motor_esquerdo&nointro=1`})
  await waitFor("document.querySelector('#drawer-title')&&document.querySelector('canvas')")
  await focusConverged('motor_esquerdo')
  await waitFor("document.body.innerText.includes('SAIR DO ISOLADO')")
  await clickText('SAIR DO ISOLADO');await settle();await closeSelection()
  await pointerRegression('isolate/restore','exterior');await closeSelection()
  // Select a moving engine through its real drawer control as explosion begins.
  // A projected pointer coordinate is unsuitable here: the mesh moves before mouse dispatch.
  await call('Page.navigate',{url:`${base}/modelo-3d?camada=motores&c=motor_esquerdo&nointro=1`})
  await waitFor("document.querySelector('#drawer-title')&&document.querySelector('canvas')")
  await focusConverged('motor_esquerdo')
  const moving=catalog.camadas.find(l=>l.id==='motores').componentes.find(c=>c.id==='motor_direito')
  await evaluate(`(()=>{const explode=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='EXPLODIR TUDO');const select=[...document.querySelectorAll('[role=dialog] button')].find(b=>b.textContent.trim()===${JSON.stringify(moving.nome)});if(!explode||!select)throw new Error('Controles de explosão/seleção ausentes');explode.click();select.click()})()`)
  await waitFor(`document.querySelector('#drawer-title')?.textContent===${JSON.stringify(moving.nome)}`)
  async function movingPose(){return evaluate(`(async()=>{const url=performance.getEntriesByType('resource').map(e=>e.name).find(u=>u.includes('@react-three_fiber.js'));const s=(await import(url))._roots.get(document.querySelector('canvas')).store.getState();s.scene.updateMatrixWorld(true);let pose=null;s.scene.traverse(o=>{if(!pose&&o.isMesh&&o.userData.componenteId===${JSON.stringify(moving.id)})pose={mesh:o.uuid,matrix:o.matrixWorld.toArray()}});return pose})()`)}
  const during=await movingPose()
  await focusConverged(moving.id);await settle(2500)
  const after=await movingPose()
  const movedAfterSelection=during&&after&&during.mesh===after.mesh&&after.matrix.some((v,i)=>Math.abs(v-during.matrix[i])>.01)
  if(!movedAfterSelection)throw new Error('Componente não se deslocou após seleção durante explosão')
  report.explosionFocus={component:moving.id,movedAfterSelection,...await focusConverged(moving.id)}
  if(report.components.length!==68)throw new Error('Cobertura de foco incompleta: '+report.components.length)
  console.log(JSON.stringify({components:report.components.length,layers:report.layers,invalidQuery:report.invalidQuery,errors},null,2))
  if(errors.length)process.exitCode=1
}catch(error){report.failure=String(error);console.error(error);process.exitCode=1}
finally{writeFileSync(`${output}/report.json`,JSON.stringify(report,null,2));ws.close();await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`).catch(()=>{})}
