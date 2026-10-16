# Trabalho diferido

- source_spec: `/Users/andrecardia/Github/PA-34/_bmad-output/implementation-artifacts/spec-melhoria-visual-modulo-3d.md`
  summary: Incorporar as figuras originais de performance e os cartões/figuras de emergency checklist citados nas fontes.
  evidence: `src/data/performance.md` informa que os gráficos das páginas 27–32 não possuem transcrição numérica, e `src/data/emergencias.json` referencia cartões/figuras de páginas do SOP que não estão disponíveis como assets nesta aplicação; reproduzir esses materiais sem os arquivos primários criaria conteúdo técnico não verificável.
  decision: Fechado como fora de escopo — sem fontes primárias (scans) disponíveis para reproduzir as figuras. Decisão do usuário em 2026-09-27.

- source_spec: `/Users/andrecardia/Github/PA-34/_bmad-output/implementation-artifacts/spec-melhoria-visual-modulo-3d.md`
  summary: Adicionar smoke tests de navegador para renderização das rotas, deep-links, Markdown, fallback WebGL e movimento reduzido.
  evidence: O projeto não possui framework de browser test nem dependência Playwright/Cypress instalada; `npm run verify` cobre contratos de fonte/build por inspeção estática, enquanto a validação DOM real permanece no checklist manual e requer um navegador automatizado disponível.
  decision: Resolvido em 2026-10-05 — Playwright em work-modulo-3d (npm --prefix work-modulo-3d run test:e2e): rotas, deep-links, Markdown, fallback sem WebGL e movimento reduzido. Ver work-modulo-3d/tests/README.md.

- source_spec: `/Users/andrecardia/Github/PA-34/_bmad-output/implementation-artifacts/spec-restauracao-graficos-originais-modulo-3d.md`
  summary: Adicionar smoke tests de navegador para verificar as rotas gráficas restauradas, deep-links, fallback WebGL/reduced-motion e carregamento visual dos assets.
  evidence: A restauração foi validada por build, contratos de componentes e existência dos assets; ainda não há Playwright/Cypress ou runner DOM no projeto para exercitar essas ramificações em navegador.
  decision: Resolvido em 2026-10-05 — Playwright em work-modulo-3d (npm --prefix work-modulo-3d run test:e2e): rotas, deep-links, Markdown, fallback sem WebGL e movimento reduzido. Ver work-modulo-3d/tests/README.md.

- source_spec: `/Users/andrecardia/Github/PA-34/_bmad-output/implementation-artifacts/spec-restauracao-graficos-originais-modulo-3d.md`
  summary: Revisar URLs root-absolute para uma eventual implantação em subcaminho.
  evidence: O shell usa `base: './'`, enquanto alguns assets históricos usam URLs iniciadas por `/`; não há requisito ou implantação em subpasta demonstrada nesta restauração, portanto a correção deve ser feita junto da configuração de deploy.

- source_spec: `/Users/andrecardia/Github/PA-34/_bmad-output/implementation-artifacts/spec-restauracao-graficos-originais-modulo-3d.md`
  summary: Harmonizar divergências preexistentes de unidades e valores entre JSONs, Markdown e diagramas técnicos.
  evidence: As divergências de ocupantes, kgf/kg, faixas de vácuo e conversões de performance já estão nas fontes canônicas antes da restauração; corrigir sem decisão operacional poderia alterar conteúdo do Seneca I.
  decision: Fechado — manter os valores/dados originais como estão; nenhuma harmonização será feita. Decisão do usuário em 2026-09-27.

- source_spec: `/Users/andrecardia/Github/PA-34/_bmad-output/implementation-artifacts/spec-restauracao-graficos-originais-modulo-3d.md`
  summary: Atualizar README e metadados genéricos do scaffold Vite.
  evidence: README e nome/versão do package são pré-existentes e não afetam os gráficos restaurados nem a execução da aplicação; ficam para uma tarefa de higiene do projeto.

