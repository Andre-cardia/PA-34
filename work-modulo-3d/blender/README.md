# PA-34: nove camadas Blender

Aplicação-alvo exclusiva: `work-modulo-3d/`. Dados e IDs continuam os do **PA34-200 Seneca I**. Não usar este modelo como desenho certificado, gabarito, instrução de manutenção ou localização exata de instalações.

## Arquivos

- `build_layers.py`: geração reproduzível a partir da fonte Bipa v12; falha em nomes originais não classificados e em cobertura incompleta.
- `pa34-camadas.blend`: derivado editável, nove coleções, texturas embarcadas. Nunca substitui a fonte.
- `../public/models/pa34-camadas.glb`: exportação glTF 2.0 sem Draco/Meshopt e sem decoder remoto.
- `../public/models/pa34-camadas.manifest.json`: SHA-256, origem, nós, IDs, camadas, lados, âncoras e métricas.
- `renders/`: montado e uma imagem por coleção. Revisar **uma imagem por vez**; geração não equivale à aprovação visual humana.
- `verify_containment.py`: auditoria geométrica de contenção de conjuntos internos, somente leitura, com tolerância visual de 25 mm. Não certifica instalações/interferências entre componentes.

## Regenerar

Testado com Blender 5.2.0 LTS. Na raiz deste projeto:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 \
  --python work-modulo-3d/blender/build_layers.py -- \
  --source '/Users/andrecardia/Documents/Codex/2026-09-04/cr/outputs/PA-34_Seneca_Bipa_v12.blend' --render
```

Para regenerar os ativos completos, mas somente os renders pertinentes à revisão de cabine, substituir `--render` por `--render-layer avionics_cabine --render-layer montado`. Os outros oito PNGs não são sobrescritos.

Em outra máquina, alterar o executável e fornecer `--source` apontando para o original autorizado. Sem `--render`, produz somente Blender/GLB/manifesto. O SHA da fonte é verificado novamente após gerar. Usar `--python-exit-code 1`: por padrão o Blender pode retornar código zero mesmo com exceção Python.

```sh
npm --prefix work-modulo-3d run verify:model
npm --prefix work-modulo-3d run verify
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 \
  work-modulo-3d/blender/pa34-camadas.blend \
  --python work-modulo-3d/blender/verify_containment.py
