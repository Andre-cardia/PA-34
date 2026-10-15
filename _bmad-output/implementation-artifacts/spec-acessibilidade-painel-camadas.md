---
title: 'Redesenho acessível do painel de camadas e da ficha do módulo 3D'
type: 'feature'
created: '2026-10-15'
status: 'done'
baseline_commit: 'c06d931a05536812849599608f1eee93ef1dc3bc'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A interface do `/modelo-3d` está pouco legível e tem defeitos de acessibilidade. O rail de camadas usa texto de 9–10px com tracking largo e linhas de altura irregular; o isolamento só existe por duplo-clique; o `GuideCard` repete a lista de camadas; a ficha quebra o cabeçalho em 4 linhas, corta a localização e desfoca o modelo; o sheet mobile cobre 72% da tela sem trap de foco. Há também os 4 itens do ledger: controles aninhados com Enter/Espaço duplicado, foco do sheet, rótulo "ISOLAR COMPONENTE" errado e isolamento sem efeito no modo estático.

**Approach:** Redesenhar a apresentação do `LayerRail`, do `GuideCard`, da `ComponentDrawer` e do sheet mobile dentro da linguagem visual atual (tokens, cores-chave das camadas, mono para rótulos), com a acessibilidade como requisito. Comportamento, IDs e deep-links não mudam.

**Decisões do usuário (2026-10-15):** escopo ampliado de acessibilidade para redesenho (opção A); botão da ficha passa a `ISOLAR CAMADA` / `SAIR DO ISOLADO (ESC)`; no modo estático o botão de isolamento é ocultado.

## Boundaries & Constraints

**Always:** trabalhar só em `work-modulo-3d/`; preservar movimento reduzido, fallback sem WebGL, `force3d`, `?nointro`, deep-links `?camada=&c=`, atalhos 1–9/E/X/R/Esc e o pulso da camada ao passar o mouse; manter os `aria-label` `Remover camada X` / `Adicionar camada X` (roteiros CDP); manter o cockpit visualmente idêntico (qualquer opção nova no `Drawer` compartilhado tem padrão igual ao atual).

**Never:** alterar o GLB, o manifesto, `blender/` ou `PA34ThreeViewData.ts`; editar `app/`; mudar `DataRow`/`SpecTable` (usado em Especificações); adicionar dependências; trocar a paleta ou as fontes do site.

## I/O & Edge-Case Matrix

| Cenário | Estado / entrada | Comportamento esperado |
|---|---|---|
| Abrir sheet mobile | viewport < lg, clique em CAMADAS | sheet ocupa ~50dvh, modelo visível acima; foco no botão fechar |
| Tab no sheet | foco no último focável | volta ao primeiro; Shift+Tab no primeiro vai ao último |
| Fechar sheet | Esc, ✕ ou overlay | fecha e devolve o foco ao botão CAMADAS |
| Esc com sheet aberto e camada isolada | `railOpen`, `isolate` ≠ null | primeiro Esc fecha o sheet; o seguinte desfaz o isolamento |
| Enter/Espaço no olho | foco em `Remover camada X` | alterna exatamente uma vez |
| Isolar pelo rail | clique ou Enter no botão isolar da linha | isola a camada; repetir desfaz; duplo-clique na linha continua funcionando |
| Localização longa | `Bateria` (eletrico) | texto quebra linha, nada cortado nem com rolagem horizontal |
| Modo estático | `reducedMotion: reduce`, ficha aberta | sem botão de isolamento; demais ações presentes |

</frozen-after-approval>

## Code Map

- `src/components/modelo3d/LayerRail.tsx:105-148` — linha = `div role=button` + `<button>` olho aninhado; `:155-177` ações em massa que quebram em 2 linhas; `:53-66` cabeçalho e chip ISOLADO.
- `src/components/modelo3d/GuideCard.tsx:38-59` — mini-índice de camadas duplicado.
- `src/components/modelo3d/ComponentDrawer.tsx:38` — chip usa `camada.nome` longo (trocar por `meta.short`); `:62` `DataRow` com `sm:shrink-0` corta a localização (substituir por bloco local rótulo/valor); `:89-96` botão de isolamento.
- `src/components/ui-custom/Drawer.tsx` — compartilhado com `cockpit/InstrumentDrawer.tsx`; overlay `bg-abyss/60 backdrop-blur-sm` (`:73`); cabeçalho com chip e título em linha (`:93-101`); padrão de trap de foco (`:22-52`).
- `src/pages/Modelo3D.tsx:342-350` botão CAMADAS; `:380-432` sheet (`h-[72dvh]`, sem foco); `:186-209` ordem do Esc; `:222-240` ramo estático com `onIsolate={() => undefined}`.
- `src/components/modelo3d/config.ts` — `LAYERS[id].short/color/icon`, `LAYER_ORDER`.
- `scripts/verify-browser-selection.mjs:56,60,66`, `scripts/verify-browser-camera.mjs:38` — procuram `ISOLAR COMPONENTE`.
- `tests/e2e/` — importar de `tests/support/fixtures`; o Chromium headless renderiza o 3D com `/modelo-3d?force3d&nointro=1`.

