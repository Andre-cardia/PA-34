---
stepsCompleted: ['step-01-preflight', 'step-02-generate-pipeline', 'step-03-configure-quality-gates', 'step-04-validate-and-summary']
lastStep: 'step-04-validate-and-summary'
lastSaved: '2026-10-05'
---

# Setup de CI — PA-34

## 1. Preflight

- Git: ausente. Por decisão do usuário, `git init -b main` foi rodado na raiz, sem commit nem remote. `git-lfs` 3.8.0 instalado via Homebrew; `*.glb`/`*.blend` rastreados por LFS. `.gitignore` exclui node_modules, dist, artefatos Playwright, `*.blend1`, o ZIP histórico e a pasta de backup.
- Stack: `frontend` (Vite + React + Playwright). Framework: Playwright (`work-modulo-3d/playwright.config.ts`).
- Testes locais: `test:e2e` 26/26. `verify` falhava por uma asserção desatualizada (procurava `/models/pa34-camadas.glb` literal; `glb.tsx` usa `${BASE_URL}models/…` desde 28/09). Asserção corrigida em `scripts/verify-build.mjs`, com o usuário de acordo; `verify` passa. Modelo e `glb.tsx` intocados.
- `npm run lint`: 29 erros pré-existentes (ledger). Decisão: lint informativo.
- Plataforma: GitHub Actions (escolha do usuário). Node: `.nvmrc` = 24 criado.
- Flags TEA: `tea_use_playwright_utils` = true, mas o pacote não está instalado (o usuário optou por Playwright puro), então o burn-in usa `--repeat-each`. `tea_use_pactjs_utils`: sem testes de contrato, jobs omitidos.

## 2. Pipeline

`.github/workflows/ci.yml` + `.github/actions/setup/action.yml`: estágios lint → verify → e2e (2 shards) → burn-in → report. Cache npm e Chromium; artefatos HTML/JUnit/trace/vídeo; `permissions: contents: read`; nenhum input de usuário interpolado em `run:`.

## 3. Quality gates

- P0/P1 = 100% (qualquer falha reprova; `retries=2` absorve só instabilidade de infraestrutura).
- Contagem executada = listada e zero pulados em cada shard (testado localmente; corrigido um bug em que `--list` sobrescrevia `junit.xml`).
- Burn-in 5× sem retries com `--fail-on-flaky-tests` em PRs e semanal. Local: 130/130.
- Notificações: padrão do GitHub; Slack/e-mail não configurados (nenhum canal informado).

## 4. Validação

- `actionlint` 1.7.12: sem erros.
- Simulação local dos comandos dos jobs: lint de testes OK, `verify` OK, shards 13+13, burn-in 130/130.
- Não validado: execução real no GitHub (sem remote/push).

Documentação: `docs/ci.md`.
