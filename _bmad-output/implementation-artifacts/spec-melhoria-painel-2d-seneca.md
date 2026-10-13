---
title: 'Melhoria do painel 2D do Seneca I com referência fotográfica'
type: 'feature'
created: '2026-09-24'
status: 'done'
route: 'dispatch'
baseline_commit: 'NO_VCS'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/project-map.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problema:** O cockpit 2D de `app/` é apresentado como um diagrama retangular, com grandes separações entre grupos e pedestal horizontal. As fotografias anexadas mostram um conjunto compacto, de contorno superior curvo, com painel escuro, faixa inferior bege e pedestal central; a representação atual não transmite essa organização visual.

**Abordagem:** Redesenhar o SVG interativo para aproximar silhueta, proporções, materiais e agrupamento dos comandos das fotografias `painel-seneca1.jpeg` e `painel-seneca-1-2.png`. Usar a segunda imagem, frontal, como referência principal de composição e a primeira para detalhes de acabamento. Entregar uma ilustração vetorial didática mais reconhecível, não uma réplica certificada nem um simulador operacional.

## Boundaries & Constraints

**Sempre:** Trabalhar somente em `app/`; preservar o PA34-200 Seneca I, os IDs e conteúdos dos instrumentos, navegação por teclado, seleção, busca, categorias, links `?i=`, tour, zoom, modo noturno e movimento reduzido. Coordenadas do desenho, hotspots, rótulos e foco precisam continuar consistentes. Preservar os instrumentos existentes mesmo quando não forem visíveis nas fotos, acomodando comandos auxiliares de maneira legível.

**Nunca:** Alterar dados ou limitações aeronáuticas por inferência fotográfica; substituir Seneca I por Seneca II; modificar GLB, módulo 3D ou `work-modulo-3d/`; usar fotografia como textura principal; adicionar equipamentos digitais como se fossem padrão da aeronave. Não copiar matrícula, adesivos ou textos operacionais ilegíveis das fotos.

**Direção visual proposta:** Chapa superior grafite quase preta, contorno curvo e borda acolchoada; faixa inferior e pedestal bege; instrumentos analógicos com aros, vidro discreto, marcações claras e sombras contidas. Aviônicos existentes compactados ao centro, instrumentos de voo à esquerda, conjunto do copiloto à direita, instrumentos de motor junto à faixa inferior e quadrante central com pares de manetes pretas, azuis e vermelhas. Elementos decorativos não podem bloquear mostradores ou interação. A composição adapta as referências ao catálogo didático existente, sem reproduzir a configuração digital específica fotografada.

</frozen-after-approval>

## Code Map

- `app/src/components/cockpit/panel-data.ts`: `VB_W/VB_H`, `PANEL_MAP`, `PANEL_ORDER`, rótulos, zonas e alvos do tour. Fonte geométrica compartilhada; reorganizar coordenadas sem renomear IDs.
- `app/src/components/cockpit/artwork.tsx`: `pal`, `Bezel`, `Face`, `ArtDefs`, `PanelPlates`, `Quadrante`, `renderArt` e `MiniArt`. Desenha instrumentos e chapas; miniaturas reutilizam geometria e definições SVG.
- `app/src/components/cockpit/CockpitPanel.tsx`: palco, camadas dia/noite, hotspots ampliados, linhas dos rótulos e spotlight. Preservar handlers e semântica de teclado; rever colisões entre áreas clicáveis após compactação.
- `app/src/components/cockpit/usePanZoom.ts`: enquadramento e navegação; manter a integração com dimensões lógicas do painel.
- `app/src/pages/Cockpit.tsx`: consumidor de seleção, tour e links; inicia no modo noturno. O enquadramento mobile usa centro fixo (360, 340) e zoom 1,6: ajustar ao novo six-pack sem redesenhar a página inteira.
- `app/src/data/cockpit_instruments.json`: catálogo técnico a preservar; não é fonte de coordenadas do novo desenho.
- `app/public/cockpit-ref.jpg`: recurso já existente com marca de geração artificial; não usar como autoridade técnica nem substituir os anexos pela imagem.

