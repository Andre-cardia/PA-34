<!-- bmad:context -->
<!-- Verificado em 2026-10-05 contra arquivos locais. SHA indisponível: repositório Git criado sem commits. Gerenciado por bmad-project-context; edições dentro deste bloco são substituídas no refresh. -->

## PA-34

Site técnico em português brasileiro sobre o PA34-200 Seneca I, em React, TypeScript, Vite e React Three Fiber.
O site integrado é work-modulo-3d/; app/ é a versão anterior, congelada.
Specs e trabalho diferido ficam em _bmad-output/implementation-artifacts/; o mapa está em docs/project-map.md.

## Política

- Manter Seneca I como aeronave-alvo. Não substituir dados técnicos por dados do Seneca II por causa da geometria 3D.
- Não alterar nem regenerar o modelo 3D feito no Blender (work-modulo-3d/blender/, public/models/pa34-camadas.glb e pa34-camadas.manifest.json), salvo pedido explícito; ajustes de apresentação vão em src/components/modelo3d/.
- Fazer todo trabalho novo em work-modulo-3d/. Não editar app/ salvo pedido explícito, e não copiar alterações entre as aplicações.
- Ao modificar ou redistribuir modelos GLB, preservar a proveniência registrada em work-modulo-3d/public/NOTICE-MODELO-3D.txt.

## Onde trabalhar

- Para localizar módulos, fontes, recursos ou animações, consultar docs/project-map.md.
- Para conteúdo técnico, editar work-modulo-3d/src/data/ e rastrear seus consumidores; content/ não é importado pelas aplicações.
- Ao alterar os Markdown de multimotor ou segurança, atualizar também components/multimotor/data.ts e components/seguranca/data.ts: há conteúdo copiado manualmente.
- Para animações, começar por src/components/Layout.tsx, components/home/, components/modelo3d/, hooks/ e src/index.css; o cockpit está em src/components/cockpit/.

## Executar e verificar

- Executar scripts com npm --prefix work-modulo-3d run <script>, nunca na raiz. Para demonstrar o site, não iniciar app/: seu 3D é antigo e já foi confundido com regressão.
- Não usar build ou verify como inspeção somente leitura: ambos executam tsc -b e Vite, gravando cache e dist/. verify:model apenas lê.
- verify exige Node >=22.18, porque importa helpers TypeScript diretamente.
- verify cobre contratos estáticos, integridade do GLB e loader. Não declarar interação ou visual aprovados a partir dele.
- test:e2e (Playwright, tests/e2e/) e o CI (.github/workflows/ci.yml) cobrem rotas, Markdown, deep-links e fallbacks; não cobrem a cena 3D real, que continua nos roteiros CDP abaixo. Importar test/expect de tests/support/fixtures.
- npm run lint tem erros pré-existentes de React Compiler/refs e é informativo no CI; não declarar lint limpo. O lint de tests/ e playwright.config.ts é bloqueante.
- Os roteiros scripts/verify-browser-*.mjs precisam de Chrome com CDP e usam APP_URL http://127.0.0.1:4173 por padrão, enquanto o servidor dev usa a porta 3000: passar APP_URL e CDP_PORT explicitamente, conforme work-modulo-3d/blender/README.md.

## Contratos entre módulos

- Ao alterar IDs, conferir JSONs técnicos, seneca-node-map.json, manifesto do GLB, busca global, mapas do cockpit, config.ts do 3D e links ?i= e ?camada=&c=.
- Ao alterar o carregamento do GLB, conferir a apresentação inicial e o módulo 3D: ambos usam components/modelo3d/glb.tsx.
- Não editar manualmente src/components/assets/PA34ThreeViewData.ts. Nenhum gerador foi localizado; estabelecê-lo antes de atualizar as projeções.
- Ao melhorar animações, preservar movimento reduzido, fallback sem WebGL, o parâmetro force3d e a pausa do canvas inicial fora da área visível.

<!-- /bmad:context -->
