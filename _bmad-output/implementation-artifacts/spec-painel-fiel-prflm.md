---
title: 'Painel do cockpit fiel à foto PR-FLM, refeito no Blender'
type: 'feature'
created: '2026-10-15'
status: 'ready-for-dev'
route: 'dispatch'
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
- [ ] `src/components/cockpit/panel-data.ts` — novo layout canônico medido sobre a foto retificada: coordenadas dos 49 IDs e dos 5 novos do pedestal, zonas renomeadas para as regiões reais, `TOUR_STOPS` revisado. Manter 1600 de largura; altura pode crescer para caber a faixa inferior e o pedestal.
- [ ] `src/components/cockpit/artwork.tsx` — `pal` com chapa preta acetinada e faixa creme; motor com faces creme e arcos verdes; GNS colorido, transponder com display laranja, placas e placa de limitações do trem; remover os rótulos didáticos impressos na chapa.
- [ ] `blender/cockpit/build_panel.py` — chapa preta com contorno do glareshield da foto, subchapas do six-pack, faixa creme em relevo, pedestal com 6 manetes (preto/azul/vermelho), ALT AIR e COWL FLAP, e manches em W como objetos separados para a camada opcional. Atualizar o número esperado de corpos.
- [ ] `blender/cockpit/{export-map,convert-images,verify-assets,test-pipeline}.mjs`, `README.md` — dimensões e contagens novas; proveniência da foto e autorização.
- [ ] `src/pages/Cockpit.tsx` — enquadramento mobile no six-pack novo.
- [ ] `src/data/cockpit_instruments.json` — 5 entradas novas do pedestal, com textos extraídos de `sistemas.json` e `procedimentos_normais.json`, citando a origem em `Implementation Notes`.
- [ ] `src/components/modelo3d/config.ts` — `COCKPIT_LINKS` sem destinos inexistentes.
- [ ] `src/components/cockpit/` + `src/pages/Cockpit.tsx` — botão "mostrar manches" (padrão desligado, `aria-pressed`) que sobrepõe a imagem dos manches com `pointer-events: none`; render separado dos manches gerado pelo Blender (dia e noite).
- [ ] **Ponto de parada E1:** ao concluir layout, arte e fallback vetorial, salvar comparação foto × vetor em `_bmad-output/visual-review/painel-fiel/` e parar para aprovação humana antes da etapa Blender.
- [ ] `_bmad-output/visual-review/painel-renderizado/verificar-painel.mjs` — alinhar às contagens e dimensões novas.
- [ ] `tests/e2e/cockpit-painel.spec.ts` — todos os IDs abrem a ficha e os centros dos hotspots ficam dentro da imagem.
- [ ] `_bmad-output/visual-review/painel-fiel/` — foto, render antigo e render novo lado a lado (dia e noite), em 1440 e 390.

**Acceptance Criteria:**
- Given o render novo lado a lado com a foto, when comparados, then cada componente da foto ocupa a mesma região relativa (piloto à esquerda, stack no centro, copiloto à direita, faixa creme e pedestal embaixo).
- Given qualquer um dos 49 IDs, when aberto por `?i=`, then o hotspot fica sobre o componente renderizado correspondente.
- Given o pipeline, when `verify-assets.mjs` roda, then todas as verificações passam.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- Sequência do README (export-map → atlas → Blender → render → verify-assets) — expected: tudo passa.
- `npm --prefix work-modulo-3d run test:e2e` e `npm --prefix work-modulo-3d run verify` — expected: passam.
- `verificar-painel.mjs` com o app em 4175 e `test-pipeline.mjs` — expected: passam.

**Manual checks (if no CLI):**
- Aprovação humana da comparação foto × render em `_bmad-output/visual-review/painel-fiel/`.
