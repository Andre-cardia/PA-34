// Negativos isolados: nunca altera os ativos finais.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, writeFile, mkdir, rm, readdir, copyFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { openChrome } from './chrome-cdp.mjs'
const here=dirname(fileURLToPath(import.meta.url)),project=resolve(here,'../../..'),temp=await mkdtemp(join(tmpdir(),'pa34-negative-'))
const results=[]
const sha=b=>createHash('sha256').update(b).digest('hex')
const run=(file,args=[],env={})=>spawnSync(process.execPath,[file,...args],{cwd:project,env:{...process.env,...env},encoding:'utf8',timeout:10000})
const record=(name,data={})=>results.push({name,ok:true,...data})
try {
  for(const path of ['/definitely/not/a/chrome','/usr/bin/true'])for(const [file,args] of [[resolve(here,'convert-images.mjs'),['atlas']],[resolve(project,'_bmad-output/visual-review/painel-renderizado/verificar-painel.mjs'),[]]]) {
    const before=(await readdir(tmpdir())).filter(n=>/^pa34-(atlas|render-test)-/.test(n)),start=Date.now()
    const r=run(file,args,{CHROME_PATH:path,REVIEW_OUTPUT:resolve(temp,'browser-report')})
    assert.notEqual(r.status,0);assert.equal(r.error,undefined);assert.ok(Date.now()-start<8000)
    const after=(await readdir(tmpdir())).filter(n=>/^pa34-(atlas|render-test)-/.test(n));assert.deepEqual(after.sort(),before.sort())
    record('CLI Chrome indisponível/encerra cedo: '+path+' '+file.split('/').pop(),{ms:Date.now()-start})
  }
  for(const mode of ['deadline','terminate']) {
    const browser=await openChrome({prefix:'pa34-negative-cdp-',timeout:2000})
    try {
      const pending=browser.send('Runtime.evaluate',{expression:'new Promise(()=>{})',awaitPromise:true}).then(()=>null,e=>e)
      if(mode==='terminate')browser.browser.kill('SIGTERM')
      const error=await pending;assert.ok(error instanceof Error);record('CDP '+mode+' rejeita comando pendente',{error:error.message})
    } finally {await browser.close()}
    assert.ok(browser.browser.exitCode!==null||browser.browser.signalCode!==null)
    await assert.rejects(readFile(resolve(browser.profile,'Local State')))
  }
  const original=JSON.parse(await readFile(resolve(here,'../../public/cockpit-render/manifest.json'),'utf8'))
  const day=await readFile(resolve(here,'../../public/cockpit-render/painel-dia.webp')),night=await readFile(resolve(here,'../../public/cockpit-render/painel-noite.webp'))
  const cases=['manifest-ausente','json-invalido','imagem-ausente','par-duplicado','terceira-imagem','assinatura','dimensao-real','dimensao-manifest','hash','truncado','proveniencia-incompleta']
  for(const name of cases) {
    const dir=resolve(temp,name);await mkdir(dir);const manifest=structuredClone(original);let bytes=Buffer.from(day)
    if(name==='proveniencia-incompleta')manifest.generation.masters={}
    if(name==='par-duplicado')manifest.images[1]=manifest.images[0]
    if(name==='terceira-imagem')manifest.images.push(manifest.images[0])
    if(name==='assinatura')bytes.write('NOPE',0)
    if(name==='dimensao-real') {for(let p=12;p<bytes.length;){const tag=bytes.toString('ascii',p,p+4),n=bytes.readUInt32LE(p+4);if(tag==='VP8X')bytes.writeUIntLE(1599,p+12,3);if(tag==='VP8 ')bytes.writeUInt16LE(1600,p+14);p+=8+n+n%2}}
    if(name==='truncado')bytes=bytes.subarray(0,bytes.length-3)
    if(['assinatura','dimensao-real','truncado'].includes(name)){manifest.images[0].sha256=sha(bytes);manifest.images[0].bytes=bytes.length}
    if(name==='dimensao-manifest')manifest.images[0].width=1500
    if(name==='hash')manifest.images[0].sha256='0'.repeat(64)
    if(name!=='imagem-ausente')await writeFile(resolve(dir,'painel-dia.webp'),bytes)
    await writeFile(resolve(dir,'painel-noite.webp'),night)
    if(name!=='manifest-ausente')await writeFile(resolve(dir,'manifest.json'),name==='json-invalido'?'{broken':JSON.stringify(manifest))
    const r=run(resolve(here,'verify-assets.mjs'),[],{COCKPIT_ASSET_DIR:dir,COCKPIT_REPORT_DIR:dir})
    assert.notEqual(r.status,0);assert.equal(r.error,undefined)
    const report=JSON.parse(await readFile(resolve(dir,'verificacao-ativos.json'),'utf8'));assert.equal(report.status,'falhou');assert.ok(report.error)
    record('Verificador falha fechado: '+name)
  }
  const provenance=JSON.parse(await readFile(resolve(here,'masters/render-provenance.json'),'utf8'))
  const fixture=resolve(temp,'fixture/app/blender/cockpit')
  for(const f of [...Object.keys(provenance.sources),...Object.keys(provenance.atlases),...Object.keys(provenance.masters),'masters/render-provenance.json']) {
    const dst=resolve(fixture,f);await mkdir(dirname(dst),{recursive:true});await copyFile(resolve(here,f),dst)
  }
  for(const target of ['build_panel.py','masters/serigrafia-dia.png','masters/painel-dia.png','../../src/components/cockpit/artwork.tsx']) {
    const dst=resolve(fixture,target),before=await readFile(dst);await writeFile(dst,Buffer.concat([before,Buffer.from('\nchanged')]))
    const r=run(resolve(fixture,'convert-images.mjs'),['render']);assert.notEqual(r.status,0);assert.match(r.stderr,/Render obsoleto/)
    await writeFile(dst,before);record('Conversor recusa proveniência obsoleta: '+target)
  }
  const incomplete=structuredClone(provenance);incomplete.masters={}
  await writeFile(resolve(fixture,'masters/render-provenance.json'),JSON.stringify(incomplete))
  const incompleteRun=run(resolve(fixture,'convert-images.mjs'),['render']);assert.notEqual(incompleteRun.status,0);assert.match(incompleteRun.stderr,/Proveniência incompleta/)
  record('Conversor recusa grupo masters sem fingerprints')
  console.log(JSON.stringify({status:'aprovado',results},null,2))
  await writeFile(resolve(project,'_bmad-output/visual-review/painel-renderizado/negativos-pipeline.json'),JSON.stringify({status:'aprovado',results},null,2)+'\n')
} finally {await rm(temp,{recursive:true,force:true,maxRetries:5,retryDelay:100})}
