// Utilitários compartilhados da página SISTEMAS (sem componentes — manter
// este arquivo livre de JSX para o react-refresh).

export const EASE_OUT = [0.22, 1, 0.36, 1] as [number, number, number, number]
export const EASE_MECH = [0.7, 0, 0.2, 1] as [number, number, number, number]

/** id DOM de um componente na lista da estação (alvo do clique nos nós) */
export function componentDomId(sistemaId: string, index: number) {
  return `${sistemaId}-c-${index}`
}

/** Rola até o componente na lista e dispara o destaque/expansão */
export function focusComponent(domId: string) {
  const el = document.getElementById(domId)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  window.dispatchEvent(new CustomEvent('sistemas:focus-component', { detail: { id: domId } }))
}
