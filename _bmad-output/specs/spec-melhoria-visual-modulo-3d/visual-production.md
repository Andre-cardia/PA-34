# Contrato de produção visual

## Base verificada

- Rotas com experiência implementada: Home e Modelo 3D.
- Rotas ainda baseadas em `PageStub`: Cockpit, Especificações, Performance, Sistemas, Procedimentos, Multimotor, Emergências e Segurança.
- Imagens estáticas atuais: `hangar-ambience.jpg`, `cockpit-ref.jpg`, `sop-electrical-schematic.png`, `sop-fuel-schematic.png`, `sop-baggage-key.png` e `grain-noise.png`.
- `hangar-ambience.jpg` e `cockpit-ref.jpg` exibem marca d’água de geração por IA e não são referência técnica autorizada.
- Os esquemas elétrico e de combustível são recortes rasterizados do SOP; seu significado deve ser preservado ao redesenhar.
- A identidade atual usa fundo escuro, ciano, tipografia técnica, grids blueprint, Framer Motion e cenas React Three Fiber.

## Padrões por mídia

| Mídia | Direção | Aceitação |
| --- | --- | --- |
| Imagens e renders | Substituir imagens de baixa credibilidade por composições próprias, responsivas e compatíveis com a identidade técnica. | Sem marcas d’água; representação identificável como Seneca I; enquadramento útil em desktop e celular; texto alternativo quando informativa. |
| Animações de interface | Usar movimento para entrada, continuidade, foco, estado e resposta à interação. | Sem conteúdo disponível apenas durante o movimento; sem ciclos decorativos persistentes fora de vista; teclado e toque não dependem de hover. |
| Animações 3D | Preservar manipulação, foco, explosão, isolamento e feedback espacial do modelo procedural. | Canvas pausa quando apropriado; fallback sem WebGL mantém acesso ao conteúdo; movimento reduzido evita autorrotação e sequências não essenciais. |
| Diagramas | Redesenhar esquemas e fluxos com hierarquia, legenda, linhas e cores semânticas consistentes. | Rótulos legíveis em viewport móvel; relações compreensíveis sem depender só de cor; conteúdo técnico conferido contra a fonte local. |
| Sistema visual | Refinar, sem substituir, a linguagem HUD/blueprint existente. | Tokens e padrões iguais entre páginas; contraste e foco visível preservados; nenhum recurso parece pertencer a outro produto. |

## Produção de imagens com Blender

1. Recriar no Blender a geometria procedural usada por `work-modulo-3d/`, sem importar como verdade técnica o GLB de Seneca II existente em `app/`.
2. Validar silhueta, proporções visíveis e configuração externa contra referências identificadas como Seneca I antes dos renders finais.
3. Produzir os renders por meio do MCP Blender, com câmeras, iluminação e fundos reutilizáveis para manter consistência entre páginas.
4. Exportar apenas os tamanhos e formatos necessários à aplicação; manter a fonte Blender e registrar origem e data dos renders.
5. Não alterar dados técnicos para acomodar a geometria. Divergências visuais permanecem explícitas até validação.

## Cobertura mínima por rota

| Rota | Entrega visual mínima |
| --- | --- |
| Home | Imagem principal própria, cena procedural coerente e animações de entrada/rolagem refinadas. |
| Modelo 3D | Estados de seleção, foco, camadas e fallback estático visualmente consistentes. |
| Cockpit | Painel visual navegável ou representação equivalente ligada aos dados existentes dos instrumentos. |
| Especificações | Vistas técnicas, dimensões ou instrumentos gráficos necessários para contextualizar os dados existentes. |
| Performance | Tabelas e gráficos responsivos que preservem unidades, escalas e valores. |
| Sistemas | Diagramas consistentes para os sistemas cobertos pelos dados, incluindo combustível e elétrico quando aplicável. |
| Procedimentos | Sequências e estados de checklist legíveis, com movimento apenas como apoio. |
| Multimotor | Diagramas ou ilustrações que apoiem os conceitos existentes sem introduzir novos dados aeronáuticos. |
| Emergências | Fluxos e itens de memória com hierarquia inequívoca e sem animação que atrase acesso. |
| Segurança | Chamadas visuais e estrutura editorial coerentes com o restante da aplicação. |

## Demonstração de aceitação

- Capturar o mesmo conjunto de páginas antes e depois em viewport desktop e móvel.
- Verificar navegação, legibilidade, carregamento, seleção e estados interativos nas dez rotas.
- Repetir o percurso com `prefers-reduced-motion: reduce`.
- Repetir o acesso ao conteúdo com WebGL indisponível.
- Confirmar que imagens, diagramas, números, unidades, IDs e vínculos continuam coerentes com os dados locais.
