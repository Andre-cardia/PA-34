# Mapa do projeto PA-34 — Seneca I

Verificado em 2026-10-05 contra arquivos locais; sem repositório Git (SHA indisponível). Atualizar com `bmad-project-context refresh` após mudanças de estrutura.

## Raiz

| Caminho | Papel |
| --- | --- |
| `work-modulo-3d/` | Site integrado e alvo de todo trabalho novo: GLB de nove camadas, cockpit, páginas SOP. |
| `app/` | Versão anterior, congelada. Seu módulo 3D é antigo; não usar para demonstrar o site. |
| `content/` | Cópia de referência dos JSON/Markdown técnicos. Não é importada; as aplicações leem `src/data/`. |
| `seneca-assets/` | GLB FlightGear antigo e seu node-map; não é o modelo ativo. |
| `ref_images/`, `site_assets/sop_diagrams/` | Imagens de referência e diagramas por página do SOP. |
| `sop_extract.txt` | Texto extraído do SOP PA34-200 Seneca I (fonte para conteúdo). |
| `info.md`, `plan.md` | Planos do ambiente anterior; históricos, não descrevem o estado atual. |
| `19f78e29-…/backup/` | Backups antigos do cockpit; não são a versão de trabalho. |
| `_bmad/`, `.agents/skills/` | Infraestrutura BMad; scripts e testes ali não cobrem o produto. |
| `_bmad-output/` | Specs, ledger de trabalho diferido e evidências de verificação visual. |

## work-modulo-3d/

- Fluxo: `index.html` → `src/main.tsx` → `src/App.tsx` (rotas) → `src/components/Layout.tsx` → `src/pages/`.
- Rotas: `/`, `/modelo-3d`, `/cockpit`, `/especificacoes`, `/performance`, `/sistemas`, `/procedimentos`, `/multimotor`, `/emergencias`, `/seguranca`.
- Componentes por domínio em `src/components/<domínio>/`; `ui/` base e `ui-custom/` próprios; hooks em `src/hooks/`.
- Cockpit: `src/pages/Cockpit.tsx` e `src/components/cockpit/` (arte, `panel-data.ts`, pan/zoom, tour, drawer, `?i=`).
- Módulo 3D: `src/pages/Modelo3D.tsx` (`?camada=&c=`, `force3d`, fallback estático) e `src/components/modelo3d/` (`glb.tsx`, `glb-runtime.ts`, `SenecaTechModel.tsx`, `config.ts`, `LayerRail.tsx`, `ComponentDrawer.tsx`).
- Apresentação inicial: `src/components/home/HeroCanvas.tsx` (pausa fora do viewport) e `SenecaModel.tsx`, que também usa `glb.tsx`.

## Modelo 3D

`work-modulo-3d/blender/build_layers.py` gera, a partir da fonte Bipa v12 fornecida pelo usuário, `blender/pa34-camadas.blend`, `public/models/pa34-camadas.glb` e `pa34-camadas.manifest.json` (nove camadas, 68 IDs, SHA-256). Instruções de regeneração e auditorias Blender: `work-modulo-3d/blender/README.md` e `VERIFICACAO.md`. O modelo não deve ser alterado sem pedido explícito. Proveniência: `public/NOTICE-MODELO-3D.txt`.

`public/models/seneca-pa34.glb` (FlightGear) e `pa34-seneca-bipa-v12.glb` permanecem como exportações anteriores, não ativas. `src/components/assets/PA34ThreeViewData.ts` foi gerado a partir do GLB FlightGear; nenhum gerador foi localizado.

## Dados

- `src/data/index.ts` importa os JSONs técnicos (`especificacoes`, `sistemas`, `procedimentos_normais`, `emergencias`, `cockpit_instruments`, `componentes_3d`, `seneca-node-map`).
- Markdown lido via `?raw`: `intro_generalidades.md` (especificações, filosofia de checklist) e `performance.md` (`components/performance/performance-data.ts`).
- `components/multimotor/data.ts` e `components/seguranca/data.ts` têm conteúdo copiado manualmente de `multimotor.md` e `callouts_seguranca.md`.

## Verificação

| Comando | Cobre |
| --- | --- |
| `npm --prefix work-modulo-3d run verify:model` | Integridade do GLB e manifesto; somente leitura. |
| `npm --prefix work-modulo-3d run verify` | Build + `scripts/verify-build.mjs --dist`: contratos de páginas/fontes, GLB, casos negativos, loader real (`verify-runtime.mjs`) e foco de câmera (`verify-camera-focus.mjs`). Exige Node >=22.18. |
| `scripts/verify-browser-{acceptance,selection,camera,labels}.mjs` | Ensaios em Chrome via CDP; opt-in, exigem servidor dev e `APP_URL`/`CDP_PORT`. |
| `scripts/verify-layer-diff.mjs` | Compara duas exportações GLB, restringindo mudanças a IDs autorizados. |
| `npm --prefix work-modulo-3d run test:e2e` | Playwright (`tests/e2e/`): rotas, Markdown, deep-links, movimento reduzido e sem WebGL. Guia: `work-modulo-3d/tests/README.md`. |

CI: `.github/workflows/ci.yml` roda lint (informativo, exceto testes), verify, e2e em shards e burn-in; ver `docs/ci.md`. Evidências de ensaios anteriores: `_bmad-output/visual-review/` e `_bmad-output/verificacao-final-retomada/`.

## Limites conhecidos

- `vite.config.ts` usa `base: './'` com `BrowserRouter`; hospedagem em subcaminho não foi verificada.
- READMEs das aplicações ainda são do template Vite; os `info.md` das aplicações citam o ambiente anterior.
- Pendências abertas: `_bmad-output/implementation-artifacts/deferred-work.md`.
