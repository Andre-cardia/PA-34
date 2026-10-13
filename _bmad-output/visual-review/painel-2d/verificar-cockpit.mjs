// Verificação local do painel 2D via Chrome DevTools Protocol.
// Uso: node _bmad-output/visual-review/painel-2d/verificar-cockpit.mjs

import { spawn } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const origem = process.env.PA34_URL ?? 'http://127.0.0.1:4175/cockpit'
const chromePath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const saida = resolve(process.env.REVIEW_OUTPUT ?? '_bmad-output/visual-review/refinamento-painel-2d')
const idsEsperados = [
  'bussola_magnetica', 'termometro_oat', 'relogio', 'adf_indicador', 'aviso_estol',
  'chave_master', 'chaves_alternadores', 'chaves_magnetos_partida', 'bombas_combustivel_eletricas', 'pitot_heat_luzes', 'freio_estacionamento',
  'velocimetro', 'horizonte_artificial', 'altimetro', 'coordenador_curva', 'giro_direcional', 'variometro',
  'indicador_vor_1', 'indicador_vor_2_gs', 'avisos_eletricos_vacuo', 'luzes_marker', 'piloto_automatico', 'painel_audio',
  'navcom_1', 'navcom_2', 'adf_receptor', 'dme', 'transponder',
  'pressao_admissao', 'tacometro_duplo', 'fluxo_combustivel_pressao', 'egt', 'pressao_oleo', 'temperatura_oleo', 'cht', 'quantidade_combustivel',
  'instrumentos_copiloto', 'relogio_copiloto_acendedor', 'disjuntores', 'seletor_trem', 'luzes_trem_verdes', 'luz_trem_vermelha',
  'extensao_emergencia_trem', 'amperimetros', 'indicador_vacuo', 'estatica_alternada', 'aquecimento_desembacador',
  'seletoras_combustivel', 'flaps_alavanca', 'manetes_potencia', 'manetes_helice', 'manetes_mistura',
  'compensadores', 'cowl_flaps', 'ar_alternativo', 'jacks_audio',
]
const porta = 9300 + (process.pid % 500)
const perfil = mkdtempSync(join(tmpdir(), 'pa34-cockpit-cdp-'))
const relatorio = {
  origem,
  executadoEm: new Date().toISOString(),
  status: 'em-execucao',
  evidencias: [],
}

mkdirSync(saida, { recursive: true })
const capturasFinais = ['depois-1440-noite.png', 'depois-1440-dia.png', 'depois-1440-rotulos.png', 'depois-768.png', 'depois-390.png']
for (const nome of capturasFinais) rmSync(join(saida, nome), { force: true })

let chrome = null
let socket = null
let sequencia = 0
const pendentes = new Map()
const TEMPO_COMANDO_MS = 8000
const esperar = (ms) => new Promise((resolveDelay) => setTimeout(resolveDelay, ms))

async function alvoDisponivel() {
  let ultimoErro
  for (let tentativa = 0; tentativa < 80; tentativa += 1) {
    try {
      const resposta = await fetch(`http://127.0.0.1:${porta}/json/list`)
      if (resposta.ok) {
        const alvos = await resposta.json()
        const pagina = alvos.find((alvo) => alvo.type === 'page')
        if (pagina?.webSocketDebuggerUrl) return pagina
      }
    } catch (erro) {
      ultimoErro = erro
    }
    await esperar(50)
  }
  throw new Error(`Chrome CDP indisponível: ${ultimoErro?.message ?? 'tempo esgotado'}`)
}

function rejeitarPendentes(erro) {
  for (const pendente of pendentes.values()) {
    clearTimeout(pendente.timer)
    pendente.reject(erro)
  }
  pendentes.clear()
}