## Tasks & Acceptance

**Execution:**
- [x] `src/hooks/useDialogFocus.ts` — hook `(open, containerRef, initialFocusRef)`: foco inicial em rAF, trap Tab/Shift+Tab, retorno ao elemento anterior.
- [x] `src/components/ui-custom/Drawer.tsx` — usar o hook; props opcionais `backdrop?: 'blur' | 'dim'` (padrão `blur`) e cabeçalho com chip acima do título em largura total, para que títulos longos não fiquem espremidos. O cockpit continua com o padrão.
- [x] `src/components/modelo3d/LayerRail.tsx` — linha `li` não interativa no teclado, com clique e duplo-clique do mouse mantidos. Nome em 12–13px com tracking reduzido e uma linha (truncar com `title`). Contagem e número-atalho discretos. Camada desligada claramente apagada. Dois botões reais: isolar (`aria-pressed`, visível no hover/foco ou quando ativo) e olho (`aria-pressed`). Ações em massa em uma linha cada. Remover o vão morto.
- [x] `src/components/modelo3d/GuideCard.tsx` — remover o mini-índice; dicas em tipografia legível.
- [x] `src/components/modelo3d/ComponentDrawer.tsx` — chip `meta.short`; localização em bloco que quebra linha; `onIsolate` opcional; botão `ISOLAR CAMADA` / `SAIR DO ISOLADO (ESC)`; tipografia dos rótulos ≥ 11px; passar `backdrop="dim"`.
- [x] `src/pages/Modelo3D.tsx` — sheet com ~50dvh, hook de foco e ref de retorno no botão CAMADAS; Esc fecha o sheet antes de desfazer o isolamento; ramo estático sem `onIsolate`.
- [x] `scripts/verify-browser-selection.mjs`, `scripts/verify-browser-camera.mjs` — novo texto do botão.
- [x] `tests/e2e/painel-camadas.spec.ts` — cobrir a matriz (`@mobile` para o sheet).
- [x] `_bmad-output/implementation-artifacts/deferred-work.md` — `decision:` nos 4 itens do painel.

**Acceptance Criteria:**
- Given 1440×1000, when a página carrega, then as 9 linhas do rail têm altura igual, nomes em uma linha e as três ações em massa não quebram.
- Given a ficha aberta, then o cabeçalho mostra chip curto e título legível, e o modelo permanece visível (sem desfoque).
- Given o cockpit com instrumento aberto, then sua aparência não muda.
- Given só teclado no rail, then cada camada tem exatamente duas paradas de Tab (isolar, olho).

## Implementation Notes

- Rail desktop passou de 280 para 320px para que os 9 nomes caibam em uma linha ao lado dos botões isolar/olho (medido em 1440: altura 44px em todas, sem truncar). `truncate` + `title` ficam como salvaguarda.
- O botão isolar da linha tem rótulo `Isolar <CAMADA>` (sem a palavra "camada") porque `verify-browser-acceptance.mjs` localiza o olho por `endsWith('camada X')`. Em dispositivos com hover ele fica oculto até hover/foco ou quando ativo; em toque fica sempre visível.
- `Drawer` ganhou `backdrop` (`blur` padrão) e `header` (`inline` padrão, `stacked` na ficha 3D). Cockpit: região do drawer idêntica pixel a pixel antes/depois (diferença só no instrumento animado, presente também entre duas capturas do mesmo build).
- `useDialogFocus` recebe um 4º argumento opcional `returnFocusRef` (retorno ao botão CAMADAS); o Esc segue com cada diálogo.
- `painel-camadas.spec.ts` desliga AUTO-ROT e roda em ordem por projeto: com WebGL em software e vários workers, as transições da cena esgotavam o timeout de ação.
- Roteiros CDP: os três falham neste Mac em Chrome headless/SwiftShader (frames ociosos, restauração de materiais, toggle sem geometria) com o código-base idêntico (stash); não é regressão desta mudança, mas a cena real continua sem verificação neste ambiente.

## Spec Change Log

## Review Triage Log

