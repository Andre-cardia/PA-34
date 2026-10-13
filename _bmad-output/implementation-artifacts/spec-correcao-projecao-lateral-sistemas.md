---
title: 'Correção da projeção lateral do PA-34 em Sistemas'
type: 'bugfix'
created: '2026-09-23'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context:
  - /Users/andrecardia/Github/PA-34/AGENTS.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A vista lateral exibida no diagrama do trem de pouso em `work-modulo-3d/sistemas` é uma silhueta manual simplificada e não corresponde à aeronave PA-34 Seneca I mostrada na referência fornecida. Isso reduz a fidelidade visual e a confiança no manual técnico.

**Approach:** Substituir somente a camada de fuselagem/aeronave do diagrama por uma projeção lateral já existente e gerada a partir da geometria do modelo do projeto, preservando a animação das três pernas, portas, estados, controles, chips VLE/VLO, dados técnicos e acessibilidade do diagrama. A alteração ficará restrita a `work-modulo-3d/` e não editará `app/` nem os dados técnicos canônicos.

</frozen-after-approval>

## Implementation Notes

- `work-modulo-3d/src/components/sistemas/diagrams/GearDiagram.tsx` passou a reutilizar `TV.perfil` e `TV_EXTRAS` de `PA34ThreeViewData.ts`, preservando as pernas, portas, controles e chips específicos do trem.
- A projeção recebeu preenchimento escuro, animação de desenho, `pointerEvents="none"` para não bloquear os hotspots, origem de transformação explícita nas peças móveis e ativação por teclado nas pernas interativas.
- Validação visual concluída em `/sistemas#8-5` nos viewports 1440 px e 390 px; `app/` e os dados técnicos não foram alterados.
- `npm --prefix work-modulo-3d run verify` passou com smoke verification de 8 páginas; ESLint do componente passou. O Vite mantém apenas o aviso existente de chunks maiores que 500 kB.
- Após a revisão visual do usuário, a projeção foi normalizada horizontalmente (`scale(1.35 1)`) e os pivôs/portas foram reposicionados para que o trem de nariz e o trem principal coincidam com a escala e a posição do PA-34 de referência.

## Review Triage Log

- false — A projeção não ficou desalinhada com o solo; os prints finais mostram rodas e linha de solo coerentes após a transformação aplicada.
- false — As pernas animadas legadas permanecem visualmente alinhadas ao perfil PA-34 nos prints finais; `TV.perfil.trem` não foi sobreposto para evitar duplicação e preservar a animação existente.
- patch — O perfil não tinha preenchimento e permitia que pernas atravessassem a fuselagem; foi corrigido com camada escura preenchida e ordem de desenho preservada.
- patch — A origem de transformação SVG das pernas/portas não era explícita; foi corrigida com `transformBox: 'fill-box'`.
- patch — A nova projeção era estática; os paths passaram a manter o draw-on do diagrama com `motion.path` e `whileInView`.
- patch — O perfil poderia capturar cliques sobre as pernas; o grupo visual passou a usar `pointerEvents="none"`.
- patch — As pernas interativas não tinham ativação por teclado; foram adicionados `tabIndex` e tratamento de Enter/Espaço.
- patch — O estado textual do trem não era anunciado dinamicamente; o status passou a usar `aria-live="polite"`.
- low rejeitado — Os rótulos auxiliares do SVG ficam pequenos em mobile, mas não foram introduzidos pela correção e o conteúdo principal/chips continuam legíveis; uma versão alternativa de layout excederia o escopo deste bug visual.
- false — A especificação oneshot é intencionalmente mínima pelo gate de escopo; não há lacuna de critérios necessária para esta correção concluída.
- low rejeitado — A ausência de um gerador documentado para o artefato de projeções é uma questão preexistente de manutenção, fora do escopo e sem impacto no resultado desta correção.

