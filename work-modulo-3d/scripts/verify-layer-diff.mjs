// Compara nós/atributos/índices/materiais sem depender dos offsets do exportador.
// Uso: node scripts/verify-layer-diff.mjs anterior.glb atual.glb [IDs autorizados...]
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
function load(path) {
  const bytes=readFileSync(path), size=bytes.readUInt32LE(12)
  return { json:JSON.parse(bytes.subarray(20,20+size)), bin:bytes.subarray(28+size) }
}
const identity=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]
function multiply(a,b) {
  return Array.from({length:16},(_,i)=>[0,1,2,3].reduce((sum,k)=>sum+a[k*4+i%4]*b[Math.floor(i/4)*4+k],0))
}
function localMatrix(n) {
  if(n.matrix) return n.matrix
  const [x,y,z,w]=n.rotation??[0,0,0,1], s=n.scale??[1,1,1], t=n.translation??[0,0,0]
  return [(1-2*(y*y+z*z))*s[0],2*(x*y+z*w)*s[0],2*(x*z-y*w)*s[0],0,
    2*(x*y-z*w)*s[1],(1-2*(x*x+z*z))*s[1],2*(y*z+x*w)*s[1],0,
    2*(x*z+y*w)*s[2],2*(y*z-x*w)*s[2],(1-2*(x*x+y*y))*s[2],0,...t,1]
}
function fingerprint({json:g,bin}) {
  const world=new Map()
  const visit=(i,parent)=>{
    assert.ok(g.nodes[i]&&!world.has(i),'Hierarquia inválida ou nó duplicado')
    const matrix=multiply(parent,localMatrix(g.nodes[i])); world.set(i,matrix)
    for(const child of g.nodes[i].children??[]) visit(child,matrix)
  }
  const scene=g.scenes?.[g.scene??0]
  assert.ok(scene,'Cena padrão ausente')
  for(const i of scene.nodes??[]) visit(i,identity())
  const image=i=>{
    const source=g.images?.[i]; assert.ok(source,'Imagem inválida')
    const {bufferView,uri,...metadata}=source
    if(bufferView===undefined) return {...metadata,uri}
    const v=g.bufferViews[bufferView], start=v.byteOffset??0
    assert.ok(v.buffer===0&&start>=0&&start+v.byteLength<=bin.length,'Imagem fora do buffer')
    return {...metadata,bytes:bin.subarray(start,start+v.byteLength).toString('hex')}
  }
  const texture=i=>{
    const source=g.textures?.[i]; assert.ok(source,'Textura inválida')
    const {source:sourceIndex,sampler,extensions,...metadata}=source
    const resolved={...metadata,sampler:sampler===undefined?{}:g.samplers[sampler]}
    if(sourceIndex!==undefined) resolved.image=image(sourceIndex)
    if(extensions) resolved.extensions=Object.fromEntries(Object.entries(extensions).map(([key,value])=>{
      const {source,...rest}=value
      return [key,source===undefined?value:{...rest,image:image(source)}]
    }))
    return resolved
  }
  // Resolve referências em TextureInfo, inclusive nas extensões de materiais.
  const material=value=>{
    if(!value||typeof value!=='object') return value
    if(Array.isArray(value)) return value.map(material)
    return Object.fromEntries(Object.entries(value).map(([key,item])=>{
      if(key.endsWith('Texture')&&item&&Number.isInteger(item.index)) {
        const {index,...info}=item
        return [key,{...info,texture:texture(index)}]
      }
      return [key,material(item)]
    }))
  }
  const accessor = i => {
    const a=g.accessors[i], v=g.bufferViews[a.bufferView]
    const width={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type]*{5121:1,5123:2,5125:4,5126:4}[a.componentType]
    assert.ok(width,'Accessor não suportado na comparação')
    const values=[], start=(v.byteOffset??0)+(a.byteOffset??0)
    const element={5121:1,5123:2,5125:4,5126:4}[a.componentType]
    for(let k=0;k<a.count;k++) for(let j=0;j<width;j+=element) {
      const offset=start+k*(v.byteStride??width)+j
      values.push(a.componentType===5126?bin.readFloatLE(offset):bin.readUIntLE(offset,element))
    }
    return [a.count,a.type,a.componentType,values]
  }
  return new Map(g.nodes.flatMap((n,i)=>n.mesh===undefined?[]:[[n.name,{
    componentId:n.extras.componentId,layerId:n.extras.layerId,extras:n.extras,
    reachable:world.has(i),matrix:world.get(i)??localMatrix(n),
    primitives:g.meshes[n.mesh].primitives.map(p=>({
      material:material(g.materials[p.material]),indices:accessor(p.indices),
      // UVs de materiais sem textura não participam da aparência; bisect do Blender
      // pode preencher esses atributos não usados de maneira diferente ao regenerar.
      attributes:Object.fromEntries(Object.entries(p.attributes).filter(([k])=>!k.startsWith('TEXCOORD')||JSON.stringify(g.materials[p.material]).includes('Texture"')).map(([k,v])=>[k,accessor(v)])),
    })),
  }]]))
}
// Reexportação pode variar UVs em ~3e-8; tolerância numérica explícita, não visual.
const epsilon=1e-6
function equal(a,b) {
  if(a===b) return true
  if(typeof a==='number'&&typeof b==='number') return Math.abs(a-b)<=epsilon
  if(!a||!b||typeof a!=='object'||typeof b!=='object') return false
  const keys=Object.keys(a)
  return keys.length===Object.keys(b).length&&keys.every(k=>Object.hasOwn(b,k)&&equal(a[k],b[k]))
}
function compare(a,b,allowed=[]) {
  const changed=[]
  for(const name of new Set([...a.keys(),...b.keys()])) {
    if(!equal(a.get(name),b.get(name))) {
      const n=b.get(name)??a.get(name)
      changed.push({name,componentId:n.componentId,layerId:n.layerId})
      assert.ok(allowed.includes(n.componentId),`Alteração fora do escopo: ${name}`)
    }
  }
  return {beforeNodes:a.size,afterNodes:b.size,changed}
}
function selfTest() {
  const fixture={json:{scene:0,scenes:[{nodes:[0]}],nodes:[{children:[1]},
    {name:'peça',mesh:0,extras:{componentId:'teste',layerId:'camada'}}],
    meshes:[{primitives:[{material:0,indices:0,attributes:{POSITION:1,TEXCOORD_0:2}}]}],
    materials:[{pbrMetallicRoughness:{baseColorTexture:{index:0}}}],
    textures:[{source:0,sampler:0}],samplers:[{magFilter:9729}],
    images:[{bufferView:3,mimeType:'image/png'}],
    bufferViews:[{buffer:0,byteOffset:0,byteLength:6},{buffer:0,byteOffset:8,byteLength:36},
      {buffer:0,byteOffset:44,byteLength:24},{buffer:0,byteOffset:68,byteLength:4}],
    accessors:[{bufferView:0,count:3,type:'SCALAR',componentType:5123},
      {bufferView:1,count:3,type:'VEC3',componentType:5126},
      {bufferView:2,count:3,type:'VEC2',componentType:5126}]},bin:Buffer.alloc(72)}
  const clone=()=>({json:structuredClone(fixture.json),bin:Buffer.from(fixture.bin)})
  const baseline=fingerprint(fixture)
  const negatives=[
    ['Imagem embarcada alterada',f=>{f.bin[68]=1}],
    ['Sampler alterado',f=>{f.json.samplers[0].magFilter=9728}],
    ['Ancestral movido',f=>{f.json.nodes[0].translation=[1,0,0]}],
    ['Ancestral rotacionado',f=>{f.json.nodes[0].rotation=[0,0,1,0]}],
    ['Ancestral escalado',f=>{f.json.nodes[0].scale=[2,1,1]}],
    ['Ancestral com matriz movido',f=>{f.json.nodes[0].matrix=identity();f.json.nodes[0].matrix[12]=1}],
    ['Nó removido da cena',f=>{f.json.scenes[0].nodes=[]}],
    ['Descendente removido',f=>{f.json.nodes[0].children=[]}],
    ['Cena padrão alterada',f=>{f.json.scenes.push({nodes:[]});f.json.scene=1}],
    ['UV texturizado alterado',f=>{f.bin.writeFloatLE(0.25,44)}],
    ['Fora da tolerância',f=>{f.json.nodes[0].translation=[2e-6,0,0]}],
  ]
  for(const [label,mutate] of negatives) {
    const f=clone();mutate(f)
    assert.throws(()=>compare(baseline,fingerprint(f)),/Alteração fora do escopo/,label)
    assert.equal(compare(baseline,fingerprint(f),['teste']).changed.length,1,label)
  }
  const near=clone();near.json.nodes[0].translation=[5e-7,0,0]
  assert.equal(compare(baseline,fingerprint(near)).changed.length,0,'Tolerância 1e-6')
  const untextured=clone();delete untextured.json.materials[0].pbrMetallicRoughness.baseColorTexture
  const oldUntextured=fingerprint(untextured);untextured.bin.writeFloatLE(0.25,44)
  assert.equal(compare(oldUntextured,fingerprint(untextured)).changed.length,0,'UV sem textura ignorado')
  const relocated=clone();relocated.json.images.unshift({uri:'não usada'});relocated.json.textures[0].source=1
  relocated.json.samplers.unshift({});relocated.json.textures[0].sampler=1
  relocated.json.textures.unshift({});relocated.json.materials[0].pbrMetallicRoughness.baseColorTexture.index=1
  assert.equal(compare(baseline,fingerprint(relocated)).changed.length,0,'Índices de dependências resolvidos')
  const equivalent=clone();equivalent.json.nodes[0].matrix=identity()
  assert.equal(compare(baseline,fingerprint(equivalent)).changed.length,0,'Matriz identidade equivalente')
  console.log('Autotestes layer-diff:',JSON.stringify({negativeCases:negatives.length,positiveCases:4}))
}
if(process.argv.includes('--self-test')) selfTest()
else {
  const [before,after,...allowed]=process.argv.slice(2)
  assert.ok(before&&after,'Fornecer GLBs anterior e atual')
  console.log('Comparação geométrica/material:',JSON.stringify(compare(fingerprint(load(before)),fingerprint(load(after)),allowed)))
}