| # | Origem | Achado | Veredito | Rota / evidência |
|---|---|---|---|---|
| 1 | blind | "(ESC)" no botão da ficha indica a tecla errada (Esc fecha a ficha) | medium | patch — rótulo virou `SAIR DO ISOLADO`; CDP atualizado |
| 2 | blind | olho com nome variável + `aria-pressed` gera anúncio contraditório | low | rejeitado — nome é contrato dos roteiros CDP (Always do spec); trocar exige migrar os roteiros |
| 3 | blind+edge | `aria-label` em `<span>` genérico é ignorado | medium | patch — `sr-only` na contagem e no índice 01/07 |
| 4 | blind | ações em massa rolam junto com a lista no sheet de 50dvh | medium | patch — lista rola sozinha; ações `shrink-0` fixas |
| 5 | blind+edge | `min-h-[340px]` cobre a tela em celular deitado | medium | patch — `min-h-[min(340px,60dvh)]` |
| 6 | blind | pulso da camada só no hover | low | patch — `onFocus` no `li` (foco borbulha dos botões) |
| 7 | blind | GuideCard cita "◎", que fica oculto até o hover | low | patch — texto diz "passe o mouse… botão de mira" |
| 8 | blind | botão da ficha sem `aria-pressed` | low | patch — `aria-pressed={isolated}` |
| 9 | blind | ficha perdeu o nome completo da camada | medium | patch — `camada.nome` em SOBRE A CAMADA |
| 10 | blind | `aria-label` duplica o `<h4>` visível nas seções | low | rejeitado — sem dano demonstrado; texto idêntico |
| 11 | blind+gap | trap/retorno de foco do Drawer sem teste | high | patch — testes 3D (ÍNDICE→ficha) e cockpit; **revelou regressão real**: hook descartava `<g>` SVG como alvo de retorno; corrigido (`SVGElement`) |
| 12 | blind | foco cai no `body` após abrir a ficha pelo canvas | low | defer — preexistente (Drawer original fazia o mesmo) |
| 13 | blind | atalhos 1–9/E/X/R disparam com diálogo aberto | medium | defer — preexistente, comportamento anterior à mudança |
| 14 | blind | layout só verificado em 1440 | low | rejeitado — rail de 320px; 1024 deixa 704px de canvas; nomes medidos cabem com folga |
| 15 | blind | diff omite spec e screenshots | false | ambos existem no disco; não rastreados por estarem fora do diff de código |
| 16 | blind | teste do overlay clica em ponto fixo | low | patch — ponto derivado do topo do sheet |
| 17 | blind | teste estático depende do vizinho `alternadores` | low | rejeitado — catálogo técnico estável; mudança quebraria visivelmente |
| 18 | blind | rótulo do isolar moldado pelo roteiro CDP | low | rejeitado — refatorar seletores CDP fora do escopo |
| 19 | edge | Esc não fecha o sheet com foco na busca do ÍNDICE | medium | patch — Esc do sheet tratado antes do filtro de INPUT |
| 20 | edge | girar para ≥ lg com sheet aberto prende o Tab | medium | patch — hook ignora Tab se o contêiner não tem caixas |
| 21 | edge | `li` perdeu o anúncio de atalho/contagem | low | patch parcial — contagem em `sr-only`; atalho só no `title` |
| 22 | gap | isolar pelo rail não verifica que a visibilidade fica intacta | medium | patch — asserção `9/9 VISÍVEIS` após o 1º clique |
| 23 | gap | clique simples na linha sem teste | medium | patch — teste novo |

## Design Notes

Linha-alvo do rail (≈44px): `▌ 05  ⚡ SISTEMA ELÉTRICO ······ 7   [◎] [👁]` — barra de cor de 3px à esquerda; ícone com a cor da camada só quando ligada; número `text-faint` como dica do atalho. Desligada: nome `text-faint`, ícone cinza, fundo transparente, olho riscado.

## Verification

**Commands:**
- `npm --prefix work-modulo-3d run test:e2e` — expected: tudo verde, incluindo `painel-camadas.spec.ts`.
- `npx eslint tests playwright.config.ts src/hooks/useDialogFocus.ts src/components/modelo3d/LayerRail.tsx src/components/modelo3d/GuideCard.tsx src/components/modelo3d/ComponentDrawer.tsx src/components/ui-custom/Drawer.tsx` (em `work-modulo-3d/`) — expected: sem erros novos.
- `npm --prefix work-modulo-3d run verify` — expected: passa.

**Manual checks (if no CLI):**
- Screenshots antes/depois em 1440 e 390 (rail, ficha, sheet, cockpit com ficha) em `_bmad-output/visual-review/painel-camadas/`, para aprovação visual humana.
