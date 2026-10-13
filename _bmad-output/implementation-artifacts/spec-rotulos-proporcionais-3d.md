---
title: 'Rótulos proporcionais no módulo 3D'
type: 'bugfix'
created: '2026-09-25'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Corrigir os rótulos gigantes que encobrem a aeronave em `work-modulo-3d/`. Manter etiquetas compactas e legíveis, vinculadas aos componentes, sem alterar o modelo, dados técnicos, fichas, seleção ou controles de câmera.

</frozen-after-approval>

## Implementation Notes

- Causa: `ModelCanvas.tsx`, função `Labels`, usa `Html transform distanceFactor={11}`; a etiqueta participa da escala/perspectiva 3D apesar da fonte CSS pequena, e nomes inteiros não quebram linha.
- Usar projeção HTML em pixels, sem escala espacial; limitar largura com quebra de nomes e reduzir densidade máxima de doze para seis etiquetas. Preservar linhas-guia e cores das camadas.
- Alterações localizadas em `ModelCanvas.tsx` e `config.ts`; sem ações irreversíveis ou lacunas de intenção. Não alterar `app/`.
- Verificação: compilação/contratos existentes, medidas DOM em navegador em diferentes distâncias, screenshot e revisão independente. Git indisponível conforme inspeção desta sessão.
- Acrescentada supressão de etiquetas sobrepostas ou fora do canvas, priorizando a ordem de proximidade; permanecem até seis candidatas, sem alterar o catálogo/fichas.
- Novo `scripts/verify-browser-labels.mjs`: Chrome real em 1191px/390px, distâncias verificadas 6/18, fonte 10px, largura ≤156px, comparação de dimensões do mesmo componente, ausência de sobreposição visível e desligar/religar. Passou; screenshots inspecionados.
- Atualizado seletor de rótulos no teste de câmera para `data-model-label`, removendo dependência da classe nowrap antiga.
- `npm --prefix work-modulo-3d run verify` passou após alterações finais: build, contratos/39 negativos, runtime, foco e smoke. Persiste apenas aviso preexistente de chunks grandes.

## Review Triage Log

- medium → patch: teste não comprovava distância efetiva após resize; agora aguarda estabilização e confere distância real.
- medium → patch: fontSize computado não detectava escala ancestral; agora compara retângulos do mesmo ID perto/longe.
- medium → patch: dimensões válidas permitiam sobreposição/clipping; adicionada supressão no runtime, captura das quatro combinações, retângulos completos e verificação de colisão das etiquetas visíveis. Não é teste de oclusão por todos os painéis HUD.

