# Verificação da implementação — 24/09/2026

> **Registro histórico de etapas anteriores.** Para a cabine corrigida, aceites humanos completos, 39 negativos e auditoria após os últimos patches, consulte [ENCERRAMENTO.md](ENCERRAMENTO.md). Números e pendências abaixo descrevem seus respectivos momentos, não o estado final.

## Encerramento independente — sessão principal

Após os patches, o agente principal executou `npm --prefix work-modulo-3d run verify`, os três roteiros CDP persistidos e a auditoria Blender com `--strict-coverage`: todos passaram. Foco com atraso real de 5,5 s, preservação de query, religamento de rótulos, zoom manual e zero frames ociosos foram confirmados; os 68 componentes passaram pela seleção/navegação. O teste da ficha aguarda a conclusão real do spring do Drawer, e a captura aguarda o fim do overlay inicial.

Nove camadas, explosão/recomposição, raio-X, 1440/768/390 e fallbacks passaram; nenhuma exceção inesperada ou requisição de decoder remoto. A cena completa mediu 273 draw calls e 586.788 triângulos por quadro. Detalhes: `_bmad-output/implementation-artifacts/auditoria-independente-camadas-blender.md` e `_bmad-output/visual-review/camadas-blender/`, relativos à raiz do projeto.

A implementação está concluída; o aceite estético humano não foi presumido. Permanece diferida a acessibilidade preexistente do modal móvel. As seções seguintes preservam o histórico e quem executou cada ensaio.

## Rodada de correções da revisão — implementador

Sem alterações de malhas, Blender, GLB, manifesto ou renders. Sem execução de build/verify integral nesta rodada; essa verificação ficou com a sessão principal.

- `node scripts/verify-model.mjs`: passou com **25 casos negativos**, incluindo índices fora de POSITION/buffer, tipo/layout inválido, quaternion não finito/formato incorreto e matrix/TRS simultâneos.
- `node scripts/verify-runtime.mjs`: passou usando **GLTFLoader real** sobre o GLB entregue; 68 IDs, 248 meshes com extras herdados e 269 materiais com clones independentes e round-trip de opacity/transparent/depthWrite/emissive, preservando PBR/mapas. O hook usa os mesmos helpers `glb-runtime.ts`, não uma cópia da lógica. Node adapta somente criação de texturas, pois não decodifica pixels via DOM; aparência/texturas precisam do ensaio de navegador.
- `node scripts/verify-camera-focus.mjs`: passou com âncora tardia após 300 frames e cancelamento por cleanup/geração de gesto ou preset. Teste isolado do effect de produção; não representa interação DOM real.
- `verify_containment.py`: 40 objetos esperados, cobertura 100% dos seus vértices, misses=0 e outside25mm=0. Três negativos passaram: objeto ausente, objeto virtualmente movido para fora da casca e conjunto vazio. A auditoria continua restrita aos componentes enumerados; não certifica o restante, faces entre vértices, interferências ou instalações. Resultados parciais são identificados explicitamente e `--strict-coverage` reprova qualquer miss.
- Os três scripts `verify-browser-{acceptance,selection,camera}.mjs` foram preservados de seus roteiros CDP e passaram em `node --check`; **não foram reexecutados pelo implementador nesta rodada**. São opt-in, requerem Chrome CDP e Vite de desenvolvimento; aguardam a verificação independente da sessão principal.
- Patches: câmera aguarda foco sem timeout curto, cancelável por gesto/preset; fitter não roda sem camadas visíveis nem simultaneamente ao tween; bounds usam caches locais/cantos; labels recebem tick ao religar; queries preservam parâmetros alheios e removem isolamento derivado inválido; carregamento usa Suspense visível, sem sucesso temporizado não comprovado.
- Aprovação estética humana dos prints continua **pendente**. Inspeção de agentes e aprovação anterior da especificação não constituem aceite visual humano.

## Conferência anterior à rodada de patches (histórico)

Esta seção distingue os ensaios executados agora dos relatos históricos abaixo. A implementação e os dez renders já existiam ao iniciar a retomada; não foram regenerados nem alterados nesta conferência.

