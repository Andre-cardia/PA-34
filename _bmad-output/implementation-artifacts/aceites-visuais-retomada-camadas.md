# Aceites visuais — retomada das camadas Blender

**Estado final: concluído.** Todos os prints receberam aceite humano individual. Após os patches de revisão, a sessão principal reexecutou a cadeia completa com saída 0; [ENCERRAMENTO.md](../../work-modulo-3d/blender/ENCERRAMENTO.md) contém os resultados definitivos e as limitações. As notas cronológicas abaixo preservam os estados intermediários.

Escopo: `work-modulo-3d/`. Aceites humanos explícitos nesta sessão, após apresentação individual dos PNGs existentes em `work-modulo-3d/blender/renders/`.

| Camada | Print | Estado |
| --- | --- | --- |
| Motores e hélices | `motores.png` | Aprovado |
| Estrutura primária | `estrutura.png` | Aprovado |
| Combustível | `combustivel.png` | Aprovado |
| Sistema elétrico | `eletrico.png` | Aprovado |
| Vácuo e pitot-estático | `vacuo_pitot.png` | Aprovado |
| Trem de pouso | `trem_pouso.png` | Aprovado |
| Controles de voo | `controles_voo.png` | Aprovado |
| Cabine e aviônicos | `avionics_cabine.png` | Versão inicial reprovada; versão corrigida com suportes/dutos contínuos reapresentada e aprovada |
| Exterior | `exterior.png` | Aprovado |
| Modelo montado | `montado.png` | Aprovado após correção da cabine |

Os aceites se limitam à aparência dos renders apresentados. Não certificam instalações aeronáuticas, contenção geométrica, correspondência de cada componente ou funcionamento no navegador. Não se estendem automaticamente a futuras mudanças de geometria.

## Impressões digitais dos oito prints aprovados

SHA-256 dos arquivos PNG no disco, registrados durante a regeneração exclusiva de cabine/montado. São hashes do arquivo original, não da prévia WebP usada pela ferramenta de visualização.

```text
a5739f22a9d912b67ec004cfc5c3526bd42637320a6918e1d4189e6fb5935e78  motores.png
bec923b7e1575554410fe79c008a3a6b79a9b81c8a9af43e1deebc9d256873f1  estrutura.png
79b1e088b0dd5ff6f47fc5d0052075792e6a2b6184c977ad5a9de272e31fd436  combustivel.png
b5c3a52fe743c45a7f216431cabe1fe8588549b0c7375cbeeb2162dd8e1a13fd  eletrico.png
4922b86aeb98450b5502bd7c966823cc265a9714c936e7939a28ca12ae3d2b8f  vacuo_pitot.png
86939ef8eb8bc5af678017ad63b405ab725a436df4e2fb062c9127ab8cd4c3e9  trem_pouso.png
1579f419ac99eb734a2e013a8debd4797e22841888aea9f85bc75708e90b6007  controles_voo.png
2c9e8f367063050ff35523ace1e7f2e1d333d6e8e31c7b75bd882e81cd5bc687  exterior.png
```

## Versão corrigida aprovada

```text
442f95297498047f45ed47f6743531b87f5d2027178a343ded0d056277bc8f0f  avionics_cabine.png
995b9ff57f8647e5d0af0ebb025329ac879af018f613437ab1e6794c5ce3089c  montado.png
11776870db30eca87b4fefc1060315b245c3df1ccff37975c11aaa643e15c71a  pa34-camadas.glb
```

Os novos prints foram apresentados e aprovados separadamente. O GLB corrigido passou nesta sessão por `npm run verify` (25 negativos, loader real e materiais), ensaios de câmera com atraso de 5,5 segundos (distância ao centro igual a zero), 68 seleções, isolamento real/restauração nas nove camadas, viewports 1440/768/390, explosão/recomposição, raio-X e fallbacks. Relatórios em `/tmp/pa34-final-cabine-{camera,selection,acceptance}/report.json`. Medição: 276 draw calls e 588.876 triângulos por quadro; 272 meshes. Não houve exceção inesperada nem decoder remoto.

Conferência independente do arquivo original realizada nesta retomada: `/Users/andrecardia/Documents/Codex/2026-09-04/cr/outputs/PA-34_Seneca_Bipa_v12.blend` mantém SHA-256 `0bc98466f988430cc6317c9ac483c950513f673cb1d204cd2d2cf9479be91cea`, igual ao manifesto e ao registro anterior. O `.blend` derivado existe separadamente.

A revisão independente posterior encontrou falhas não cobertas por esses ensaios; os patches e testes adicionais estão em andamento no implementador. Esses resultados, portanto, NÃO encerram a revisão técnica. Triagem detalhada na especificação.

## Evidências técnicas desta retomada

- Ensaio independente de navegador executado: `/tmp/pa34-retomada-20260924-acceptance/report.json`, saída 0. Observados 68 IDs, nove camadas, 269 meshes, 273 draw calls e 586.788 triângulos por quadro; toggles, explosão/recomposição, raio-X/restauração, viewports 1440/768/390 e fallbacks conferidos. Sem exceções inesperadas ou decoder remoto.
- Esse ensaio não cobre seleção completa nem foco após download lento; precisam de execução específica.
- Auditoria preparatória dos roteiros persistidos: `verify-browser-camera.mjs` deve rejeitar `focusDistance` nulo/não finito, não somente distância >0,08; `verify-browser-selection.mjs` deve conferir o efeito do isolamento nas malhas/materiais, não apenas a mudança de rótulo. Corrigir e executar após o handoff da cabine, sem edições paralelas na aplicação.
- Os resultados de navegador acima antecedem a correção visual da cabine; reexecutar sobre o GLB definitivo e registrar seu hash.
- Alterações externas foram detectadas em `ModelCanvas.tsx`; o usuário confirmou que as demais edições foram encerradas e autorizou prosseguir sobre o estado atual.
- A regressão isolada de foco inicialmente falhou por falta de `motion` no teste. Uma última alteração externa já havia compatibilizado o teste ao relê-lo; sua reexecução passou para âncora após 300 frames, cleanup e cancelamento por gesto/preset. Nenhuma edição minha foi aplicada nesse teste.
- Sem Git/baseline versionado: não é possível produzir um diff histórico confiável contra `NO_VCS`. A revisão deve distinguir leitura do estado atual de diferenças comprovadas.
