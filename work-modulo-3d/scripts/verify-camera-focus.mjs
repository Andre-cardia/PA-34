// Regressão isolada do effect de foco real, sem simular um teste de navegador.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import * as THREE from 'three'

const text = readFileSync(new URL('../src/components/modelo3d/ModelCanvas.tsx', import.meta.url), 'utf8')
const start = text.indexOf('  // focus move:')
const end = text.indexOf('  // interação do usuário', start)
assert.ok(start >= 0 && end > start, 'Effect de foco não localizado: atualizar o teste após refatorar')
const section = text.slice(start, end)
assert.ok(section.includes('focusWhenReady'), 'Callback de foco ausente')
const js = ts.transpileModule(section, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
let cleanup, serial = 0, calls = 0
const scheduled = new Map(), anchorsRef = { current: new Map() }
const raf = fn => { scheduled.set(++serial, fn); return serial }
const cancel = id => scheduled.delete(id)
const step = () => { const pending = [...scheduled.values()]; scheduled.clear(); for (const fn of pending) fn() }
const motion = { tween: false, generation: 0 }, goal = { current: null }
const run = new Function('useEffect', 'focusRequest', 'anchorsRef', 'mkGoal', 'requestAnimationFrame', 'cancelAnimationFrame', 'anchorBounds', 'THREE', 'camera', 'motion', 'goal', 'viewRequest', js)
const invoke = (viewRequest = null, focusRequest = { compId: 'bateria', key: 1 }) => run(fn => { cleanup = fn() }, focusRequest, anchorsRef, () => calls++, raf, cancel,
  () => new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1)), THREE, { fov: 34, aspect: 1.5 }, motion, goal, viewRequest)

