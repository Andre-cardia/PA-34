# Site corrigido: modelo 3D aprovado e cockpit novo

## Aplicação e execução corretas

Nesta entrega, o site integrado está em **`work-modulo-3d/`**. `app/` guarda o redesenho original do cockpit, mas seu módulo 3D é antigo: não iniciar essa pasta para demonstrar o conjunto atualizado.

```bash
npm --prefix work-modulo-3d run dev -- --host 127.0.0.1 --port 3000 --strictPort
```

- Modelo aprovado: http://127.0.0.1:3000/modelo-3d
- Painel novo: http://127.0.0.1:3000/cockpit

A causa era o servidor apontar para `app/`, não perda dos arquivos 3D. As 22 fontes previamente validadas e o GLB permanecem idênticos aos hashes aprovados. GLB servido por HTTP: `11776870db30eca87b4fefc1060315b245c3df1ccff37975c11aaa643e15c71a`.

## Correção de código limitada

Migrados somente `artwork.tsx`, `panel-data.ts` e `CockpitPanel.tsx` para o cockpit de `work-modulo-3d/`; em sua página `Cockpit.tsx`, alterado apenas o centro mobile. Preservados `centeredId`, limpeza de seleção por URL, sincronização de deep-link e ajuste de pan/zoom após resize. Nenhuma fonte, geometria, material ou dado técnico 3D alterado.

## Verificações executadas

- `npm --prefix work-modulo-3d run verify`: passou build, GLB/manifesto/dist, 39 negativos, loader real, foco e smoke checks.
- [report.json](report.json): navegador com nove camadas, 68 componentes, 272 meshes, explosão/recomposição, raio-X, 1440/768/390 e fallbacks. Nenhuma exceção inesperada; falha de ativo induzida é esperada.
- [integracao.json](integracao.json): hashes das 22 fontes, hash do GLB servido, home, navegação SPA 3D → cockpit → 3D, troca e remoção de `?i=`, foco e resize sem reload.
- [01-montado.png](01-montado.png): captura do modelo aprovado no servidor corrigido.
- [Cockpit](../painel-2d/verificacao-navegador.json): painel novo e interações passaram na mesma origem 3000; ensaio reconhece nomes por `aria-labelledby` e `aria-label`.

### Reproduzir

Com a aplicação acima e Chrome de teste em CDP 9338:

```bash
APP_URL=http://127.0.0.1:3000 CDP_PORT=9338 REVIEW_OUTPUT=_bmad-output/visual-review/restabelecimento-3d node work-modulo-3d/scripts/verify-browser-acceptance.mjs
node _bmad-output/visual-review/restabelecimento-3d/verificar-integracao.mjs
PA34_URL=http://127.0.0.1:3000/cockpit node _bmad-output/visual-review/painel-2d/verificar-cockpit.mjs
```

Limitações: aviso conhecido de chunks >500 kB; o mapa histórico do projeto precisa de atualização separada. Não há Git nem commit. O servidor de desenvolvimento é local e precisa ser reiniciado com o comando correto após encerramento do processo.
