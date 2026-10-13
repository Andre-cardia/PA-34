---
title: 'Melhoria visual e conteúdo real do módulo 3D'
type: 'feature'
created: '2026-09-22'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'NO_VCS'
context:
  - /Users/andrecardia/Github/PA-34/_bmad-output/specs/spec-melhoria-visual-modulo-3d/SPEC.md
  - /Users/andrecardia/Github/PA-34/_bmad-output/specs/spec-melhoria-visual-modulo-3d/visual-production.md
  - /Users/andrecardia/Github/PA-34/AGENTS.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A aplicação `work-modulo-3d/` combina uma Home e um modelo 3D elaborados com oito rotas provisórias, imagens com marca d’água, interações dependentes de hover e lacunas de acessibilidade em navegação, movimento e fallback. Isso reduz a credibilidade de um manual técnico do PA34-200 Seneca I.

**Approach:** Substituir as oito telas `PageStub` por interfaces data-driven que consumam os dados e Markdown locais, corrigir as interações e transições sem mudar a stack ou o conteúdo aeronáutico, remover referências às imagens sem procedência adequada e manter estados equivalentes para movimento reduzido e WebGL indisponível.

## Boundaries & Constraints

**Always:** alterar somente `work-modulo-3d/`; preservar português brasileiro, IDs, vínculos de busca, valores de `src/data/`, identidade HUD/blueprint, Seneca I, fallback sem WebGL, pausa fora da viewport e movimento reduzido; usar componentes existentes quando forem adequados; manter diagramas e imagens com texto alternativo.

**Never:** alterar `app/`; importar o GLB de Seneca II como verdade do Seneca I; reescrever ou ampliar conteúdo técnico; trocar frameworks; deixar a navegação de emergências bloqueada por transição; depender somente de hover, cor ou movimento para acesso ao conteúdo.

## I/O & Edge-Case Matrix

| Cenário | Entrada / estado | Comportamento esperado | Tratamento de erro |
|---|---|---|---|
| Rota de conteúdo | Navegação para qualquer uma das oito rotas | Renderiza conteúdo real, IDs e links profundos preservados | Rota desconhecida redireciona para Home |
| Deep-link | URL com hash ou query de cockpit | Após montagem, rola para o alvo ou seleciona o instrumento | Alvo inválido mantém a página utilizável |
| Movimento reduzido | `prefers-reduced-motion: reduce` | Estado final estático, sem autorrotação, loops ou transições essenciais | Conteúdo permanece acessível |
| WebGL indisponível | Canvas não pode criar contexto | Vista técnica estática e mensagem não bloqueante | Não lança erro para o restante da página |
| Viewport móvel | 360–767 px | Tabelas, diagramas, drawers e checklists continuam legíveis e operáveis | Overflow horizontal somente dentro de tabelas |

**Decisão de baseline:** validar navegadores atuais em viewports de 360, 768 e 1440 px, sem exigir orçamento quantitativo de carregamento/FPS nesta entrega.

</frozen-after-approval>

## Code Map

- `work-modulo-3d/src/App.tsx` — rotas, wildcard e composição do layout; preservar as rotas e corrigir somente o destino desconhecido.
- `work-modulo-3d/src/pages/*.tsx` — oito destinos provisórios; substituir por páginas que consumam `src/data/` e Markdown local.
- `work-modulo-3d/src/components/content/ContentPage.tsx` — frame e renderização técnica compartilhada para conteúdo.
- `work-modulo-3d/src/data/index.ts` e `work-modulo-3d/src/data/*.md` — fonte canônica de valores, checklists, emergências, sistemas e texto editorial.
- `work-modulo-3d/src/components/Layout.tsx` e `src/components/Navbar.tsx` — scroll, transições, hash deep-link, drawer móvel e foco.
- `work-modulo-3d/src/components/home/` — Hero, cards, blueprint, gauges, stats, CTA e modelo procedural; refinar sem migrar para `app/`.
- `work-modulo-3d/src/components/assets/PA34SilhouetteTop.tsx` e `PA34ThreeView.tsx` — projeções blueprint e fallback estático.
- `work-modulo-3d/src/hooks/useScramble.ts` e `useCountUp.ts` — estados de animação e contadores sem flash ou NaN.
- `work-modulo-3d/src/index.css` — tokens, foco e media query de movimento reduzido.
- Não alterar `app/`, o GLB de Seneca II ou os dados técnicos locais.

## Tasks & Acceptance

**Execution:**
- [x] `work-modulo-3d/src/pages/` — implementar Cockpit, Especificações, Performance, Sistemas, Procedimentos, Multimotor, Emergências e Segurança com dados existentes.
- [x] `work-modulo-3d/src/components/content/ContentPage.tsx` — fornecer frame, tabelas, cards e leitura Markdown responsiva.
- [x] `work-modulo-3d/src/components/home/` — corrigir unidades, stabilator do Seneca I, ponteiro, foco/toque, loops e referências visuais sem marca d’água.
- [x] `work-modulo-3d/src/components/Layout.tsx`, `Navbar.tsx`, `SearchPalette.tsx`, `App.tsx` — corrigir foco, Escape, hash, busca, transições e wildcard.
- [x] `work-modulo-3d/src/components/assets/`, `HeroCanvas.tsx`, `ModelCanvas.tsx`, hooks e CSS — manter fallback, pausa, movimento reduzido e estados seguros.
- [x] `work-modulo-3d/src/data/` consumidores — conferir valores, unidades, IDs e atribuições sem criar conteúdo editorial.