async function iniciarChrome() {
  chrome = spawn(
    chromePath,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      `--remote-debugging-port=${porta}`,
      `--user-data-dir=${perfil}`,
      'about:blank',
    ],
    { stdio: ['ignore', 'ignore', 'ignore'] },
  )
  const falhaSpawn = new Promise((_, rejeitar) => chrome.once('error', rejeitar))
  const alvo = await Promise.race([alvoDisponivel(), falhaSpawn])
  socket = new WebSocket(alvo.webSocketDebuggerUrl)
  await Promise.race([
    new Promise((resolveOpen, rejectOpen) => {
      socket.addEventListener('open', resolveOpen, { once: true })
      socket.addEventListener('error', () => rejectOpen(new Error('Falha ao abrir WebSocket CDP')), { once: true })
    }),
    esperar(TEMPO_COMANDO_MS).then(() => {
      throw new Error('Tempo esgotado ao abrir WebSocket CDP')
    }),
  ])
  socket.addEventListener('message', (evento) => {
    const mensagem = JSON.parse(evento.data)
    if (!mensagem.id) return
    const pendente = pendentes.get(mensagem.id)
    if (!pendente) return
    pendentes.delete(mensagem.id)
    clearTimeout(pendente.timer)
    if (mensagem.error) pendente.reject(new Error(`${pendente.metodo}: ${mensagem.error.message}`))
    else pendente.resolve(mensagem.result)
  })
  socket.addEventListener('close', () => rejeitarPendentes(new Error('WebSocket CDP encerrado')))
  socket.addEventListener('error', () => rejeitarPendentes(new Error('Falha no WebSocket CDP')))
}

function enviar(metodo, params = {}) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return Promise.reject(new Error(`WebSocket CDP indisponível para ${metodo}`))
  }
  const id = ++sequencia
  return new Promise((resolveSend, rejectSend) => {
    const timer = setTimeout(() => {
      pendentes.delete(id)
      rejectSend(new Error(`Tempo esgotado no comando CDP ${metodo}`))
    }, TEMPO_COMANDO_MS)
    pendentes.set(id, { resolve: resolveSend, reject: rejectSend, metodo, timer })
    try {
      socket.send(JSON.stringify({ id, method: metodo, params }))
    } catch (erro) {
      clearTimeout(timer)
      pendentes.delete(id)
      rejectSend(erro)
    }
  })
}

async function avaliar(expressao) {
  const resposta = await enviar('Runtime.evaluate', {
    expression: `(() => {
      const nomeDialogo = (el) => {
        if (!el) return null
        const referencias = el.getAttribute('aria-labelledby')?.trim().split(/\\s+/).filter(Boolean)
        if (referencias?.length) return referencias.map(id => document.getElementById(id)?.textContent?.trim() ?? '').join(' ').trim()
        return el.getAttribute('aria-label')
      }
      return (${expressao})
    })()`,
    awaitPromise: true,
    returnByValue: true,
  })
  if (resposta.exceptionDetails) {
    throw new Error(resposta.exceptionDetails.exception?.description ?? resposta.exceptionDetails.text)
  }
  return resposta.result.value
}

async function esperarAte(expressao, descricao, limiteMs = 6000) {
  const inicio = Date.now()
  while (Date.now() - inicio < limiteMs) {
    if (await avaliar(expressao)) return
    await esperar(50)
  }
  throw new Error(`Tempo esgotado: ${descricao}`)
}

async function viewport(largura, altura = 1100) {
  await enviar('Emulation.setDeviceMetricsOverride', {
    width: largura,
    height: altura,
    deviceScaleFactor: 1,
    mobile: false,
  })
}

async function navegar(url = origem) {
  await enviar('Page.navigate', { url })
  await esperarAte(
    "document.readyState === 'complete' && document.querySelectorAll('[data-hotspot]').length === 56",
    `carregar ${url}`,
  )
  await esperar(700)
}

function urlInstrumento(id) {
  const url = new URL(origem)
  url.searchParams.set('i', id)
  url.hash = ''
  return url.href
}

async function clicarHotspotReal(id) {
  const ponto = await avaliar(`(() => {
    const grupo = document.querySelector('[data-hotspot="${id}"]')
    const alvo = grupo?.firstElementChild
    if (!alvo) return null
    const r = alvo.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, largura: r.width, altura: r.height }
  })()`)
  if (!ponto) return null
  await enviar('Input.dispatchMouseEvent', { type: 'mousePressed', x: ponto.x, y: ponto.y, button: 'left', buttons: 1, clickCount: 1 })
  await enviar('Input.dispatchMouseEvent', { type: 'mouseReleased', x: ponto.x, y: ponto.y, button: 'left', buttons: 0, clickCount: 1 })
  return ponto
}

