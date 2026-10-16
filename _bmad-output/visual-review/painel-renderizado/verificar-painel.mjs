// Ensaios reais CDP do painel pré-renderizado. Não modifica baselines anteriores.
// Contrato atual (spec-painel-fiel-prflm): 54 IDs (49 + 5 do pedestal), viewBox 1600×960,
// WebP = viewBox×2 (3200×1920). O layout canônico é lido de panel-data.ts (Vite SSR,
// sem gravar arquivos); verify-assets.mjs garante que panel-map.json coincide com ele.
// Se os WebPs forem de outro layout (RenderedPanel os recusa por dimensão), o ensaio
// roda em modo 'fallback-e1': verifica o fallback vetorial e pula as checagens de raster.
// Na E2 (render Blender novo) o modo esperado é 'raster', incluindo a camada dos manches.
// EXPECT_MODE (padrão 'raster'; 'fallback-e1' para ensaiar assets antigos): o ensaio falha se o modo observado diferir.
// Uso (da raiz): APP_URL=http://127.0.0.1:4175 REVIEW_OUTPUT=<pasta> node _bmad-output/visual-review/painel-renderizado/verificar-painel.mjs
import { openChrome } from '../../../work-modulo-3d/blender/cockpit/chrome-cdp.mjs'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { createServer } from '../../../work-modulo-3d/node_modules/vite/dist/node/index.js'
const origin = (process.env.APP_URL ?? process.env.PA34_URL ?? 'http://127.0.0.1:4175').replace(/\/$/, '')
const output = resolve(process.env.REVIEW_OUTPUT ?? '_bmad-output/visual-review/painel-renderizado')
const ssr = await createServer({ root: resolve('work-modulo-3d'), configFile: false, logLevel: 'silent', server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] }, resolve: { alias: { '@': resolve('work-modulo-3d/src') } } })
let panel
try { panel = await ssr.ssrLoadModule('/src/components/cockpit/panel-data.ts') } finally { await ssr.close() }
const map = { width: panel.VB_W, height: panel.VB_H, instruments: panel.PANEL_ORDER.map(id => panel.PANEL_MAP[id]) }
const N = map.instruments.length, RW = map.width * 2, RH = map.height * 2
const TOUR = panel.TOUR_STOPS.map(s => s.id)
const catalog = JSON.parse(readFileSync('work-modulo-3d/src/data/cockpit_instruments.json','utf8')).instrumentos
const NON_MOTOR = map.instruments.filter(e => catalog.find(i => i.id === e.id).categoria !== 'motor').length
mkdirSync(output, { recursive: true })
const EXPECT_MODE = process.env.EXPECT_MODE ?? 'raster'
const report = { origin, date: new Date().toISOString(), contract: { ids: N, viewBox: [map.width, map.height], raster: [RW, RH] }, expectedMode: EXPECT_MODE, mode: 'pending', status: 'running', checks: [], skipped: [], errors: [] }
let raster = true // false = modo 'fallback-e1' (WebP de outro layout, recusado por dimensão)
const settled = `document.querySelectorAll('[data-rendered-panel][data-image-state="loading"]').length === 0`
let chrome
const pausedImages = []
const sleep = ms => new Promise(r => setTimeout(r, ms))
const send = (method, params = {}) => chrome ? chrome.send(method, params) : Promise.reject(new Error('Chrome indisponível'))
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text)
  return r.result.value
}
async function until(expression) {
  for (let i = 0; i < 160; i++) {
    try { if (await evaluate(`Boolean(${expression})`)) return }
    catch(error) { if (!/context|navigation/i.test(error.message ?? '')) throw error }
    await sleep(50)
  }
  throw new Error(`Timeout: ${expression}`)
}
function check(name, ok, data) { report.checks.push({ name, ok: Boolean(ok), data }); if (!ok) throw new Error(name + ': ' + JSON.stringify(data)) }
async function nav(path = '/cockpit', ready = true) {
  await send('Page.navigate', { url: origin + path })
  await until(`document.readyState === 'complete' && document.querySelectorAll('[data-hotspot]').length === ${N}`)
  if (ready) await until(raster ? `document.querySelectorAll('[data-rendered-panel][data-image-state="ready"]').length === 2` : settled)
  await sleep(800)
}
async function capture(name) { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(output, name + '.png'), Buffer.from(r.data, 'base64')) }
async function click(selector) { await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`); await sleep(100) }
async function key(key, code, vk) { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key, code, windowsVirtualKeyCode: vk }) }
async function realClick(id) {
  // pan/zoom pode deixar o alvo fora do palco: recentra antes do clique real.
  await evaluate(`(()=>{const e=document.querySelector('[data-hotspot="${id}"]')?.firstElementChild,s=document.querySelector('[aria-label^="Painel renderizado"]');if(!e||!s)return;const r=e.getBoundingClientRect(),t=s.getBoundingClientRect();if(r.left<t.left||r.right>t.right||r.top<t.top||r.bottom>t.bottom)document.querySelector('button[aria-label="Recentrar o painel"]')?.click()})()`);await sleep(600)
  await until(`(()=>{const e=document.querySelector('[data-hotspot="${id}"]')?.firstElementChild;if(!e)return false;const r=e.getBoundingClientRect();return r.width>3&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('[data-hotspot]')?.getAttribute('data-hotspot')==='${id}'})()`)
  const p = await evaluate(`(() => {const el=document.querySelector('[data-hotspot="${id}"]').firstElementChild; const r=el.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}})()`)
  for (const type of ['mousePressed','mouseReleased']) await send('Input.dispatchMouseEvent',{type,...p,button:'left',buttons:type==='mousePressed'?1:0,clickCount:1})
  await until(`new URLSearchParams(location.search).get('i') === '${id}' && document.querySelector('[role="dialog"][aria-labelledby]')`)
}
function skip(name, reason = 'modo fallback-e1: render de outro layout') { report.skipped.push({ name, reason }) }
async function assertMapping(label) {
  if (!raster) return skip('Mapeamento intrínseco/canônico '+label)
  const data=await evaluate(`(async()=>{const map=${JSON.stringify(map)},result=[];for(const image of document.querySelectorAll('[data-rendered-panel] image')){
    const im=new Image();im.src=image.getAttribute('href');await im.decode();const x=image.x.baseVal.value,y=image.y.baseVal.value,w=image.width.baseVal.value,h=image.height.baseVal.value;
    const scale=Math.min(w/im.naturalWidth,h/im.naturalHeight),ox=x+(w-im.naturalWidth*scale)/2,oy=y+(h-im.naturalHeight*scale)/2;
    const errors=map.instruments.map(e=>{const s=e.shape,cx=s.kind==='circle'?s.cx:s.x+s.w/2,cy=s.kind==='circle'?s.cy:s.y+s.h/2;
      const raster=new DOMPoint(ox+cx*im.naturalWidth/map.width*scale,oy+cy*im.naturalHeight/map.height*scale).matrixTransform(image.getScreenCTM());
      const hotspot=new DOMPoint(cx,cy).matrixTransform(document.querySelector('[data-hotspot="'+e.id+'"]').getScreenCTM());return Math.hypot(raster.x-hotspot.x,raster.y-hotspot.y)});
    result.push({mode:image.parentElement.dataset.renderedPanel,x,y,w,h,align:image.preserveAspectRatio.baseVal.align,meet:image.preserveAspectRatio.baseVal.meetOrSlice,intrinsic:[im.naturalWidth,im.naturalHeight],maxError:Math.max(...errors)});
  }return result})()`)
  check('Mapeamento intrínseco/canônico '+label,data.length===2&&data.every(i=>i.x===0&&i.y===0&&i.w===map.width&&i.h===map.height&&i.align===6&&i.meet===1&&i.intrinsic[0]===RW&&i.intrinsic[1]===RH&&i.maxError<.001),data)
}
// Em fallback-e1 a atenuação é por opacidade dos grupos vetoriais (RenderedPanel), não por formas sobre o raster.
async function assertFilterFallback(selected=null) {
  const expected=map.instruments.filter(e=>catalog.find(i=>i.id===e.id).categoria!=='motor'&&e.id!==selected).length
  const data=await evaluate(`['dia','noite'].map(mode=>{const g=document.querySelector('[data-vector-fallback="'+mode+'"]');const groups=[...g.children].slice(1);return{mode,groups:groups.length,dimmed:groups.filter(n=>n.getAttribute('opacity')==='0.35').length,overlay:document.querySelectorAll('[data-category-dimming]').length}})`)
  check('Filtro (fallback): '+expected+' grupos vetoriais atenuados em ambos modos'+(selected?' com seleção isenta':''),data.every(d=>d.groups===N&&d.dimmed===expected&&d.overlay===0),data)
}
async function assertFilter(selected=null) {
  if (!raster) return assertFilterFallback(selected)
  const expected=map.instruments.filter(e=>catalog.find(i=>i.id===e.id).categoria!=='motor'&&e.id!==selected)
  const data=await evaluate(`(()=>{const expected=${JSON.stringify(expected)};return ['dia','noite'].map(mode=>{const g=document.querySelector('[data-category-dimming="'+mode+'"]'),nodes=[...g.children],ids=nodes.map(n=>n.dataset.dimmedInstrument);
    const details=expected.map(e=>{const n=nodes.find(n=>n.dataset.dimmedInstrument===e.id);if(!n)return{id:e.id,ok:false};const s=e.shape,style=getComputedStyle(n),attrs=s.kind==='circle'?{cx:s.cx,cy:s.cy,r:s.r}:{x:s.x,y:s.y,width:s.w,height:s.h,rx:3};
      return{id:e.id,geometry:Object.fromEntries(Object.keys(attrs).map(a=>[a,n.getAttribute(a)])),fill:style.fill,fillOpacity:style.fillOpacity,opacity:style.opacity,ok:n.tagName.toLowerCase()===s.kind&&Object.entries(attrs).every(([k,v])=>Number(n.getAttribute(k))===v)&&style.fill==='rgb(5, 8, 13)'&&Number(style.fillOpacity)===.65&&Number(style.opacity)===1};});
    const image=document.querySelector('[data-rendered-panel="'+mode+'"] image');return{mode,ids,details,imageFilter:getComputedStyle(image).filter,ok:ids.length===expected.length&&new Set(ids).size===ids.length&&details.every(d=>d.ok)&&getComputedStyle(image).filter==='none'};
  })})()`)
  check('Filtro: IDs, formas e estilos exatos em ambos modos'+(selected?' com seleção isenta':''),data.every(d=>d.ok),data)
}
try {
  chrome = await openChrome({ prefix:'pa34-render-test-', port:9900+process.pid%200 })
  chrome.onEvent(m => {
    if(m.method==='Runtime.exceptionThrown') report.errors.push(m.params.exceptionDetails.text)
    if(m.method==='Fetch.requestPaused') pausedImages.push(m.params.requestId)
  })
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable')
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false})
  await nav('/cockpit', false)
  await until(settled)
  const states = await evaluate(`[...document.querySelectorAll('[data-rendered-panel]')].map(e=>e.dataset.imageState)`)
  raster = states.every(s => s === 'ready')
  report.mode = raster ? 'raster' : 'fallback-e1'
  check('Modo observado igual ao esperado (EXPECT_MODE='+EXPECT_MODE+')', report.mode === EXPECT_MODE, { observed: report.mode, expected: EXPECT_MODE, states })
  if (!raster) {
    const fb = await evaluate(`(async()=>{const out=[];for(const el of document.querySelectorAll('[data-rendered-panel] image')){const im=new Image();im.src=el.getAttribute('href');let w=null,h=null;try{await im.decode();w=im.naturalWidth;h=im.naturalHeight}catch{/* ausente */}out.push({src:el.getAttribute('href'),width:w,height:h,visibility:el.getAttribute('visibility')})}return{states:[...document.querySelectorAll('[data-rendered-panel]')].map(e=>e.dataset.imageState),images:out,fallbacks:document.querySelectorAll('[data-vector-fallback]').length,paths:document.querySelectorAll('[data-vector-fallback] path').length,canvases:document.querySelectorAll('canvas').length}})()`)
    check('Fallback-e1: WebPs fora do contrato '+RW+'×'+RH+' recusados, dois fallbacks vetoriais, sem canvas', fb.states.every(s=>s==='error')&&fb.images.every(i=>i.visibility==='hidden'&&!(i.width===RW&&i.height===RH))&&fb.fallbacks===2&&fb.paths>40&&fb.canvases===0, fb)
    skip('Ambas imagens decodificadas por HTTP e raster visível')
  } else {
  const rasterInfo = await evaluate(`(async()=>{const results=[];for(const el of document.querySelectorAll('[data-rendered-panel] image')){const im=new Image(); im.src=el.getAttribute('href');await im.decode();const res=await fetch(im.src);results.push({src:im.src,width:im.naturalWidth,height:im.naturalHeight,status:res.status,bytes:(await res.arrayBuffer()).byteLength,visibility:getComputedStyle(el).visibility})}return {images:results,fallbacks:document.querySelectorAll('[data-vector-fallback]').length,canvases:document.querySelectorAll('canvas').length}})()`)
  check('Ambas imagens decodificadas por HTTP e raster visível, sem fallback ou canvas WebGL',rasterInfo.images.length===2&&rasterInfo.images.every(i=>i.width===RW&&i.height===RH&&i.status===200&&i.bytes<1048576&&i.visibility==='visible')&&rasterInfo.fallbacks===0&&rasterInfo.canvases===0,rasterInfo)
  }
  const ids=await evaluate(`[...document.querySelectorAll('[data-hotspot]')].map(e=>({id:e.dataset.hotspot,tab:e.getAttribute('tabindex'),label:e.getAttribute('aria-label')}))`)
  check(N+' IDs canônicos únicos, tabuláveis e rotulados', N===54&&ids.length===N&&new Set(ids.map(i=>i.id)).size===N&&ids.every((i,k)=>i.id===map.instruments[k].id)&&map.instruments.every(e=>ids.some(i=>i.id===e.id&&i.tab==='0'&&i.label)), ids)
  const centers=await evaluate(`(()=>{const map=${JSON.stringify(map)};const image=document.querySelector('[data-rendered-panel] image');const im=image.getScreenCTM();return map.instruments.map(e=>{const s=e.shape,x=s.kind==='circle'?s.cx:s.x+s.w/2,y=s.kind==='circle'?s.cy:s.y+s.h/2;const a=new DOMPoint(x,y).matrixTransform(im);const hit=document.querySelector('[data-hotspot="'+e.id+'"]');const b=new DOMPoint(x,y).matrixTransform(hit.getScreenCTM());return {id:e.id,error:Math.hypot(a.x-b.x,a.y-b.y)}})})()`)
  check(N+' centros compartilham a transformação exata da imagem',centers.every(c=>c.error<.001),centers)
  await assertMapping('inicial')
  check('Vista inicial sem rótulos permanentes',await evaluate(`document.querySelectorAll('[data-cockpit-label]').length===0`))
  await capture('1440-dia-inicial')
  await realClick('altimetro');await click('button[aria-label="Fechar painel"]');await sleep(350)
  await click('button[aria-label="Recentrar o painel"]');await sleep(600)
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:2,y:2})
  await capture('1440-dia')
  await click('button[title^="Modo noite"]');await sleep(700);await capture('1440-noite')
  await click('button[title="Modo dia"]');await sleep(700)
  await click('button[title^="Mostrar/esconder rótulos"]')
  check(N+' rótulos sob controle explícito',await evaluate(`document.querySelectorAll('[data-cockpit-label]').length===${N}`))
  await capture('1440-rotulos')
  for(const id of ['altimetro','navcom_1','navcom_2','pressao_oleo','temperatura_oleo']) {await nav();await realClick(id);check('Clique real distingue '+id,true)}
  // Manches (camada opcional): desligados por padrão; ligados, usam o render Blender
  // VB×2 sobre os hotspots sem capturar clique (cubo do piloto sobre o TC/AP).
  await nav()
  check('Manches desligados por padrão (aria-pressed=false, sem camada)',await evaluate(`document.querySelector('button[aria-label="Mostrar manches"]').getAttribute('aria-pressed')==='false'&&!document.querySelector('[data-yokes]')`))
  await click('button[aria-label="Mostrar manches"]')
  await until(`document.querySelectorAll('[data-yokes-layer]').length===2&&[...document.querySelectorAll('[data-yokes-layer]')].every(g=>g.dataset.imageState!=='loading')`)
  if (raster) {
    const yokes=await evaluate(`(async()=>{const out=[];for(const g of document.querySelectorAll('[data-yokes-layer]')){const img=g.querySelector('image');let w=null,h=null;if(img){const im=new Image();im.src=img.getAttribute('href');await im.decode();w=im.naturalWidth;h=im.naturalHeight}out.push({mode:g.dataset.yokesLayer,state:g.dataset.imageState,w,h,pe:getComputedStyle(g).pointerEvents})}return out})()`)
    check('Manches: render Blender '+RW+'×'+RH+' dia/noite, pointer-events none',yokes.length===2&&yokes.every(y=>y.state==='ready'&&y.w===RW&&y.h===RH&&y.pe==='none'),yokes)
  } else skip('Manches: render Blender')
  await sleep(500);await capture('1440-dia-manches')
  for(const id of ['piloto_automatico','freio_estacionamento']) {
    const hit=await evaluate(`(()=>{const r=document.querySelector('[data-hotspot="${id}"]').firstElementChild.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('[data-hotspot]')?.dataset.hotspot})()`)
    check('Manches ligados não bloqueiam '+id,hit===id,{hit})
  }
  await realClick('piloto_automatico');check('Clique real sob os manches abre a ficha',true)
  for(const [id,k,c,v] of [['giro_direcional','Enter','Enter',13],['variometro',' ','Space',32]]) {await nav();await evaluate(`document.querySelector('[data-hotspot="${id}"]').focus()`);await key(k,c,v);await until(`location.search==='?i=${id}'`);check('Teclado seleciona '+id,true)}
  await nav()
  await evaluate(`(()=>{const input=document.querySelector('input[aria-label="Buscar instrumento no painel"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'velocimetro');input.dispatchEvent(new Event('input',{bubbles:true}));input.focus()})()`)
  await until(`document.querySelector('[role=listbox] [role=option]')`);await key('Enter','Enter',13);await until(`location.search==='?i=velocimetro'`);check('Busca preservada',true)
  for(const id of ['velocimetro','navcom_1','manetes_mistura']) {
    await nav('/cockpit?i='+id)
    const mini=await evaluate(`(()=>{const s=document.querySelector('[role=dialog] svg.h-44');const v=s.viewBox.baseVal,b=[...s.children].find(e=>e.tagName.toLowerCase()==='g').getBBox();return {contained:b.x>=v.x-.5&&b.y>=v.y-.5&&b.x+b.width<=v.x+v.width+.5&&b.y+b.height<=v.y+v.height+.5,svg:s.querySelectorAll('path,circle,rect').length}})()`)
    check('Miniatura vetorial e deep-link '+id,mini.contained&&mini.svg>0,mini)
  }
  await evaluate(`history.pushState({},'', '/cockpit?i=altimetro');dispatchEvent(new PopStateEvent('popstate'))`)
  await until(`document.querySelector('[data-cockpit-label="altimetro"]')`);check('Link reativo sem remontagem',true)
  await nav()
  await evaluate(`[...document.querySelectorAll('[aria-label="Filtrar por categoria"] button')].find(b=>b.textContent.replace(/\s/g,'')==='MOTOR${N-NON_MOTOR}').click()`)
  if (raster) {
    const dim=await evaluate(`({count:document.querySelectorAll('[data-category-dimming="noite"] [data-dimmed-instrument]').length,rects:document.querySelector('[data-category-dimming="noite"]').children.length})`)
    check('Filtro atenua somente '+NON_MOTOR+' formas não-motor, não imagem inteira',dim.count===NON_MOTOR&&dim.rects===NON_MOTOR,dim)
  }
  await assertFilter()
  await click('button[title^="Modo noite"]');await sleep(650);await assertFilter()
  await click('button[title="Modo dia"]');await sleep(650)
  await capture('1440-filtro-motor')
  await evaluate(`history.pushState({},'', '/cockpit?i=velocimetro');dispatchEvent(new PopStateEvent('popstate'))`)
  await until(`document.querySelector('[data-cockpit-label="velocimetro"]')`)
  check('Selecionado fora da categoria não fica atenuado',await evaluate(raster?`document.querySelector('[data-category-dimming="noite"] [data-dimmed-instrument="velocimetro"]')===null`:`[...document.querySelector('[data-vector-fallback="noite"]').children].slice(1)[${panel.PANEL_ORDER.indexOf('velocimetro')}].getAttribute('opacity')==='1'`))
  await assertFilter('velocimetro')
  await nav(); await click('button[title^="Tour guiado"]')
  const stops=TOUR
  for(let i=0;i<stops.length;i++) {
    await until(`document.querySelector('[aria-label="Tour guiado — parada ${i+1} de ${stops.length}"]')`)
    const e=map.instruments.find(e=>e.id===stops[i]),s=e.shape
    check('Tour '+(i+1)+' máscara delimitada em '+e.id,await evaluate(s.kind==='circle'?`document.querySelector('#ck-spot circle')?.getAttribute('cx')==='${s.cx}'&&document.querySelector('#ck-spot circle')?.getAttribute('cy')==='${s.cy}'`:`document.querySelector('#ck-spot rect[fill="black"]')?.getAttribute('x')==='${s.x-20}'`))
    if(i===0){await sleep(950);await capture('1440-tour')}
    await evaluate(`[...document.querySelectorAll('[aria-label="Tour guiado — parada ${i+1} de ${stops.length}"] button')].find(b=>/Próximo|Concluir/.test(b.textContent)).click()`)
  }
  await sleep(800)
  for(const width of [1440,768,390]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:false});await nav();await capture(width+'-dia-inicial')
    await click('button[aria-label="Recentrar o painel"]');await sleep(600)
    check(width+' reset permite alcançar todos os comandos',await evaluate(`(()=>{const stage=document.querySelector('[aria-label^="Painel renderizado"]').getBoundingClientRect();return [...document.querySelectorAll('[data-hotspot]')].every(e=>{const r=e.firstElementChild.getBoundingClientRect();return r.left>=stage.left-1&&r.right<=stage.right+1&&r.top>=stage.top-1&&r.bottom<=stage.bottom+1})})()`))
    await click('button[aria-label="Aproximar (zoom +)"]');await sleep(250)
    check(width+' zoom aumenta sem separar imagem e hotspot',await evaluate(`(()=>{const im=document.querySelector('[data-rendered-panel] image').getScreenCTM(),h=document.querySelector('[data-hotspot]').getScreenCTM();return Math.abs(im.a-h.a)<.0001&&[...document.querySelectorAll('div')].some(e=>e.textContent==='ZOOM 135%')})()`))
    if(width===390){await click('button[aria-label="Aproximar (zoom +)"]');await sleep(250);const pan=await evaluate(`(()=>{const s=document.querySelector('[aria-label^="Painel renderizado"]'),r=s.getBoundingClientRect();return {x:r.x+r.width*.5,y:r.y+r.height*.1,before:s.querySelector('svg > g[transform]').getAttribute('transform')}})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',x:pan.x,y:pan.y,button:'left',buttons:1,clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:pan.x+35,y:pan.y+20,button:'left',buttons:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:pan.x+35,y:pan.y+20,button:'left',buttons:0});await sleep(150);check('Pan mobile altera transformação compartilhada',await evaluate(`document.querySelector('[aria-label^="Painel renderizado"] svg > g[transform]').getAttribute('transform')!==${JSON.stringify(pan.before)}`))}
    await assertMapping('zoom '+width)
    // Navega de/para 3D pelo roteador; conserva a aplicação-alvo, sem canvas no retorno.
    await evaluate(`history.pushState({},'', '/modelo-3d');dispatchEvent(new PopStateEvent('popstate'))`)
    await until(`location.pathname==='/modelo-3d'&&document.querySelectorAll('[data-hotspot]').length===0`)
    await sleep(1600)
    await evaluate(`history.pushState({},'', '/cockpit');dispatchEvent(new PopStateEvent('popstate'))`)
    await until(raster?`document.querySelectorAll('[data-rendered-panel][data-image-state="ready"]').length===2`:`document.querySelectorAll('[data-hotspot]').length===${N}&&${settled}`)
    check(width+' navegação 3D → cockpit sem canvas residual',await evaluate(`document.querySelectorAll('canvas').length===0`))
  }
  // Resize sem Page.navigate e pinch CDP de dois contatos em área arrastável.
  await evaluate('window.__resizeSentinel=performance.now()')
  const sentinel=await evaluate('window.__resizeSentinel')
  for(const width of [768,390]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:true})
    await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2})
    await sleep(350);await click('button[aria-label="Recentrar o painel"]');await sleep(550)
    check('Resize sem recarga '+width,await evaluate(`innerWidth===${width}&&window.__resizeSentinel===${sentinel}`))
    await assertMapping('resize sem recarga '+width)
    const p=await evaluate(`(()=>{const e=document.querySelector('[aria-label^="Painel renderizado"]'),r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height*.1,scale:e.querySelector('image').getScreenCTM().a,clear:[-35,35].every(dx=>!document.elementFromPoint(r.x+r.width/2+dx,r.y+r.height*.1)?.closest('[data-hotspot]'))}})()`)
    check('Pinch começa fora dos hotspots '+width,p.clear,p)
    await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:p.x-35,y:p.y},{id:2,x:p.x+35,y:p.y}]})
    await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:p.x-65,y:p.y},{id:2,x:p.x+65,y:p.y}]})
    await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
    await until(`document.querySelector('[data-rendered-panel] image').getScreenCTM().a>${p.scale}`)
    check('Pinch touch real aumenta zoom '+width,true)
    await assertMapping('pinch '+width)
  }
  await send('Emulation.setTouchEmulationEnabled',{enabled:false})
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false})
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
  await nav()
  check('Movimento reduzido remove crossfade raster',await evaluate(`parseFloat(getComputedStyle(document.querySelector('.ck-render-illumination')).transitionDuration)<=.001`))
  await click('button[title^="Modo noite"]');await realClick('navcom_2');check('Noite e teclado/mouse seguem funcionais com movimento reduzido',true)
  // Carregamento controlado: segura ambas respostas sem bloquear a aplicação.
  await send('Network.setCacheDisabled',{cacheDisabled:true})
  await send('Fetch.enable',{patterns:[{urlPattern:'*cockpit-render/*.webp*',requestStage:'Request'}]})
  await send('Page.navigate',{url:origin+'/cockpit'})
  await until(`document.querySelectorAll('[data-hotspot]').length===${N}&&document.querySelectorAll('[data-image-state="loading"]').length===2`)
  check('Carregamento mantém os dois fallbacks e hotspots utilizáveis',await evaluate(`document.querySelectorAll('[data-vector-fallback]').length===2&&document.querySelectorAll('[data-hotspot]').length===${N}`))
  await realClick('navcom_1');check('Clique real durante carregamento pendente',true)
  await capture('carregando-fallback')
  for(const requestId of pausedImages.splice(0))await send('Fetch.continueRequest',{requestId})
  await send('Fetch.disable')
  if (raster) {
    await until(`document.querySelectorAll('[data-image-state="ready"]').length===2`)
    check('Conclusão do carregamento troca fallback por raster sem perder seleção',await evaluate(`document.querySelectorAll('[data-vector-fallback]').length===0&&location.search==='?i=navcom_1'`))
  } else {
    await until(settled)
    check('Conclusão do carregamento (fallback-e1) recusa o WebP e mantém fallback e seleção',await evaluate(`document.querySelectorAll('[data-image-state="error"]').length===2&&document.querySelectorAll('[data-vector-fallback]').length===2&&location.search==='?i=navcom_1'`))
  }
  // Falha individual dos dois recursos: limpa cache antes de cada navegação.
  for(const mode of ['dia','noite']) {
    await send('Network.setCacheDisabled',{cacheDisabled:true})
    await send('Network.setBlockedURLs',{urls:[`*cockpit-render/painel-${mode}.webp*`]})
    await nav('/cockpit',false)
    await until(`document.querySelector('[data-rendered-panel="${mode}"]').dataset.imageState==='error'`)
    if(mode==='noite')await click('button[title^="Modo noite"]')
    const fallback=await evaluate(`(()=>{const g=document.querySelector('[data-rendered-panel="${mode}"]');return {opacity:getComputedStyle(g).opacity,fallback:!!g.querySelector('[data-vector-fallback]'),art:g.querySelectorAll('[data-vector-fallback] path').length,image:g.querySelector('image').getAttribute('visibility'),other:document.querySelector('[data-rendered-panel="${mode==='dia'?'noite':'dia'}"]').dataset.imageState}})()`)
    check('Falha '+mode+' conserva arte vetorial visível e outra imagem '+(raster?'pronta':'em fallback'),fallback.opacity==='1'&&fallback.fallback&&fallback.art>20&&fallback.image==='hidden'&&fallback.other===(raster?'ready':'error'),fallback)
    await capture('fallback-'+mode);await realClick('altimetro');check('Interação real durante falha '+mode,true)
  }
  await send('Network.setBlockedURLs',{urls:[]})
  check('Nenhuma exceção JavaScript inesperada',report.errors.length===0,report.errors)
  report.status='passed'
} catch(error) {report.status='failed';report.error=error.stack ?? JSON.stringify(error);process.exitCode=1;try{report.failurePage=await evaluate(`({url:location.href,hotspots:document.querySelectorAll('[data-hotspot]').length,states:[...document.querySelectorAll('[data-rendered-panel]')].map(e=>e.dataset.imageState),text:document.body.innerText.slice(0,1800)})`);await capture('falha-ensaio')}catch{/* mantém erro original */}}
finally {
  try {await chrome?.close()}catch(error){report.status='failed';report.shutdownError=String(error);process.exitCode=1}
  writeFileSync(join(output,'verificacao-navegador.json'),JSON.stringify(report,null,2)+'\n')
}
console.log(JSON.stringify(report,null,2))