**Acceptance Criteria:**
- Given qualquer uma das oito rotas, when o visitante a abre, then encontra conteúdo real da fonte local e não vê `MÓDULO EM MONTAGEM`.
- Given teclado, toque, deep-link, movimento reduzido ou WebGL indisponível, when o visitante interage, then navega e lê o conteúdo sem depender de hover, bloqueio ou animação.
- Given desktop e móvel, when a revisão visual é executada, then componentes, imagens/vetores, tabelas e diagramas permanecem legíveis e coerentes com HUD/blueprint.

## Implementation Notes

- As oito páginas foram convertidas para conteúdo data-driven; `ContentPage` fornece tabelas, listas, Markdown bruto, cards e âncoras.
- O fallback hero foi separado em módulo próprio para preservar o lazy-load do Canvas; referências às imagens `hangar-ambience.jpg` e `cockpit-ref.jpg` foram removidas do código.
- O MCP Blender não estava disponível (`Cannot connect to Blender at 127.0.0.1:9876`); a entrega usa a geometria blueprint procedural existente como fallback vetorial e não declara um novo render Blender como concluído.
- A instalação local de dependências exigiu `--legacy-peer-deps` porque React 19.3 e `@react-three/fiber` anunciam faixas de peer incompatíveis.

## Verification

**Commands:**
- `npm --prefix work-modulo-3d run build` — passou; `tsc -b` e `vite build` concluídos, com apenas aviso de chunks grandes.
- `npm --prefix work-modulo-3d run verify` — passou; smoke verification cobriu 8 páginas, dados JSON, deep-links, fallback WebGL e reduced-motion.
- `npm exec -- eslint <arquivos alterados>` em `work-modulo-3d/` — passou para os arquivos alterados, incluindo as exceções imperativas documentadas dos modelos R3F.
- `npm --prefix work-modulo-3d run lint` — não passou por 11 erros de regras React Compiler/hooks em componentes utilitários legados fora do escopo (`ChecklistCard`, `ui/*`, `use-mobile`); o conjunto alterado foi verificado separadamente.

**Manual checks:**
- Ainda requer abrir as dez rotas em desktop e móvel, repetir com movimento reduzido e WebGL indisponível e confirmar visualmente foco, imagens/vetores e tabelas.

## Review Triage Log

Diff revisado em `/tmp/pa34-build-20260922.diff`, com as camadas blind hunter, edge-case hunter e verification-gap hunter. Cada achado foi registrado; duplicatas foram mantidas explícitas para rastreabilidade.

