---
title: 'Todas as camadas da aeronave modeladas no Blender'
type: 'feature'
created: '2026-09-24'
status: 'done'
baseline_commit: 'NO_VCS'
route: 'dispatch'
review_loop_iteration: 0
context:
  - /Users/andrecardia/Github/PA-34/AGENTS.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problema:** O exterior importado convive com componentes internos rudimentares gerados no navegador. A aparência foi reprovada: formas genéricas, materiais uniformes e alinhamento inconsistente prejudicam todas as camadas.

**Abordagem:** Produzir um arquivo Blender editável com nove coleções e cobertura dos 68 IDs existentes, substituindo os proxies por conjuntos reconhecíveis. Exportar geometria e materiais para GLB e preservar as interações do site. Renders Blender servem para revisar as peças; o site continua 3D interativo, não uma sequência de imagens.

## Boundaries & Constraints

**Sempre:** trabalhar em `work-modulo-3d/`; preservar o `.blend` original; manter Seneca I, dados e IDs técnicos; usar escala/orientação únicas; distinguir visualização didática de reprodução técnica certificada; revisar um print por vez. Manter movimento reduzido e fallback sem WebGL.

**Nunca:** editar `app/`; substituir formas apenas por blocos arredondados; inventar cotas ou instalações internas exatas; modificar dados técnicos para justificar a geometria; usar materiais monocromáticos que apaguem vidros, pneus e metais; manter componentes aeronáuticos procedurais no navegador após a migração.

**Direção visual proposta:** ilustração técnica tridimensional detalhada e sóbria, com metais, borracha, vidro e isolamento distinguíveis. Anatomia interna sem referência dimensional é explicitamente esquemática. Preservar a forma externa fornecida, corrigindo somente problemas necessários de integração e separação de peças.

## I/O & Edge-Case Matrix

| Estado | Comportamento | Falha |
|---|---|---|
| Modelo montado | Aeronave completa, materiais legíveis e peças alinhadas | Informar erro de ativo; não retornar silenciosamente aos proxies |
| Camada isolada | Conjunto reconhecível com rótulos corretos | ID desconhecido falha na validação de exportação |
| Explosão e retorno | Conjuntos separados sem duplicações; retorno à montagem | Enquadrar limites atuais, sem cortar partes |
| Seleção/deep-link | Peça, ficha e câmera correspondem ao mesmo ID | Query inválida mantém navegação utilizável |
| Movimento reduzido/sem WebGL | Conteúdo técnico e fallback continuam disponíveis | Mensagem específica, sem tela vazia |

</frozen-after-approval>

## Code Map

- `work-modulo-3d/src/components/modelo3d/SenecaTechModel.tsx`: mistura GLB e proxies; preservar eventos/animações e remover geometrias aeronáuticas locais.
- `work-modulo-3d/src/components/modelo3d/glb.tsx`: classificador por nomes e material substituto; migrar para metadados explícitos e materiais clonados por instância.
- `work-modulo-3d/src/components/modelo3d/ModelCanvas.tsx` e `config.ts`: câmera, luzes e deslocamentos.
- `work-modulo-3d/src/data/componentes_3d.json`: catálogo canônico dos 68 componentes; leitura, sem reescrever conteúdo.
- Fonte externa: `PA-34_Seneca_Bipa_v12.blend`; inspeção confirma coleção externa com 144 objetos, não nove sistemas internos completos.

## Tasks & Acceptance

