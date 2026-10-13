# Refinamento visual da cabine — iluminação e ventilação

> **Histórico do handoff da cabine.** A aprovação humana e a auditoria completa posteriores foram concluídas; consulte [ENCERRAMENTO.md](ENCERRAMENTO.md). Os resultados e as pendências abaixo são os que existiam no momento deste handoff.

## Solicitação e escopo

Correção solicitada pelo humano após reprovar o print da cabine: pequenas peças pareciam soltas/deformadas. Aceites das outras oito camadas pertencem aos prints anteriores; a sessão principal os mantém em `_bmad-output/implementation-artifacts/aceites-visuais-retomada-camadas.md`. Este registro não concede aprovação humana à cabine nem ao montado novos.

Somente `iluminacao_interna` e `aquecimento_ventilacao` tiveram geometria alterada. Não foram alterados dados técnicos, IDs, `app/`, código de runtime ou roteiros de navegador. As mudanças CameraMotion/glb-runtime e regressões existentes foram preservadas.

## Correção reproduzível

- `build_layers.py`: luminárias circulares com flange/corpo/difusor e suporte central contínuo; bocais com grelhas ligados a dutos laterais. A altura do conjunto é medida em múltiplos raios contra a casca antes da criação. Os conjuntos permanecem rígidos: não são achatados vértice a vértice no teto.
- Suportes e percursos permanecem uma representação esquemática, não afirmação sobre instalação certificada do Seneca I.
- As hastes claras ainda exteriores à cabine são `antenas`, pertencentes à camada canônica `avionics_cabine`, preservadas da fonte. Não são luminárias deformadas. Assentos, instrumentos e rádios também foram preservados.
- Novo argumento repetível `--render-layer` permite regenerar ativos completos e apenas os prints pertinentes, preservando os PNGs já aprovados.
- `verify_containment.py` agora audita também ambos os IDs refinados.
- Novo `scripts/verify-layer-diff.mjs` compara geometria/índices/transformações/materiais com uma exportação anterior.

Comando executado (Blender 5.2.0 LTS, saída 0):

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 \
  --python work-modulo-3d/blender/build_layers.py -- \
  --source /Users/andrecardia/Documents/Codex/2026-09-04/cr/outputs/PA-34_Seneca_Bipa_v12.blend \
  --render-layer avionics_cabine --render-layer montado
```

Produzidos: `pa34-camadas.blend`, GLB/manifesto e `renders/avionics_cabine.png`, `renders/montado.png`. Os outros oito renders não foram sobrescritos. O Blender pode manter `.blend1` como backup automático da versão anterior.

## Evidências atuais

- `npm --prefix work-modulo-3d run verify`: saída 0. Build, 25 casos negativos, GLTFLoader real, 68 IDs, 251 meshes com extras herdados, 272 materiais independentes/round-trip e foco após 300 frames/cancelamento passaram.
- Contenção Blender com `--strict-coverage`: 43 objetos auditados, cobertura integral, zero misses, zero vértices além de 25 mm e três negativos aprovados. Os três objetos novos/refinados têm 1.056 vértices cada, todos medidos. Não certifica interferências entre peças ou instalação.
- Comparação contra `/tmp/pa34-cabin-before/pa34-camadas.glb`: somente três nós mudaram geometricamente/materialmente: `aquecimento_ventilacao__dir`, `aquecimento_ventilacao__esq` e `iluminacao_interna__centro`. Os 116 restantes conservam atributos usados, índices, transformações e materiais, com tolerância numérica explícita de 1e-6.
- A comparação binária inicial detectou variações de UV na regeneração: ruído de ~3e-8 e UVs de tampas de flaps sem textura. Esses atributos não usados não mudam aparência. O comparador documenta que ignora UV de material sem textura; não há alegação de identidade binária dos demais nós. As imagens embarcadas permaneceram idênticas por SHA-256.
- A fonte original preserva SHA-256 `0bc98466f988430cc6317c9ac483c950513f673cb1d204cd2d2cf9479be91cea`.
- GLB atual SHA-256: `11776870db30eca87b4fefc1060315b245c3df1ccff37975c11aaa643e15c71a`.
- Inspeção individual dos novos renders cabine e montado: luminárias/dutos conectados e sem a deformação anterior; montagem sem peças novas atravessando a pele nesta vista. Aprovação humana ainda pendente.

| Métrica | Antes desta correção | Depois |
|---|---:|---:|
| Bytes GLB | 19.936.824 | 20.070.308 |
| Triângulos | 574.014 | 576.102 |
| Materiais | 21 | 21 |
| Primitivas | 269 | 272 |
| Nós / IDs | 119 / 68 | 119 / 68 |

## Pendências e riscos

A sessão principal executará auditoria de navegador e medição final de draw calls após este handoff; não foram executadas aqui. O aumento é de 2.088 triângulos, três primitivas e 133.484 bytes. Permanecem aviso Vite de chunks >500 kB, custo do GLB ~20 MB, limites de fidelidade e direitos da fonte documentados no NOTICE. Relatos anteriores em `VERIFICACAO.md` e na especificação são históricos, não resultados do novo ativo.
