// Node >=22.18: helpers TypeScript de produção, sem transpilação/framework adicional.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { collectGlbParts, materialsOf, styleMaterial, objectBounds } from '../src/components/modelo3d/glb-runtime.ts'
const root=new URL('../',import.meta.url)
const raw=readFileSync(new URL('public/models/pa34-camadas.glb',root))
const catalog=JSON.parse(readFileSync(new URL('src/data/componentes_3d.json',root),'utf8'))
const ids=new Map(catalog.camadas.flatMap(l=>l.componentes.map(c=>[c.id,l.id])))
const layers=catalog.camadas.map(l=>l.id)
const loader=new GLTFLoader()
// Node não tem decodificador de imagens DOM. Só esse limite é adaptado;
// buffers, hierarquia, extras e todos materiais PBR são lidos pelo GLTFLoader real.
loader.register(()=>({name:'NODE_TEXTURE_ADAPTER',loadTexture:async()=>new THREE.Texture()}))
const loaded=await loader.parseAsync(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),fileURLToPath(root))
const a=collectGlbParts(loaded.scene,ids,layers),b=collectGlbParts(loaded.scene,ids,layers)
assert.equal(new Set(Object.values(a).flat().map(p=>p.comp)).size,68)
let inherited=0
loaded.scene.traverse(o=>{if(o.isMesh&&!o.userData.componentId&&o.parent?.userData.componentId)inherited++})
assert.ok(inherited>0,'Ativo deve exercitar extras herdados da hierarquia multimaterial')
function state(m){return {opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite,emissive:m.emissive?.toArray(),intensity:m.emissiveIntensity,color:m.color?.toArray(),roughness:m.roughness,metalness:m.metalness,map:m.map}}
let tested=0
for(const layer of layers)for(let i=0;i<a[layer].length;i++) {
  const pa=a[layer][i],pb=b[layer][i]
  const source=loaded.scene.getObjectByProperty('uuid',pa.name)
  const originals=Array.isArray(source.material)?source.material:[source.material]
  materialsOf(pa).forEach((m,j)=>{
    const other=materialsOf(pb)[j],original=originals[j],initial=state(m),sourceBefore=state(original)
    assert.notEqual(m,other);assert.notEqual(m,original)
    for(const [opacity,highlight] of [[.12,.7],[.06,.4],[1,.55],[1,0]])styleMaterial(m,opacity,highlight)
    assert.deepEqual(state(m),initial,'Round-trip deve restaurar propriedades PBR/emissão/transparência')
    assert.deepEqual(state(other),initial,'Outra instância não pode ser contaminada')
    assert.deepEqual(state(original),sourceBefore,'Cache GLTFLoader não pode ser contaminado')
    tested++
  })
}
// Mesmo caminho de produção com propriedades autorais não-default.
const custom=new THREE.MeshStandardMaterial({transparent:true,opacity:.37,depthWrite:false,emissive:'#824033',emissiveIntensity:2.5})
const group=new THREE.Group();group.userData={componentId:'teste',layerId:'teste',side:'centro',anchor:[0,0,0]}
const mesh=new THREE.Mesh(new THREE.BoxGeometry(2,4,6),custom);group.add(mesh)
const parts=collectGlbParts(group,new Map([['teste','teste']]),['teste'])
const clone=parts.teste[0].material;const before=state(clone)
styleMaterial(clone,.03,.9);styleMaterial(clone,1,0);assert.deepEqual(state(clone),before)
group.userData.componentId='inválido'
assert.throws(()=>collectGlbParts(group,new Map([['teste','teste']]),['teste']))
group.position.set(5,6,7);mesh.rotation.z=Math.PI/2
const bounds=objectBounds(group)
assert.ok(bounds.getCenter(new THREE.Vector3()).distanceTo(new THREE.Vector3(5,6,7))<1e-10)
const precise=new THREE.Box3().setFromObject(group,true)
assert.ok(bounds.min.distanceTo(precise.min)<1e-10&&bounds.max.distanceTo(precise.max)<1e-10)
// Após construir cache local, nova avaliação não pode ler a posição dos vértices.
mesh.geometry.attributes.position.getX=()=>{throw new Error('Varredura de vértices por frame')}
objectBounds(group);objectBounds(group)
console.log(`Runtime PASS: GLTFLoader real, 68 IDs, ${inherited} meshes com extras herdados, ${tested} materiais independentes/round-trip, bounds cacheados; pixels de textura limitados ao ensaio CDP.`)