**Execução:**
- [x] `work-modulo-3d/blender/build_layers.py` — criar pipeline reproduzível a partir do Blender original, com `layerId`, `componentId`, lado e âncora por conjunto; validar cobertura dos IDs.
- [x] `work-modulo-3d/blender/pa34-camadas.blend` — produzir nove coleções: exterior; estrutura com cavernas/nervuras/longarinas; motores com cilindros, acessórios e hélices; combustível com tanques e tubulações; elétrica com bateria, caixas e chicotes; vácuo/pitot com instrumentos e linhas; trem com articulações e freios; controles com superfícies e transmissões; cabine com assentos e painel.
- [x] `work-modulo-3d/public/models/pa34-camadas.glb` e manifesto adjacente — exportar materiais PBR compatíveis, texturas compactas e mapeamento completo; evitar dependência de decoder remoto.
- [x] `glb.tsx` e `SenecaTechModel.tsx` — consumir metadados e todos os conjuntos exportados; manter materiais originais com overrides reversíveis para hover/raio-X/isolamento, sem duplicar peças.
- [x] `ModelCanvas.tsx`, `config.ts` e `BottomBar.tsx` — ajustar enquadramento, iluminação e comunicação de representação didática.
- [x] `work-modulo-3d/scripts/verify-model.mjs` e `scripts/verify-build.mjs` — validar GLB, IDs, camadas, materiais, recursos locais e integridade do manifesto; casos inválidos devem falhar.
- [x] `work-modulo-3d/blender/README.md` e `public/NOTICE-MODELO-3D.txt` — registrar geração, proveniência e limites de fidelidade.

**Critérios:**
- Dadas as nove camadas, quando isoladas, cada uma apresenta geometria Blender reconhecível, sem proxies do navegador.
- Dados os 68 IDs, quando exportados, todos possuem representação e âncora válidas; nenhum nó depende de fallback para fuselagem.
- Dado o modelo montado, quando explodido e recomposto, escala, posição, materiais e seleção permanecem corretos.
- Dados Blender e navegador, quando comparados sob iluminação equivalente, vidros, metais, pneus e silhuetas permanecem reconhecíveis.

## Implementation Notes

- Investigação estática: apenas 12 dos 68 IDs associados ao GLB; 43 possuem proxies; a união representa 52 IDs, deixando 16 sem associação semântica. Não equivale a validação visual.
- O ativo contém 11 materiais e três imagens, descartados pelo carregador atual. Vidros integrados à pele exigem separação ou tratamento de material apropriado.
- Corrigir também registro/desregistro das âncoras: usar limites geométricos e pivôs preservados, não média de origens nem referências de objetos removidos.
- Nenhuma alteração de produção realizada nesta etapa. A fonte original permanece intacta. Escopo amplo, reversível, sem migração de dados ou publicação externa.

## Review Triage Log

Revisão 1, snapshot integral identificado como `NO_VCS`; não existe diff histórico recuperável. Três revisores independentes, sem camadas omitidas. Os testes de navegador independentes já executados não equivalem a testes persistentes do comando `verify`.

