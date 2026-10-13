# Evidências — melhoria do painel 2D do Seneca I

## Comparação visual

| Largura | Antes | Depois |
| --- | --- | --- |
| 1440 px | [antes-1440.png](antes-1440.png) | [depois-1440-noite.png](depois-1440-noite.png) · [depois-1440-dia.png](depois-1440-dia.png) |
| 768 px | [antes-768.png](antes-768.png) | [depois-768.png](depois-768.png) |
| 390 px | [antes-390.png](antes-390.png) | [depois-390.png](depois-390.png) |

As capturas finais mostram a silhueta superior curva, chapa grafite, faixa inferior bege, aviônicos centrais, instrumentos do motor junto à faixa e pedestal central com pares de manetes pretas, azuis e vermelhas. O enquadramento de 390 px inicia no six-pack a 160%; o restante permanece acessível por pan e zoom.

## Verificações

- [verificacao-navegador.json](verificacao-navegador.json) — Chrome headless aprovou 56 hotspots únicos e rotulados; hit-testing real em controles adjacentes; seleção por clique, Enter, Espaço, busca e link direto; contratos visuais; filtro MOTOR; tour e spotlight; zoom/reset; centro e pan em 390 px; miniaturas; modo diurno; movimento reduzido; larguras 390, 768 e 1440 px.
- [verificacao-contratos.json](verificacao-contratos.json) — gerado pelo mesmo verificador a partir das formas renderizadas: 56 IDs únicos, geometrias válidas e nenhuma interseção entre áreas clicáveis expandidas.
- [build.log](build.log) — `npm --prefix app run build` concluído; permanece apenas o aviso de chunks maiores que 500 kB.
- [lint.log](lint.log) — `npm --prefix app run lint` continua falhando globalmente com 54 erros e 1 aviso já existentes.
- [verificacao-lint-alteracoes.json](verificacao-lint-alteracoes.json) — comparação das quatro fontes alteradas antes/depois por severidade e regra; nenhum problema novo.
- [verificar-cockpit.mjs](verificar-cockpit.mjs) — automação reproduzível via Chrome DevTools Protocol.

### Reproduzir a verificação

1. Gere e sirva a aplicação: `npm --prefix app run build` e, em outro terminal, `npm --prefix app run preview -- --host 127.0.0.1 --port 4175`.
2. Execute: `node _bmad-output/visual-review/painel-2d/verificar-cockpit.mjs`.
3. Para outra URL ou navegador Chromium, defina `PA34_URL="http://host:porta/cockpit"` e/ou `CHROME_PATH="/caminho/para/chrome"` antes do comando. No macOS, o caminho padrão do Google Chrome já é usado.

## Limitações e risco residual

- O `package.json` não oferece script `test`; build e lint não foram tratados como testes automatizados.
- `app/node_modules` não existia e `npm --prefix app ci` falhou porque o espelho configurado estava inacessível. As verificações reutilizaram temporariamente `work-modulo-3d/node_modules`; os dois `package-lock.json` são idênticos, e o link temporário foi removido ao final.
- Os anexos `painel-seneca1.jpeg` e `painel-seneca-1-2.png` citados na especificação não estavam presentes no workspace. A implementação segue a direção visual congelada no spec; a fidelidade fina às fotografias deve ser conferida por uma pessoa com os anexos originais.
- A representação permanece uma ilustração didática, não uma réplica certificada nem um simulador operacional.
