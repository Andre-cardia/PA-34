---
title: 'Restauração dos gráficos originais do módulo 3D'
type: 'refactor'
created: '2026-09-22'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'NO_VCS'
context:
  - /Users/andrecardia/Github/PA-34/_bmad-output/implementation-artifacts/spec-melhoria-visual-modulo-3d.md
  - /Users/andrecardia/Github/PA-34/AGENTS.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Os gráficos e composições visuais introduzidos na última melhoria foram reprovados visualmente. O projeto já contém as versões originais, mais completas, em componentes SVG/R3F e módulos visuais do próprio repositório; a versão atual do `work-modulo-3d/` não deve continuar exibindo aproximações simplificadas.

**Approach:** Restaurar em `work-modulo-3d/` os componentes gráficos originais existentes no projeto — painel de cockpit, estações e diagramas de sistemas, gauges de especificações/performance, composições de procedimentos e ilustrações do Home/modelo — reutilizando seus dados e interações originais. Manter o conteúdo técnico data-driven e os guardrails essenciais já existentes, sem alterar `app/`.

## Boundaries & Constraints

**Always:** alterar somente `work-modulo-3d/`; usar como referência os componentes equivalentes em `app/src/` e os assets originais já presentes; preservar dados, IDs, links `?i=`, `?camada=&c=`, âncoras `#8-x`, português brasileiro, identidade PA34-200 Seneca I, teclado e foco onde já existirem; manter fallback WebGL e movimento reduzido quando a restauração permitir.

**Never:** editar `app/`; criar novos gráficos autorais ou substituir os SVGs originais por placeholders; alterar JSON/Markdown técnico para fazer a restauração caber; importar o GLB de Seneca II como verdade técnica; remover dados ou apagar assets originais; reintroduzir uma aproximação manual quando houver componente original equivalente.

## I/O & Edge-Case Matrix

| Cenário | Entrada / estado | Comportamento esperado | Tratamento de erro |
|---|---|---|---|
| Home | Abertura da rota `/` | Exibe a composição visual original do Hero, cards, blueprint e gauges | Fallback estático preserva leitura quando Canvas/WebGL não está disponível |
| Cockpit | `/cockpit`, toque, teclado, `?i=<id>` | Exibe painel SVG original, hotspots, pan/zoom, tour e drawer | ID inválido não abre ficha e mantém painel utilizável |
| Sistemas | `/sistemas#8-1` … `#8-7` ou `#<id>` | Exibe os sete diagramas originais e centraliza a estação correspondente | Hash desconhecido mantém a página no início |
| Especificações/performance | Viewport desktop ou móvel | Exibe gauges, réguas, tabelas e gráficos originais sem overflow global | Conteúdo permanece legível se uma animação estiver reduzida |
| Modelo 3D | Query de camada/componente e movimento reduzido | Preserva seleção, foco e apresentação visual original | Fallback não bloqueia navegação nem leitura |

**Decisão de fonte visual:** quando houver duas implementações no repositório, a versão equivalente em `app/src/components/` é a referência original do projeto; seus dados são conferidos contra `work-modulo-3d/src/data/`, que permanece canônico para esta aplicação.

</frozen-after-approval>

## Code Map

- `app/src/components/home/`, `app/src/components/assets/` — fonte visual original para Hero, cards, blueprint, modelo procedural e projeções; copiar/adaptar somente para `work-modulo-3d/`.
- `app/src/components/cockpit/` e `app/src/pages/Cockpit.tsx` — painel SVG original, artwork, pan/zoom, tour, índice e drawer.
- `app/src/components/sistemas/` e `app/src/pages/Sistemas.tsx` — `SystemStation`, sete diagramas SVG, navegação sticky e `CrossMap`.
- `app/src/components/especificacoes/` e `app/src/pages/Especificacoes.tsx` — gauges, arco ASI, motores, capacidades, pesos e generalidades.
- `app/src/components/performance/` e `app/src/pages/Performance.tsx` — régua de velocidades, detalhes, distâncias/tetos, galeria, timeline e glossário.
- `work-modulo-3d/src/data/` — dados canônicos que não devem ser substituídos; validar compatibilidade das props e exports.
- `work-modulo-3d/src/components/Layout.tsx`, `Navbar.tsx`, `SearchPalette.tsx` — preservar shell, navegação, foco e deep-links já corrigidos.
- `work-modulo-3d/src/pages/Procedimentos.tsx`, `Emergencias.tsx`, `Multimotor.tsx`, `Seguranca.tsx` — restaurar apenas composições visuais originais quando existirem, sem reescrever conteúdo.

