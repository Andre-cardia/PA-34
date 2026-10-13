---
title: 'Correção da estrutura interna das asas'
type: 'bugfix'
created: '2026-09-25'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Corrigir a estrutura primária que atravessa o revestimento das asas no modelo montado. Aplicação-alvo: `work-modulo-3d/`, confirmada pelo modelo Blender ativo e servidor Vite na porta 3000. Ajustar a geometria interna, não ocultar a camada nem alterar transparências para mascarar o defeito. Preservar exterior, dados Seneca I, IDs, seleção, isolamento, explosão, origem e licença dos recursos. Não modificar `app/` nem a fonte Blender original.

</frozen-after-approval>

## Implementation Notes

- Sem lacunas de intenção ou ações irreversíveis; correção localizada no gerador Blender e recursos derivados, com verificação geométrica de regressão.
- `work-modulo-3d/blender/build_layers.py:260–271`: mesas/almas extensas e nervuras; contenção posterior ajusta somente vértices, não comprova faces entre eles.
- `work-modulo-3d/blender/verify_containment.py`: auditoria atual permite 25 mm e testa apenas vértices; acrescentar verificação específica de faces das longarinas.
- Regenerar `blender/pa34-camadas.blend`, `public/models/pa34-camadas.glb` e manifesto preservando os demais componentes. Comparar exportações com `scripts/verify-layer-diff.mjs`.
- Verificar malha, contratos do modelo e aparência montada/estrutura isolada. Manter a representação interna explicitamente didática.
- Git indisponível; não há repositório na raiz. Diretório de planning-artifacts ausente.
- Causa comprovada: raízes com |Y|≤0,55 escapavam do ajuste; faces longas interpolavam extremos sem seguir a pele. Baseline ultrapassava até 118 mm no referencial Blender.
- Correção: cortes a cada 40 mm, inclusão das raízes e remapeamento proporcional da seção inteira com folga. Nenhuma transparência, visibilidade ou código React alterado.
- Comparação de recursos confirmou alterações apenas nos quatro nós dos IDs longarina_principal/longarina_traseira. A primeira execução de `npm run verify` passou (build, contratos, 39 negativos, runtime, foco e smoke); aviso preexistente de chunks grandes.

## Verificação final

- Blender: 131.582 amostras; GLB publicado reimportado: 186.204 amostras; nenhum ponto fora, raio ausente ou face degenerada nas quatro longarinas. Folga mínima amostrada aproximadamente 19,8 mm no referencial da fonte.
- Negativos específicos de faces e raízes aprovados em ambos os formatos. Teste inicial também reprovou corretamente a baseline anterior.
- Comparação final: somente os quatro nós das duas longarinas alterados; outros 115 nós preservados geometricamente e em materiais.
- `npm --prefix work-modulo-3d run verify` repetido após exportação final: build, contratos/39 negativos, runtime, foco e smoke aprovados; aviso de chunks grandes permanece.
- Renders montado e estrutura regenerados; montado inspecionado sem barras atravessando as asas. Não foi executado ensaio interativo de navegador nesta correção; recarregar a página para descartar o GLB anterior em memória.

## Review Triage Log

- medium → patch: projeção individual dos vértices criava faces colapsadas; substituída por remapeamento proporcional das seções e adicionada reprovação de faces degeneradas.
- medium → patch: negativo genérico não protegia cobertura de faces/raízes; adicionadas contagens obrigatórias e mutações separadas por região.
- medium → patch: auditoria só no Blender não comprovava ativo publicado; acrescentado modo `--glb` para importar e medir o recurso público efetivamente entregue.

