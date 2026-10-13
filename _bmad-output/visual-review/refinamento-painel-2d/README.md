# Refinamento visual do cockpit 2D

**Endereço integrado:** http://127.0.0.1:3000/cockpit

## O que mudou

- Removida a grade blueprint atrás do painel; agora o palco usa uma luz radial de estúdio discreta.
- A primeira vista não é mais coberta pelos 56 callouts. Rótulos globais continuam disponíveis pela ação **Rótulos**; ao selecionar um instrumento aparece apenas a chamada correspondente.
- Reduzidas as molduras que separavam o six-pack e o painel do copiloto em cartões. Chapas e módulos receberam chanfros/sombras mais delicados, aro iluminado e reflexo sutil no vidro dos instrumentos.
- Mantidos os mesmos dados, geometria de hotspots e interações do PA-34 Seneca I. Sem alterações ao modelo ou à cena 3D.

## Evidências

- [depois-1440-dia.png](depois-1440-dia.png), [depois-1440-noite.png](depois-1440-noite.png), [depois-1440-rotulos.png](depois-1440-rotulos.png), [depois-768.png](depois-768.png), [depois-390.png](depois-390.png): capturas atualizadas; a captura de rótulos permite conferir o modo completo explicitamente ligado.
- [verificacao-navegador.json](verificacao-navegador.json): aprovado; 56 hotspots únicos e acessíveis, zero colisões, callouts ocultos por padrão, um callout na seleção, alternância dos 56 rótulos, cliques reais, navegação por Enter/Espaço, busca, miniaturas, filtros, tour, zoom/reset, vistas móveis e movimento reduzido.
- [verificacao-contratos.json](verificacao-contratos.json): geometrias positivas e interseções verificadas.

`npm --prefix work-modulo-3d run verify` passou build, tipo, manifesto/blend e smoke checks. Há apenas o aviso conhecido de bundle JavaScript maior que 500 kB.

### Reproduzir verificações

```bash
npm --prefix work-modulo-3d run verify
PA34_URL=http://127.0.0.1:3000/cockpit REVIEW_OUTPUT=_bmad-output/visual-review/refinamento-painel-2d node _bmad-output/visual-review/painel-2d/verificar-cockpit.mjs
```
