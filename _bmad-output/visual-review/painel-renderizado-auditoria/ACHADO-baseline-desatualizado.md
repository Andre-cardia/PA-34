# Achado de integridade — baseline de hashes desatualizado (não é regressão desta sessão)

Data do achado: 26/09, durante a revisão de fidelidade do painel.

## O que foi observado

`verify-assets.mjs` acusou divergência em 4 das 22 fontes do módulo 3D registradas em
`_bmad-output/verificacao-final-retomada/fontes-sha256.json`:

- `work-modulo-3d/src/components/modelo3d/ModelCanvas.tsx`
- `work-modulo-3d/src/components/modelo3d/config.ts`
- `work-modulo-3d/blender/build_layers.py`
- `work-modulo-3d/scripts/verify-browser-camera.mjs`

Além disso, o GLB do avião **não é o que foi aprovado na entrega anterior**:

| | hash | bytes |
|---|---|---|
| Aprovado (entrega do painel) | `11776870db30eca87b4fefc1060315b245c3df1ccff37975c11aaa643e15c71a` | 20.070.308 |
| Atual (mtime 25/09 23:08) | `abaa85a09dc28c6a9d78b74580ec30afa8cdd68bc5ad3a494e45879041bf47a0` | 22.260.432 |

## Por que isto não é regressão causada pela revisão de fidelidade

- As edições desta sessão foram exclusivamente em `artwork.tsx` (CopilotoPack), `panel-data.ts`
  (bloco do copiloto e coluna direita) e `build_panel.py` (raio dos mostradores do copiloto).
- Os arquivos divergentes têm mtime de 24–25/09, anteriores a esta sessão.
- O diff de `ModelCanvas.tsx` contra a cópia de baseline mostra uma **melhoria deliberada nos rótulos**
  do modelo 3D: projeção em pixels (tamanho constante ao orbitar) e supressão de etiquetas sobrepostas.
  É evolução legítima do módulo 3D, não dano.
- O GLB atual é coerente e completo (119 nós, 9 camadas, componentes nomeados), apenas mais recente.

## Falha de verificação que isto expõe

`verify-assets.mjs` compara o GLB contra o **próprio manifest ao lado dele**. Como ambos foram
regravados no mesmo instante, a checagem "GLB aprovado intacto" passou mesmo com o GLB trocado.
Uma verificação de imutabilidade precisa comparar contra um hash externo fixo, não contra um
manifest que o mesmo processo reescreve.

## Encaminhamento (requer decisão humana — nenhum arquivo do avião foi alterado)

1. Se as mudanças de 24–25/09 no módulo 3D são desejadas: **atualizar o baseline** de hashes e o
   hash de referência do GLB, registrando a nova versão como aprovada.
2. Se não são desejadas: restaurar a partir da origem correta — **não** a partir de cópias temporárias.
3. Em qualquer caso: corrigir `verify-assets.mjs` para ancorar o GLB num hash externo.

Deliberadamente **não restaurei nem regravei** nada do avião, para não desfazer trabalho legítimo.
