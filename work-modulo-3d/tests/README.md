# Testes E2E — work-modulo-3d

Smoke tests de navegador com Playwright (`@playwright/test`, Chromium). Cobrem rotas, conteúdo Markdown, deep-links e os caminhos de movimento reduzido e sem WebGL. Não substituem `npm run verify` nem os ensaios CDP de `scripts/verify-browser-*.mjs`, que inspecionam a cena R3F (camadas, 68 componentes, câmera).

## Preparar

```sh
npm --prefix work-modulo-3d install
npx --prefix work-modulo-3d playwright install chromium
```

## Executar (da raiz do projeto)

```sh
npm --prefix work-modulo-3d run test:e2e            # headless, sobe Vite dev em 127.0.0.1:4180
npm --prefix work-modulo-3d run test:e2e:headed     # com janela
npm --prefix work-modulo-3d run test:e2e:ui         # modo UI / depuração
npm --prefix work-modulo-3d run test:e2e:report     # abre o último relatório HTML
```

- `BASE_URL=http://127.0.0.1:3000` testa um servidor já ativo, sem subir outro. `E2E_PORT` muda a porta do servidor dedicado.
- Projetos: `chromium-desktop` (1440×1000, todos os testes) e `chromium-mobile` (Pixel 7, só testes marcados `@mobile`).
- Artefatos: `test-results/` (trace, vídeo e screenshot em falha, `junit.xml`) e `playwright-report/`, ambos fora do controle de versão.

## Estrutura

| Caminho | Papel |
| --- | --- |
| `playwright.config.ts` | Timeouts (ação 15 s, navegação 30 s, teste 60 s), reporters HTML/JUnit/list, webServer. |
| `tests/support/fixtures/index.ts` | `test`/`expect` do projeto. Fixture automática `pageErrors` falha o teste se houver exceção de runtime; `noWebGL` simula navegador sem WebGL. |
| `tests/support/helpers/catalog.ts` | Lê IDs reais de `src/data/` (componentes 3D, instrumentos); falha cedo se um ID sumir do catálogo. |
| `tests/support/helpers/browser.ts` | Injeções de ambiente (`disableWebGL`). |
| `tests/e2e/*.spec.ts` | Rotas, deep-links e fallbacks. |

## Práticas

- Importar `test`/`expect` de `tests/support/fixtures`, nunca diretamente de `@playwright/test`.
- Selecionar por papel e nome acessível (`getByRole`) — o site já expõe `aria-label`/`aria-labelledby`. Não há `data-testid` exceto `asset-error-fallback`; não acrescentar sem necessidade.
- Usar dados reais do Seneca I via `catalog.ts`; não inventar IDs nem usar faker.
- Nada de `waitForTimeout`: aguardar estados com `expect(...)`. Os títulos usam efeito scramble; `toHaveText` já espera o texto final.
- Testes que só precisam do conteúdo do módulo 3D usam `reducedMotion: 'reduce'` (modo estático) para não depender de GPU. A cena 3D real continua coberta pelos roteiros CDP.
- O h1 da home só recebe texto após a montagem do GLB; em testes da home sem 3D, verificar outro cabeçalho.
- Marcar com `[P0]`/`[P1]` no título; `@mobile` inclui o teste no projeto mobile.

## CI

Ainda não há pipeline. Em CI, `CI=1` ativa `forbidOnly`, 2 retries e 2 workers e impede reutilizar servidor existente. Próximo passo: `bmad-testarch-ci`.

## Referências

Fragmentos TEA aplicados: `fixture-architecture.md`, `test-quality.md`, `playwright-config.md`, `network-first.md`, `data-factories.md` (adaptado: dados vêm do catálogo, não de factories).