- source_spec: `/Users/andrecardia/Github/PA-34/_bmad-output/implementation-artifacts/spec-integracao-modelo-blender-modelo-3d.md`
  summary: Automatizar a cobertura de nós, camadas, Draco e seleção do GLB Blender em um runner de navegador.
  evidence: A rota e os toggles foram conferidos manualmente via navegador local, mas o projeto ainda não possui Playwright/Cypress ou runner DOM persistente para transformar essa verificação em teste automatizado.

- source_spec: `/Users/andrecardia/Github/PA-34/_bmad-output/implementation-artifacts/spec-integracao-modelo-blender-modelo-3d.md`
  summary: Harmonizar as regras React Compiler/refs do módulo 3D e obter lint limpo nos componentes R3F.
  evidence: O lint direcionado ainda acusa padrões legados em `SenecaTechModel.tsx` e `Modelo3D.tsx` que já existiam antes desta integração; corrigi apenas os problemas introduzidos no classificador sem ampliar a refatoração.

- source_spec: `/Users/andrecardia/Github/PA-34/_bmad-output/implementation-artifacts/spec-integracao-modelo-blender-modelo-3d.md`
  summary: Tornar os assets root-absolute do módulo 3D compatíveis com implantação em subcaminho.
  evidence: `vite.config.ts` e vários assets históricos já usam URLs iniciadas por `/`; não há implantação em subpasta demonstrada nesta entrega.

- source_spec: `_bmad-output/implementation-artifacts/spec-camadas-completas-blender.md`
  summary: Corrigir gestão de foco, trap e retorno de foco do painel modal de camadas em dispositivos móveis.
  evidence: A implementação preexistente do painel em Modelo3D.tsx declara aria-modal sem o tratamento de foco já disponível no Drawer; a troca de geometria não criou esse painel. Revisão independente B7 identificou o impacto no uso por teclado e leitor de tela.
  decision: Resolvido em 2026-10-15 — hook `src/hooks/useDialogFocus.ts` (foco inicial, trap de Tab/Shift+Tab, retorno ao botão CAMADAS) usado pelo sheet e pelo Drawer; Esc fecha o sheet antes de desfazer o isolamento. Ver `_bmad-output/implementation-artifacts/spec-acessibilidade-painel-camadas.md` e `work-modulo-3d/tests/e2e/painel-camadas.spec.ts`.

- source_spec: `_bmad-output/implementation-artifacts/spec-camadas-completas-blender.md`
  summary: Corrigir controles aninhados e propagação de Enter/Espaço no LayerRail preexistente.
  evidence: H5 da retomada: botão filho dentro de div role=button aciona também o handler de teclado do pai; painel não foi introduzido pela migração Blender.
  decision: Resolvido em 2026-10-15 — a linha virou `li` sem foco (clique e duplo-clique do mouse mantidos) com dois botões reais, isolar e olho, ambos com `aria-pressed`; Enter/Espaço no olho alterna uma única vez. Ver `_bmad-output/implementation-artifacts/spec-acessibilidade-painel-camadas.md` e `work-modulo-3d/tests/e2e/painel-camadas.spec.ts`.

- source_spec: `_bmad-output/implementation-artifacts/spec-camadas-completas-blender.md`
  summary: Ajustar o rótulo preexistente ISOLAR COMPONENTE para indicar isolamento da camada.
  evidence: H6 da retomada: ComponentDrawer passa apenas camadaId ao callback; SenecaTechModel reduz as outras camadas, não os componentes irmãos.
  decision: Resolvido em 2026-10-15 — botão renomeado para `ISOLAR CAMADA` / `SAIR DO ISOLADO (ESC)` (decisão do usuário); roteiros CDP atualizados. Ver `_bmad-output/implementation-artifacts/spec-acessibilidade-painel-camadas.md` e `work-modulo-3d/tests/e2e/painel-camadas.spec.ts`.

