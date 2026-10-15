// useDialogFocus — gestão de foco de diálogos modais (Drawer, sheet de camadas):
// foco inicial no próximo frame, trap de Tab/Shift+Tab dentro do contêiner e
// retorno do foco ao fechar (ao elemento de retorno indicado ou ao anterior).
// Esc não é tratado aqui: cada diálogo decide a própria ordem de fechamento.

import { useEffect } from 'react'
import type { RefObject } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function focusablesIn(container: HTMLElement) {
  // Lido a cada Tab: o conteúdo do diálogo muda (abas, navegação da ficha).
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.getClientRects().length > 0)
}

export function useDialogFocus(
  open: boolean,
  containerRef: RefObject<HTMLElement | null>,
  initialFocusRef?: RefObject<HTMLElement | null>,
  returnFocusRef?: RefObject<HTMLElement | SVGElement | null>,
) {
  useEffect(() => {
    if (!open) return
    // HTMLElement ou SVGElement: os hotspots do cockpit são <g tabIndex=0>.
    const active = document.activeElement
    const previous = active instanceof HTMLElement || active instanceof SVGElement ? active : null
    // O alvo de retorno (ex.: botão CAMADAS) já está montado quando o diálogo abre.
    const returnTarget = returnFocusRef?.current ?? previous
    const frame = requestAnimationFrame(() => {
      ;(initialFocusRef?.current ?? containerRef.current)?.focus()
    })
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const container = containerRef.current
      // Contêiner oculto (ex.: sheet lg:hidden após girar o tablet): não prender o Tab.
      if (!container || container.getClientRects().length === 0) return
      const items = focusablesIn(container)
      if (items.length === 0) {
        event.preventDefault()
        container.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (!active || !container.contains(active)) {
        event.preventDefault()
        ;(event.shiftKey ? last : first).focus()
      } else if (event.shiftKey && (active === first || active === container)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKey)
      if (returnTarget && document.contains(returnTarget)) returnTarget.focus()
    }
  }, [open, containerRef, initialFocusRef, returnFocusRef])
}
