---
title: 'Refinar a qualidade visual do painel 2D integrado'
type: 'feature'
created: '2026-09-25'
status: 'done'
route: 'oneshot'
baseline_commit: 'NO_VCS'
review_loop_iteration: 0
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problema:** A primeira versão integrada do cockpit funciona, mas sua aparência ainda é genérica e excessivamente carregada de grade, rótulos e contornos de módulos; não transmite o cuidado, as proporções e os materiais do PA-34-200 vistos nas referências.

**Abordagem:** Refinar a ilustração SVG existente para dar precedência a silhueta, acabamento e mostradores analógicos, removendo distrações técnicas redundantes e tornando a hierarquia mais limpa. A referência é estética/organizacional: manter o Seneca I didático, sem inventar equipamentos ou conteúdo operacional.

**Sempre:** Alterar apenas o cockpit 2D em `work-modulo-3d/`; preservar os 56 IDs, conteúdo, áreas de toque, foco/teclado, busca, deep-links reativos, tour, filtros, pan/zoom, modo dia/noite e movimento reduzido. Preservar o comportamento mobile e as correções preexistentes de navegação e resize com zoom. Nenhuma alteração ao GLB, às camadas ou aos componentes/cenas 3D.

**Nunca:** Usar aparência de Seneca II como fonte técnica, adicionar aviônicos modernos, simplificar instrumentação válida ou sacrificar leitura/interação por decoração. Não introduzir dependências nem trocar a identidade visual do restante do site.

</frozen-after-approval>

## Implementation Notes

- Capturas de partida: `_bmad-output/visual-review/painel-2d/depois-1440-dia.png`, `depois-1440-noite.png`, `depois-390.png`. Problemas concretos: malha blueprint compete com o painel; 56 rótulos/callouts ciano em massa poluem os mostradores; módulos quadrados repetidos e bordas uniformes achatam a hierarquia; enquadramento mobile não explica o conjunto.
- Direção baseada nas referências anteriores do cockpit do Seneca I e no intento já validado em `spec-melhoria-painel-2d-seneca.md`: acabamento ilustrativo com silhueta curva, seis instrumentos principais evidentes, rádio central e pedestal bege reconhecível. Os três arquivos de desenho em `work-modulo-3d/src/components/cockpit/` vieram de `app/`; a página e `usePanZoom.ts` de destino têm correções próprias, preservar.
- Escopo reversível e sem APIs/dependências novas: refinamento de palco e rótulos em `CockpitPanel.tsx`, materiais/chapas/aparência dos instrumentos em `artwork.tsx`, somente ajustes de posição/tamanho necessários em `panel-data.ts`, e estado visual inicial em `pages/Cockpit.tsx` apenas se necessário.
- Implementação: `CockpitPanel.tsx` usa fundo radial discreto em vez da grade, exibe a chamada selecionada sozinha (ou todas quando solicitadas), e mantém todos os rótulos acessíveis no modo global; `Cockpit.tsx` começa com rótulos globais desligados; `artwork.tsx` suaviza os cartões, acrescenta chanfro e reflexo sutil no aro/vidro.
- Atualizado `verificar-cockpit.mjs` para aceitar `REVIEW_OUTPUT`, manter capturas anteriores separadas, conferir a lista exata dos 56 IDs, provar que zoom acima de 200% não força callouts, e salvar uma captura dedicada com todos os rótulos ligados.
- `npm --prefix work-modulo-3d run verify` aprovado após a edição: TS/build, manifesto do GLB, 68 componentes, 272 meshes/materiais, loaders e 8 páginas. Aviso existente de bundle maior que 500 kB.
- Teste headless em http://127.0.0.1:3000/cockpit aprovado em 1440/768/390: 56 IDs originais tabuláveis e rotulados, geometrias/hit targets sem colisão, filtros, clique real, `?i=`, busca, Enter/Espaço, drawer, tour, zoom/reset, miniaturas, centro mobile e movimento reduzido. Callouts: zero na abertura/zoom alto, um na seleção, 56 sob toggle. Evidências em `../visual-review/refinamento-painel-2d/README.md`.
- Fontes Blender e GLB não são destino desta mudança; o `verify` confirmou que o 3D aprovado segue carregando. Sem novas dependências, IDs ou alterações de conteúdo técnico.

## Review Triage Log

- R1 — low · patch: execução padrão do roteiro removia evidência anterior; `REVIEW_OUTPUT` agora separa os arquivos finais em `refinamento-painel-2d` sem apagar capturas prévias.
- R2 — medium · patch: zoom alto sobrepunha a preferência do usuário e mostrava 56 rótulos; toggle agora controla rótulos globais em qualquer zoom, com teste em 246%.
- R3 — low · patch: cartões de comando tinham borda dupla repetida; shell agora tem um aro único mais contido, enquanto as placas físicas agrupadoras permanecem distinguíveis.
- R4 — medium · patch: o contrato de testes cobria quantidade/unicidade, não identidade; verificador agora compara o conjunto com os 56 IDs originais.
- R5 — low · patch: aparência do modo global de rótulos carecia de evidência; captura própria gerada e inspecionada visualmente.
