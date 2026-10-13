// Audita mapa, corpos projetados, WebPs reais e proveniência; falha fechada.
import { createServer } from 'vite'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const here = dirname(fileURLToPath(import.meta.url)), root = resolve(here, '../..'), project = resolve(root, '..')
const out = resolve(process.env.COCKPIT_REPORT_DIR ?? resolve(project, '_bmad-output/visual-review/painel-renderizado'))
const assets = resolve(process.env.COCKPIT_ASSET_DIR ?? resolve(root, 'public/cockpit-render'))
const readJSON = async path => JSON.parse(await readFile(path, 'utf8'))
const hash = async path => createHash('sha256').update(await readFile(path)).digest('hex')
const report = { status: 'em-verificacao', checks: [] }
function check(name, ok, data) { report.checks.push({ name, ok: Boolean(ok), data }); if (!ok) throw new Error(name) }
function dimensions(b) {
  if (b.length < 20 || b.toString('ascii',0,4)!=='RIFF' || b.toString('ascii',8,12)!=='WEBP' || b.readUInt32LE(4)+8!==b.length) throw new Error('Assinatura/tamanho RIFF WEBP inválido')
  let canvas, image, count=0
  for(let p=12;p<b.length;) {
    if(p+8>b.length)throw new Error('Chunk WebP truncado')
    const tag=b.toString('ascii',p,p+4),n=b.readUInt32LE(p+4),start=p+8,end=start+n
    if(end>b.length)throw new Error('Payload WebP truncado')
    if(tag==='VP8X') {if(n!==10)throw new Error('VP8X inválido');canvas=[b.readUIntLE(start+4,3)+1,b.readUIntLE(start+7,3)+1]}
    if(tag==='VP8 ') {if(n<10||b.toString('hex',start+3,start+6)!=='9d012a')throw new Error('VP8 inválido');image=[b.readUInt16LE(start+6)&16383,b.readUInt16LE(start+8)&16383];count++}
    if(tag==='VP8L') {if(n<5||b[start]!==47)throw new Error('VP8L inválido');const bits=b.readUInt32LE(start+1);image=[(bits&16383)+1,((bits>>>14)&16383)+1];count++}
    p=end+(n%2)
    if(p>b.length)throw new Error('Padding WebP truncado')
  }
  if(count!==1||!image||canvas&&canvas.some((v,i)=>v!==image[i]))throw new Error('Dimensões/bitstream WebP inconsistentes')
  return image
}
let server
try {
  server = await createServer({ root, server: { middlewareMode: true }, appType: 'custom' })
  const { PANEL_MAP, PANEL_ORDER, VB_W, VB_H } = await server.ssrLoadModule('/src/components/cockpit/panel-data.ts')
  const exported = await readJSON(resolve(here,'panel-map.json'))
  check('Mapa exportado idêntico à fonte TypeScript atual',JSON.stringify(exported)===JSON.stringify({width:VB_W,height:VB_H,instruments:PANEL_ORDER.map(id=>PANEL_MAP[id])}))
  const projection = await readJSON(resolve(here,'projection-check.json'))
  check('49 corpos reais: centros e extensões projetados',projection.length===49&&PANEL_ORDER.every(id=>projection.some(p=>p.id===id&&p.object&&p.error<.001&&p.boundsError<.001&&p.bounds?.length===4)),{maxError:Math.max(...projection.map(p=>p.error)),maxBoundsError:Math.max(...projection.map(p=>p.boundsError))})
  const manifest=await readJSON(resolve(assets,'manifest.json'))
  check('Exatamente imagens dia/noite, sem duplicatas',Array.isArray(manifest.images)&&manifest.images.length===2&&['painel-dia.webp','painel-noite.webp'].every(file=>manifest.images.filter(i=>i.file===file).length===1))
  for(const image of manifest.images) {
    const path=resolve(assets,image.file),bytes=await readFile(path),[width,height]=dimensions(bytes)
    check(image.file+' assinatura, dimensões reais e integridade',width===VB_W*2&&height===VB_H*2&&image.width===width&&image.height===height&&await hash(path)===image.sha256&&bytes.length===image.bytes&&bytes.length<1000000,{width,height,bytes:bytes.length,sha256:image.sha256})
  }
  check('Proveniência de geração presente',manifest.generation?.masters&&manifest.generation?.atlases&&manifest.generation?.sources)
  for(const [group,prefix] of [['atlases','serigrafia'],['masters','painel']]) {
    const keys=Object.keys(manifest.generation[group]);check('Proveniência completa '+group,keys.length===2&&['dia','noite'].every(light=>keys.includes(`masters/${prefix}-${light}.png`)))
  }
  for(const [source,expected] of Object.entries({...manifest.sources,...manifest.generation.sources,...manifest.generation.atlases,...manifest.generation.masters})) check('Fingerprint '+source,await hash(resolve(here,source))===expected.sha256)
  const baseline=await readJSON(resolve(project,'_bmad-output/verificacao-final-retomada/fontes-sha256.json'))
  for(const [file,expected] of Object.entries(baseline))check('Fonte 3D aprovada intacta: '+file,await hash(resolve(project,file))===expected.sha256)
  const approved=await readJSON(resolve(root,'public/models/pa34-camadas.manifest.json'))
  check('GLB aprovado intacto',await hash(resolve(root,'public/models/pa34-camadas.glb'))===approved.sha256)
  check('Fonte Blender aprovada intacta',await hash(process.env.PA34_APPROVED_BLEND??'/Users/andrecardia/Documents/Codex/2026-09-04/cr/outputs/PA-34_Seneca_Bipa_v12.blend')===approved.source.sha256)
  report.status='aprovado'
} catch(error) {report.status='falhou';report.error=error.stack??String(error)}
finally {
  try {await server?.close()}catch(error){report.status='falhou';report.error=error.stack??String(error)}
  await mkdir(out,{recursive:true})
  await writeFile(resolve(out,'verificacao-ativos.json'),JSON.stringify(report,null,2)+'\n')
}
console.log(JSON.stringify(report,null,2))
if(report.status!=='aprovado')process.exitCode=1