| Achado | Veredito | Evidência e rota |
|---|---|---|
| B1: foco limitado a 120 frames | medium | `CameraRig` abandona âncora ainda ausente após cerca de 2 s; GLB de 20 MB torna o cenário plausível. Patch: aguardar registro até cancelamento da requisição/montagem. |
| B2: nove camadas ocultas invalidam continuamente | medium | Bounds vazio retorna sem decrementar `remaining`. Patch: encerrar quando nenhuma camada está visível. |
| B3: dois controladores disputam câmera | medium | Tween e fitter escrevem posição/target no mesmo frame; só tween escuta início de interação. Patch: coordenar essa janela e cancelar ambos na interação. |
| B4: query descarta force3d/nointro | medium | Handlers novos substituem todo URLSearchParams. Patch direto: alterar/remover somente camada/c. |
| B5: query inválida conserva isolamento | medium | Ramo sem componente limpa seleção/foco mas não isolamento. Patch: limpar isolamento derivado da seleção. |
| B6: loading exibe OK antes do ativo | medium | Overlay usa timer, Suspense interno usa null. Patch de apresentação: remover sucesso não comprovado e mostrar fallback de carregamento enquanto Suspense estiver pendente. |
| B7: modal mobile sem gestão de foco | medium | Painel de camadas mantém implementação anterior sem trap/retorno de foco; não foi criado pela troca de geometria. Defer: correção de acessibilidade existente. |
| B8: índices GLB malformados passam | medium | Validador só verifica contagem divisível por três, sem tipos, limites ou valores. Patch no validador e mutações negativas. |
| B9: auditoria de contenção aceita cobertura vazia | medium | `continue` em raios ausentes e `all([])` podem produzir sucesso sem medição. Patch: componentes esperados e contagens de cobertura/misses explícitas, sem declarar prova para vértices não medidos. |
| B10: bounds precisos duplicam varredura | medium | Duas travessias precisas por frame durante ajuste para ~574 mil triângulos. Patch: bounds locais cacheados e transformados, sem percorrer vértices a cada frame. |
| B11: regressões de interação não persistidas | medium | Ensaios CDP independentes passaram, mas estão em `/tmp`; pipeline normal não os executa. Patch: preservar roteiros reproduzíveis e testar as correções de câmera/carregamento. |
| E1: foco perde carga lenta | medium | Mesmo defeito B1, mesma correção. |
| E2: vazio derrota demand render | medium | Mesmo defeito B2, mesma correção. |
| E3: fitter sobrepõe gesto manual | medium | Mesmo defeito B3, mesma correção. |
| E4: rótulos podem aguardar indefinidamente | medium | Ao desligar/religar rótulos após tick recente, acumulador pode ficar <0,15 s e nenhum invalidate é solicitado. Patch: completar o tick pendente quando rótulos estão ativos. |
| E5: contenção ignora ausência de interseção | medium | Mesmo defeito B9, mesma correção. |
| E6: índices além de POSITION | medium | Mesmo defeito B8, mesma correção. |
| E7: quaternion/matrix sem validação | medium | Validações cobrem translation/scale, não rotação/matriz. Patch: validar representações e incluir casos negativos. |
| V1: herança de extras sem teste persistente | medium | Gap pre-verificado: checks textuais/raw GLB não executam resolução na hierarquia GLTFLoader; ensaio independente confirmou funcionamento atual, não proteção futura. Patch: check de integração do loader. |
| V2: materiais sem teste persistente | medium | Gap pre-verificado: round-trip CDP passou, mas `verify` não testa clones independentes ou restauração. Patch: assertions executáveis sobre as funções de produção. |
| V3: contenção sem cobertura passa | medium | Mesmo defeito B9; confirmado no arquivo de 31 linhas do auditor. |

### Encerramento da revisão

Todos os patches dos achados B1–B6/B8–B11, E1–E7 e V1–V3 foram implementados e verificados. B7 permanece diferido no ledger como acessibilidade preexistente do modal móvel. O bloco congelado permaneceu intacto.

- `npm --prefix work-modulo-3d run verify`: código 0; build, 25 mutações negativas, GLTFLoader real, 248 meshes com extras herdados, 269 materiais com round-trip e instâncias independentes; foco após 300 frames/cancelamento.
- Três roteiros CDP persistidos passaram: 68 seleções, nove camadas, explosão/recomposição, raio-X/restauração, 1440/768/390, fallbacks, bloqueio deliberado do GLB, foco com atraso de 5,5 s, URL preservada, rótulos religados, zoom manual e zero frames ociosos com todas camadas ocultas. Erros do bloqueio deliberado são esperados; nenhuma exceção inesperada e nenhum decoder remoto.
- Contenção Blender em `--strict-coverage`: 40 objetos auditados, cobertura integral de seus vértices, zero misses, zero vértices além da tolerância de 25 mm; três negativos passaram. Não equivale a auditoria universal de interferências.
- Arquivo `.blend`: nove coleções, 68 IDs, texturas usadas embarcadas, nenhuma biblioteca externa. GLB: 19.936.824 bytes, 574.014 triângulos, 21 materiais. Cena completa no navegador: 273 draw calls e 586.788 triângulos por quadro.
- Renders examinados individualmente pelo agente; prints apresentados um por vez. Aprovação da especificação não foi tratada como aprovação estética humana dos renders.
- Sem Git, portanto sem commit ou prova por diff histórico. Snapshot de revisão e hashes registram o estado observado. Aplicação-alvo permanece `work-modulo-3d/`; nenhum trabalho foi transferido para `app/`.