## Tasks & Acceptance

**Execução:**
- [x] `app/src/components/cockpit/panel-data.ts` — reorganizar instrumentos, comandos e rótulos em uma composição frontal compacta; manter correspondência completa entre mapa, ordem e catálogo.
- [x] `app/src/components/cockpit/artwork.tsx` — redesenhar chapas e pedestal, refinar paleta, aros e manetes; revisar todos os desenhos dependentes de tamanhos para evitar cortes e sobreposições. Manter miniaturas e estados diurno/noturno utilizáveis.
- [x] `app/src/components/cockpit/CockpitPanel.tsx` — ajustar apresentação e expansão dos hotspots somente quando necessário ao novo layout; manter feedback de seleção e foco visíveis sem mascarar instrumentos adjacentes.
- [x] `app/src/pages/Cockpit.tsx` — alinhar enquadramento inicial mobile ao six-pack reposicionado, preservando o comportamento de seleção e tour.
- [x] `_bmad-output/visual-review/painel-2d/` — registrar capturas antes/depois e evidência das verificações de interação, responsividade e contratos; registrar limitações reais se automação de navegador estiver indisponível.

**Critérios de aceitação:**
- Dado o painel no modo diurno, quando aberto com enquadramento inicial, então apresenta topo escuro curvo, faixa inferior bege, aviônicos centrais e pedestal central, em aproximação visual clara às referências.
- Dados os três pares de manetes, quando exibidos, então potência, hélice e mistura são reconhecíveis por forma, rótulo e cores preta, azul e vermelha, respectivamente.
- Dado cada instrumento do catálogo, quando selecionado por clique, teclado, busca ou link direto, então o detalhe correto abre e o realce acompanha sua nova posição sem acionar outro instrumento.
- Dado o tour e um filtro de categoria, quando ativados, então foco, spotlight e destaques continuam alinhados aos instrumentos correspondentes; reset restaura o enquadramento integral.
- Dadas telas de 390, 768 e 1440 pixels, quando o painel é aberto e ampliado, então não há corte permanente de comandos e zoom/pan permitem inspeção; rótulos essenciais ficam legíveis ao aproximar.
- Dados modo noturno, movimento reduzido e miniaturas, quando exibidos, então materiais e mostradores mantêm contraste, miniaturas não são cortadas e nenhuma animação nova ignora a preferência de movimento reduzido.

## Implementation Notes

- O mapa preserva os 56 IDs do catálogo, mas agora organiza six-pack à esquerda, aviônicos no centro, copiloto à direita, motor junto à faixa inferior e três pares de manetes no pedestal central; a ordem de foco acompanha as zonas do novo desenho.
- A arte usa silhueta superior curva, borda acolchoada, chapa grafite, faixa/pedestal bege, rebaixos de montagem, aros com volume e materiais distintos para dia e noite. Potência, hélice e mistura receberam manoplas de formas diferentes e cores preta, azul e vermelha.
- A expansão das áreas clicáveis passou a ter limites e foi validada sem interseções; o pulso de retângulos acompanha a forma do comando em vez de criar círculos grandes sobre os vizinhos.
- O NAV/COM passou a calcular displays e botões a partir da largura disponível; miniaturas circulares, retangulares e do quadrante foram verificadas dentro do próprio `viewBox`.
- Nenhum ID, dado aeronáutico, GLB, módulo 3D ou arquivo de `work-modulo-3d/` foi alterado.
- A revisão corrigiu colisões e contraste dos rótulos, retirou os pulsos do hit-testing e tornou a evidência reproduzível: interseções, cliques reais adjacentes, centro mobile e contratos visuais agora falham automaticamente em regressões.

## Spec Change Log

