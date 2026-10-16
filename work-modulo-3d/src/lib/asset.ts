// URL de um arquivo de public/ respeitando o `base` do Vite. No build local o
// base é './'; no GitHub Pages é '/PA-34/' (.github/workflows/pages.yml). Use com
// o caminho absoluto de public/, ex.: asset('/hangar-ambience.jpg').
export function asset(path: string): string {
  return import.meta.env.BASE_URL + path.replace(/^\/+/, '')
}

// basename do roteador: '/PA-34' no Pages; undefined (raiz) no base relativo.
export const ROUTER_BASENAME = import.meta.env.BASE_URL.startsWith('/') ? import.meta.env.BASE_URL.replace(/\/+$/, '') || undefined : undefined