### Revisão independente da retomada (snapshot NO_VCS)

As três camadas foram executadas simultaneamente, sem omissões, sobre snapshot integral de 22 fontes (195.332 bytes); linhas adicionadas no snapshot não provam autoria nem diferença histórica. A revisão anterior permanece histórica. Todos os prints das nove camadas e o montado foram aprovados individualmente pelo humano, incluindo a cabine corrigida. GLB desta revisão: `11776870db30eca87b4fefc1060315b245c3df1ccff37975c11aaa643e15c71a`.

| Achado | Veredito | Evidência e rota |
|---|---|---|
| H1: foco duplicado/timer da URL | medium | `selectComponent` pede foco imediato e effect da URL cria outro após 900 ms; o timer não participa da geração cancelada por gestos/presets. Patch: usar um único pedido sem timer redundante, preservando espera de âncora. |
| H1-R: queda do ramo válido após remoção do timer | high | Leitura do patch detectou ausência de `return` no ramo válido do effect: seleção/foco seriam limpos pelo trecho de query inválida. Implementador confirmou e corrigiu; regressão específica de hidratação/ação URL solicitada, além do CDP. |
| H2: foco durante explosão | medium | Bounds são capturados uma vez enquanto `a.explode` continua movendo grupos; o tween termina no centro antigo. Patch: atualizar destino pelo deslocamento dos bounds durante o tween, respeitando cancelamento. |
| H3: fallback do ativo cortado | medium | `StaticFallback` longo ocupa frame fixo com overflow oculto, sem rolagem no contêiner. Patch: contêiner rolável específico do fallback e teste de acesso ao último componente. |
| H4: foco modal móvel | medium | carried B7: modal móvel preexistente continua sem trap/retorno de foco; mesma localização e alegação já diferida, não duplicar ledger. |
| H5: interação aninhada no rail | medium | Handler Enter/Espaço do `div role=button` recebe evento do botão filho; código do rail é preexistente à migração auditada. Defer: semântica/teclado do painel de camadas. |
| H6: rótulo ISOLAR COMPONENTE | low | A ação recebe somente camada e reduz outras camadas, não irmãos; nomenclatura preexistente do drawer. Defer: corrigir rótulo para refletir isolamento de camada. |
| H7: isolamento sem efeito no modo estático | low | Ramo estático passa callback vazio para ação visível do drawer; comportamento preexistente. Defer: ocultar/desabilitar ação não disponível. |
| H8: clipping não reprova teste | medium | Listas `clipped`/`clippedComponents` são registradas mas ausentes da condição de saída. Patch: assertions explícitas de listas vazias. |
| H9: seleção não verifica foco concluído | medium | Navegação espera 600 ms, não convergência do tween; inspeciona destaque apenas. Patch: conferir centro da câmera contra bounds em cada seleção após convergência. |
| H10: comparação ignora imagens/samplers | medium | Fingerprint guarda JSON material, sem resolver bytes da imagem nem sampler. Patch: incluir dependências de textura e regressões com textura alterada. |
| H11: comparação ignora ancestrais/cena | medium | Fingerprint itera nós com mesh e guarda somente transform local. Patch: incluir transform efetivo e alcance na cena padrão; regressões para pai movido/nó removido. |
| H12: bounds declarados não conferidos | medium | Validador exige min/max finitos, mas não compara com floats reais; loader pode usar bounds incorretos. Patch: calcular limites reais e rejeitar divergência fora da tolerância. |
| E2.1: raycast não restaurado | high | R3F instalado ignora propriedades undefined (`events-156d8d12.esm.js:392`); após `noRay`, raycast vazio permanece. Patch: restaurar explicitamente `THREE.Mesh.prototype.raycast` e testar clique/hover após toggle/raio-X/isolamento. |
| E2.2: timer sobrepõe reset | medium | Mesmo mecanismo verificado em H1; timer da URL não conhece cancelamento do CameraRig. Patch agrupado H1. |
| E2.3: fallback sem rolagem | medium | Mesmo contêiner verificado em H3. Patch agrupado H3. |
| E2.4: foco escapa do modal | medium | carried B7/H4: mesmo código preexistente e mesma alegação; manter defer anterior, sem duplicar ledger. |
| E2.5: POSITION fracionário/offset negativo | medium | Guardas de POSITION não exigem count inteiro, offset não negativo/alinhado nem início dentro do próprio bufferView; reviewer demonstrou aceitação. Patch: validar intervalos/tipos e acrescentar negativos. |
| E2.6: alteração de textura passa comparação | medium | Mesmo fingerprint sem dependências verificado em H10. Patch agrupado H10. |
| E2.7: pai/cena ignorados na comparação | medium | Mesmo fingerprint local verificado em H11. Patch agrupado H11. |
| E2.8: clipping registrado sem falha | medium | Mesmo teste verificado em H8. Patch agrupado H8. |
| G1: cancelamento por preset não testado | medium | Gap pre-verificado: teste isolado incrementa geração por conta própria; CDP não escolhe preset durante carga lenta. Patch: ensaio real de preset com GLB atrasado. |
| G1-R: readiness/preset sem seleção | medium | Os novos testes revelaram reaplicação de foco antigo quando controles ficavam prontos e cancelamento indevido do preset pelo effect com foco nulo. Implementador aplicou sequência monotônica compartilhada, guarda de antiguidade e cancelamento separado; regressões reais de preset durante GLB retido e sem seleção foram adicionadas. Aguardar execução final antes do encerramento. |
| G2: fechamento não verifica saída de isolamento | medium | Gap pre-verificado: caso de fechamento só confere URL/dialog; teste de material usa outro caminho. Patch: conferir restauração de opacidades ao fechar drawer deep-linked. |

