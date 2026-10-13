# Painel pré-renderizado independente — Seneca I

Aplicação-alvo: **somente `work-modulo-3d/`**. Material didático, não certificado e sem simulação operacional. Nenhum arquivo do avião é aberto/importado pelo gerador. Não executar `../build_layers.py` para este painel.

## Reprodução

Na raiz do projeto, com dependências locais instaladas, Node, Chrome e Blender:

```sh
node work-modulo-3d/blender/cockpit/export-map.mjs
node work-modulo-3d/blender/cockpit/convert-images.mjs atlas
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 \
  --python work-modulo-3d/blender/cockpit/build_panel.py
node work-modulo-3d/blender/cockpit/convert-images.mjs render
node work-modulo-3d/blender/cockpit/verify-assets.mjs
npm --prefix work-modulo-3d run verify
```

`CHROME_PATH` permite outro executável. O conversor usa um perfil temporário dedicado, encerrado ao terminar. Blender testado: 5.2.0 LTS; Chrome local para rasterização e WebP. A reprodução funcional é determinística quanto ao mapa/câmera; bytes de render podem variar entre versões de Blender/Chrome/dispositivo.

## Fontes e resultados

- `export-map.mjs` importa via Vite o **mesmo `panel-data.ts`** usado pelo cockpit, exportando ordem/IDs/formas/rótulos para `panel-map.json`. Não existe segunda lista manual de coordenadas.
- A serigrafia e mostradores vêm de `artwork.tsx`, preservando valores, agulhas, escalas e arcos. O atlas **não contém a chapa do painel**. Tipografia das escalas genéricas é recomposta no conversor (tamanho e distância radial, legenda central) para separar inscrições preexistentes sobrepostas. Não modifica conteúdo técnico ou miniaturas do aplicativo. Fontes usam o fallback monospace local; não há download de fonte pelo gerador.
- `build_panel.py` inicia uma cena vazia. Chapa curva extrudada, microtextura, borda acolchoada, pedestal, caixas, aros, vedações, vidro refletivo e fixadores são geometria real. Rockers, controles de motor, botões de sintonia, disjuntores e comandos selecionados têm volumes próprios, alinhados às representações existentes; não são controles adicionais.
- `painel-seneca-i.blend` é a cena editável exclusiva com texturas embarcadas, câmera e luzes diurnas. O script aplica a segunda iluminação para o master noturno; não sobrescreve cenas do avião.
- `masters/`: SVGs intermediários, PNGs de serigrafia e masters finais 3200×1910, fora de `public/`.
- `../../public/cockpit-render/`: somente dois WebPs otimizados e `manifest.json` com dimensões, pesos, SHA-256 e origem/fontes. Não se publica `.blend` nem masters no aplicativo.
- `projection-check.json`: centros e extensões dos **56 corpos reais**, medidos nos vértices avaliados com modificadores e transformação, confrontados com o mapa (erro inferior a 0,001). `oat-clearance.json` registra quatro raios que atingem o OAT à frente da borda acolchoada.
- `masters/text-bounds-*.json`: caixas tipográficas medidas por `getBBox()` dentro dos retângulos imprimíveis; títulos longos são ajustados sem remover/renomear texto.
- `masters/*-provenance.json`: fingerprints encadeados exportação → atlas → render. A conversão recusa fontes, atlas ou masters divergentes; não pode atribuir hashes atuais a PNGs antigos.

## Calibração e integração

Coordenadas SVG 1600×955; unidade Blender = 0,01 unidade canônica; X cresce à direita, Y é invertido e Z determina espessura. Câmera ortográfica frontal com largura 16; nenhuma perspectiva pode deslocar controles elevados. Mesma câmera/proporção em ambas as imagens.

`RenderedPanel.tsx` insere as imagens no mesmo `<g transform>` dos hotspots. Filtros escurecem apenas formas canônicas não correspondentes; seleção fora da categoria fica isenta. Máscara do tour, feedback, foco, handlers, pan/zoom e miniaturas continuam vetoriais. Cada imagem tem estado independente e fallback correspondente durante carregamento/falha. `Image.decode()` também cobre o retorno SPA com cache (o evento `load` de SVG sozinho não é confiável nesse caminho). A nova camada não cria canvas/WebGL nem captura eventos.

## Ensaios

Com a aplicação servida em `http://127.0.0.1:4175`:

```sh
node _bmad-output/visual-review/painel-renderizado/verificar-painel.mjs
node work-modulo-3d/blender/cockpit/test-pipeline.mjs
```

Os negativos de `test-pipeline.mjs` trabalham exclusivamente em cópias temporárias: arquivos/JSON/assinatura/dimensões/par WebP inválidos, proveniência obsoleta/incompleta e ciclo de vida CDP (Chrome ausente, término precoce, deadline e desconexão). `verify-assets.mjs` registra `falhou` e sai com código não zero em qualquer exceção. `chrome-cdp.mjs` garante prazo e limpeza compartilhados pelo conversor e pelo navegador.

`PA34_URL` muda a origem. Saída isolada em `_bmad-output/visual-review/painel-renderizado/`; baselines anteriores permanecem intactos. O teste exercita decodificação HTTP, 56 IDs, calibração DOM, cliques adjacentes, busca/teclado, miniaturas, deep-links reativos, categorias, oito paradas do tour, 1440/768/390, resize/zoom/pan, retorno SPA de 3D, movimento reduzido, respostas de imagem atrasadas e bloqueio independente dia/noite. `verify-assets.mjs` compara os 22 hashes históricos, o GLB e a fonte Blender aprovada; `PA34_APPROVED_BLEND` permite informar a localização dessa fonte em outra máquina.

## Limites

As agulhas da imagem principal são estáticas; a animação das miniaturas é preservada. Inscrições muito pequenas exigem zoom, especialmente em celular. Rádios/mostradores são a representação didática existente, não reprodução certificada de um número de série. Dois WebPs de 3200×1910 consomem aproximadamente 49 MB se ambos forem decodificados em RGBA, apesar do download inferior a 1 MB somado; não há certificação de desempenho em aparelhos físicos de baixo custo. O build mantém o aviso preexistente de chunks JavaScript grandes.
