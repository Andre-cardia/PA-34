# Painel pré-renderizado independente — Seneca I (fiel à foto PR-FLM)

Aplicação-alvo: **somente `work-modulo-3d/`**. Material didático, não certificado e sem simulação operacional. Nenhum arquivo do avião é aberto/importado pelo gerador. Não executar `../build_layers.py` para este painel.

## Referência fotográfica e autorização

- Foto: `referencia/painel-real-prflm.png` (1024×640), cabine do PA-34-200 Seneca I matrícula **PR-FLM**, vista interna em perspectiva. Os recortes `referencia/reg_*.png` vêm da mesma foto. A marca d'água do fotógrafo e o logotipo do site de origem estão na própria imagem e não foram removidos.
- **Autorização:** em 2026-10-15 o usuário autorizou integralmente ("autorização total") o uso da foto PR-FLM e a criação livre sobre o painel do Seneca (spec `_bmad-output/implementation-artifacts/spec-painel-fiel-prflm.md`, Decisões do usuário). Em 2026-09-26 ele já tinha pedido que a foto fosse copiada **incluindo os aviônicos modernos**.
- A foto serve só de **referência de layout e cor**. Ela não é publicada no aplicativo nem embutida no `.blend`, nos masters ou nos WebPs. Toda a geometria e toda a serigrafia são procedurais: `panel-data.ts` e `artwork.tsx`.
- Dados técnicos continuam os do Seneca I em `src/data/`. Os textos das placas reproduzem a foto, sem valores novos.

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

`CHROME_PATH` permite outro executável. O conversor usa um perfil temporário dedicado, encerrado ao terminar. Testado com Blender 5.2.0 LTS (Cycles: GPU Metal quando disponível, senão CPU), cerca de 2 min para os quatro renders, e com Chrome local para rasterização e WebP. A reprodução funcional é determinística quanto ao mapa e à câmera. Os bytes do render podem variar entre versões de Blender, Chrome e dispositivo.

Qualquer edição em `panel-data.ts`, `panel-geometry.ts`, `artwork.tsx` ou nos scripts exige refazer a sequência inteira. A cadeia de proveniência recusa etapas obsoletas.

## Fontes e resultados

- `map-source.mjs` importa via Vite os **mesmos `panel-data.ts`, `panel-geometry.ts` e `artwork.tsx`** usados pelo cockpit. `export-map.mjs` grava em `panel-map.json` os 54 IDs (49 + 5 do pedestal), com formas e rótulos, e a `geometry` das chapas: contorno do glareshield, acolchoado, subchapas, faixa escura, faixa creme, pedestal, console lateral, frisos, placas, horímetro, fixadores e manches. Não há segunda lista manual de coordenadas. `verify-assets.mjs` recalcula o mapa e exige igualdade byte a byte.
- O atlas (`masters/serigrafia-*.png`) vem de `artwork.tsx` e preserva valores, agulhas, escalas e arcos. Inclui também os impressos sem ID (placas da foto, horímetro, placa da base do pedestal), mas **não a chapa**. A tipografia das escalas genéricas é recomposta no conversor. Fontes usam o fallback monospace local; nada é baixado.
- `build_panel.py` começa de uma cena vazia e extruda os polígonos do mapa:
  - chapa preta acetinada com o contorno do glareshield da foto e acolchoado achatado;
  - subchapas do six-pack, do copiloto e do stack, recortadas pelo contorno;
  - faixa de anunciadores entre frisos cromados;
  - faixa inferior creme em relevo, console lateral e paredes creme;
  - pedestal creme com 6 manetes (potência pretas, hélice azuis, mistura vermelhas), ALT AIR entre puxadores prata e duas bolas pretas de COWL FLAP;
  - um corpo medido por ID, com aros, vedações, vidro refletivo, fixadores e volumes próprios (rockers, chaves rotativas, disjuntores, seletor e puxadores).

  Cada um dos 54 corpos é medido em projeção ortográfica: erro de centro e extensão menor que 0,001 em `projection-check.json`. Um raio frontal no centro de cada hotspot precisa atingir primeiro o próprio corpo (`occlusion-check.json`). O volume do conjunto do copiloto é visível à câmera: o retângulo do hotspot fica inteiro dentro do contorno da chapa.