```

`verify` compila TypeScript/Vite e executa verificações de contrato, integridade e 39 casos negativos (incluindo contagem, offsets, alinhamento, stride e bounds reais de POSITION): ID/camada/âncora/material/decoder/textura/buffer/cobertura/manifesto/arquivo truncado, imagem com referência inválida, geometria órfã, duplicação/ciclo de nós, quaternion nulo e índices com tipo, faixa ou conteúdo inválidos. A cobertura deve estar na cena padrão efetivamente carregada. **Não substitui testes de interação ou inspeção visual.**

## Testes de runtime e navegador (opt-in)

Node >=22.18 é necessário para importar os helpers TypeScript de produção sem framework/transpilador adicional. `verify` inclui `scripts/verify-runtime.mjs` (GLTFLoader real, hierarquia multimaterial/extras herdados, independência e round-trip dos materiais, bounds cacheados) e `verify-camera-focus.mjs` (âncora tardia, cancelamento, movimento durante explosão, prioridade de presets e deduplicação de foco/URL). Rodar isoladamente:

```sh
node work-modulo-3d/scripts/verify-model.mjs
node work-modulo-3d/scripts/verify-runtime.mjs
node work-modulo-3d/scripts/verify-camera-focus.mjs
node work-modulo-3d/scripts/verify-layer-diff.mjs --self-test
```

O comparador de camadas valida dependências de textura, transformações efetivas e participação na cena; seus autotestes incluem 11 negativos e quatro positivos. Para comparar duas exportações: `node work-modulo-3d/scripts/verify-layer-diff.mjs anterior.glb atual.glb aquecimento_ventilacao iluminacao_interna` (ajustar somente a lista de IDs cuja mudança foi autorizada).

O teste Node não decodifica os pixels das imagens: adapta apenas a criação de Texture; buffers, materiais e hierarquia usam GLTFLoader de produção. A aparência final e eventos do DOM exigem Chrome. Os roteiros CDP preservados não fazem parte da verificação automática padrão e não instalam navegador/framework.

1. Iniciar a aplicação de desenvolvimento existente, ou `npm --prefix work-modulo-3d run dev -- --host 127.0.0.1 --port 4173`. Os roteiros descobrem o módulo R3F no Vite de desenvolvimento, não no bundle minificado de produção.
2. Iniciar Chrome com perfil temporário dedicado e porta CDP somente local (ajustar executável conforme o sistema): `google-chrome --remote-debugging-port=9228 --user-data-dir=/tmp/pa34-cdp-review about:blank`. Não reutilizar perfil pessoal nem expor essa porta na rede.
3. Executar sequencialmente da raiz do projeto:

```sh
CDP_PORT=9228 APP_URL=http://127.0.0.1:4173 EXPECT_COMPLETE=1 node work-modulo-3d/scripts/verify-browser-acceptance.mjs
CDP_PORT=9228 APP_URL=http://127.0.0.1:4173 node work-modulo-3d/scripts/verify-browser-selection.mjs
CDP_PORT=9228 APP_URL=http://127.0.0.1:4173 node work-modulo-3d/scripts/verify-browser-camera.mjs
```

Cada roteiro abre/fecha sua própria aba; `REVIEW_OUTPUT` pode definir diretório de evidências. Sem override, relatórios ficam em `./test-artifacts/browser-*` relativo ao diretório de execução. Acceptance cobre camadas/explosão/raio-X/viewports/fallbacks/rede; selection cobre 68 IDs/deep-links/isolamento/clique real; camera cobre atraso de GLB de 5,5 s, preservação de parâmetros, labels religados, zoom durante ajuste e repouso com nove camadas ocultas. Consultar `VERIFICACAO.md` para distinguir sintaxe validada, execuções históricas e ensaios atuais efetivamente executados; roteiro persistido não significa teste já aprovado.

`verify_containment.py` exige os objetos esperados do manifesto, registra `covered`, `misses`, `coverage` e reprova objeto inteiramente não medido, vazio, ausente ou medido fora da pele. Três mutações negativas não alteram/salvam a cena. Usar `-- --strict-coverage` após o script Blender para reprovar qualquer raio ausente; em modo normal, cobertura parcial é explicitamente reportada como parcial, nunca contenção completa. Mesmo 100% dos vértices auditados não certifica faces entre vértices, demais componentes ou instalações internas.

### Regressão das longarinas das asas

As longarinas são seccionadas a cada 40 mm de envergadura antes do ajuste à pele, incluindo as raízes abaixo de `|Y|=0,55`. Isso evita faces longas atravessando o revestimento apesar de suas pontas estarem contidas. Apenas `longarina_principal` e `longarina_traseira` recebem esses cortes; exterior, materiais e IDs são preservados.

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 \
  work-modulo-3d/blender/pa34-camadas.blend \
  --python work-modulo-3d/blender/verify_wing_structure.py
```

Acrescentar `-- --glb` ao comando para repetir a auditoria sobre o GLB público importado, não apenas sobre o editável. Executar ambos após regenerar.

Esse teste exige os quatro conjuntos, mede vértices e pontos interiores dos triângulos contra **somente a pele das asas/comandos** (sem fuselagem/naceles mascarando extravasamentos), reprova raios ausentes e faces degeneradas, exige amostras nas raízes/faces e usa tolerância de 2 mm. Inclui deslocamentos virtuais negativos de 250 mm restritos separadamente às raízes e aos interiores das faces. As seções são remapeadas dentro do perfil medido, preservando espessuras em vez de achatar seus vértices no teto. É uma amostragem, não prova contínua nem certificação de instalações. Inspecionar também os renders `montado.png` e `estrutura.png`.

## Geometria e contrato

Referencial da fonte: nariz -X, lateral Y, vertical Z. glTF converte para Y-up; o único wrapper de visualização aplica rotação Y=π, escala `4.7/5.93994` e translação Y=-1.1. Não há calibrações separadas por camada.

Cada conjunto exportado tem `componentId`, `layerId`, `side` (`esq`, `dir`, `centro`) e `anchor` local no pivô geométrico. O pipeline agrupa por componente/lado, preserva os materiais e centraliza a origem nos limites. Um componente pode abranger ambos os lados, mas cada face aparece uma única vez. O navegador valida os extras, herda metadados do nó pai para primitivas multimaterial e **não classifica nomes nem usa fallback para fuselagem**.

