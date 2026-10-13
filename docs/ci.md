# CI — PA-34

Pipeline: `.github/workflows/ci.yml` (GitHub Actions), com setup compartilhado em `.github/actions/setup/`. Cobre apenas `work-modulo-3d/`; `app/` está congelado.

## Jobs

| Job | Quando | Bloqueia? | O que faz |
| --- | --- | --- | --- |
| `lint` | push/PR | Só o lint de `tests/` e `playwright.config.ts` | O `npm run lint` completo roda com `continue-on-error`: 29 erros React Compiler pré-existentes estão no ledger (`deferred-work.md`). |
| `verify` | push/PR | Sim | `npm run verify`: build, contratos de fonte, GLB/manifesto, 39 negativos, loader real e foco. Exige checkout LFS; falha cedo se o GLB for só ponteiro. |
| `e2e` | push/PR | Sim (P0 e P1 = 100%) | Playwright em 2 shards, `retries=2`. Confere se o número de testes executados é igual ao listado, sem nenhum pulado. |
| `burn-in` | PR, segunda 05:00 UTC, manual | Sim | Suíte completa 5× (`--repeat-each=5 --retries=0 --fail-on-flaky-tests`). |
| `report` | sempre | Agrega | Tabela no job summary; falha se `lint`, `verify` ou `e2e` falharem, ou se o burn-in falhar. |

Artefatos (14 dias): `e2e-shard-N` (relatório HTML, `junit.xml`, traces, vídeos e screenshots de falhas) e `burn-in-failures`.

## Ambiente

- Node vem do `.nvmrc` (24); `verify` exige ≥22.18.
- Dependências: `npm --prefix work-modulo-3d ci`, com cache npm pelo `work-modulo-3d/package-lock.json`.
- Chromium: cache por versão do `@playwright/test`; em cache hit, só `install-deps`.
- `*.glb` e `*.blend` ficam em Git LFS (`.gitattributes`). Jobs que leem o GLB fazem checkout com `lfs: true`; isso consome a cota de banda LFS do GitHub.
- Segredos: nenhum. Permissões do workflow: `contents: read`.

## Reproduzir localmente (da raiz)

```sh
npx --prefix work-modulo-3d eslint work-modulo-3d/tests   # ou, em work-modulo-3d/: npx eslint tests playwright.config.ts
npm --prefix work-modulo-3d run verify
CI=1 npm --prefix work-modulo-3d run test:e2e -- --shard=1/2
CI=1 npm --prefix work-modulo-3d run test:e2e -- --repeat-each=5 --retries=0 --fail-on-flaky-tests
actionlint                                                # valida o workflow
```

## Fora do pipeline

- A cena 3D real (9 camadas, 68 IDs, câmera, seleção por clique) continua nos roteiros CDP `scripts/verify-browser-*.mjs`, que exigem Chrome com GPU e servidor dev.
- Sem notificações (Slack/e-mail): ficam as notificações padrão do GitHub. Para adicionar uma, criar um secret de webhook e um passo `if: failure()` no `report`.
- Sem deploy.

## Ativar

1. Revisar `git status`, fazer o primeiro commit (o `git lfs` já está configurado no repo).
2. Criar o repositório remoto, `git remote add origin …` e `git push -u origin main`.
3. Confirmar que o LFS foi enviado (`git lfs ls-files`) e que o primeiro run do Actions passou.
4. Opcional: proteger `main` exigindo o check `Resumo`.