- **Manches em W com logo Piper:** objetos separados na coleção "Manches (camada opcional)", com a mesma geometria do SVG (`yokeGeometry`). Renderizados à parte com fundo transparente e a mesma câmera, em `manches-{dia,noite}`. Os cubos são medidos contra o mapa (`occlusion-check.json`, `yokes`).
- `painel-seneca-i.blend` é a cena editável exclusiva, com texturas embarcadas, câmera e luzes diurnas. O script aplica a segunda iluminação para os masters noturnos e não sobrescreve cenas do avião.
- `masters/`: SVGs intermediários, PNGs de serigrafia e quatro masters finais de 3200×1920 (`painel-*`, `manches-*`), fora de `public/`.
- `../../public/cockpit-render/`: quatro WebPs otimizados (`painel-{dia,noite}`, `manches-{dia,noite}`, cada um com menos de 1 MB) e `manifest.json`, com dimensões, pesos, SHA-256, camadas, origem (foto PR-FLM e autorização) e fontes. Nem o `.blend` nem os masters são publicados no aplicativo.
- `masters/*-provenance.json`: fingerprints encadeados exportação → atlas → render. A conversão recusa fontes, atlas ou masters divergentes.

## Calibração e integração

Coordenadas SVG 1600×960, unidade Blender = 0,01 unidade canônica. X cresce à direita, Y é invertido e Z determina a espessura. Câmera ortográfica frontal com largura 16, sem perspectiva que desloque controles elevados. Mesma câmera e mesma proporção nas quatro imagens.

`RenderedPanel.tsx` insere as imagens no mesmo `<g transform>` dos hotspots e **recusa WebPs com dimensão ≠ viewBox×2**, caindo no fallback vetorial (mesmo layout). Filtros escurecem apenas as formas canônicas que não correspondem à categoria, e a seleção fora da categoria fica isenta. Máscara do tour, feedback, foco, handlers, pan/zoom e miniaturas continuam vetoriais. `YokesLayer.tsx` sobrepõe `manches-*.webp` só quando o botão "Mostrar manches" (`aria-pressed`, desligado por padrão) está ativo. A camada usa `pointer-events: none` e, sem o render, cai no desenho vetorial equivalente. Nenhuma camada cria canvas/WebGL nem captura eventos.

## Ensaios

Com a aplicação servida em `http://127.0.0.1:4175` (por exemplo, `npm --prefix work-modulo-3d run dev -- --host 127.0.0.1 --port 4175 --strictPort`):

```sh
node _bmad-output/visual-review/painel-renderizado/verificar-painel.mjs
node work-modulo-3d/blender/cockpit/test-pipeline.mjs
```

Os negativos de `test-pipeline.mjs` trabalham só em cópias temporárias. Cobrem:

- manifesto ausente ou JSON inválido;
- imagem ou manche ausente, duplicado ou extra;
- assinatura, dimensões (lidas do manifesto atual) e truncamento;
- proveniência obsoleta ou incompleta, inclusive a dos manches;
- origem sem a foto;
- ciclo de vida CDP.

`verificar-painel.mjs` lê o contrato de `panel-data.ts` e roda no modo `raster` quando os WebPs têm VB×2; com WebP de outro layout, cai no `fallback-e1`. Exercita:

- decodificação HTTP e os 54 IDs;
- calibração DOM, cliques adjacentes, busca e teclado;
- camada dos manches: desligada por padrão, render VB×2 e cliques passando por baixo;
- categorias, paradas do tour e 1440/768/390;
- resize, zoom e pan, retorno SPA do 3D, imagens atrasadas e bloqueio independente dia/noite.

`verify-assets.mjs` compara as 22 fontes 3D de `_bmad-output/verificacao-final-retomada/fontes-sha256.json`, o GLB e a fonte Blender aprovada. `PA34_APPROVED_BLEND` permite indicar essa fonte em outra máquina. A atualização do baseline em 2026-10-16 está registrada em `atualizacao-baseline-2026-10-16.json`: 10 arquivos alterados por commits aprovados (`c0dfa51`, `7a24544`) e `config.ts`, que mudou pelo `COCKPIT_LINKS` desta spec.

## Limites

As agulhas da imagem principal são estáticas; a animação das miniaturas é preservada. Inscrições muito pequenas exigem zoom, sobretudo no celular. Rádios e mostradores seguem a representação didática da foto, não a reprodução certificada de um número de série. O render é frontal e limpo: não reproduz desgaste, reflexos de janela nem a perspectiva da foto. Quatro WebPs de 3200×1920 ocupam cerca de 24 MB cada em RGBA se decodificados, embora o download somado fique abaixo de 1 MB. Os manches só são baixados quando ligados. Não há certificação de desempenho em aparelhos físicos de baixo custo. O build mantém o aviso preexistente de chunks JavaScript grandes.
