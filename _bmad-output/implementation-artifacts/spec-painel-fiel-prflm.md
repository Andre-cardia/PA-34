---
title: 'Painel do cockpit fiel à foto PR-FLM, refeito no Blender'
type: 'feature'
created: '2026-10-15'
status: 'done'
route: 'dispatch'
baseline_commit: '8717f4f9baf8eeb2e0be2ff2f6f1ad07846ca859'
review_loop_iteration: 0
context:
  - '{project-root}/work-modulo-3d/blender/cockpit/README.md'
  - '{project-root}/work-modulo-3d/blender/cockpit/referencia/PLANO-FIDELIDADE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** O painel de `/cockpit` não se parece com o Seneca I real. É uma chapa cinza-oliva com caixas didáticas rotuladas ("CHAVE MASTER", "TREM DE POUSO"), instrumentos de motor genéricos, sem pedestal de manetes, sem placas e sem a faixa creme inferior da aeronave. O `PLANO-FIDELIDADE.md` (26/09) parou na correção 1 de 6.

**Approach:** Redesenhar o layout, a arte e a geometria Blender para reproduzir a foto `referencia/painel-real-prflm.png` em vista frontal: posições relativas, proporções, cores e componentes como aparecem na foto. Os pontos clicáveis passam a ficar sobre os componentes reais da foto.

**Decisões do usuário:**
- 2026-09-26: copiar a foto **incluindo os aviônicos modernos**; revisar todos os instrumentos; mover ou reagrupar hotspots preservando os IDs.
- 2026-10-15: uso da foto PR-FLM e criação livre sobre o painel do Seneca autorizados integralmente ("autorização total").
- 2026-10-15 (Q1 → b): pedestal clicável com IDs novos `manetes_potencia`, `manetes_helice`, `manetes_mistura`, `ar_alternativo` e `cowl_flaps`. As fichas são escritas só a partir do conteúdo já existente em `src/data/` (sistemas e procedimentos), sem números novos. Os destinos inexistentes de `COCKPIT_LINKS` passam a apontar para eles; o que ainda não tiver destino (`seletoras_combustivel`, `flaps_alavanca`, `compensadores`) aponta para o ID existente mais próximo ou é removido. O usuário revisa o texto das fichas.
- 2026-10-15 (Q2 → c): manches em W com logo Piper desenhados como na foto, atrás de um botão "mostrar manches" desligado por padrão. Quando ligados, não capturam clique sobre os hotspots.
- 2026-10-15: implementação em etapas com aprovação de render: (E1) layout canônico, arte e fallback vetorial; (E2) geometria Blender, render e cadeia de proveniência.

## Boundaries & Constraints

**Always:**
- Trabalhar só em `work-modulo-3d/`.
- Manter os 49 IDs existentes (mais os 5 novos do pedestal) e os deep-links `?i=` (busca global, `CKP()` em sistemas, `COCKPIT_LINKS`, tour).
- Manter o fallback vetorial (`renderArt`), o modo noite, o tour, os filtros por categoria, o pan/zoom e o cockpit sem WebGL.
- Câmera ortográfica frontal, com o render e os hotspots no mesmo sistema de coordenadas.
- WebPs com menos de 1 MB cada.
- Regenerar a cadeia de proveniência inteira (export → atlas → Blender → render → verify-assets).
- Registrar no README a proveniência da foto e a autorização de 2026-10-15.

**Never:**
- Abrir, importar ou regenerar o avião, o GLB ou `build_layers.py`.
- Editar `app/`.
- Alterar dados técnicos em `src/data/` além do que as perguntas abertas aprovarem.
- Inventar valores técnicos do Seneca II.
- Editar manualmente `panel-map.json` ou os masters: tudo sai dos scripts.

## I/O & Edge-Case Matrix

| Cenário | Entrada / estado | Comportamento esperado |
|---|---|---|
| Deep-link | `/cockpit?i=<cada um dos 49 IDs>` | ficha correta e hotspot centralizado sobre o componente renderizado |
| ID inválido | `/cockpit?i=nao_existe` | nenhuma ficha |
| Render ainda carregando | WebP lento ou com falha | fallback vetorial com o mesmo layout novo |
| Noite | alternar dia/noite | imagem noturna alinhada à diurna |
| Mobile | 390×844, primeira carga | enquadramento inicial no six-pack do piloto |

