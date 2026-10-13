// Chrome dedicado: deadlines e cleanup comuns ao conversor e aos ensaios.
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
export async function openChrome({ prefix = 'pa34-cdp-', port = 9500 + process.pid % 300, timeout = 15000 } = {}) {
  const profile = await mkdtemp(join(tmpdir(), prefix))
  const browser = spawn(process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new','--no-sandbox','--disable-gpu','--no-first-run',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'about:blank'], { stdio:'ignore' })
  let socket, failure, seq = 0, closed = false
  const pending = new Map(), listeners = new Set()
  const sleep = ms => new Promise(r => setTimeout(r, ms))
  const rejectAll = error => { for (const p of pending.values()) { clearTimeout(p.timer); p.reject(error) } pending.clear() }
  browser.on('error', error => { failure = error; rejectAll(error) })
  browser.on('exit', (code, signal) => { failure ??= new Error(`Chrome encerrou: ${code ?? signal}`); rejectAll(failure) })
  const alive = () => browser.pid && browser.exitCode === null && browser.signalCode === null && !failure
  async function waitExit(ms) {
    if (!alive()) return
    await new Promise(resolve => {
      const done = () => { clearTimeout(timer); browser.off('exit', done); browser.off('error', done); resolve() }
      const timer = setTimeout(done, ms)
      browser.once('exit', done); browser.once('error', done)
      if (!alive()) done()
    })
  }
  async function close() {
    if (closed) return
    closed = true; rejectAll(new Error('CDP encerrado'))
    if (socket && socket.readyState < WebSocket.CLOSING) socket.close()
    if (alive()) { browser.kill('SIGTERM'); await waitExit(2000) }
    if (alive()) { browser.kill('SIGKILL'); await waitExit(2000) }
    await rm(profile, { recursive:true, force:true, maxRetries:5, retryDelay:100 })
    if (alive()) throw new Error('Chrome não encerrou após SIGKILL')
  }
  try {
    let target
    const deadline = Date.now() + timeout
    while (!target && Date.now() < deadline) {
      if (failure) throw failure
      try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(500) })).json()).find(t => t.type === 'page') } catch { /* startup */ }
      if (!target) await sleep(50)
    }
    if (failure) throw failure
    if (!target) throw new Error('Prazo de inicialização do Chrome excedido')
    socket = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => {
      const finish = error => { clearTimeout(timer); socket.removeEventListener('open', opened); socket.removeEventListener('error', failed); socket.removeEventListener('close', failed); error ? reject(error) : resolve() }
      const opened = () => finish(), failed = () => finish(new Error('Handshake CDP interrompido'))
      const timer = setTimeout(() => finish(new Error('Prazo do handshake CDP excedido')), timeout)
      socket.addEventListener('open', opened); socket.addEventListener('error', failed); socket.addEventListener('close', failed)
    })
    socket.addEventListener('close', () => rejectAll(new Error('CDP desconectado')))
    socket.addEventListener('error', () => rejectAll(new Error('Erro no socket CDP')))
    socket.addEventListener('message', event => {
      const m = JSON.parse(event.data), p = pending.get(m.id)
      if (p) { clearTimeout(p.timer); pending.delete(m.id); m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result) }
      for (const listener of listeners) listener(m)
    })
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        if (closed || failure || socket.readyState !== WebSocket.OPEN) { reject(failure ?? new Error('CDP indisponível')); return }
        const id = ++seq
        const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Prazo CDP excedido: ${method}`)) }, timeout)
        pending.set(id, { resolve, reject, timer })
        try { socket.send(JSON.stringify({ id, method, params })) } catch (error) { clearTimeout(timer); pending.delete(id); reject(error) }
      })
    }
    return { send, close, browser, profile, onEvent(listener) { listeners.add(listener); return () => listeners.delete(listener) } }
  } catch (error) { await close(); throw error }
}