- source_spec: `_bmad-output/implementation-artifacts/spec-camadas-completas-blender.md`
  summary: Ocultar ou desabilitar isolamento do drawer no modo estático preexistente.
  evidence: H7 da retomada: ramo staticReason passa callback vazio à ação visível, que não produz efeito sem canvas.
  decision: Resolvido em 2026-10-15 — `onIsolate` tornou-se opcional e o ramo estático não o passa; o botão é ocultado (decisão do usuário). Ver `_bmad-output/implementation-artifacts/spec-acessibilidade-painel-camadas.md` e `work-modulo-3d/tests/e2e/painel-camadas.spec.ts`.

- source_spec: `_bmad-output/implementation-artifacts/spec-restabelecer-site-3d-aprovado.md`
  summary: Atualizar o mapa histórico e as instruções do projeto para refletir a aplicação atualmente integrada em work-modulo-3d.
  evidence: docs/project-map.md ainda descreve modelo procedural e cockpit provisório, embora a aplicação tenha GLB aprovado e painel completo; execução correta e verificação de identidade foram documentadas em _bmad-output/visual-review/restabelecimento-3d/README.md nesta correção.
  decision: Resolvido em 2026-10-05 — AGENTS.md e docs/project-map.md atualizados via bmad-project-context refresh, aprovados pelo usuário.

- source_spec: `_bmad-output/implementation-artifacts/spec-acessibilidade-painel-camadas.md`
  summary: Bloquear atalhos globais 1–9/E/X/R do módulo 3D enquanto a ficha ou o sheet de camadas estiver aberto (ou tornar o fundo `inert`).
  evidence: Revisão do painel: com o foco preso num diálogo `aria-modal`, digitar "3" ainda alterna uma camada atrás dele; comportamento anterior a esta mudança.

- source_spec: `_bmad-output/implementation-artifacts/spec-acessibilidade-painel-camadas.md`
  summary: Devolver o foco a um alvo útil (canvas ou rail) quando a ficha foi aberta por clique no canvas WebGL.
  evidence: O elemento ativo nesse caso é `body`, então fechar a ficha leva o leitor de tela ao topo; o Drawer original já se comportava assim.

- source_spec: `/Users/andrecardia/Github/PA-34/_bmad-output/implementation-artifacts/spec-painel-fiel-prflm.md`
  summary: Alinhar as fichas `giro_direcional`, `indicador_vor_2_gs`, `dme`, `adf_receptor` e a operação de `navcom_1` aos equipamentos desenhados no painel PR-FLM.
  evidence: A arte nova mostra HSI/DG quadrado, CDI do GNS e unidades modernas, mas `cockpit_instruments.json` ainda descreve giro a vácuo, NAV 2 separado e King KN 64/KR 85; `navcom_1.operacao` não explica mais a sintonia COM/NAV. Mudar o texto altera dados técnicos de `src/data/` e depende de decisão do usuário.

- source_spec: `/Users/andrecardia/Github/PA-34/_bmad-output/implementation-artifacts/spec-painel-fiel-prflm.md`
  summary: Fazer `projection-check` medir a união das peças visíveis de cada ID, e não só o corpo construído a partir do próprio hotspot.
  evidence: Os corpos medidos saem do `x/y/w/h` do hotspot, então o erro abaixo de 0,001 é garantido por construção; botões, alavancas e anéis de legenda nunca são comparados com o hotspot.

- source_spec: `/Users/andrecardia/Github/PA-34/_bmad-output/implementation-artifacts/spec-painel-fiel-prflm.md`
  summary: Rodar no CI as verificações do pipeline do cockpit que não dependem de Blender (mapa idêntico à fonte e fingerprints do manifesto).
  evidence: `verify-assets.mjs` só roda manualmente; mudar `panel-data.ts` sem regenerar o render mantém o e2e verde com hotspots desalinhados do raster.