</frozen-after-approval>

## Code Map

- `src/components/cockpit/panel-data.ts` — `VB_W/VB_H` 1600×700 (:9-10); `PanelEntry` (:40-61); zonas `Z` (:63-74); 49 `ENTRIES` (:95-165); `PANEL_ORDER`, `SUGGESTED`, `TOUR_STOPS` (8 paradas), `RELATED`, `resolveInstrumentId`.
- `src/components/cockpit/artwork.tsx` — `pal` (:37); peças `Bezel/Face/Needle/GenericGauge` (:126-373), `G5Bezel` (:552), `Mfd` (:859), `CopilotoPack` (:1242); `renderArt` (:1524); `PanelPlates` (:1693, chapa e faixa bege). É a serigrafia exportada para o atlas e também o fallback.
- `src/components/cockpit/RenderedPanel.tsx`, `CockpitPanel.tsx` — imagem em 0,0,VB_W,VB_H no mesmo `<g>` dos hotspots `data-hotspot`; não mudam se a proporção se mantiver.
- `src/components/cockpit/usePanZoom.ts` usa VB_W/VB_H; `src/pages/Cockpit.tsx:90` `centerOn(380,378,1.6)` é o enquadramento inicial mobile, a recalcular.
- `blender/cockpit/build_panel.py` — material `plate` (:60-64, hoje grafite-oliva); contorno da chapa fixo no código (`upper`, :148-155); subchapas (:156); `gauge` (:190), `g5` (:206), `screen` (:219), caixas por ID (:243-295); `assert len(bodies)==49` (:338); câmera ortográfica (:300-305).
- `blender/cockpit/export-map.mjs`, `convert-images.mjs` (atlas e render), `verify-assets.mjs` (49 corpos, WebP = VB×2, < 1 MB, proveniência). **Já falha hoje** num hash 3D não relacionado (`ModelCanvas.tsx`, alterado no commit 7a24544): atualizar `_bmad-output/verificacao-final-retomada/fontes-sha256.json` só para os arquivos 3D alterados por commits aprovados e registrar isso.
- `blender/cockpit/test-pipeline.mjs:42` fixa a dimensão 1599/1600 nos negativos.
- `_bmad-output/visual-review/painel-renderizado/verificar-painel.mjs` — desatualizado (espera 56 IDs e 1600×955); alinhar ao contrato atual.
- `src/components/modelo3d/config.ts:165-191` `COCKPIT_LINKS` — 6 destinos inexistentes; redirecionar conforme a decisão do pedestal.
- Leitura da foto (regiões): piloto à esquerda (relógio, ASI, AI, ALT, OBS na linha de cima; OAT/vácuo, TC, HSI quadrado, VSI e furo vago na de baixo); placas e PR-FLM no topo; stack central (áudio, GNS colorido, NAV/COM2, transponder laranja, ADF, placa de limitações do trem); copiloto à direita (ASI, AI, ALT; TC, DG com avião laranja, VSI, tacômetro digital); faixa de anunciadores e chaves; faixa inferior creme com manifold, 2 RPM, fluxo, piloto automático AutoControl III, quadrante de 6 manetes e 3 luzes verdes, painel de disjuntores à direita.

## Tasks & Acceptance

