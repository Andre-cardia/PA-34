# Auditoria independente das camadas Blender

Estado: implementação e verificação técnica concluídas. Avaliação estética humana dos renders permanece aberta; não foi presumida.

## Entrega

Aplicação exclusiva: `work-modulo-3d`, rota `http://127.0.0.1:4173/modelo-3d`.

- Blender editável: `work-modulo-3d/blender/pa34-camadas.blend`, nove coleções, 68 IDs, texturas utilizadas embarcadas e nenhuma biblioteca externa.
- GLB: `work-modulo-3d/public/models/pa34-camadas.glb`, sem Draco/Meshopt ou decoder remoto.
- Pipeline, documentação e dez renders (montado + nove coleções): `work-modulo-3d/blender/`.
- Proveniência: manifesto adjacente ao GLB e `public/NOTICE-MODELO-3D.txt`.
- Fonte original preservada, SHA-256 `0bc98466f988430cc6317c9ac483c950513f673cb1d204cd2d2cf9479be91cea`.
- GLB SHA-256 `742c93c966c6218b73c397083360343a33414813a96b2085c1801f3ca50a689c`.
- Métricas: 19.936.824 bytes, 574.014 triângulos, 21 materiais, 269 primitivas, 119 nós e 68 IDs. O cenário completo mediu 273 draw calls e 586.788 triângulos por quadro no navegador.

Não existe repositório Git nesta pasta. Não foram fabricados commit ou diff histórico; a revisão utilizou snapshot explicitamente identificado como tal. Hashes dos 13 arquivos de geometria/render estão em `camadas-blender-asset-fingerprints.json`.

## Ensaios executados pelo agente principal

### Build e runtime

`npm --prefix work-modulo-3d run verify` terminou com código 0:

- TypeScript/Vite e igualdade dos ativos distribuídos em `dist`.
- 25 casos inválidos rejeitados pelo validador do GLB, incluindo índices, transformações, cena, materiais, metadados e recursos.
- GLTFLoader real: 68 componentes, 248 meshes com metadados herdados do pai.
- 269 materiais: clones independentes, cache não contaminado, restauração de opacity/transparent/depthWrite/emissive e preservação PBR.
- Bounds locais cacheados, sem varredura de vértices por frame.
- Foco com âncora disponibilizada após 300 frames; cancelamento de requisição/gesto.

O teste Node adapta apenas a criação de texturas, pois não tem decodificador DOM. Não é prova de pixels renderizados; estes foram examinados no navegador. O build continua emitindo aviso de chunks maiores que 500 kB. Não há alegação de lint limpo.

### Navegador real via CDP

Os roteiros persistidos `scripts/verify-browser-acceptance.mjs`, `verify-browser-selection.mjs` e `verify-browser-camera.mjs` passaram após os patches:

- Presença real dos 68 IDs nas nove camadas, não somente contagem no JSON.
- Cada toggle altera a visibilidade efetiva das malhas.
- Seleção e destaque das 68 peças, links diretos, navegação entre fichas e isolamento.
- Clique real de ponteiro sobre a fuselagem abre a ficha correspondente.
- Query inválida não abre ficha incorreta; fechar seleção preserva `force3d`/`nointro`.
- Explosão desloca as 269 malhas; recomposição restaura as matrizes.
- Raio-X reduz a opacidade de 23 primitivas externas e restaura os materiais.
- Sem overflow horizontal ou componentes fora do frustum em 1440, 768 e 390 px. Barra mobile corrigida para duas linhas e examinada visualmente.
- Movimento reduzido e WebGL ausente mantêm conteúdo/fallback.
- Requisição do GLB deliberadamente bloqueada mostra mensagem específica de falha, sem retornar a proxies. Exceção e console errors desse caso são esperados e classificados; nenhuma exceção inesperada.
- Nenhuma requisição de decoder remoto.
- GLB atrasado em 5,5 segundos ainda foca o centro do motor solicitado.
- Rótulos podem ser desligados/religados com autorrotação parada.
- Zoom manual durante o ajuste automático é respeitado.
- Todas as camadas ocultas: zero novos frames de renderização no intervalo ocioso medido.

O teste de fechamento da ficha passou a aguardar o desaparecimento real do Drawer, pois sua animação usa spring, não duração fixa de 400 ms. A captura inicial aguarda também o encerramento do overlay de apresentação.

Evidências visuais e relatório geral: `_bmad-output/visual-review/camadas-blender/`. Os roteiros usam `APP_URL`, `CDP_PORT` e `REVIEW_OUTPUT`; instruções estão no README do Blender.

### Blender e geometria

Abertura independente do `.blend`, sem salvar, confirmou portabilidade e cobertura.

`verify_containment.py --strict-coverage` passou: 40 objetos auditados, 100% dos vértices desses objetos medidos, zero raios ausentes, zero vértices além de 25 mm da casca medida. Negativos de objeto ausente, objeto deslocado para fora e conjunto vazio falharam como esperado. Isso não certifica todos os componentes, interseções entre peças ou instalações aeronáuticas.

## Revisão visual

Foram examinados os renders individualmente. Correções exigidas e reconferidas:

- Estrutura com chapas, nervuras e flanges, em vez de simples armação de barras.
- Cilindros opostos com aletas, carcaças, tubulações e acessórios nos motores.
- Melhor encaixe de tanques, cavernas e longarinas e eliminação de afloramentos evidentes na deriva/raiz.
- Tubulações geradas após ajustar o eixo; removidas as lâminas causadas pela deformação individual de vértices.
- Flaps/ailerons com cortes planos e fechamento de bordos, sem o serrilhado inicial.
- Cabine com painel/instrumentos, rádios, seis assentos, cintos, ventilação e iluminação; conjunto esquemático, não réplica minuciosa de cada peça.
- Comparação Blender/navegador confirma silhueta, vidros, borracha e metais distinguíveis; iluminação Cycles/Three.js não é idêntica pixel a pixel.

O render de motores e o print do navegador foram apresentados em mensagens separadas. Não foi registrado aceite estético humano inexistente.

## Revisão formal e limites

Três revisores independentes examinaram código, casos de borda e lacunas de verificação. Os patches de câmera, query, carregamento, bounds, materiais e validadores foram concluídos e revalidados.

Permanece diferida a gestão de foco/trap do modal móvel de camadas, preexistente e registrada em `deferred-work.md`.

Os interiores são didáticos e não certificados. A geometria não substitui documentação de manutenção, não comprova conexão exata dos circuitos e não altera os dados do PA34-200 Seneca I. O ativo sem compressão tem ~20 MB; desempenho em aparelhos de baixo custo não foi certificado. Direitos de redistribuição externa da fonte Bipa não foram presumidos. Nenhuma publicação externa ou alteração em `app/` integra esta entrega.