A fuselagem original trazia janelas pintadas: faces identificadas pela textura são separadas para material transparente. Asas traziam contornos de comandos: cortes geométricos planos e tampas separam o bordo de fuga entre flap e aileron sem duplicar a asa. A silhueta e pintura fornecidas são preservadas. Isso não constitui certificação do recorte/instalação dos componentes.

Internos esquemáticos: cavernas e nervuras de chapa vazadas; almas/flanges de longarinas; berços tubulares; cárteres, quatro cilindros com aletas e acessórios por motor; tanques perfilados, bombas e linhas; bateria/terminais/chicotes/disjuntores; circuitos pneumáticos; freios/hidráulica; cabos/polias/manches; painel analógico, rádios e assentos com cintos. BVHs das cascas originais limitam os internos às superfícies disponíveis. Tubulações ajustam o eixo antes do sweep para manter seção circular; bombas são reposicionadas como conjuntos rígidos, não achatadas por projeção de vértices. Nenhum valor do catálogo técnico é reescrito para justificar a geometria.

### Refinamento da cabine

Luminárias possuem corpo, flange e difusor em suporte central contínuo; bocais com grelhas estão ligados a dutos laterais. A folga da peça completa é medida antes de criar a geometria rígida; não se achatam vértices contra o teto. Suportes e percursos são esquemáticos, não instalação certificada. Hastes externas ainda visíveis no render isolado pertencem ao ID canônico `antenas`, classificado em `avionics_cabine`; não são peças deformadas de iluminação.

Para conferir o escopo contra uma exportação anterior preservada:

```sh
node work-modulo-3d/scripts/verify-layer-diff.mjs anterior.glb \
  work-modulo-3d/public/models/pa34-camadas.glb iluminacao_interna aquecimento_ventilacao
```

A comparação usa tolerância numérica de 1e-6 em atributos/transformações e ignora UVs não usados por materiais sem textura. Assim detecta alterações de geometria/material fora dos IDs autorizados sem confundir variação não visual de UV na regeneração Blender.

## Integração e verificação visual

Materiais são clonados por instância (Hero e módulo não contaminam um ao outro). Texturas, PBR, transparência e emissão autorais são preservados; hover/seleção/raio-X têm overrides reversíveis. As âncoras registram/desregistram objetos e câmera/rótulos usam limites geométricos, não médias de origens. O estado inicial tem nove camadas montadas e opacas; raio-X é manual; seleção isola a camada e mantém URL compartilhável. O botão somente exterior mostra apenas essa coleção, não duplica hélices/trem.

Verificar após cada geração:

1. Modelo montado completo, sem internos atravessando pele; materiais legíveis.
2. Nove camadas isoladas, IDs/nomes/fichas corretos; motor esquerdo/direito correspondentes.
3. Explosão 0→100→0, sem duplicação e com enquadramento dos limites atuais.
4. Seleção por mouse, lista e deep-link; query inválida, fechar seleção e navegação.
5. Hover/raio-X/isolamento e retorno aos materiais autorais, inclusive vidro/pneu/metal.
6. Navegador 1440/768/390 px, movimento reduzido e WebGL ausente; falha de ativo mostra mensagem específica, nunca proxies.
7. Rede sem decoder remoto. Comparar Blender e navegador com luz neutra, sem exigir igualdade pixel a pixel entre Cycles e Three.js.

## Métricas e riscos

Baseline somente GLB (exclui proxies antigos): 1.255.252 bytes, 436.242 triângulos, 11 materiais, 148 primitivas. A compressão Draco anterior buscava decoder remoto.

Ativo após refinamento de iluminação/ventilação da cabine: 20.070.308 bytes, 576.102 triângulos, 21 materiais, 272 primitivas e 119 nós cobrindo 68 IDs. Valores exatos estão no manifesto/saída do validador. Primitivas são draw calls geométricas estimadas; cenário, transparência e sombras acrescentam chamadas reais. A verificação final independente mediu 276 chamadas e 588.876 triângulos por quadro da cena completa. Consulte [ENCERRAMENTO.md](ENCERRAMENTO.md) para evidências, aceites humanos e limites; relatórios de etapas anteriores são históricos.

O custo maior sem compressão é um risco de download/memória em celulares; não há orçamento de desempenho certificado. Build ainda avisa sobre chunks JS >500 kB. Direitos da fonte Bipa fornecida não foram certificados: preservar `../public/NOTICE-MODELO-3D.txt`, que também mantém o aviso GPL-2.0 do recurso histórico FlightGear. Não redistribuir externamente sem esclarecer a cadeia de direitos.
