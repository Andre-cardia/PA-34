import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = (...parts) => join(root, 'src', ...parts)
const read = (...parts) => readFileSync(src(...parts), 'utf8')
const expect = (condition, message) => assert.ok(condition, message)

const pages = ['Cockpit', 'Especificacoes', 'Performance', 'Sistemas', 'Procedimentos', 'Multimotor', 'Emergencias', 'Seguranca']
const app = read('App.tsx')
expect(!app.includes("from '@/pages/PageStub'"), 'As rotas não podem importar PageStub.')

const originalVisualContracts = {
  Cockpit: ['CockpitPanel', 'usePanZoom', 'InstrumentDrawer'],
  Especificacoes: ['VelocimetroASI', 'IdentidadeAeronave', 'PesosEnvelope'],
  Performance: ['ReguaVelocidades', 'DistanciasTetos', 'GaleriaTabelas'],
  Sistemas: ['SystemStation', 'CrossMap', 'metaFor'],
  Procedimentos: ['FaseSection', 'LinhaDeVoo'],
  Multimotor: ['AssimetriaDemo', 'MotorCritico'],
  Emergencias: ['EmergenciaCard', 'FluxoDecisao'],
  Seguranca: ['SafetyWindow', 'RegrasAccordion'],
}
for (const page of pages) {
  const content = read('pages', `${page}.tsx`)
  for (const contract of originalVisualContracts[page]) {
    expect(content.includes(contract), `${page} deve restaurar o gráfico/componente original ${contract}.`)
  }
}

const dataIndex = read('data', 'index.ts')
expect(dataIndex.includes('export const especificacoes'), 'Dados de especificações devem permanecer exportados.')
expect(dataIndex.includes('export const procedimentosNormais'), 'Checklists normais devem permanecer exportados.')
expect(dataIndex.includes('export const emergencias'), 'Emergências devem permanecer exportadas.')

const layout = read('components', 'Layout.tsx')
const cockpit = read('pages', 'Cockpit.tsx')
const systems = read('pages', 'Sistemas.tsx')
expect(layout.includes('location.hash'), 'Deep-links com hash devem ser tratados no Layout.')
expect(cockpit.includes('useSearchParams'), 'Deep-link de instrumentos deve usar query params.')
expect(cockpit.includes('resolveInstrumentId'), 'Cockpit deve resolver IDs válidos e inválidos.')
expect(systems.includes('metaFor'), 'Sistemas deve manter âncoras #8-x.')
expect(read('components', 'ui-custom', 'SearchPalette.tsx').includes('/modelo-3d?camada='), 'Busca deve manter deep-link 3D.')
expect(read('components', 'modelo3d', 'ModelCanvas.tsx').includes('EXPLODIDO'), 'HUD 3D deve usar o rótulo EXPLODIDO.')
const glbIntegration = read('components', 'modelo3d', 'glb.tsx')
// Aceita URL absoluta (/models/…) ou relativa ao BASE_URL (${…}models/…); proíbe o GLB FlightGear antigo.
expect(/(^|[/}])models\/pa34-camadas\.glb/m.test(glbIntegration) && !glbIntegration.includes('models/seneca-pa34.glb'), 'O modelo ativo deve usar as nove coleções Blender.')
expect(glbIntegration.includes('userData.componentId'), 'O carregador deve consumir metadados explícitos, não nomes.')
expect(!glbIntegration.includes('assignBipaNode'), 'Não deve existir classificação heurística no navegador.')
await import('./verify-model.mjs')
await import('./verify-runtime.mjs')
await import('./verify-camera-focus.mjs')
expect(app.includes('<Navigate to="/" replace />'), 'Rota desconhecida deve retornar para Home.')

const heroCanvas = read('components', 'home', 'HeroCanvas.tsx')
const heroFallback = read('components', 'home', 'HeroStaticFallback.tsx')
expect(heroCanvas.includes('canUseWebGL'), 'Hero deve detectar capacidade WebGL.')
expect(heroCanvas.includes('HeroStaticFallback'), 'Hero deve ter fallback estático.')
expect(heroFallback.includes('PA34ThreeView'), 'Fallback deve preservar a vista blueprint.')
expect(layout.includes('MotionConfig reducedMotion="user"'), 'Layout deve respeitar movimento reduzido.')
expect(read('index.css').includes('prefers-reduced-motion'), 'CSS deve conter o caminho de movimento reduzido.')
expect(read('components', 'home', 'HeroSection.tsx').includes('/hangar-ambience.jpg'), 'Hero deve restaurar o fundo visual original.')
expect(read('components', 'home', 'ModuleCards.tsx').includes('/cockpit-ref.jpg'), 'Card do cockpit deve restaurar a textura original.')

const originalVisualFiles = [
  'components/cockpit/artwork.tsx',
  'components/cockpit/CockpitPanel.tsx',
  'components/sistemas/diagrams/FuelDiagram.tsx',
  'components/sistemas/diagrams/ElectricalDiagram.tsx',
  'components/sistemas/diagrams/VacuumDiagram.tsx',
  'components/sistemas/diagrams/PropSyncDiagram.tsx',
  'components/sistemas/diagrams/GearDiagram.tsx',
  'components/sistemas/diagrams/BaggageDiagram.tsx',
  'components/sistemas/diagrams/HvacDiagram.tsx',
  'components/performance/ReguaVelocidades.tsx',
  'components/especificacoes/VelocimetroASI.tsx',
  'components/assets/PA34ThreeViewData.ts',
  'data/seneca-node-map.json',
]
for (const relative of originalVisualFiles) {
  expect(existsSync(join(root, 'src', relative)), `Visual original ausente: ${relative}`)
}

const publicAssets = [
  'grain-noise.png',
  'hangar-ambience.jpg',
  'cockpit-ref.jpg',
  'sop-fuel-schematic.png',
  'sop-electrical-schematic.png',
  'sop-baggage-key.png',
  'models/pa34-camadas.glb',
  'models/pa34-camadas.manifest.json',
  'models/seneca-pa34.glb',
  'models/pa34-seneca-bipa-v12.glb',
  'models/pa34-seneca-bipa-v12.source.txt',
  'NOTICE-MODELO-3D.txt',
]
for (const relative of publicAssets) {
  expect(existsSync(join(root, 'public', relative)), `Asset público ausente: ${relative}`)
}

for (const json of ['especificacoes.json', 'sistemas.json', 'procedimentos_normais.json', 'emergencias.json', 'cockpit_instruments.json', 'seneca-node-map.json']) {
  JSON.parse(read('data', json))
}

expect(existsSync(join(root, 'dist', 'index.html')), 'O build deve gerar dist/index.html antes da verificação.')
console.log(`Smoke verification passed: ${pages.length} páginas, componentes gráficos originais, dados JSON, deep-links e fallback WebGL.`)