## Plan & Acceptance

**Intent gaps:** nenhum — o repositório identifica as implementações originais equivalentes em `app/src/`, e a mudança deve atingir apenas `work-modulo-3d/`.

**Irreversibles:** nenhum; alterações são reversíveis por substituição de arquivos e não mutam dados técnicos nem fazem deploy.

**Footprint:** substituir páginas/componentes gráficos equivalentes e adicionar componentes visuais ausentes sob `work-modulo-3d/src/components/`; não alterar `app/`, JSON, Markdown ou assets públicos sem necessidade comprovada.

**Execution:**
- [x] Restaurar composição original do Home, assets blueprint e gráficos/modelo visuais sem substituir dados.
- [x] Restaurar Cockpit SVG, pan/zoom, tour, hotspots e drawer.
- [x] Restaurar sete estações/diagramas de Sistemas e links cruzados.
- [x] Restaurar gauges de Especificações e gráficos/réguas de Performance.
- [x] Reconciliar imports, acessibilidade, deep-links e fallbacks no `work-modulo-3d/`.
- [x] Executar build, smoke verification e lint do conjunto alterado; o build/smoke passam e o lint completo mantém falhas legadas dos componentes originais.

**Acceptance Criteria:**
- Given a rota com gráfico original equivalente no projeto, when ela é aberta, then o visitante vê a composição original e não um placeholder ou desenho autoral simplificado.
- Given interação por mouse, toque, teclado ou deep-link, when o visitante usa cockpit, sistemas, gauges ou modelo, then a interação original continua operável e seus IDs permanecem válidos.
- Given movimento reduzido ou WebGL indisponível, when a Home/modelo é carregada, then existe estado estático legível sem bloquear o restante da página.
- Given a validação de build, when os comandos do projeto são executados, then TypeScript e Vite concluem e nenhum arquivo em `app/` é alterado.

## Implementation Notes

- A fonte visual restaurada foi `app/src/components/` equivalente, copiada/adaptada apenas em `work-modulo-3d/`; `app/` não foi alterado.
- Foram recolocados os componentes originais do Home/modelo, cockpit, sete diagramas de sistemas, especificações, performance, procedimentos, emergências, multimotor e segurança, além de `PA34ThreeViewData.ts`, `seneca-node-map.json`, o GLB e seu `NOTICE-MODELO-3D.txt`.
- A restauração manteve os gráficos originais, mas conservou fallback WebGL/movimento reduzido e adicionou Error Boundaries para falha de carregamento do GLB.
- Foram corrigidos deep-links de cockpit/3D, foco tardio após carregamento do GLB, pan/zoom após resize, timers de emergência, persistência de checklist, semântica do flashcard e links de busca sem âncoras reais.
- `scripts/verify-build.mjs` agora valida os contratos gráficos e a existência dos assets públicos; `npm run verify` executa o build antes do smoke check.
- O build e o smoke verification passaram. O lint completo continua falhando em regras legadas dos componentes originais/React Hooks (46 erros e 1 aviso no último ciclo), sem falha de TypeScript/Vite.

## Spec Change Log

## Review Triage Log

### Blind Hunter

