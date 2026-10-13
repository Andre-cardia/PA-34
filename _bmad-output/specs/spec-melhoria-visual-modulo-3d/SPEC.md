---
id: SPEC-melhoria-visual-modulo-3d
companions:
  - visual-production.md
  - ../../../docs/project-map.md
sources: []
---

> **Contrato canônico.** Esta SPEC e os arquivos em `companions:` formam o contrato completo e validado do que construir, testar e demonstrar.

# Melhoria visual do módulo 3D

## Why

Elevar a qualidade visual e a credibilidade do site técnico do PA34-200 Seneca I. A experiência atual combina páginas visualmente elaboradas com oito rotas ainda provisórias, imagens de procedência visual inadequada e diagramas rasterizados; a entrega deve transformar esse conjunto em um produto técnico coerente sem alterar seu conteúdo aeronáutico.

## Capabilities

- **CAP-1**
  - **intent:** O visitante pode consultar imagens e renders nítidos, coerentes e adequados ao conteúdo técnico em todas as rotas da aplicação.
  - **success:** Cada imagem de aeronave aprovada representa o Seneca I, não exibe marcas d’água, mantém nitidez nos layouts móvel e desktop e possui alternativa textual quando transmite informação.

- **CAP-2**
  - **intent:** O visitante recebe movimento que orienta navegação, hierarquia e interação sem competir com o estudo do conteúdo.
  - **success:** Transições, revelações, indicadores e cenas 3D permanecem fluidos durante a demonstração, encerram ou pausam quando não são úteis e oferecem um estado final equivalente com movimento reduzido.

- **CAP-3**
  - **intent:** O visitante pode compreender sistemas, relações e sequências por diagramas técnicos visualmente consistentes.
  - **success:** Cada diagrama incluído permanece legível em desktop e celular, diferencia elementos e fluxos sem depender apenas de cor e preserva o significado da fonte técnica.

- **CAP-4**
  - **intent:** O visitante percebe imagens, animações, diagramas e componentes como partes de uma única linguagem visual técnica.
  - **success:** As dez rotas principais passam por revisão comparativa e usam de forma consistente a identidade escura HUD/blueprint, a hierarquia tipográfica, as cores semânticas e os padrões de interação definidos no companion.

- **CAP-5**
  - **intent:** O visitante pode acessar conteúdo real nas rotas que hoje exibem apenas `PageStub`.
  - **success:** Cockpit, Especificações, Performance, Sistemas, Procedimentos, Multimotor, Emergências e Segurança deixam de exibir a mensagem de módulo em montagem e apresentam o conteúdo existente em `src/data/`, com os recursos visuais pertinentes e sem criação editorial nova.

## Constraints

- Alterar somente `work-modulo-3d/`; `app/` não recebe mudanças por consequência desta especificação.
- Manter o PA34-200 Seneca I como aeronave-alvo; geometria ou dados do Seneca II não podem substituir informações do Seneca I.
- Preservar o conteúdo técnico e editorial existente em português brasileiro, inclusive IDs e vínculos consumidos pela aplicação.
- Manter React, TypeScript, Vite, React Three Fiber e a arquitetura atual; a melhoria não autoriza migração de stack.
- Produzir as novas imagens estáticas de aeronave com o MCP Blender a partir de uma recriação da geometria procedural atual, validada contra referências do Seneca I.
- Preservar movimento reduzido, fallback sem WebGL e pausa do canvas inicial fora da área visível.
- Preservar e refinar a identidade escura, técnica, HUD/blueprint em ciano, conforme `visual-production.md`.

## Non-goals

- Reescrever, ampliar ou arbitrar o conteúdo aeronáutico e editorial.
- Trocar frameworks, refazer a arquitetura da aplicação ou sincronizar automaticamente as duas aplicações do repositório.

## Success signal

Uma demonstração comparativa antes/depois das dez rotas principais, em viewport desktop e móvel, é aprovada quando não restam páginas provisórias, as imagens estão nítidas e sem marcas d’água, os diagramas podem ser lidos sem ambiguidade e as animações mantêm orientação e fluidez. A mesma demonstração deve completar-se com movimento reduzido e sem WebGL, sem perda de conteúdo ou bloqueio da navegação.

## Assumptions

- O conteúdo já presente em `work-modulo-3d/src/data/` é suficiente para estruturar as oito páginas provisórias sem criação editorial nova.

## Open Questions

- Quais navegadores, dispositivos físicos e limiares quantitativos definirão a ausência de regressão de desempenho?
