import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const catalog = JSON.parse(readFileSync(join(root,'src/data/componentes_3d.json'),'utf8'))
const ids = new Map(catalog.camadas.flatMap(l => l.componentes.map(c => [c.id,l.id])))
const path = process.argv.find(a => a.endsWith('.glb')) ?? join(root,'public/models/pa34-camadas.glb')
const raw = readFileSync(path)
const manifest = JSON.parse(readFileSync(path.replace(/\.glb$/,'.manifest.json'),'utf8'))
function parse(bytes) {
  assert.equal(bytes.readUInt32LE(0),0x46546c67,'Cabeçalho GLB')
  assert.equal(bytes.readUInt32LE(4),2,'Versão GLB')
  assert.equal(bytes.readUInt32LE(8),bytes.length,'Comprimento GLB')
  const len=bytes.readUInt32LE(12)
  assert.equal(bytes.readUInt32LE(16),0x4e4f534a,'Chunk JSON')
  const doc=JSON.parse(bytes.subarray(20,20+len).toString())
  const start=20+len
  assert.equal(bytes.readUInt32LE(start+4),0x004e4942,'Chunk binário')
  const bin=bytes.subarray(start+8)
  assert.equal(bin.length,bytes.readUInt32LE(start),'Comprimento binário')
  return {doc,bin}
}
const {doc,bin}=parse(raw)
const finiteVector = (a, size) => Array.isArray(a)&&a.length===size&&a.every(Number.isFinite)
const finite3 = a => finiteVector(a,3)
const validIndex = (index, array) => Number.isInteger(index)&&index>=0&&index<array.length
// A cobertura precisa existir na cena carregada, não só em nós órfãos do arquivo.
function sceneNodes(gltf) {
  assert.ok(validIndex(gltf.scene??0,gltf.scenes??[]),'Cena padrão ausente')
  const visited=new Set(), active=new Set()
  const visit = index => {
    assert.ok(validIndex(index,gltf.nodes),'Referência de nó inválida')
    assert.ok(!active.has(index),'Ciclo na hierarquia')
    assert.ok(!visited.has(index),'Nó duplicado na hierarquia')
    visited.add(index); active.add(index)
    for(const child of gltf.nodes[index].children??[]) visit(child)
    active.delete(index)
  }
  for(const index of gltf.scenes[gltf.scene??0].nodes??[]) visit(index)
  return visited
}
export function validate(gltf, map, binary=bin) {
  assert.equal(map.schemaVersion,1,'Schema do manifesto')
  assert.deepEqual([...map.layers].sort(),catalog.camadas.map(l=>l.id).sort(),'Nove camadas')
  assert.equal(new Set(map.layers).size,9,'Camadas duplicadas')
  assert.ok(!(gltf.extensionsUsed??[]).some(e=>/draco|meshopt/i.test(e)),'Decoder remoto/compressão não permitido')
  assert.equal(gltf.buffers.length,1,'Buffer único embarcado')
  assert.ok(!gltf.buffers[0].uri,'Buffer externo')
  assert.ok(gltf.buffers[0].byteLength<=binary.length,'Buffer truncado')
  for(const image of gltf.images??[]) {
    assert.ok(!image.uri,'Textura externa')
    assert.ok(validIndex(image.bufferView,gltf.bufferViews),'Textura sem buffer local válido')
    assert.ok(['image/png','image/jpeg'].includes(image.mimeType),'Formato de textura precisa decoder')
  }
  for(const view of gltf.bufferViews) {
    assert.equal(view.buffer,0)
    assert.ok(Number.isSafeInteger(view.byteOffset??0)&&Number.isSafeInteger(view.byteLength)&&(view.byteOffset??0)>=0&&view.byteLength>0&&(view.byteOffset??0)+view.byteLength<=gltf.buffers[0].byteLength,'bufferView fora do binário')
  }
  const materials=gltf.materials??[]
  assert.ok(materials.length>=8,'Materiais insuficientes')
  assert.ok(materials.some(m=>m.alphaMode==='BLEND'),'Vidro sem transparência')
  assert.ok(materials.some(m=>(m.pbrMetallicRoughness?.metallicFactor??1)>.6),'Metal ausente')
  assert.ok(materials.some(m=>(m.pbrMetallicRoughness?.roughnessFactor??1)>.7),'Borracha/isolamento ausente')
  const reachable=sceneNodes(gltf)
  const entries = gltf.nodes.map((n,i)=>({...n,index:i})).filter(n=>n.mesh!==undefined)
  assert.equal(entries.length,map.nodes.length,'Nós divergentes no manifesto')
  assert.equal(new Set(map.nodes.map(n=>n.node)).size,map.nodes.length,'Nó duplicado no manifesto')
  for(const n of gltf.nodes) {
    for(const key of ['translation','scale']) if(key in n) assert.ok(finite3(n[key]),'Transformação inválida')
    if(n.scale) assert.ok(n.scale.every(s=>s!==0),'Escala nula')
    if('rotation' in n) {
      assert.ok(finiteVector(n.rotation,4),'Quaternion inválido')
      assert.ok(Math.abs(Math.hypot(...n.rotation)-1)<1e-4,'Quaternion não unitário')
    }
    if('matrix' in n) {
      assert.ok(finiteVector(n.matrix,16),'Matriz inválida')
      assert.ok(!['translation','rotation','scale'].some(k=>k in n),'Matriz e TRS simultâneos')
      assert.ok(n.matrix[3]===0&&n.matrix[7]===0&&n.matrix[11]===0&&n.matrix[15]===1,'Matriz não afim')
    }
  }
  const seen=new Set(), names=new Set()
  let triangles=0, primitives=0
  for(const n of entries) {
    const e=n.extras
    assert.ok(e&&ids.has(e.componentId),'ID desconhecido/ausente')
    assert.equal(e.layerId,ids.get(e.componentId),'Camada incorreta')
    assert.ok(['esq','dir','centro'].includes(e.side),'Lado inválido')
    assert.ok(finite3(e.anchor),'Âncora inválida')
    assert.ok(!names.has(n.name),'Nome duplicado'); names.add(n.name); seen.add(e.componentId)
    const mapped=map.nodes.find(m=>m.node===n.index)
    assert.ok(mapped,'Nó não mapeado')
    for(const key of ['componentId','layerId','side','anchor']) assert.deepEqual(mapped[key],e[key],`Manifesto ${key}`)
    assert.equal(mapped.name,n.name,'Nome divergente')
    assert.ok(reachable.has(n.index),'Nó geométrico fora da cena padrão')
    const mesh=gltf.meshes[n.mesh]; assert.ok(mesh?.primitives.length,'Nó sem geometria')
    for(const p of mesh.primitives) {
      primitives++
      assert.equal(p.mode??4,4,'Somente triângulos')
      assert.ok(materials[p.material],'Material inválido')
      const pos=gltf.accessors[p.attributes.POSITION]
      assert.ok(pos&&Number.isSafeInteger(pos.count)&&pos.count>2&&pos.componentType===5126&&pos.type==='VEC3'&&!pos.normalized&&!pos.sparse,'Posições inválidas')
      assert.ok(finite3(pos.min)&&finite3(pos.max)&&pos.max.every((v,i)=>v>=pos.min[i])&&pos.max.some((v,i)=>v>pos.min[i]),'Limites vazios')
      assert.ok(validIndex(pos.bufferView,gltf.bufferViews),'Buffer de posições inválido')
      const view=gltf.bufferViews[pos.bufferView], localOffset=pos.byteOffset??0
      const offset=(view.byteOffset??0)+localOffset, stride=view.byteStride??12
      assert.ok(Number.isSafeInteger(localOffset)&&localOffset>=0&&localOffset%4===0&&offset%4===0,'Offset de posições inválido')
      assert.ok(Number.isSafeInteger(stride)&&stride>=12&&stride<=252&&stride%4===0,'Stride de posições inválido')
      assert.ok(localOffset+(pos.count-1)*stride+12<=view.byteLength,'Accessor fora dos limites')
      const actualMin=[Infinity,Infinity,Infinity], actualMax=[-Infinity,-Infinity,-Infinity]
      for(let i=0;i<pos.count;i++) for(let j=0;j<3;j++) {
        const value=binary.readFloatLE(offset+i*stride+j*4)
        assert.ok(Number.isFinite(value),'Vértice não finito')
        actualMin[j]=Math.min(actualMin[j],value); actualMax[j]=Math.max(actualMax[j],value)
      }
      // Tolerância absoluta/relativa para limites JSON arredondados de FLOAT32.
      const close=(a,b)=>Math.abs(a-b)<=1e-6*Math.max(1,Math.abs(a),Math.abs(b))
      assert.ok(actualMin.every((v,i)=>close(v,pos.min[i]))&&actualMax.every((v,i)=>close(v,pos.max[i])),'Limites POSITION divergentes dos vértices')
      const indices=gltf.accessors[p.indices]
      assert.ok(indices&&Number.isInteger(indices.count)&&indices.count>0&&indices.count%3===0,'Índices inválidos')
      assert.ok(indices.type==='SCALAR'&&[5121,5123,5125].includes(indices.componentType)&&!indices.normalized&&!indices.sparse,'Formato de índices inválido')
      assert.ok(validIndex(indices.bufferView,gltf.bufferViews),'Buffer de índices inválido')
      const iv=gltf.bufferViews[indices.bufferView], size={5121:1,5123:2,5125:4}[indices.componentType]
      const io=indices.byteOffset??0
      assert.ok(Number.isInteger(io)&&io>=0&&io%size===0&&!iv.byteStride&&io+indices.count*size<=iv.byteLength,'Índices fora do buffer')
      const start=(iv.byteOffset??0)+io
      assert.ok(Number.isInteger(start)&&start%size===0,'Alinhamento de índices inválido')
      for(let i=0;i<indices.count;i++) assert.ok(binary.readUIntLE(start+i*size,size)<pos.count,'Índice fora dos vértices')
      triangles+=indices.count/3
    }
  }
  assert.deepEqual([...seen].sort(),[...ids.keys()].sort(),'Cobertura 68 IDs')
  assert.equal(map.metrics.triangles,triangles,'Métrica triângulos')
  assert.equal(map.metrics.primitives,primitives,'Métrica draw calls geométricas')
  assert.equal(map.metrics.materials,materials.length,'Métrica materiais')
  assert.equal(map.metrics.components,68,'Métrica componentes')
  return {triangles,materials:materials.length,primitives,nodes:entries.length,components:seen.size}
}
assert.equal(manifest.sha256,createHash('sha256').update(raw).digest('hex'),'Integridade SHA-256')
assert.equal(manifest.metrics.bytes,raw.length,'Tamanho manifesto')
const metrics=validate(doc,manifest)
const firstPosition=d=>d.accessors[d.meshes[0].primitives[0].attributes.POSITION]
const mutations=[
  ['POSITION count fracionário',d=>{firstPosition(d).count-=0.5}],
  ['POSITION count negativo',d=>{firstPosition(d).count=-3}],
  ['POSITION offset negativo',d=>{firstPosition(d).byteOffset=-4}],
  ['POSITION offset fracionário',d=>{firstPosition(d).byteOffset=0.5}],
  ['POSITION offset desalinhado',d=>{firstPosition(d).byteOffset=2}],
  ['POSITION buffer desalinhado',d=>{d.bufferViews[firstPosition(d).bufferView].byteOffset+=2}],
  ['POSITION buffer ausente',d=>{firstPosition(d).bufferView=d.bufferViews.length}],
  ['POSITION fora da view',d=>{const p=firstPosition(d);d.bufferViews[p.bufferView].byteLength=(p.byteOffset??0)+(p.count-1)*12+8}],
  ['POSITION stride curto',d=>{d.bufferViews[firstPosition(d).bufferView].byteStride=8}],
  ['POSITION stride desalinhado',d=>{d.bufferViews[firstPosition(d).bufferView].byteStride=13}],
  ['POSITION min incorreto',d=>{firstPosition(d).min[0]-=1}],
  ['POSITION max incorreto',d=>{firstPosition(d).max[0]+=1}],
  ['POSITION limites invertidos',d=>{firstPosition(d).min[0]=firstPosition(d).max[0]+1}],
  ['POSITION sparse não suportado',d=>{firstPosition(d).sparse={count:1}}],
  ['ID desconhecido',d=>{d.nodes.find(n=>n.mesh!==undefined).extras.componentId='inexistente'}],
  ['Camada incorreta',d=>{d.nodes.find(n=>n.mesh!==undefined).extras.layerId='inexistente'}],
  ['Âncora inválida',d=>{d.nodes.find(n=>n.mesh!==undefined).extras.anchor=[null,0,0]}],
  ['Material ausente',d=>{d.meshes[0].primitives[0].material=9999}],
  ['Decoder Draco',d=>{d.extensionsUsed=['KHR_draco_mesh_compression']}],
  ['Textura remota',d=>{d.images=[{uri:'https://example.invalid/texture.png'}]}],
  ['Buffer truncado',d=>{d.bufferViews[0].byteLength=2**30}],
  ['ID sem cobertura',d=>{d.nodes=d.nodes.filter(n=>n.extras?.componentId!=='bateria')}],
  ['Imagem sem buffer válido',d=>{d.images[0].bufferView=d.bufferViews.length}],
  ['Cena sem geometria',d=>{d.scenes[d.scene??0].nodes=[]}],
  ['Nó duplicado na cena',d=>{d.scenes[d.scene??0].nodes.push(d.scenes[d.scene??0].nodes[0])}],
  ['Ciclo de nós',d=>{const i=d.scenes[d.scene??0].nodes[0];d.nodes[i].children=[i]}],
  ['Quaternion nulo',d=>{d.nodes.find(n=>n.mesh!==undefined).rotation=[0,0,0,0]}],
  ['Quaternion não finito',d=>{d.nodes[0].rotation=[0,0,NaN,1]}],
  ['Quaternion formato errado',d=>{d.nodes[0].rotation=[0,0,1]}],
  ['Matriz não finita',d=>{d.nodes[0].matrix=Array(16).fill(Infinity)}],
  ['Matriz formato errado',d=>{d.nodes[0].matrix=[1,0,0,1]}],
  ['Matriz e TRS',d=>{d.nodes[0].matrix=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];d.nodes[0].translation=[0,0,0]}],
  ['Índices VEC3',d=>{d.accessors[d.meshes[0].primitives[0].indices].type='VEC3'}],
  ['Índices buffer ausente',d=>{d.accessors[d.meshes[0].primitives[0].indices].bufferView=999999}],
  ['Índices FLOAT',d=>{d.accessors[d.meshes[0].primitives[0].indices].componentType=5126}],
  ['Índices fora do buffer',d=>{d.accessors[d.meshes[0].primitives[0].indices].byteOffset=2**30}],
]
for(const [label,mutate] of mutations) { const d=structuredClone(doc); mutate(d); assert.throws(()=>validate(d,manifest),undefined,label) }
const badManifest=structuredClone(manifest);badManifest.nodes[0].componentId='incorreto'
assert.throws(()=>validate(doc,badManifest),undefined,'Manifesto adulterado')
assert.throws(()=>parse(raw.subarray(0,raw.length-4)),undefined,'Arquivo truncado')
const badIndices=Buffer.from(bin), primitive=doc.meshes[0].primitives[0]
const indexAccessor=doc.accessors[primitive.indices], indexView=doc.bufferViews[indexAccessor.bufferView]
const indexSize={5121:1,5123:2,5125:4}[indexAccessor.componentType]
badIndices.writeUIntLE(2**(8*indexSize)-1,(indexView.byteOffset??0)+(indexAccessor.byteOffset??0),indexSize)
assert.throws(()=>validate(doc,manifest,badIndices),/Índice fora dos vértices/,'Índice binário inválido')
for(const file of ['src/components/modelo3d/SenecaTechModel.tsx','src/components/home/SenecaModel.tsx']) {
  const text=readFileSync(join(root,file),'utf8')
  assert.ok(!/new THREE\.(Box|Cylinder|Sphere|Lathe|Extrude|Torus)Geometry/.test(text),'Proxy aeronáutico no navegador')
}
if(process.argv.includes('--dist')) {
  const built=join(root,'dist/models/pa34-camadas.glb')
  assert.ok(existsSync(built),'GLB ausente no build')
  assert.deepEqual(readFileSync(built),raw,'Build publicou GLB obsoleto')
  assert.deepEqual(readFileSync(join(root,'dist/models/pa34-camadas.manifest.json')),readFileSync(path.replace(/\.glb$/,'.manifest.json')),'Manifesto obsoleto')
}
const baselinePath=join(root,'public/models/pa34-seneca-bipa-v12.glb')
if(existsSync(baselinePath)) {
  const oldRaw=readFileSync(baselinePath),old=parse(oldRaw).doc
  console.log('Baseline GLB (não inclui proxies antigos):',JSON.stringify({bytes:oldRaw.length,triangles:old.meshes.reduce((n,m)=>n+m.primitives.reduce((a,p)=>a+old.accessors[p.indices].count/3,0),0),materials:old.materials.length,primitives:old.meshes.reduce((n,m)=>n+m.primitives.length,0)}))
}
console.log('Ativo Blender validado:',JSON.stringify({...metrics,bytes:raw.length,negativeCases:mutations.length+3}))
