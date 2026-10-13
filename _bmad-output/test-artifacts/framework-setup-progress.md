---
stepsCompleted: ['step-01-preflight', 'step-02-select-framework', 'step-03-scaffold-framework', 'step-04-docs-and-scripts', 'step-05-validate-and-summary']
lastStep: 'step-05-validate-and-summary'
lastSaved: '2026-10-05'
---

# Setup do framework de testes — PA-34

## 1. Preflight

- Alvo: `work-modulo-3d/` (site integrado; `app/` congelado). Pilha `frontend`: React 19, Vite 7, R3F, TypeScript.
- Nenhum framework E2E prévio; havia somente roteiros CDP próprios em `scripts/verify-browser-*.mjs` e `npm run verify`.
- Contexto: `AGENTS.md`, `docs/project-map.md`, `work-modulo-3d/blender/README.md`, ledger `deferred-work.md`.
- Ambiente: Node 25.9.0, npm 11.12.1.

## 2. Seleção

**Playwright** (`@playwright/test` 1.63.0, Chromium). Motivos: já havia navegadores Playwright no cache local; suporta emulação de `prefers-reduced-motion`, injeção de scripts antes da navegação (sem WebGL) e projetos desktop/mobile; CI-friendly.

Decisão do usuário: Playwright puro, **sem** `@seontechnologies/playwright-utils` — o site é SPA estática, sem API ou autenticação; o ramo "Playwright Utils" foi trocado pelo ramo desabilitado. Pact: portão de relevância fechado (não há fronteira consumidor-provedor); nenhum artefato de contrato.

## 3. Scaffold

- `playwright.config.ts`: timeouts 15/30/60 s, `BASE_URL` com fallback, trace `retain-on-failure-and-retries`, screenshot/vídeo em falha, reporters list/HTML/JUnit, paralelismo; webServer Vite dedicado em 4180 (evita 3000/4173 usados manualmente).
- `tests/support/fixtures/index.ts` (`pageErrors` automático, `noWebGL`), `tests/support/helpers/{catalog,browser}.ts`.
- Sem factories faker: os dados vêm do catálogo real do Seneca I (`src/data/`), conforme política do projeto.
- Sem `.env.example`/`.nvmrc`: não há variáveis obrigatórias; a exigência de Node já está documentada (verify ≥22.18).
- Smoke tests (26): rotas de conteúdo + redirect, Markdown (`performance.md`, `intro_generalidades.md`), deep-links `?i=` e `?camada=&c=` (válidos/inválidos), movimento reduzido e sem WebGL na home e no módulo 3D.

## 4. Docs e scripts

- `tests/README.md`; scripts `test:e2e`, `test:e2e:headed`, `test:e2e:ui`, `test:e2e:report`; `.gitignore` com `test-results` e `playwright-report`.
- Hook de enforcement TEA **não instalado**: o harness em uso (DeepSeek Harness) não tem interceptação de escrita no formato `.claude/settings.json`. Enforcement segue por `bmad-testarch-test-review`.

## 5. Validação

- `npx playwright test --repeat-each=3`: **78/78 passaram** (26 testes × 3), ~40 s.
- `eslint tests playwright.config.ts` e `tsc --strict` nos arquivos de teste: limpos.
- Durante a execução: corrigido um seletor errado (painel do cockpit é `role=group`) e um teste instável (h1 da home vazio até a montagem do GLB → teste passou a usar movimento reduzido e um h2).

### Alteração fora dos testes

`npm install` falhava com ENOTFOUND: 61 entradas do `package-lock.json` apontavam para o mirror `npm.mirrors.msh.team` do ambiente anterior. Substituídas por `registry.npmjs.org` (mesmos pacotes/versões/integrity). Backup: `/tmp/pa34-package-lock.backup.json`.

## Próximos passos

- `bmad-testarch-ci` para pipeline (ainda não há repositório Git).
- Cobertura da cena 3D real (camadas, 68 IDs, seleção por clique) continua nos roteiros CDP; migrá-los para Playwright é candidato a `bmad-testarch-automate`.