- 2026-09-25 — Implementação concluída; tarefas marcadas e evidências automatizadas/visuais registradas em [`../visual-review/painel-2d/`](../visual-review/painel-2d/README.md).
- 2026-09-25 — Revisão em três camadas corrigida sem alterar o intento congelado: rótulos, ordem de foco, eventos dos pulsos e robustez/cobertura do verificador foram reforçados; preservados o layout fotográfico, os 56 IDs e todas as interações aprovadas.
- 2026-09-29 — Intento renegociado pelo usuário: o painel passará a ser usado em um SOP de escola de aviação, que não admite adaptação didática nem diferenças de posição em relação à aeronave real. Isso substitui a decisão registrada no Intent acima ("a composição adapta as referências ao catálogo didático existente, sem reproduzir a configuração digital específica fotografada"). `panel-data.ts` foi reposicionado a partir da mesma foto real (matrícula PR-FLM), com fileiras retificadas (linhas retas, sem a distorção de lente grande-angular) e viewBox ampliado (3100×980); `artwork.tsx` (`PanelPlates`) e o enquadramento mobile inicial (`Cockpit.tsx`) foram ajustados para a nova geometria. O raster Blender (`RenderedPanel.tsx`) foi desativado temporariamente — ele foi renderizado sobre a disposição didática anterior e ficaria desalinhado com as novas posições; a camada vetorial ficou ativa até um re-render (fase 2, não incluída nesta entrega). Itens fora do quadro da foto (coluna de chaves à esquerda) ou atrás dos manches (VOR/OBS, cluster de motor pequeno) foram mantidos como melhor estimativa e sinalizados com comentário "estimado" em `panel-data.ts` — ver relato da entrega para a lista completa.

## Review Triage Log

