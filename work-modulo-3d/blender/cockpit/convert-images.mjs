// Conversão local via Chrome: SVG da serigrafia → PNG, masters Blender → WebP.
import { openChrome } from './chrome-cdp.mjs'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
const here = dirname(fileURLToPath(import.meta.url))
const digest = async path => { const bytes = await readFile(path); return { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') } }
const sourceFiles = ['export-map.mjs', 'convert-images.mjs', 'chrome-cdp.mjs', 'build_panel.py', 'panel-map.json', '../../src/components/cockpit/panel-data.ts', '../../src/components/cockpit/artwork.tsx', 'masters/serigrafia-dia.svg', 'masters/serigrafia-noite.svg']
const fingerprints = async files => Object.fromEntries(await Promise.all(files.map(async f => [f, await digest(resolve(here, f))])))
const mode = process.argv[2] ?? 'atlas'
if (!['atlas', 'render'].includes(mode)) throw new Error('Modo inválido')
let provenance
if (mode === 'atlas') {
  const exported = JSON.parse(await readFile(resolve(here,'masters/export-provenance.json'),'utf8'))
  for (const [file, expected] of Object.entries(exported)) if ((await digest(resolve(here,file))).sha256 !== expected.sha256) throw new Error(`Exportação obsoleta: ${file}`)
}
if (mode === 'render') {
  provenance = JSON.parse(await readFile(resolve(here, 'masters/render-provenance.json'), 'utf8'))
  for (const [group, prefix] of [['atlases','serigrafia'],['masters','painel']]) {
    const keys=Object.keys(provenance[group] ?? {})
    if(keys.length!==2||!['dia','noite'].every(light=>keys.includes(`masters/${prefix}-${light}.png`))) throw new Error(`Proveniência incompleta: ${group}`)
  }
  for (const [file, expected] of Object.entries({...provenance.sources, ...provenance.atlases, ...provenance.masters})) {
    if ((await digest(resolve(here, file))).sha256 !== expected.sha256) throw new Error(`Render obsoleto: ${file}`)
  }
  if (sourceFiles.some(file => !provenance.sources[file])) throw new Error('Proveniência incompleta')
}
const chrome = await openChrome({ prefix:'pa34-atlas-' })
try {
  const { send } = chrome
  const out = resolve(here, '../../public/cockpit-render')
  await mkdir(out, { recursive: true })
  for (const light of ['dia', 'noite']) {
    const input = resolve(here, `masters/${mode === 'atlas' ? 'serigrafia-' : 'painel-'}${light}.${mode === 'atlas' ? 'svg' : 'png'}`)
    const mime = mode === 'atlas' ? 'image/svg+xml' : 'image/png'
    const data = `data:${mime};base64,${(await readFile(input)).toString('base64')}`
    const canonical = JSON.parse(await readFile(resolve(here, 'panel-map.json'), 'utf8'))
    const response = await send('Runtime.evaluate', { expression: `(async () => {
      const im = new Image(); let src = ${JSON.stringify(data)}; const bounds=[];
      if (${mode === 'atlas'}) {
        const xml = new DOMParser().parseFromString(await (await fetch(src)).text(), 'image/svg+xml');
        const svg=document.importNode(xml.documentElement,true);svg.style.position='absolute';svg.style.left='-10000px';document.body.appendChild(svg);
        // Composição tipográfica para impressão pequena: sem mudar um único valor,
        // ângulo de escala, arco, ponteiro ou posição/raio canônico do instrumento.
        for (const entry of ${JSON.stringify(canonical.instruments)}) {
          const s=entry.shape;
          const g=svg.querySelector('[data-decal-instrument="'+entry.id+'"]');
          if(s.kind==='rect') {
            const left=s.x+3,top=s.y+3,right=s.x+s.w-3,bottom=s.y+s.h-3;
            for(const text of g.querySelectorAll('text')) {
              const original=text.textContent;let b=text.getBBox();
              for(let attempt=0;attempt<8&&(b.width>right-left||b.height>bottom-top);attempt++) {
                const factor=Math.min((right-left)/b.width,(bottom-top)/b.height)*.99;
                text.setAttribute('font-size',parseFloat(getComputedStyle(text).fontSize)*factor);
                const spacing=parseFloat(getComputedStyle(text).letterSpacing);if(Number.isFinite(spacing))text.setAttribute('letter-spacing',spacing*factor);
                b=text.getBBox();
              }
              const dx=b.x<left?left-b.x:b.x+b.width>right?right-b.x-b.width:0;
              const dy=b.y<top?top-b.y:b.y+b.height>bottom?bottom-b.y-b.height:0;
              text.setAttribute('x',Number(text.getAttribute('x'))+dx);text.setAttribute('y',Number(text.getAttribute('y'))+dy);
              b=text.getBBox();const ok=b.x>=left-.01&&b.y>=top-.01&&b.x+b.width<=right+.01&&b.y+b.height<=bottom+.01&&text.textContent===original;
              bounds.push({id:entry.id,text:original,bounds:[b.x,b.y,b.width,b.height],printable:[left,top,right,bottom],ok});
              if(!ok)throw new Error('Impressão fora do decal: '+entry.id+' '+original);
            }
            continue;
          }
          for(const t of g.querySelectorAll('text[dominant-baseline="central"]')) {
            const font=Number(t.getAttribute('font-size'))*.7;
            t.setAttribute('font-size',font);
            const x=Number(t.getAttribute('x')),y=Number(t.getAttribute('y'));
            // Reserva espaço real de glifo dentro da vedação/vidro, inclusive ADF.
            const limit=s.r-7-font*Math.max(1,.6*t.textContent.trim().length)/2;
            const factor=Math.min(1.08,limit/Math.max(1,Math.hypot(x-s.cx,y-s.cy)));
            t.setAttribute('x',s.cx+(x-s.cx)*factor);t.setAttribute('y',s.cy+(y-s.cy)*factor);
          }
          const title=g.querySelector('text[letter-spacing="0.5"]');
          const generic=[...g.querySelectorAll('text[dominant-baseline="central"]')].some(t=>t.parentElement.children.length===2);
          if(title && generic) {
            title.setAttribute('y',s.cy+s.r*.20);
            title.setAttribute('font-size',Math.max(3.4,s.r*.092));
            title.setAttribute('letter-spacing','0');
            const sub=title.nextElementSibling;
            if(sub?.tagName==='text') {sub.setAttribute('y',s.cy+s.r*.34);sub.setAttribute('font-size',Math.max(2.9,s.r*.075));}
          } else if(title && Number(title.getAttribute('y'))>s.cy+s.r*.68) {
            // Legendas especiais antes impressas sobre o aro ficam dentro do vidro.
            title.setAttribute('y',s.cy+s.r*.64);
            title.setAttribute('font-size',Math.max(3.4,s.r*.092));
            title.setAttribute('letter-spacing','0');
          }
        }
        svg.removeAttribute('style');src=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));svg.remove();
      }
      im.src=src; await im.decode(); const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0); if(src.startsWith('blob:'))URL.revokeObjectURL(src);return {data:c.toDataURL('${mode === 'atlas' ? 'image/png' : 'image/webp'}', .93),bounds}
    })()`, awaitPromise: true, returnByValue: true })
    if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails))
    const dest = mode === 'atlas' ? resolve(here, `masters/serigrafia-${light}.png`) : resolve(out, `painel-${light}.webp`)
    await writeFile(dest, Buffer.from(response.result.value.data.split(',')[1], 'base64'))
    if (mode === 'atlas') await writeFile(resolve(here, `masters/text-bounds-${light}.json`), JSON.stringify(response.result.value.bounds, null, 2)+'\n')
    console.log(dest)
  }
  if (mode === 'atlas') await writeFile(resolve(here,'masters/atlas-provenance.json'), JSON.stringify({sources:await fingerprints(sourceFiles),atlases:await fingerprints(['masters/serigrafia-dia.png','masters/serigrafia-noite.png'])},null,2)+'\n')
  if (mode === 'render') {
    const canonical = JSON.parse(await readFile(resolve(here, 'panel-map.json'), 'utf8'))
    const images = []
    for (const light of ['dia', 'noite']) images.push({ file: `painel-${light}.webp`, width: canonical.width * 2, height: canonical.height * 2, ...await digest(resolve(out, `painel-${light}.webp`)) })
    const sources = provenance.sources
    await writeFile(resolve(out, 'manifest.json'), JSON.stringify({ origem: 'Cena procedural independente do painel PA-34-200 Seneca I, criada no Blender; impressão derivada do artwork local, sem importar geometria do avião. Material didático não certificado.', camera: { projection: 'orthographic', width: canonical.width, height: canonical.height, sameCameraForBothImages: true }, masters: 'work-modulo-3d/blender/cockpit/masters/', generation: provenance, images, sources }, null, 2) + '\n')
  }
} finally {
  await chrome.close()
}