- **false** — `AssimetriaDemo.tsx:114` usa shorthand JSX válido (`spinning` equivale a `spinning={true}`); o build confirma que não há identificador ausente.
- **false** — `vite.config.ts:16` carrega no Vite atual e o build conclui; não há falha observada de `__dirname` nesta configuração.
- **false** — `tailwind.config.js` é consumido pela cadeia atual sem falha; a observação não produz um erro verificável nesta entrega.
- **patch** — `package.json:9` fazia `verify` depender de um `dist` prévio; o script agora executa `build` antes do smoke check.
- **defer** — A verificação continua estática para comportamento DOM/browser; não há runner Playwright/Cypress. Registrado em `deferred-work.md`.
- **defer** — URLs root-absolute podem exigir ajuste em deploy de subpasta, mas nenhum deploy desse tipo faz parte desta entrega; registrado para a configuração de deploy.
- **false** — `public/grain-noise.png` existe; a verificação também passou a verificar assets públicos.
- **false** — Os três assets SOP existem em `public/` e agora são verificados explicitamente.
- **patch** — A ausência de Error Boundary para falha do GLB foi corrigida com `HeroErrorBoundary` e `ModelErrorBoundary`, ambos com fallback estático.
- **false** — O claim de labels stale não foi reproduzido: mudanças de props invalidam o render demand e o loop já chama `state.invalidate()` durante animações; a fonte não evidencia o resultado descrito.
- **false** — Sistemas aceita tanto o `s.id` usado pela busca quanto a âncora `meta.anchor`; links genéricos sem âncora real foram removidos.
- **patch** — Os links de busca para páginas sem IDs reais deixaram de apontar para hashes órfãos.
- **patch** — O flashcard agora ignora teclas vindas de controles internos, evitando ativação dupla do card e do botão “Dominado”.
- **patch** — O diagrama de hélices inicia com sincronizador desligado, coerente com o aviso “Não instalado no Seneca I”.
- **defer** — Divergências preexistentes de seis/sete ocupantes, kgf/kg, vácuo e performance foram agrupadas e registradas para revisão técnica das fontes.
- **defer** — A divergência de unidades/valores em performance já existia nos Markdown/JSON e não pode ser resolvida sem decisão operacional; registrada junto das demais fontes técnicas.
- **defer** — A ausência de figuras numéricas primárias de performance já está registrada no ledger anterior; a restauração não inventou dados.
- **false** — “7 CAMADAS REMOVÍVEIS” descreve as sete estações de sistemas mapeadas, não o total de nove camadas do modelo 3D.
- **defer** — README e metadados genéricos são higiene preexistente do scaffold, fora do objetivo visual; registrados no ledger.
- **defer** — A ausência de testes automatizados de navegador é limitação preexistente de infraestrutura; registrada no ledger.

### Edge Case Hunter

- **false** — O deep-link 3D liga explicitamente a camada recebida e o raio-X automático mantém a camada interna visível com o exterior.
- **patch** — O efeito de deep-link de `Modelo3D` agora reage a mudanças de `searchParams`, limpa seleção inválida e agenda novo foco.
- **patch** — `Cockpit` agora limpa o drawer quando `?i=` é removido ou inválido.
- **patch** — O centro do painel agora é recalculado quando `?i=` muda com a página montada.
- **patch** — O foco 3D tenta novamente por até 120 frames enquanto a âncora do GLB ainda não foi registrada.
- **patch** — Falhas do carregamento do GLB agora caem em `StaticFallback` por Error Boundary.
- **patch** — `usePanZoom` reaplica `clampView` a qualquer resize, inclusive quando o painel está ampliado ou deslocado.
- **patch** — Timers de expansão/deep-link de emergências agora são cancelados em nova navegação e desmontagem.
- **patch** — `readChecked` aceita somente chaves de checklist conhecidas com valor booleano `true`.
- **patch** — O timer de confirmação de cópia de emergência é substituído e desmontado corretamente.

### Verification Gap Reviewer

- **defer** — Renderização DOM da régua/performance não é automatizada; o smoke verifica imports/componentes e o item está registrado para um runner browser.
- **defer** — Busca, hash e query deep-links não são exercitados em DOM real; contratos foram preservados/corrigidos e o teste browser permanece no ledger.
- **defer** — WebGL, reduced-motion e pausa por viewport ainda precisam de emulação browser; os caminhos existem e o teste automatizado está diferido.
- **patch** — A existência do GLB, JPGs, PNGs SOP, textura e notice agora é verificada por `verify-build.mjs`.
- **patch** — A lacuna duplicada sobre query 3D foi coberta pelo efeito reativo de `Modelo3D` e pelo smoke de contratos; o exercício DOM continua no item diferido.

## Verification

**Commands:**
- `npm --prefix work-modulo-3d run build` — esperado: TypeScript e Vite concluídos.
- `npm --prefix work-modulo-3d run verify` — esperado: smoke verification concluído.
- `npm exec -- eslint <arquivos alterados>` em `work-modulo-3d/` — esperado: sem erros nos arquivos restaurados ou alterações justificadas.

**Manual checks:**
- Abrir `/`, `/cockpit`, `/sistemas`, `/especificacoes`, `/performance` e `/modelo-3d` em 360/768/1440 px; confirmar aparência dos gráficos originais, pan/zoom, hotspots, gauges, âncoras e fallback reduzido.