- `BH-01 — low · rejeitado` — Os alvos OAT/DME ficam abaixo de 24 px no enquadramento mobile inicial, mas o palco oferece zoom até 4× e uma garantia dinâmica em pixels criaria colisões entre instrumentos compactos; o impacto residual é pequeno e a correção não é direta.
- `BH-02 — low · patch` — Os rótulos MP e AP ocupam praticamente a mesma coordenada em `panel-data.ts`; a sobreposição é visível e pode ser resolvida movendo um rótulo.
- `BH-03 — low · patch` — Os rótulos DISJUNTORES e SUCÇÃO se cruzam na área direita; é uma colisão real e de correção direta.
- `BH-04 — medium · patch` — O cyan a 85% sobre o bege diurno mede aproximadamente 1,16:1–2,25:1 nas faixas usadas, insuficiente para os rótulos pequenos; a camada deve variar por modo/superfície.
- `BH-05 — low · patch` — `PANEL_ORDER` preservou a ordem anterior, não a leitura espacial do novo desenho; todos os focos existem, mas a sequência por teclado ficou confusa.
- `BH-06 — medium · patch` — O clique automatizado usa `dispatchEvent` no nó escolhido e não exercita hit-testing, sobreposição nem empilhamento reais; adicionar cliques por coordenadas.
- `BH-07 — false` — O relatório promete pan em viewport de 390 px, não emulação específica de toque, e `usePanZoom` já possui o caminho de Pointer Events/pinch anterior a esta história; a conclusão sobre uma alegação de toque inexistente não procede.
- `BH-08 — false` — `clampView` permite alcançar os dois limites com margem de 80 px e o painel inteiro volta a caber em reset; a evidência automatizada é parcial, mas o restante do painel não fica permanentemente inacessível.
- `BH-09 — maybe-false · rejeitado` — `getBBox()` realmente ignora filtros, porém o possível excesso do shadow sobre `pad=8` é subpixel e as capturas não mostram corte; seria necessária comparação de pixels das 56 miniaturas e o dano, se existir, é apenas cosmético.
- `BH-10 — medium · patch` — `verificacao-contratos.json` não tem gerador preservado; integrar cobertura de IDs/geometria/interseções ao verificador reproduzível.
- `BH-11 — false` — A técnica de contagem poderia falhar genericamente, mas o diff e o log atual mostram que os erros dos quatro arquivos permanecem nas mesmas regras preexistentes e nenhuma construção nova dispara lint; não houve substituição de ocorrência neste caso.
- `BH-12 — medium · patch` — Falhas ao iniciar Chrome/CDP acontecem antes do `try/finally` e podem deixar perfil/processo; mover todo o ciclo para cleanup garantido.
- `BH-13 — medium · patch` — Comandos CDP não têm timeout nem rejeição no fechamento do socket, podendo bloquear a verificação indefinidamente.
- `BH-14 — low · patch` — A documentação não informa o comando do preview em 4175 nem `CHROME_PATH`; a reprodução padrão fica incompleta.
- `BH-15 — low · rejeitado` — Há uma corrida teórica na porta derivada do PID, mas é rara e local; reservar porta/ler `DevToolsActivePort` exigiria complexidade desproporcional ao dano residual.
- `BH-16 — low · rejeitado` — A automação cobre todas as identidades no DOM e amostras de cada caminho/forma; recarregar e abrir 56 drawers aumentaria muito o tempo para um risco já limitado pelos contratos de ID.
- `BH-17 — low · rejeitado` — A comparação literal da cor é frágil para uma futura mudança de paleta, mas produz o modo correto hoje; não existe falha atual e a refatoração excede uma correção necessária desta entrega.
- `BH-18 — low · patch` — `trim` foi adicionado à paleta e não é consumido; remover o token morto evita uma falsa fonte de tema.
- `BH-19 — low · patch` — O log de lint contém o caminho absoluto local repetidamente; sanitizá-lo preserva a evidência sem expor caminho específico da máquina.
- `EC-01 — medium · patch` — Os pulsos SVG escalam a 1,4× e continuam recebendo eventos; como grupos posteriores podem sobrepor vizinhos, os pulsos devem usar `pointerEvents="none"`.
- `EC-02 — low · patch` — O rótulo GEAR WARN inicia em x=1271 e atravessa a face de estática alternada em x=1280; reposicionar o texto elimina a sobreposição.
- `EC-03 — maybe-false · rejeitado` — Repete o risco de shadow de `BH-09`; não há corte visível comprovado e seria preciso ensaio pixel a pixel para confirmar um efeito apenas cosmético.
- `EC-04 — medium · patch` — Mesmo defeito de lifecycle de `BH-12`; cleanup precisa abranger spawn, descoberta CDP e handshake.
- `EC-05 — medium · patch` — Mesmo bloqueio de `BH-13`; operações e pendências CDP precisam expirar/rejeitar.
- `EC-06 — low · rejeitado` — Mesmo risco raro de porta de `BH-15`; rejeitado pelo custo de uma reserva robusta frente ao uso local.
- `EC-07 — low · patch` — Concatenar `?i=` quebra `PA34_URL` com query/fragmento; usar `URL`/`searchParams` é correção direta.
- `EC-08 — low · rejeitado` — Existem esperas fixas, mas os estados essenciais também usam `esperarAte` e a verificação passou em execução independente; substituir todas as pausas por observadores seria mais complexo que o risco residual.
- `EC-09 — low · patch` — `zoomDepois !== 'ZOOM 100%'` aprova `null`; exigir valor numérico finito e maior que o inicial.
- `EC-10 — low · patch` — A verificação de pan aprova `null` como diferença; exigir transform string e mudança real da translação.
- `EC-11 — low · patch` — Uma falha precoce pode deixar capturas finais antigas ao lado do novo relatório; limpar somente saídas finais no início ou publicar de área temporária.
- `EC-12 — low · patch` — Se SIGTERM for ignorado após dois segundos, Chrome pode sobreviver; aplicar SIGKILL e aguardar saída antes de remover o perfil.
- `VG-01 — medium · patch` — Lacuna pré-verificada: geometria movida e expansão de hotspot não são testadas por hit-testing real nem por gerador reproduzível de interseções; adicionar ambas as verificações.
- `VG-02 — medium · patch` — Lacuna pré-verificada: o teste mobile só confere 160%, portanto qualquer centro passaria; afirmar que o centro do six-pack cai próximo ao centro do palco.
- `VG-03 — medium · patch` — Lacuna pré-verificada: as capturas não têm assertivas para silhueta curva, faixa bege e três tipos/cores de manete; acrescentar contratos SVG semânticos.
- `VG-04 — low · rejeitado` — O spec declara explicitamente ausência de script `test` e exige verificação manual/headless registrada; adicionar um orquestrador de preview ao manifest amplia a superfície pública para um ganho pequeno nesta entrega.