Todos os patches acima são correções locais dos caminhos demonstrados, sem nova superfície pública ou alteração do bloco congelado. **Resolução final:** H1/H1-R/H2/H3/H8/H9/H10/H11/H12, E2.1/E2.2/E2.3/E2.5/E2.6/E2.7/E2.8 e G1/G1-R/G2 foram corrigidos e verificados pela sessão principal após o último patch. H4/E2.4 permanecem carried do defer anterior; H5/H6/H7 foram registrados no ledger como preexistentes, sem alegação de correção.

A cadeia final sequencial passou com código 0: build/verify (39 negativos, loader real, materiais e callbacks), comparador (11 negativos/quatro positivos e somente três nós de cabine modificados), contenção Blender estrita (43 objetos, cobertura integral dos seus vértices, três negativos), câmera CDP 7/7, seleção 68/68 com convergência, nove round-trips de isolamento, quatro regressões de ponteiro/hover, seleção durante explosão, clipping nos três viewports e fallbacks com acesso ao último componente. Cena: 276 draw calls/588.876 triângulos por quadro. GLB mantém o hash aprovado acima, 20.070.308 bytes/576.102 triângulos/21 materiais. As 22 fontes auditadas permaneceram iguais aos hashes coletados antes da execução.

Evidências e limites no [encerramento final](../../work-modulo-3d/blender/ENCERRAMENTO.md); [log integral](../verificacao-final-retomada/execucao.log), [diff real desde o snapshot de revisão](../verificacao-final-retomada/alteracoes-desde-revisao.diff) e [aceites individuais](aceites-visuais-retomada-camadas.md). Sem Git, sem commit, sem push. Relatos anteriores nesta especificação são históricos; este parágrafo e o encerramento descrevem a versão entregue.

## Verification

Executar `npm --prefix work-modulo-3d run verify` e o novo validador de ativo; build não substitui testes de interação. Registrar triângulos, materiais, draw calls e tamanho antes/depois. Conferir em navegador 1440/768/390 px, incluindo carregamento sem decoder externo, todas as camadas, seleção, isolamento, explosão e fallback. Renderizar cada coleção no Blender e apresentar prints individualmente. A entrega exige inspeção visual, não apenas exportação bem-sucedida.