| ID | Achado | Disposição | Ação / evidência |
|---|---|---|---|
| B01 | Card de Performance chamava 770 NM de máximo alcance sem condição. | patch | Card e callout agora informam 75% / 6.000 ft e também 700 NM a 65% / 9.000 ft. |
| B02 | Teto monomotor não distinguia serviço de absoluto. | patch | Card usa “Teto OEI · serviço” e o callout registra 3.650 ft / 50 ft/min e 5.000 ft absoluto. |
| B03 | Gráficos de performance das páginas 27–32 não estão disponíveis para transcrição. | defer | Diferido em `deferred-work.md`; a fonte local declara a ausência das figuras. |
| B04 | `seneca_specs.md` não era consumido pela página de Especificações. | patch | A referência primária agora é renderizada com nota sobre divergências entre documentos. |
| B05 | Cinco sistemas não tinham representação visual além do texto. | patch | Cada sistema ganhou mapa de componentes, sem sugerir uma sequência de acionamento não documentada. |
| B06 | Emergências citam cartões/figuras de checklist que não estão nos assets. | defer | Diferido em `deferred-work.md` para evitar reproduzir procedimento sem fonte primária. |
| B07 | Rótulo de Segurança `01–09` não representava capítulos 13.1 e anexos. | patch | Página e kicker agora explicitam `01–04 · 09 · 13.1`. |
| B08 | Regras 13.1 não apareciam no índice/busca. | patch | Índice da Home, busca e aliases numéricos Markdown apontam para `#13-1`. |
| B09 | Busca não cobria termos de Markdown como SAFETY WINDOW e Vxse. | patch | Busca ganhou entradas para SAFETY WINDOW/13.1, Vxse e especificações primárias. |
| B10 | Listas numeradas eram renderizadas como `<ul>`. | patch | `MarkdownView` preserva `<ol>` e marcadores decimais. |
| B11 | Parser não suportava links/imagens Markdown. | reject | Nenhum Markdown canônico contém sintaxe `[texto](url)` ou imagem; assets React já usam `alt`. |
| B12 | Hierarquia de headings Markdown era achatada. | reject | O mapeamento de `#` para `h2` é intencional: `ContentPage` fornece o `h1` da rota e mantém a página sem heading duplicado. |
| B13 | Home dizia 7 categorias, Cockpit listava 6. | patch | Categoria `AVISOS` foi incluída. |
| B14 | Card do cockpit prometia hover/zoom/pan inexistentes. | patch | Copy agora descreve seleção direta e fichas operacionais reais. |
| B15 | Fallback sempre dizia WebGL indisponível. | patch | `HeroStaticFallback` recebe causa: WebGL, movimento reduzido, compatibilidade, loading ou erro. |
| B16 | Cotas da vista 3D divergiam da fonte local. | patch | Envergadura e comprimento foram alinhados a 11,85 m e 8,69 m. |
| B17 | Sucção não indicava condição de RPM. | patch | Gauge agora rotula `SUCÇÃO · 2.000 RPM`. |
| B18 | Stats poderia confundir kgf e libras. | reject | Valor exibido é somente 4.200 LB; conversão fica explicitada no tooltip. |
| B19 | Procedimentos não avisavam material de estudo junto aos checklists. | patch | Callout de material de estudo adicionado. |
| B20 | Hashes de procedimentos/emergências rolavam para `<details>` fechado. | patch | Hash válido abre o item correspondente. |
| E01 | `decodeURIComponent` podia lançar em hash inválido. | patch | Decodificação protegida por `try/catch`, com fallback para topo. |
| E02 | Segundo `requestAnimationFrame` não era cancelado. | patch | IDs do frame externo e interno são rastreados e cancelados. |
| E03 | Hash sem alvo preservava rolagem anterior. | patch | Alvo ausente agora leva ao topo. |
| E04 | `/emergencias/` escapava do bypass de transição. | patch | Layout normaliza barra final antes de decidir a transição. |
| E05 | Drawer mobile não fechava em mudança apenas de query/hash. | patch | Dependências incluem pathname, search e hash. |
| E06 | Dropdown MAIS não fechava com Escape. | patch | Listener de Escape adicionado enquanto o dropdown está aberto. |
| E07 | Search Palette não tinha trap/restauração de foco. | patch | Modal agora captura Tab, foca input e restaura o elemento anterior. |
| E08 | Query de cockpit inválida mantinha ficha anterior. | patch | URL sem instrumento válido limpa `selectedId`. |
| E09 | Links 3D `#8-1` não correspondiam aos IDs semânticos de Sistemas. | patch | Aliases numéricos `8-1`…`8-7` foram adicionados. |
| E10 | Índice da Home não alcançava diretamente as regras de Segurança. | patch | Ficha 09 · 13.1 aponta para o alias numérico. |
| E11 | Deep-link de procedimento não abria checklist. | patch | `Procedimentos` abre o `<details>` cujo hash coincide. |
| E12 | Deep-link de emergência não abria fluxo. | patch | `Emergencias` aplica a mesma regra de hash. |
| E13 | Busca para Modelo 3D podia mudar URL sem selecionar componente já montado. | patch | Efeito de deep-link reage a mudanças de `searchParams`, inclusive navegação interna. |
| E14 | Rótulos podiam não invalidar `frameloop="demand"`. | patch | Modelo mantém o loop ativo quando RÓTULOS está habilitado. |
| E15 | Wrapper `pointer-events-none` bloqueava seleção do hero. | patch | Canvas interativo usa `pointer-events-auto` no descendente. |
| E16 | Ausência de IntersectionObserver deixava Canvas sempre ativo. | patch | Modo de compatibilidade retorna fallback estático. |
| E17 | Preferência reduzida era lida apenas na montagem. | patch | Hero assina mudanças de `matchMedia`. |
| E18 | Fallback confundia movimento reduzido com WebGL ausente. | patch | Mensagens distinguem as causas. |
| E19 | Listas ordenadas não preservavam ordem. | patch / duplicata B10 | Coberto pela correção do parser. |
| E20 | Card de alcance não informava a condição. | patch / duplicata B01 | Coberto pelo novo label e callout de Performance. |
| V01 | Não há teste de navegador para renderizar as oito rotas. | defer | Diferido em `deferred-work.md`; não há Playwright/Cypress/browser runner instalado. |
| V02 | Deep-links não são exercitados no DOM real. | defer | Diferido junto ao smoke de navegador; o smoke atual verifica contratos estáticos. |
| V03 | WebGL/reduced-motion não são simulados em navegador. | defer | Diferido junto ao smoke de navegador; manual check permanece explícito. |
| V04 | Markdown não é verificado por conteúdo DOM. | defer | Diferido junto ao smoke de navegador; parser e fontes são validados por build/smoke estático. |
| O01 | `MarkdownView` lista numerada virava `<ul>`. | patch / duplicata B10 | Corrigido no mesmo patch do parser. |
| O02 | Fallback dizia WebGL indisponível em outros estados. | patch / duplicata B15 | Corrigido com `StaticReason`. |