function lerZoom(rotulo) {
  const valor = /^ZOOM\s+(\d+(?:\.\d+)?)%$/.exec(rotulo ?? '')?.[1]
  return valor === undefined ? Number.NaN : Number(valor)
}

function lerTranslacao(transformacao) {
  const grupos = /^translate\((-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\)\s+scale\(/.exec(transformacao ?? '')
  return grupos ? { x: Number(grupos[1]), y: Number(grupos[2]) } : null
}

function formasIntersectam(a, b) {
  if (a.kind === 'circle' && b.kind === 'circle') {
    return Math.hypot(a.cx - b.cx, a.cy - b.cy) < a.r + b.r
  }
  if (a.kind === 'rect' && b.kind === 'rect') {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  }
  const circulo = a.kind === 'circle' ? a : b
  const retangulo = a.kind === 'rect' ? a : b
  const x = Math.max(retangulo.x, Math.min(circulo.cx, retangulo.x + retangulo.w))
  const y = Math.max(retangulo.y, Math.min(circulo.cy, retangulo.y + retangulo.h))
  return Math.hypot(circulo.cx - x, circulo.cy - y) < circulo.r
}

async function aguardarSaidaChrome(limiteMs) {
  if (!chrome || chrome.exitCode !== null || chrome.signalCode !== null) return true
  return new Promise((resolver) => {
    const timer = setTimeout(() => {
      chrome.removeListener('exit', aoSair)
      resolver(false)
    }, limiteMs)
    const aoSair = () => {
      clearTimeout(timer)
      resolver(true)
    }
    chrome.once('exit', aoSair)
  })
}

async function capturar(nome) {
  const captura = await enviar('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  writeFileSync(join(saida, nome), Buffer.from(captura.data, 'base64'))
}

function registrar(nome, dados = true) {
  relatorio.evidencias.push({ nome, ok: true, dados })
}

function exigir(condicao, mensagem, dados) {
  if (!condicao) throw new Error(`${mensagem}: ${JSON.stringify(dados)}`)
  registrar(mensagem, dados)
}

try {
  await iniciarChrome()
  await enviar('Page.enable')
  await enviar('Runtime.enable')
  await viewport(1440)
  await navegar()

  const contratoDom = await avaliar(`(() => {
    const hotspots = [...document.querySelectorAll('[data-hotspot]')]
    const ids = hotspots.map((el) => el.getAttribute('data-hotspot'))
    const formas = hotspots.map((el) => {
      const alvo = el.firstElementChild
      const id = el.getAttribute('data-hotspot')
      if (alvo?.tagName.toLowerCase() === 'circle') {
        return { id, kind: 'circle', cx: Number(alvo.getAttribute('cx')), cy: Number(alvo.getAttribute('cy')), r: Number(alvo.getAttribute('r')) }
      }
      return {
        id,
        kind: 'rect',
        x: Number(alvo?.getAttribute('x')),
        y: Number(alvo?.getAttribute('y')),
        w: Number(alvo?.getAttribute('width')),
        h: Number(alvo?.getAttribute('height')),
      }
    })
    return {
      total: ids.length,
      unicos: new Set(ids).size,
      ids,
      formas,
      tabulaveis: hotspots.filter((el) => el.getAttribute('tabindex') === '0').length,
      rotulados: hotspots.filter((el) => (el.getAttribute('aria-label') || '').length > 3).length,
      nomePainel: document.querySelector('[role="group"][aria-label^="Painel vetorial"]')?.getAttribute('aria-label') ?? null,
    }
  })()`)
  const geometriasInvalidas = contratoDom.formas.filter((forma) =>
    forma.kind === 'circle'
      ? ![forma.cx, forma.cy, forma.r].every(Number.isFinite) || forma.r <= 0
      : ![forma.x, forma.y, forma.w, forma.h].every(Number.isFinite) || forma.w <= 0 || forma.h <= 0,
  )
  const conjuntoIDs = contratoDom.ids.length === idsEsperados.length && idsEsperados.every((id) => contratoDom.ids.includes(id))
  const intersecoes = []
  for (let i = 0; i < contratoDom.formas.length; i += 1) {
    for (let j = i + 1; j < contratoDom.formas.length; j += 1) {
      if (formasIntersectam(contratoDom.formas[i], contratoDom.formas[j])) {
        intersecoes.push([contratoDom.formas[i].id, contratoDom.formas[j].id])
      }
    }
  }
  const contratoReproduzivel = {
    executadoEm: relatorio.executadoEm,
    total: contratoDom.total,
    unicos: contratoDom.unicos,
    ids: contratoDom.ids,
    geometriasInvalidas: geometriasInvalidas.map((forma) => forma.id),
    intersecoesHotspotsExpandidos: intersecoes,
    resultado:
      contratoDom.total === 56 && contratoDom.unicos === 56 && conjuntoIDs && geometriasInvalidas.length === 0 && intersecoes.length === 0
        ? 'aprovado'
        : 'falhou',
    conjuntoIDsEsperado: conjuntoIDs,
  }
  writeFileSync(join(saida, 'verificacao-contratos.json'), `${JSON.stringify(contratoReproduzivel, null, 2)}\n`)
  exigir(
    contratoReproduzivel.resultado === 'aprovado' && contratoDom.tabulaveis === 56 && contratoDom.rotulados === 56,
    '56 hotspots únicos, tabuláveis, rotulados e sem interseções',
    { ...contratoReproduzivel, tabulaveis: contratoDom.tabulaveis, rotulados: contratoDom.rotulados },
  )

  const contratoVisual = await avaliar(`(() => {
    const concha = document.querySelector('[data-panel-shape="curved-shell"]')
    const faixa = document.querySelector('[data-panel-surface="tan-strip"]')
    const pedestal = document.querySelector('[data-panel-surface="tan-pedestal"]')
    const corDaManete = (kind) => document.querySelector('[data-lever-kind="' + kind + '"] [fill]')?.getAttribute('fill') ?? null
    return {
      conchaCurva: Boolean(concha?.getAttribute('d')?.includes(' Q ')),
      faixaBege: faixa?.getAttribute('fill') ?? null,
      pedestalBege: pedestal?.getAttribute('fill') ?? null,
      manetes: {
        throttle: corDaManete('throttle'),
        prop: corDaManete('prop'),
        mixture: corDaManete('mixture'),
      },
    }
  })()`)
  exigir(
    contratoVisual.conchaCurva &&
      contratoVisual.faixaBege?.includes('ck-tan-') &&
      contratoVisual.pedestalBege?.includes('ck-tan-') &&
      contratoVisual.manetes.throttle === '#151615' &&
      contratoVisual.manetes.prop === '#3F7DCB' &&
      contratoVisual.manetes.mixture === '#C83E36',
    'Contratos visuais preservam concha curva, superfícies bege e manetes distintas',
    contratoVisual,
  )

  const estadoRotulosInicial = await avaliar(`({
    total: document.querySelectorAll('[data-cockpit-label]').length,
    ativo: document.querySelector('button[title^="Mostrar/esconder rótulos"]')?.getAttribute('aria-pressed'),
  })`)
  exigir(estadoRotulosInicial.total === 0 && estadoRotulosInicial.ativo === 'false', 'Vista inicial limpa sem callouts em massa', estadoRotulosInicial)

  for (let i = 0; i < 3; i += 1) {
    await avaliar(`document.querySelector('button[aria-label="Aproximar (zoom +)"]').click()`)
    await esperar(280)
  }
  await esperarAte("document.querySelectorAll('[data-cockpit-label]').length === 0", 'zoom alto não deve ligar todos os callouts')
  const zoomSemRotulos = await avaliar(`({ zoom: [...document.querySelectorAll('[aria-hidden="true"]')].find((el) => el.textContent?.trim().startsWith('ZOOM '))?.textContent?.trim(), total: document.querySelectorAll('[data-cockpit-label]').length })` )
  exigir(lerZoom(zoomSemRotulos.zoom) > 200 && zoomSemRotulos.total === 0, 'Rótulos globais continuam sob controle do toggle em zoom alto', zoomSemRotulos)
  await avaliar(`document.querySelector('button[aria-label="Recentrar o painel"]').click()`)
  await esperarAte("document.querySelector('[aria-hidden=\"true\"]')?.textContent?.trim() === 'ZOOM 100%' || [...document.querySelectorAll('[aria-hidden=\"true\"]')].some((el) => el.textContent?.trim() === 'ZOOM 100%')", 'reset após verificação de zoom alto')

  await avaliar(`document.querySelector('button[title^="Mostrar/esconder rótulos"]').click()`)
  await esperarAte("document.querySelectorAll('[data-cockpit-label]').length === 56", 'habilitar todos os rótulos')
  await capturar('depois-1440-rotulos.png')
  await avaliar(`document.querySelector('button[title^="Mostrar/esconder rótulos"]').click()`)
  await esperarAte("document.querySelectorAll('[data-cockpit-label]').length === 0", 'desabilitar rótulos globais')
  await capturar('depois-1440-noite.png')
  const alternouDia = await avaliar(`(() => {
    const botao = [...document.querySelectorAll('button')].find((el) => el.title === 'Modo dia')
    if (!botao) return false
    botao.click()
    return true
  })()`)
  exigir(alternouDia, 'Alternância para modo diurno disponível')
  await esperar(850)
  const estadoDia = await avaliar(`(() => {
    const botao = [...document.querySelectorAll('button')].find((el) => el.title?.startsWith('Modo noite'))
    return botao ? { pressionado: botao.getAttribute('aria-pressed'), titulo: botao.title } : null
  })()`)
  exigir(estadoDia?.pressionado === 'false', 'Modo diurno ativado', estadoDia)
  await capturar('depois-1440-dia.png')

  await navegar()
  const cliqueAltimetro = await clicarHotspotReal('altimetro')
  exigir(cliqueAltimetro, 'Clique real no hotspot do altímetro despachado', cliqueAltimetro)
  await esperarAte("new URLSearchParams(location.search).get('i') === 'altimetro' && nomeDialogo(document.querySelector('[role=\"dialog\"]')) === 'Altímetro'", 'seleção e montagem da ficha do altímetro por clique')
  const cliqueCorreto = await avaliar(`({
    url: location.search,
    dialogo: nomeDialogo(document.querySelector('[role="dialog"]')),
  })`)
  exigir(cliqueCorreto.dialogo === 'Altímetro', 'Clique abre a ficha correta', cliqueCorreto)
  const rotuloSelecionado = await avaliar(`({ total: document.querySelectorAll('[data-cockpit-label]').length, id: document.querySelector('[data-cockpit-label]')?.getAttribute('data-cockpit-label') })`)
  exigir(rotuloSelecionado.total === 1 && rotuloSelecionado.id === 'altimetro', 'Seleção apresenta somente seu rótulo contextual', rotuloSelecionado)

  const cliquesAdjacentes = []
  for (const id of ['navcom_1', 'navcom_2', 'pressao_oleo', 'temperatura_oleo']) {
    await navegar()
    const ponto = await clicarHotspotReal(id)
    exigir(ponto, `Hotspot ${id} possui centro clicável real`, ponto)
    await esperarAte(`location.search === '?i=${id}'`, `seleção real de ${id}`)
    cliquesAdjacentes.push({ id, url: await avaliar('location.search') })
  }
  registrar('Cliques reais distinguem controles adjacentes', cliquesAdjacentes)

  await navegar()
  await avaliar("document.querySelector('[data-hotspot=\"giro_direcional\"]')?.focus()")
  await enviar('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
  await enviar('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
  await esperarAte("location.search === '?i=giro_direcional'", 'seleção com Enter')
  registrar('Enter seleciona o giro direcional', await avaliar('location.search'))

  await navegar()
  await avaliar("document.querySelector('[data-hotspot=\"variometro\"]')?.focus()")
  await enviar('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 })
  await enviar('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 })
  await esperarAte("location.search === '?i=variometro'", 'seleção com Espaço')
  registrar('Espaço seleciona o variômetro', await avaliar('location.search'))

  await navegar()
  const preencheuBusca = await avaliar(`(() => {
    const input = document.querySelector('input[aria-label="Buscar instrumento no painel"]')
    if (!input) return false
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    setter.call(input, 'velocimetro')
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.focus()
    return true
  })()`)
  exigir(preencheuBusca, 'Campo de busca localizado e preenchido')
  await esperarAte("document.querySelectorAll('[role=listbox] [role=option]').length > 0", 'resultados da busca')
  await enviar('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
  await enviar('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
  await esperarAte("location.search === '?i=velocimetro'", 'seleção pela busca')
  registrar('Busca seleciona o velocímetro', await avaliar('location.search'))

  await navegar(urlInstrumento('velocimetro'))
  const linkDireto = await avaliar(`(() => {
    const dialogo = document.querySelector('[role="dialog"]')
    const miniatura = dialogo?.querySelector('svg.h-44[viewBox]')
    if (!dialogo || !miniatura) return null
    const vb = miniatura.viewBox.baseVal
    const arte = [...miniatura.children].find((el) => el.tagName.toLowerCase() === 'g')
    const bb = arte?.getBBox()
    return {
      url: location.search,
      titulo: nomeDialogo(dialogo),
      viewBox: [vb.x, vb.y, vb.width, vb.height],
      bbox: bb ? [bb.x, bb.y, bb.width, bb.height] : null,
      contida: bb ? bb.x >= vb.x - 0.5 && bb.y >= vb.y - 0.5 && bb.x + bb.width <= vb.x + vb.width + 0.5 && bb.y + bb.height <= vb.y + vb.height + 0.5 : false,
    }
  })()`)
  exigir(linkDireto?.titulo === 'Velocímetro (ASI)' && linkDireto.contida, 'Link direto e miniatura circular corretos', linkDireto)

  for (const [id, titulo] of [['navcom_1', 'NAV/COM nº 1'], ['manetes_mistura', 'Manetes de mistura (2)']]) {
    await navegar(urlInstrumento(id))
    const miniatura = await avaliar(`(() => {
      const dialogo = document.querySelector('[role="dialog"]')
      const svg = dialogo?.querySelector('svg.h-44[viewBox]')
      if (!dialogo || !svg) return null
      const vb = svg.viewBox.baseVal
      const arte = [...svg.children].find((el) => el.tagName.toLowerCase() === 'g')
      const bb = arte?.getBBox()
      return {
        titulo: nomeDialogo(dialogo),
        contida: bb ? bb.x >= vb.x - 0.5 && bb.y >= vb.y - 0.5 && bb.x + bb.width <= vb.x + vb.width + 0.5 && bb.y + bb.height <= vb.y + vb.height + 0.5 : false,
      }
    })()`)
    exigir(miniatura?.titulo === titulo && miniatura.contida, `Miniatura de ${id} contida no viewBox`, miniatura)
  }

  await navegar()
  const filtroMotor = await avaliar(`(() => {
    const grupo = document.querySelector('[role="group"][aria-label="Filtrar por categoria"]')
    const botao = [...(grupo?.querySelectorAll('button') ?? [])].find((el) => el.textContent.replace(/\\s+/g, '') === 'MOTOR10')
    if (!botao) return null
    botao.click()
    return true
  })()`)
  exigir(filtroMotor, 'Filtro MOTOR acionado')
  await esperar(120)
  const estadoFiltro = await avaliar(`(() => {
    const grupo = document.querySelector('[role="group"][aria-label="Filtrar por categoria"]')
    const botao = [...(grupo?.querySelectorAll('button') ?? [])].find((el) => el.textContent.replace(/\\s+/g, '') === 'MOTOR10')
    const destacados = [...document.querySelectorAll('[data-hotspot]')].filter((el) =>
      [...el.querySelectorAll('[stroke="#FFB020"]')].some((no) => no.getAttribute('opacity') === '1')
    ).length
    return { pressionado: botao?.getAttribute('aria-pressed'), destacados }
  })()`)
  exigir(estadoFiltro.pressionado === 'true' && estadoFiltro.destacados === 10, 'Filtro mantém 10 instrumentos de motor alinhados', estadoFiltro)

  const iniciouTour = await avaliar(`(() => {
    const botao = [...document.querySelectorAll('button')].find((el) => el.title?.startsWith('Tour guiado'))
    if (!botao) return false
    botao.click()
    return true
  })()`)
  exigir(iniciouTour, 'Tour guiado iniciado')
  await esperar(950)
  const estadoTour = await avaliar(`(() => {
    const dialogo = document.querySelector('[role="dialog"][aria-label^="Tour guiado"]')
    const alvo = document.querySelector('mask#ck-spot circle')
    return {
      dialogo: dialogo?.getAttribute('aria-label') ?? null,
      alvo: alvo ? [alvo.getAttribute('cx'), alvo.getAttribute('cy')] : null,
    }
  })()`)
  exigir(estadoTour.dialogo === 'Tour guiado — parada 1 de 8' && estadoTour.alvo?.join(',') === '244,310', 'Tour e spotlight seguem o velocímetro reposicionado', estadoTour)
  await avaliar("document.querySelector('button[aria-label=\"Encerrar tour\"]')?.click()")
  await esperar(600)

  const zoomAntes = await avaliar("[...document.querySelectorAll('div')].find((el) => el.textContent?.trim() === 'ZOOM 100%')?.textContent.trim() ?? null")
  await avaliar("document.querySelector('button[aria-label^=\"Aproximar\"]')?.click()")
  await esperar(280)
  const zoomDepois = await avaliar("[...document.querySelectorAll('div')].find((el) => /^ZOOM \\d+%$/.test(el.textContent?.trim() || ''))?.textContent.trim() ?? null")
  await avaliar("document.querySelector('button[aria-label=\"Recentrar o painel\"]')?.click()")
  await esperar(560)
  const zoomReset = await avaliar("[...document.querySelectorAll('div')].find((el) => el.textContent?.trim() === 'ZOOM 100%')?.textContent.trim() ?? null")
  const zoomAntesNumero = lerZoom(zoomAntes)
  const zoomDepoisNumero = lerZoom(zoomDepois)
  const zoomResetNumero = lerZoom(zoomReset)
  exigir(
    Number.isFinite(zoomAntesNumero) && zoomDepoisNumero > zoomAntesNumero && zoomResetNumero === zoomAntesNumero,
    'Zoom e reset restauram o enquadramento integral',
    { zoomAntes, zoomDepois, zoomReset },
  )

  await viewport(768)
  await navegar()
  await capturar('depois-768.png')
  const tablet = await avaliar(`({
    largura: innerWidth,
    hotspots: document.querySelectorAll('[data-hotspot]').length,
    zoom: [...document.querySelectorAll('div')].find((el) => /^ZOOM \\d+%$/.test(el.textContent?.trim() || ''))?.textContent.trim() ?? null,
  })`)
  exigir(tablet.largura === 768 && tablet.hotspots === 56, 'Painel íntegro em 768 px', tablet)

  await viewport(390)
  await navegar()
  await capturar('depois-390.png')
  const mobileAntes = await avaliar(`(() => {
    const grupo = document.querySelector('[role="group"][aria-label^="Painel vetorial"] svg > g[transform]')
    const palco = document.querySelector('[role="group"][aria-label^="Painel vetorial"]')?.getBoundingClientRect()
    const idsSixPack = ['velocimetro', 'horizonte_artificial', 'altimetro', 'coordenador_curva', 'giro_direcional', 'variometro']
    const caixas = idsSixPack.map((id) => document.querySelector('[data-hotspot="' + id + '"]')?.firstElementChild?.getBoundingClientRect()).filter(Boolean)
    const limites = caixas.length === idsSixPack.length
      ? {
          esquerda: Math.min(...caixas.map((r) => r.left)),
          direita: Math.max(...caixas.map((r) => r.right)),
          topo: Math.min(...caixas.map((r) => r.top)),
          base: Math.max(...caixas.map((r) => r.bottom)),
        }
      : null
    const centroSixPack = limites ? { x: (limites.esquerda + limites.direita) / 2, y: (limites.topo + limites.base) / 2 } : null
    const centroPalco = palco ? { x: palco.left + palco.width / 2, y: palco.top + palco.height / 2 } : null
    return {
      largura: innerWidth,
      transform: grupo?.getAttribute('transform') ?? null,
      palco: palco ? { left: palco.left, top: palco.top, width: palco.width, height: palco.height } : null,
      centroSixPack,
      centroPalco,
      desvioCentro: centroSixPack && centroPalco ? Math.hypot(centroSixPack.x - centroPalco.x, centroSixPack.y - centroPalco.y) : null,
      zoom: [...document.querySelectorAll('div')].find((el) => /^ZOOM \\d+%$/.test(el.textContent?.trim() || ''))?.textContent.trim() ?? null,
    }
  })()`)
  exigir(
    mobileAntes.largura === 390 && mobileAntes.zoom === 'ZOOM 160%' && Number.isFinite(mobileAntes.desvioCentro) && mobileAntes.desvioCentro <= 48,
    'Enquadramento mobile inicia com o six-pack centralizado a 160%',
    mobileAntes,
  )
  const x = mobileAntes.palco.left + mobileAntes.palco.width * 0.5
  const y = mobileAntes.palco.top + mobileAntes.palco.height * 0.14
  await enviar('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 })
  await enviar('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x + 38, y: y + 22, button: 'left', buttons: 1 })
  await enviar('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x + 38, y: y + 22, button: 'left', buttons: 0, clickCount: 1 })
  await esperar(120)
  const mobileDepois = await avaliar("document.querySelector('[role=\"group\"][aria-label^=\"Painel vetorial\"] svg > g[transform]')?.getAttribute('transform') ?? null")
  const translacaoAntes = lerTranslacao(mobileAntes.transform)
  const translacaoDepois = lerTranslacao(mobileDepois)
  exigir(
    translacaoAntes !== null &&
      translacaoDepois !== null &&
      (translacaoDepois.x !== translacaoAntes.x || translacaoDepois.y !== translacaoAntes.y),
    'Pan permanece funcional em 390 px',
    { antes: mobileAntes.transform, depois: mobileDepois },
  )

  await enviar('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  })
  await viewport(1440)
  await navegar()
  const movimentoReduzido = await avaliar(`(() => {
    const pulso = document.querySelector('.animate-hotspot-pulse')
    const estilo = pulso ? getComputedStyle(pulso) : null
    return {
      ativo: matchMedia('(prefers-reduced-motion: reduce)').matches,
      duracao: estilo?.animationDuration ?? null,
      iteracoes: estilo?.animationIterationCount ?? null,
    }
  })()`)
  exigir(movimentoReduzido.ativo && movimentoReduzido.iteracoes === '1', 'Movimento reduzido neutraliza repetição dos pulsos', movimentoReduzido)

  relatorio.status = 'aprovado'
} catch (erro) {
  relatorio.status = 'falhou'
  relatorio.erro = erro instanceof Error ? erro.stack : String(erro)
  throw erro
} finally {
  writeFileSync(join(saida, 'verificacao-navegador.json'), `${JSON.stringify(relatorio, null, 2)}\n`)
  rejeitarPendentes(new Error('Verificação encerrada'))
  if (socket && socket.readyState < WebSocket.CLOSING) socket.close()
  if (chrome && chrome.exitCode === null && chrome.signalCode === null) {
    chrome.kill('SIGTERM')
    const encerrou = await aguardarSaidaChrome(2000)
    if (!encerrou && chrome.exitCode === null && chrome.signalCode === null) {
      chrome.kill('SIGKILL')
      await aguardarSaidaChrome(2000)
    }
  }
  rmSync(perfil, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
}

console.log(JSON.stringify(relatorio, null, 2))