**Execution:**
- [x] `src/components/cockpit/panel-data.ts` — novo layout canônico medido sobre a foto retificada: coordenadas dos 49 IDs e dos 5 novos do pedestal, zonas renomeadas para as regiões reais, `TOUR_STOPS` revisado. Manter 1600 de largura; altura pode crescer para caber a faixa inferior e o pedestal.
- [x] `src/components/cockpit/artwork.tsx` — `pal` com chapa preta acetinada e faixa creme; motor com faces creme e arcos verdes; GNS colorido, transponder com display laranja, placas e placa de limitações do trem; remover os rótulos didáticos impressos na chapa.
- [x] `blender/cockpit/build_panel.py` — chapa preta com contorno do glareshield da foto, subchapas do six-pack, faixa creme em relevo, pedestal com 6 manetes (preto/azul/vermelho), ALT AIR e COWL FLAP, e manches em W como objetos separados para a camada opcional. Atualizar o número esperado de corpos.
- [x] `blender/cockpit/{export-map,convert-images,verify-assets,test-pipeline}.mjs`, `README.md` — dimensões e contagens novas; proveniência da foto e autorização.
- [x] `src/pages/Cockpit.tsx` — enquadramento mobile no six-pack novo.
- [x] `src/data/cockpit_instruments.json` — 5 entradas novas do pedestal, com textos extraídos de `sistemas.json` e `procedimentos_normais.json`, citando a origem em `Implementation Notes`.
- [x] `src/components/modelo3d/config.ts` — `COCKPIT_LINKS` sem destinos inexistentes.
- [x] `src/components/cockpit/` + `src/pages/Cockpit.tsx` — botão "mostrar manches" (padrão desligado, `aria-pressed`) que sobrepõe a imagem dos manches com `pointer-events: none`; render separado dos manches gerado pelo Blender (dia e noite).
- [x] **Ponto de parada E1:** ao concluir layout, arte e fallback vetorial, salvar comparação foto × vetor em `_bmad-output/visual-review/painel-fiel/` e parar para aprovação humana antes da etapa Blender.
- [x] `_bmad-output/visual-review/painel-renderizado/verificar-painel.mjs` — alinhar às contagens e dimensões novas.
- [x] `tests/e2e/cockpit-painel.spec.ts` — todos os IDs abrem a ficha e os centros dos hotspots ficam dentro da imagem.
- [x] `_bmad-output/visual-review/painel-fiel/` — foto, render antigo e render novo lado a lado (dia e noite), em 1440 e 390.

**Acceptance Criteria:**
- Given o render novo lado a lado com a foto, when comparados, then cada componente da foto ocupa a mesma região relativa (piloto à esquerda, stack no centro, copiloto à direita, faixa creme e pedestal embaixo).
- Given qualquer um dos 49 IDs, when aberto por `?i=`, then o hotspot fica sobre o componente renderizado correspondente.
- Given o pipeline, when `verify-assets.mjs` roda, then todas as verificações passam.

## Implementation Notes