invoke()
for (let i = 0; i < 300; i++) step()
assert.equal(calls, 0, 'Não focar antes da geometria existir')
assert.equal(scheduled.size, 1, 'Carregamento lento não pode expirar o foco')
anchorsRef.current.set('bateria', {})
step()
assert.equal(calls, 1, 'Focar após a âncora tardia ser registrada')
assert.equal(scheduled.size, 0, 'Encerrar espera depois do foco')
cleanup()
anchorsRef.current.clear()
invoke()
step()
cleanup()
assert.equal(scheduled.size, 0, 'Desmontagem/troca de seleção deve cancelar espera')
invoke(); step(); motion.generation++; anchorsRef.current.set('bateria', {}); step()
assert.equal(calls, 1, 'Gesto/preset deve cancelar foco ainda pendente')
assert.equal(scheduled.size, 0)
cleanup()
// Um preset mais novo também vence quando o effect reinicia por readiness.
const presetGoal={preset:true}
goal.current=presetGoal;motion.tween=true
invoke({key:2});step()
assert.equal(goal.current,presetGoal,'Readiness não pode reaplicar foco antigo sobre preset novo')
invoke({key:3},null);step()
assert.equal(goal.current,presetGoal,'Effect sem seleção não pode cancelar preset')
assert.equal(calls,1)
assert.equal(scheduled.size,0)
// Executar também o callback real do tween com uma âncora em movimento.
const frameStart=text.indexOf('  useFrame((_, dt) => {')
const frameEnd=text.indexOf('\n\n  return null',frameStart)
assert.ok(frameStart>=0&&frameEnd>frameStart)
const frameJs=ts.transpileModule(text.slice(frameStart,frameEnd),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
let frame, center=new THREE.Vector3()
const camera={position:new THREE.Vector3(0,0,5)}
const controls={target:new THREE.Vector3(),update(){}}
new Function('useFrame','goal','controls','anchorBounds','THREE','easeOutExpo','camera','invalidate','autoRotateActive','motion',frameJs)(
  fn=>{frame=fn},goal,controls,()=>new THREE.Box3(center.clone().addScalar(-.5),center.clone().addScalar(.5)),THREE,
  t=>t>=1?1:1-Math.pow(2,-10*t),camera,()=>{},false,motion)
const makeGoal=()=>({startPos:camera.position.clone(),endPos:new THREE.Vector3(0,0,5),startTgt:controls.target.clone(),endTgt:new THREE.Vector3(),t:0,dur:1,follow:{},stableFor:0})
goal.current=makeGoal()
for(let i=0;i<180;i++){center.set(4*(1-Math.exp(-8*i/60)),0,0);frame(null,1/60)}
assert.ok(controls.target.distanceTo(center)<.001,'Tween deve convergir à âncora movida pela explosão')
assert.equal(goal.current,null,'Tween deve encerrar após a peça estabilizar')
goal.current=makeGoal();frame(null,1/60)
goal.current=null;motion.tween=false
const cancelledTarget=controls.target.clone(),cancelledPosition=camera.position.clone()
center.set(9,0,0);frame(null,1/60)
assert.ok(controls.target.equals(cancelledTarget)&&camera.position.equals(cancelledPosition),'Cancelamento deve impedir acompanhamento posterior')
// Hidratação e ação locais reais: uma requisição, sem cair no ramo inválido.
const page=readFileSync(new URL('../src/pages/Modelo3D.tsx',import.meta.url),'utf8')
const urlStart=page.indexOf('  useEffect(() => {',page.indexOf('// ---- deep-link'))
const urlEnd=page.indexOf('\n  // A URL',urlStart)
assert.ok(urlStart>=0&&urlEnd>urlStart)
const urlJs=ts.transpileModule(page.slice(urlStart,urlEnd),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
let params=new URLSearchParams('camada=motores&c=motor_esquerdo'), selected=null, focus=null, isolated=null, requests=0, visibility={motores:true}
const deepLink={current:null},cameraRequestSequence={current:0}
const setSelected=v=>{selected=typeof v==='function'?v(selected):v}
const setFocus=v=>{focus=typeof v==='function'?v(focus):v;requests++}
const setIsolate=v=>{isolated=typeof v==='function'?v(isolated):v}
const setVisible=v=>{visibility=typeof v==='function'?v(visibility):v}
const hydrate=new Function('useEffect','searchParams','isLayerId','compExiste','deepLink','setIsolate','setVisible','setSelected','setFocusRequest','cameraRequestSequence',urlJs)
const hydrateNow=()=>hydrate(fn=>fn(),params,id=>id==='motores',(layer,id)=>layer==='motores'&&id.startsWith('motor_'),deepLink,setIsolate,setVisible,setSelected,setFocus,cameraRequestSequence)
hydrateNow()
assert.equal(selected?.comp,'motor_esquerdo','Query válida não pode cair no cleanup inválido')
assert.equal(focus?.compId,'motor_esquerdo');assert.equal(isolated,'motores');assert.equal(requests,1)
hydrateNow();assert.equal(requests,1,'Rehidratação da mesma query não deve duplicar foco')
const actionStart=page.indexOf('  const selectComponent = useCallback(')
const actionEnd=page.indexOf('\n\n  const clearSelection',actionStart)
assert.ok(actionStart>=0&&actionEnd>actionStart)
const actionJs=ts.transpileModule(page.slice(actionStart,actionEnd),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
const select=new Function('useCallback','deepLink','setVisible','setSelected','setSearchParams','setIsolate','setFocusRequest','cameraRequestSequence',actionJs+'; return selectComponent')(
  fn=>fn,deepLink,setVisible,setSelected,fn=>{params=fn(params)},setIsolate,setFocus,cameraRequestSequence)
select('motores','motor_esquerdo');hydrateNow();assert.equal(requests,2,'Reseleção deve focar uma vez')
select('motores','motor_direito');hydrateNow();assert.equal(requests,3,'Nova seleção local deve focar uma vez')
assert.equal(selected?.comp,'motor_direito')
params=new URLSearchParams();hydrateNow()
assert.equal(selected,null);assert.equal(focus,null);assert.equal(isolated,null)
console.log('Foco validado: âncora tardia, cancelamento, explosão e seleção/deep-link sem duplicação (ensaio isolado, não navegador).')
