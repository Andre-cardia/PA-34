# Encerramento — nove camadas Blender do PA-34

## Resultado

Concluído em `work-modulo-3d/`: nove coleções editáveis, 68 IDs canônicos do Seneca I, exportação GLB com materiais embarcados e integração sem proxies aeronáuticos no navegador. A cabine foi refinada após reprovação humana das pequenas peças de iluminação/ventilação. Os nove prints de camadas e o montado receberam **aceite humano individual**, incluindo a versão corrigida.

- Editável: [pa34-camadas.blend](pa34-camadas.blend).
- Ativo: [pa34-camadas.glb](../public/models/pa34-camadas.glb).
- Contrato e proveniência: [manifesto](../public/models/pa34-camadas.manifest.json) e [NOTICE](../public/NOTICE-MODELO-3D.txt).
- GLB SHA-256: `11776870db30eca87b4fefc1060315b245c3df1ccff37975c11aaa643e15c71a`.
- Fonte original preservada: SHA-256 `0bc98466f988430cc6317c9ac483c950513f673cb1d204cd2d2cf9479be91cea`, conferido independentemente.

## Verificação final executada pela sessão principal

Todos os comandos foram executados **sequencialmente**, depois do último patch; cadeia completa terminou com código **0**. Os resultados abaixo não são inferidos somente do build.

| Verificação | Resultado |
| --- | --- |
| `npm --prefix work-modulo-3d run verify` | TypeScript/Vite, contratos, GLB/manifesto/dist, 39 negativos, GLTFLoader real, 68 IDs, 272 materiais independentes/restauráveis e callbacks reais de foco/URL passaram. |
| `verify-layer-diff.mjs --self-test` | 11 casos negativos e quatro positivos passaram; compara imagens, samplers, transformações efetivas e alcance na cena. |
| Comparação antes/depois da cabine | Somente três nós dos IDs `iluminacao_interna` e `aquecimento_ventilacao` diferem; tolerância 1e-6 e UV sem textura ignorado. Não é identidade binária das demais geometrias. |
| Blender `verify_containment.py --strict-coverage` | 43 objetos auditados; cobertura integral dos seus vértices, zero raios ausentes, zero vértices além de 25 mm; três negativos passaram. |
| Navegador — câmera | Sete casos passaram: GLB atrasado 5,5 s, fechamento/restauração de materiais, preset durante GLB retido, preset sem seleção, rótulos, zoom por gesto e repouso. |
| Navegador — seleção | 68 seleções com convergência finita <0,08 sustentada por 300 ms; nove isolamentos com restauração real de opacidade/geometria; quatro ciclos de hover/clique, incluindo ocultar/reexibir, raio-X e isolamento. |
| Seleção durante explosão | Deslocamento após seleção comprovado pelas matrizes; foco no motor direito converge com erro de aproximadamente 2,24e-16. |
| Navegador — aceitação | Nove toggles, 272 meshes explodidas/recompostas sem cortes, raio-X/restauração, viewports 1440/768/390 sem overflow ou clipping. |
| Fallbacks | Movimento reduzido, ausência de WebGL e GLB bloqueado exibem conteúdo; erro de ativo permite rolar até o último componente e selecioná-lo por ponteiro. |
| Rede e erros | Nenhum decoder remoto e nenhuma exceção inesperada. O erro deliberado de rede no ensaio de ativo bloqueado foi identificado como esperado. |

Os roteiros CDP usam a aplicação Vite de desenvolvimento existente em `http://127.0.0.1:4173`; **não** são ensaios contra o bundle minificado. O build e a igualdade binária dos ativos publicados em `dist` foram verificados separadamente. Nenhuma publicação remota ou operação de push foi realizada.

## Métricas

| Métrica | Baseline GLB anterior, sem proxies | Entrega |
| --- | ---: | ---: |
| Bytes | 1.255.252, com Draco | 20.070.308, sem decoder |
| Triângulos do ativo | 436.242 | 576.102 |
| Materiais do ativo | 11 | 21 |
| Primitivas | 148 | 272 |
| Nós com mesh / IDs | — | 119 / 68 |

Cena completa no navegador: **276 draw calls e 588.876 triângulos por quadro**. Inclui cenário e não se confunde com as métricas do arquivo.

## Revisão e rastreabilidade

Três revisores independentes examinaram snapshot integral. Os patches corrigiram raycast não restaurado, foco duplicado/atrasado, acompanhamento durante explosão, prioridade de presets antes da readiness, fallback cortado e lacunas nos validadores/ensaios. Regressões intermediárias de limpeza indevida do deep-link e de preset sem seleção foram encontradas, corrigidas e cobertas por testes — não ocultadas.

Não há Git neste projeto: `NO_VCS`, sem commit. Há um diff real **desde o snapshot lido pelos revisores**, não desde o início histórico da implementação. Os hashes das 22 fontes foram comparados após os testes e permaneceram iguais.

Evidências preservadas:

- [Log da execução final](../../_bmad-output/verificacao-final-retomada/execucao.log).
- [Câmera](../../_bmad-output/verificacao-final-retomada/camera/report.json), [seleção](../../_bmad-output/verificacao-final-retomada/selection/report.json), [aceitação](../../_bmad-output/verificacao-final-retomada/acceptance/report.json).
- [Diff após revisão](../../_bmad-output/verificacao-final-retomada/alteracoes-desde-revisao.diff) e [hashes das fontes](../../_bmad-output/verificacao-final-retomada/fontes-sha256.json).
- [Aceites humanos e hashes dos prints](../../_bmad-output/implementation-artifacts/aceites-visuais-retomada-camadas.md).
- [Triagem](../../_bmad-output/implementation-artifacts/spec-camadas-completas-blender.md) e [trabalho diferido](../../_bmad-output/implementation-artifacts/deferred-work.md).

## Limites mantidos

Representação **didática, não certificada**: contenção de vértices não valida instalações, interferências entre componentes ou fidelidade de cada percurso. O custo de ~20 MB e chunks JS >500 kB permanece documentado, sem certificação de desempenho em celulares de baixo recurso. Direitos da fonte Bipa precisam ser esclarecidos antes de redistribuição externa; atribuição histórica FlightGear/GPL preservada.

Foram diferidas questões preexistentes de interface: foco do modal móvel, interação de teclado aninhada no rail, rótulo de isolamento da camada e ação indisponível no modo estático. Não são apresentadas como corrigidas. `app/` e dados técnicos não foram alterados nesta retomada.