- 2026-10-15: duas execuções do subagente de implementação caíram antes do relatório; o trabalho parcial da E1 ficou no working tree. Um import inválido (`SteeringWheel`, ausente do `lucide-react` instalado) derrubava o site e foi trocado por `Gamepad2`.
- 2026-10-15: entre as duas tentativas, o usuário pediu um tema claro/escuro para o site inteiro, com o painel 2D sempre escuro. Ele foi commitado à parte (`98e077d`), fora deste spec. O palco do cockpit usa `.theme-dark`.
- VB passou a 1600×960. `RenderedPanel` rejeita WebPs com dimensão ≠ VB×2, então os renders antigos (3200×1400) caem no fallback vetorial até a E2.
- E1 fechada: `cockpit-painel.spec.ts` (61 passaram), suite completo com 108 passando e 6 pulados, `verificar-painel.mjs` em modo `fallback-e1` (55 ok, 9 pulados). Comparação em `_bmad-output/visual-review/painel-fiel/`. Aguardando aprovação humana antes da E2. Divergências conhecidas: console lateral, mostrador central da faixa escura, glareshield/bússola, placa do trem, altura do pedestal e proporção dos manches.
- 2026-10-15, revisão E1 pelo usuário: "ajustar antes". Corrigir as 7 divergências (console lateral, mostrador central, glareshield/bússola, placa do trem, pedestal, manches, cores) e tratar `navcom_1` como **Garmin GNS 530W** (o ID se mantém; nome, descrição e arte mudam). A operação do GNS segue o que já está em `procedimentos_normais.json` (GNS com TAWS), sem números novos.
- 2026-10-16: uma terceira execução deixou ajustes parciais da revisão E1 no working tree (`artwork.tsx` e `panel-data.ts`, por volta de 01:20; "530" já aparece na arte, mas não em `cockpit_instruments.json`). As capturas em `painel-fiel/` são anteriores aos ajustes. Próximo passo: auditar o working tree contra as 7 divergências e o GNS 530W, concluir o que faltar, rodar os testes, regenerar todas as capturas de `painel-fiel/` e **parar de novo no ponto E1**. A E2 (Blender, manches renderizados, pipeline) continua bloqueada até a aprovação humana.
- 2026-10-16, quarta execução: auditoria do working tree. As 7 divergências já estavam na arte e no layout; faltava a ficha. `navcom_1` em `cockpit_instruments.json` passou a "Garmin GNS 530W (GPS/NAV/COM nº 1)"; a descrição e a operação vêm de `procedimentos_normais.json` (MSA/TAWS/PDA, GNS da VoeFloripa). As faixas COM/NAV da época foram retiradas, sem números novos. Todas as capturas de `painel-fiel/` foram regeneradas contra o working tree (Vite em 5173). `verificar-painel.mjs` em `fallback-e1`: 55 ok, 0 falhas, 9 pulados. Suite e2e completo: 108 passaram e 6 foram pulados. O lint de `tests/` passa e `tsc` está limpo. **Parado de novo no ponto E1**, aguardando aprovação humana. A E2 não foi iniciada.
- 2026-10-16: **E1 aprovada pelo usuário** (opção 1). A E2 está liberada: geometria Blender, render dia/noite 3200×1920, render separado dos manches (dia/noite) e botão "mostrar manches", cadeia de proveniência completa e README com a proveniência da foto e a autorização. A tela do GNS e o realismo das cores ficam a cargo do render; o vetor de fallback não muda.
- 2026-10-16, quinta execução (E2):
  - **Fonte única da geometria.** `blender/cockpit/map-source.mjs` (novo) monta o mapa a partir de `panel-data.ts`, do novo `panel-geometry.ts` e de `artwork.tsx`. `export-map` grava em `panel-map.json` os 54 IDs e a `geometry` (chapas, faixa, pedestal, placas, horímetro, fixadores, manches); `verify-assets` exige que o arquivo seja idêntico. Para isso:
    - `offsetLine` e os manches (`YOKES`, `yokeGeometry`, `sampleSegs`) saíram de `artwork.tsx` para `panel-geometry.ts`, sem React, e o lint de `react-refresh` não ganhou erros;
    - as placas, o horímetro e a base do pedestal viraram exports (`Placards`, `HorimetroArt`, `PedestalBasePrint`) e entram no atlas;
    - `PLATE_SCREWS` e `PEDESTAL_BASE` foram para `panel-data.ts`.

    A arte vetorial não mudou visualmente.
  - **Cena Blender.** `build_panel.py` foi reescrito. Extruda os polígonos do mapa: chapa preta com o contorno do glareshield e acolchoado achatado, subchapas recortadas pelo contorno, faixa escura com frisos, faixa creme em relevo, console, paredes e pedestal. Os volumes incluem as 6 manetes (preto/azul/vermelho), os puxadores prata do ALT AIR, as bolas do COWL FLAP, rockers, chaves e disjuntores, com um corpo por ID. A contagem esperada é `len(MAP['instruments'])` (54).
  - **Medições na cena.** Os 54 corpos foram medidos com erro < 0,001 (`projection-check.json`). Os 54 raios frontais atingem primeiro o próprio ID (`occlusion-check.json`, que substitui o obsoleto `oat-clearance.json`). O retângulo de `instrumentos_copiloto` passa acima do contorno do glareshield, então usa um volume de medição invisível à câmera.
  - **Manches.** São objetos separados numa coleção própria, renderizados à parte com fundo transparente e a mesma câmera. O cubo de cada um é medido contra o mapa.
  - **Renders e pipeline.** Quatro masters e WebPs de 3200×1920, todos com menos de 1 MB: painel 368/334 KB, manches 55/47 KB. Mudanças nos scripts:
    - `convert-images` passou a converter 4 imagens e registra a foto PR-FLM e a autorização no `manifest.origem`;
    - `verify-assets` passou a exigir as 4 imagens, a proveniência dos manches, 54 corpos e raios e a origem da foto;
    - `test-pipeline` lê as dimensões do manifesto em vez de fixar 1599/1600 e ganhou negativos novos: manche ausente, imagem extra, proveniência dos manches, origem sem foto e `map-source`/`manches` obsoletos.

    O README tem a proveniência da foto e a autorização de 2026-10-15. Os WebPs antigos foram copiados para `painel-fiel/render-antigo/`.
  - **Baseline 3D.** O `fontes-sha256.json` foi atualizado em 11 entradas, auditadas em `_bmad-output/verificacao-final-retomada/atualizacao-baseline-2026-10-16.json`. Dez arquivos estavam idênticos ao HEAD (commits `c0dfa51`/`7a24544`). `modelo3d/config.ts` mudou pelo `COCKPIT_LINKS` desta spec. Nenhum arquivo do avião foi alterado: o GLB e o `.blend` aprovado conferem.
  - **Verificação.**
    - Sequência do README: tudo passou; `verify-assets` aprovado com 55 checks.
    - `test-pipeline`: 27 aprovados.
    - `verificar-painel.mjs` em 4175, **modo `raster`**: 69 ok, 0 pulados; inclui os manches render VB×2, `pointer-events: none` e cliques passando por baixo.
    - Suite e2e: 109 passaram e 6 foram pulados, incluindo o novo teste "Render Blender (E2)".
    - `npm run verify` passou; `tsc` limpo; lint de `tests/` limpo; lint de `src/components/cockpit/` com os mesmos 8 erros pré-existentes do HEAD.
  - **Capturas.** `painel-fiel/` regenerado: `08` com o render novo em 1440 e 390, dia/noite, com e sem manches; `09` com foto × antigo × novo; `10` com foto × render + manches; `11` com a sobreposição. **Falta a aprovação humana da comparação** (Manual checks).

