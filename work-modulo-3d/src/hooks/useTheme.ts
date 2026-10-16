// Tema do site: 'escuro' (padrão) ou 'claro'. Persistido em localStorage
// (`pa34:tema`) e aplicado como classe `theme-light` no <html>; o script inline
// do index.html aplica antes do primeiro paint. O painel 2D do cockpit força o
// escuro com a classe `theme-dark` (src/index.css).

import { useCallback, useSyncExternalStore } from 'react'

export type Tema = 'claro' | 'escuro'

const KEY = 'pa34:tema'
const EVENT = 'pa34:tema-change'

function read(): Tema {
  return document.documentElement.classList.contains('theme-light') ? 'claro' : 'escuro'
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener('storage', cb)
  }
}

export function setTema(tema: Tema) {
  document.documentElement.classList.toggle('theme-light', tema === 'claro')
  try {
    localStorage.setItem(KEY, tema)
  } catch {
    /* modo privado: só a sessão */
  }
  window.dispatchEvent(new Event(EVENT))
}

export function useTheme() {
  const tema = useSyncExternalStore(subscribe, read, () => 'escuro' as Tema)
  const toggle = useCallback(() => setTema(read() === 'claro' ? 'escuro' : 'claro'), [])
  return { tema, toggle, setTema }
}