## Design Notes

A mudança exige redesenho coordenado de mapa e arte, não somente recoloração. Não há efeitos externos irreversíveis previstos. O alcance previsto é de até quatro arquivos existentes, sem nova API pública. Os anexos orientam aparência, não valores operacionais; as diferenças de aviônicos entre fotos não autorizam alterar o catálogo.

## Verification

- `npm --prefix app run build` — verificar TypeScript e geração Vite, reconhecendo que escreve artefatos; não equivale a testes.
- `npm --prefix app run lint` — registrar resultado e distinguir problemas preexistentes dos introduzidos.
- Conferir unicidade e cobertura dos IDs, dimensões positivas e limites de geometria; verificar visualmente interseções de hotspots e rótulos.
- No navegador: seleção por mouse e Enter/Espaço, busca, `?i=velocimetro`, tour, categorias, rótulos, zoom/reset, modos dia/noite e movimento reduzido; capturar as três larguras.
- O manifest não oferece script `test`; não declarar testes automatizados aprovados a partir de build ou lint. A raiz não possui Git, portanto não há SHA-base disponível.

**Resultados registrados em 2026-09-25:**

- `npm --prefix app run build` — aprovado; TypeScript e Vite concluíram. Há somente o aviso preexistente de chunks maiores que 500 kB. Log: [`../visual-review/painel-2d/build.log`](../visual-review/painel-2d/build.log).
- `npm --prefix app run lint` — não aprovado globalmente: 54 erros e 1 aviso preexistentes no aplicativo. A comparação das quatro fontes alteradas encontrou as mesmas contagens/regras antes e depois, sem problema novo. Evidências: [`../visual-review/painel-2d/lint.log`](../visual-review/painel-2d/lint.log) e [`../visual-review/painel-2d/verificacao-lint-alteracoes.json`](../visual-review/painel-2d/verificacao-lint-alteracoes.json).
- Contratos geométricos — aprovado pelo verificador reproduzível: 56 IDs únicos, nenhuma geometria inválida ou interseção entre hotspots expandidos. Evidência: [`../visual-review/painel-2d/verificacao-contratos.json`](../visual-review/painel-2d/verificacao-contratos.json).
- Navegador headless — aprovado para hit-testing real em controles adjacentes, Enter, Espaço, busca, link `?i=`, contratos da silhueta/faixa/manetes, filtro de motor, tour/spotlight, zoom/reset, centro e pan mobile, movimento reduzido e miniaturas; capturas em 390, 768 e 1440 px. Evidência: [`../visual-review/painel-2d/verificacao-navegador.json`](../visual-review/painel-2d/verificacao-navegador.json).
- Limitação real — os anexos `painel-seneca1.jpeg` e `painel-seneca-1-2.png` são referências desta conversa, não arquivos versionados; as capturas finais foram conferidas visualmente contra as prévias, sem baseline automatizada de pixels.
- Ambiente — `npm --prefix app ci` não pôde acessar o espelho configurado. Build, lint e navegador reutilizaram temporariamente `work-modulo-3d/node_modules`; os `package-lock.json` são idênticos e o link temporário foi removido após as verificações.