- 2026-10-16, walkthrough: por decisão do usuário, o painel abre no **modo dia** por padrão (`Cockpit.tsx`, `useState(false)`); o modo noite segue no botão da toolbar. O e2e e os roteiros CDP (`verificar-painel.mjs`, `gerar-capturas.mjs`) foram ajustados; `cockpit-painel.spec.ts` passou com 67 testes. As capturas `*-inicial` dos roteiros CDP passam a se chamar `*-dia-inicial` na próxima execução.
- 2026-10-16, walkthrough (8717f4f..8922020 + modo dia): **aprovado pelo usuário**, incluindo a comparação foto × render (Manual checks). Pendências conhecidas: brilhos `[box-shadow:…rgb(var(--c-*) / α)]` não gerados pelo Tailwind em 12 classes (commit do tema `98e077d`) e os itens de `deferred-work.md`.

## Spec Change Log

## Review Triage Log

Revisão de 2026-10-16 (blind-hunter, edge-case-hunter e verification-gap sobre o diff contra `98e077d`, sem binários nem masters gerados).

| # | Achado | Veredito | Rota | Evidência |
|---|---|---|---|---|
| 1 | O teste e2e "manches não bloqueiam clique" escolhe `bussola_magnetica` em modo raster | medium | patch | Um `<image>` não tem `isPointInFill`, então todo hotspot conta como coberto (spec.ts:110–113) |
| 2 | O comentário "nenhum par se sobrepõe; e2e e CDP conferem" não tem teste | medium | patch | Não existe asserção de sobreposição em `cockpit-painel.spec.ts` nem em `verificar-painel.mjs` |
| 3 | Rejeição de WebP com dimensão errada sem teste | medium | patch | O e2e só aborta requisições; nenhum `route.fulfill` serve imagem de tamanho errado |
| 4 | `COCKPIT_LINKS`/`RELATED` sem teste de contrato | medium | patch | Nada em `tests/` ou `scripts/` confere os destinos |
| 5 | Manches desenhados por cima do foco, da seleção e do tour | medium | patch | `YokesLayer` vem depois do grupo de hotspots (CockpitPanel.tsx:461), o que esconde os indicadores (WCAG 2.4.11) |
| 6 | `isOverCream` ignora o console lateral e as paredes creme | low | patch | panel-data.ts:337 só testa `faixaCreme` e `pedestal` |
| 7 | O tom `blackBright` da placa do trem não tem ramo | low | patch | Em artwork.tsx:974–975 ele cai no ramo do preto comum |
| 8 | A oclusão de `instrumentos_copiloto` usa volume invisível; o hotspot passa acima do glareshield | medium | patch | rect(1150,132,…) passa de `GLARE_CONTOUR`; com `visible_camera=False`, o `ray_cast` não prova nada |
| 9 | Nenhum teste confere o alfa dos WebPs dos manches | low | patch | `verify-assets.mjs` não lê a flag de alfa do VP8X |
| 10 | `verificar-painel.mjs` não exige modo `raster` | low | patch | Ele cai em `fallback-e1` e reporta `passed` |
| 11 | O título do README de `painel-fiel/` diz "E2 concluída", mas o estado é aguardando aprovação; a sobreposição afim não é retificação real | low | patch | Divergência textual direta |
| 12 | Fichas `giro_direcional`, `indicador_vor_2_gs`, `dme` e `adf_receptor` descrevem equipamento diferente da arte nova | medium | defer | Real, mas exige alterar dados técnicos de `src/data/`, o que o Never do spec só permite com aprovação do usuário |
| 13 | `navcom_1.operacao` perdeu a sintonia COM/NAV | low | defer | Mesmo motivo do 12; decisão de conteúdo do usuário |
| 14 | Citação de origem das 5 fichas do pedestal ausente | — | rejeitado | A correção é editar este spec |
| 15 | Flaps e compensadores sem link | false | rejeitado | Decisão Q1→b do usuário: aponta para o ID mais próximo ou é removido |
| 16 | `projection-check` passa por construção | medium | defer | Fraqueza de verificação; o teste por união das peças é trabalho próprio |
| 17 | `verify-assets` (mapa e fingerprints) fora do CI | medium | defer | Lacuna anterior: o pipeline do cockpit nunca rodou no CI |
| 18 | Diff de revisão sem `fontes-sha256.json` | false | rejeitado | Foi exclusão da montagem do diff; a mudança está registrada em `atualizacao-baseline-2026-10-16.json` |
| 19 | `clip()` assume chapa convexa; `prism` com menos de 3 pontos | low | rejeitado | Só afeta edições futuras; o render atual foi verificado |
| 20 | Enquadramento mobile fixo e teste fraco | low | rejeitado | Valor medido; o teste confere o six-pack |
| 21 | Memória com 4 rasters decodificados | low | rejeitado | Manches desligados por padrão; carga preguiçosa adiciona complexidade |
| 22 | Portas e import do Vite inconsistentes nos scripts | low | rejeitado | Ferramenta manual, parametrizável |
| 23 | `catalog.find` indefinido e botão recentrar opcional no verificador | low | rejeitado | Falha alta e explícita, não silenciosa |
| 24 | `RenderedPanel` baixa a imagem rejeitada | low | rejeitado | Custo de rede só com assets obsoletos |

Patches 1–11 aplicados em 2026-10-16. Verificação final: `verify` passou, e2e com 114 passando e 6 pulados, `verify-assets` aprovado (57 checagens), `test-pipeline` aprovado (28), `tsc` limpo, lint de `tests/` limpo, `verificar-painel.mjs` em modo `raster` (70 ok). O GLB do avião, `build_layers.py` e `app/` não foram tocados.

## Verification

**Commands:**
- Sequência do README (export-map → atlas → Blender → render → verify-assets) — expected: tudo passa.
- `npm --prefix work-modulo-3d run test:e2e` e `npm --prefix work-modulo-3d run verify` — expected: passam.
- `verificar-painel.mjs` com o app em 4175 e `test-pipeline.mjs` — expected: passam.

**Manual checks (if no CLI):**
- Aprovação humana da comparação foto × render em `_bmad-output/visual-review/painel-fiel/`.