- `npm --prefix work-modulo-3d run verify` e `verify:model`: aprovação do ativo atual. O validador foi ampliado de 10 para 18 casos negativos após demonstrar que aceitava cena vazia, quaternion nulo, referência de imagem inexistente e índices FLOAT. Agora verifica alcance pela cena padrão, ciclos/duplicação de nós, formato/faixa/conteúdo dos índices, transformações e referências das imagens.
- Blender 5.2.0 LTS aberto em background, sem salvar: nove coleções, 119 meshes, 68 IDs, nenhum metadado requerido ausente, nenhuma imagem utilizada não embarcada e nenhuma biblioteca externa. SHA-256 da fonte original e do GLB conferem com o manifesto.
- `verify_containment.py`: código 0; nenhum vértice dos conjuntos auditados excede a pele em mais de 25 mm. Não é uma auditoria universal de interseções internas.
- Inspeção individual dos dez PNGs existentes: silhueta montada e materiais distinguíveis; estruturas, cilindros/hélices, tanques/linhas, bateria/chicotes, pneumática, trem/freios, controles e assentos/painel reconhecíveis como conjuntos didáticos. Não equivale à aprovação estética humana. A cabine ainda merece revisão próxima das pequenas peças de iluminação/ventilação: algumas aparecem deformadas/soltas no render isolado; anatomia esquemática não certifica conexões mecânicas.
- Corrigido o foco de deep-link: o effect não desiste mais após 120 frames enquanto o GLB ainda carrega. `scripts/verify-camera-focus.mjs` transpila e exercita o callback de produção com âncora disponibilizada após 300 frames, verificando foco único e cancelamento no cleanup; executado por `verify`. É um ensaio isolado, não teste de rede/navegador.
- O usuário aprovou a especificação antes da implementação. A sessão principal inspecionou os renders e apresentou o de motores, mas não houve aprovação estética humana dos prints. Inspeção do agente e aceite humano são etapas distintas.
- Não foram executados testes de navegador nesta retomada. Os relatos da seção “Ensaios independentes” são históricos e precisam ser confirmados pela sessão revisora, inclusive draw calls finais e os viewports 1440/768/390.
- A fonte Blender, o GLB, os dados técnicos, `app/` e a especificação não foram modificados por esta sessão. Mudanças próprias: `scripts/verify-model.mjs`, `scripts/verify-build.mjs`, novo `scripts/verify-camera-focus.mjs`, foco em `ModelCanvas.tsx`, comentário de compressão em `Modelo3D.tsx`, este registro e `blender/README.md`; o comando de build também atualiza os artefatos em `dist/` e caches TypeScript.


## Ativo entregue

- GLB SHA-256: `742c93c966c6218b73c397083360343a33414813a96b2085c1801f3ca50a689c`.
- Fonte original SHA-256 preservado: `0bc98466f988430cc6317c9ac483c950513f673cb1d204cd2d2cf9479be91cea`.
- Nove coleções, 68 IDs, 119 nós, 269 primitivas, 21 materiais.
- 574.014 triângulos e 19.936.824 bytes.
- Baseline GLB: 436.242 triângulos, 148 primitivas, 11 materiais, 1.255.252 bytes (Draco; exclui proxies antigos).

## Executado pelo implementador

1. Blender 5.2.0 LTS: geração completa a partir do original, exportação e dez renders (montado + nove camadas); código de saída 0.
2. `npm --prefix work-modulo-3d run verify`: TypeScript/Vite + verificação de build + validador de ativo; código 0. Inclui comparação binária do GLB/manifesto em `dist` e dez casos inválidos que falham como esperado.
3. `blender/verify_containment.py`: código 0; conjuntos auditados sem vértices além da pele por mais de 25 mm. A deriva usa raios transversais; raios verticais sobre sua costura central aberta não representam um envelope válido.
4. Inspeção dos renders individualmente: montado, exterior, estrutura, motores, combustível, elétrica, vácuo/pitot, trem, controles e cabine. Corrigidos afloramentos de estrutura/tanques/empenagem, tubos deformados por projeção de vértices e bordos serrilhados dos comandos. O tubo agora é gerado ao redor de eixo ajustado; cortes das superfícies recebem tampas.
5. Verificação das dependências editáveis: nove coleções, imagens de arquivo usadas embarcadas, nenhuma biblioteca externa. O buffer `Viewer Node` é interno ao compositor, não arquivo externo.

## Ensaios independentes da sessão revisora

A sessão principal executou Chrome DevTools contra a aplicação e informou:

- 68 componentes selecionáveis com destaque nas respectivas meshes; deep-links das nove camadas, anterior/próximo, isolamento e query inválida; zero exceções após remover a injeção DOM `code-path` em R3F e eliminar a corrida de sincronização query/seleção.
- Toggles das nove camadas; explosão e recomposição sem duplicação, sem clipping nos viewports 1440/768/390.
- Nenhuma requisição de decoder remoto.
- Fallbacks por movimento reduzido, ausência de WebGL e bloqueio deliberado do GLB. Erros de rede no ensaio de GLB bloqueado são esperados.
- Primeira integração: 273 draw calls e 561.084 triângulos por quadro (inclui cenário). Essa medição antecede o último refinamento geométrico; consultar a evidência final da sessão principal para o quadro final.

Evidências finais de navegador são mantidas pela sessão revisora em `_bmad-output/visual-review/camadas-blender/` na raiz do projeto. Não confundir build/asserções estáticas com esses testes de interação.

## Limites e riscos remanescentes

- A aprovação estética humana ainda depende da revisão dos prints, um por vez. O primeiro render de motores foi apresentado pela sessão principal; exportação e testes não substituem essa aprovação.
- Interiores e percursos são esquemáticos. A contenção na casca não valida instalação exata, interferências internas, dimensões de manutenção ou certificação.
- A separação dos vidros deriva da textura original, não de desenhos de engenharia.
- GLB sem decoder tem ~20 MB e mais geometria; download/memória de celulares de baixo desempenho não têm orçamento certificado. Vite ainda avisa sobre chunks JS maiores que 500 kB.
- Cadeia de direitos da fonte Bipa precisa esclarecimento antes de redistribuição externa. O aviso GPL do recurso histórico FlightGear permanece preservado.
- Nenhum arquivo de `app/`, conteúdo técnico ou ID do catálogo foi alterado.
