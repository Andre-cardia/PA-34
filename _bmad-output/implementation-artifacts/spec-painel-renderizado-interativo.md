---
title: 'Painel pré-renderizado com instrumentos interativos'
type: 'feature'
created: '2026-09-25'
status: 'done'
route: 'dispatch'
baseline_commit: 'NO_VCS'
review_loop_iteration: 0
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problema:** Refinamentos no SVG não atingiram a qualidade visual desejada. O usuário escolheu explicitamente uma imagem renderizada com áreas clicáveis, em vez de um cockpit 3D em tempo real.

**Abordagem:** Criar uma cena independente do painel no Blender, renderizar versões diurna e noturna com materiais, volume e iluminação, e usar as imagens como fundo da interação existente. Não basta converter o SVG atual em PNG: a melhoria deve ser visível nos aros, vidro, comandos, chapa e profundidade. A apresentação continua didática, não certificada.

## Boundaries & Constraints

**Sempre:** Trabalhar em `work-modulo-3d/`. Preservar o Seneca I, os 56 IDs e conteúdo técnico, fichas, busca, teclado, foco, links reativos, tour, categorias, zoom/pan, dia/noite e movimento reduzido. Conservar fundo e hotspots no mesmo sistema de coordenadas. Renderizar o painel separadamente; avião, fontes Blender aprovadas, GLB e cenas 3D permanecem intactos. Manter fallback vetorial se as imagens falharem.

**Nunca:** Alterar o avião para gerar o painel, executar o gerador de camadas do avião, acrescentar aviônicos modernos ou usar Seneca II como autoridade técnica. Não usar uma foto ou mera captura do SVG como entrega principal. Não copiar automaticamente para `app/`, adicionar WebGL ao cockpit nem prometer simulação operacional.

## I/O & Edge-Case Matrix

| Cenário | Estado | Resultado esperado | Tratamento |
|---|---|---|---|
| Abertura | Imagens carregadas | Painel renderizado e hotspots alinhados | Sem contornos permanentes sobre os instrumentos |
| Falha/carregamento | Imagem indisponível | Arte vetorial mantém painel utilizável | Nada de fundo vazio ou interação perdida |
| Inspeção | Clique, teclado, busca ou `?i=` | Ficha e destaque corretos | Preservar sincronização reativa |
| Categorias/tour | Instrumentos filtrados ou parada ativa | Destaque e atenuação delimitados ao alvo | Não escurecer toda a imagem indiscriminadamente |
| Dia/noite | Troca durante uso | Mesmo alinhamento, iluminação diferente | Respeitar movimento reduzido |
| Tela estreita | Resize, pan ou zoom | Fundo e áreas clicáveis movem juntos | Todos os comandos continuam alcançáveis |

</frozen-after-approval>

## Code Map

- `work-modulo-3d/src/components/cockpit/panel-data.ts`: mapa canônico 1600×955, formas, rótulos, ordem e IDs; usar para calibrar câmera e centros, sem duplicação manual divergente.
- `work-modulo-3d/src/components/cockpit/CockpitPanel.tsx`: substituir apenas grupos de arte dia/noite por camada raster sob os hotspots; preservar máscara do tour e feedback.
- `work-modulo-3d/src/components/cockpit/artwork.tsx`: conservar fallback, definições e `MiniArt` vetorial das fichas/seções, incluindo animação de agulhas.
- `work-modulo-3d/src/components/cockpit/usePanZoom.ts`: transformação compartilhada; base mínima entre largura/1600 e altura/955, zoom 1–4. Não substituir suas correções de resize.
- `work-modulo-3d/src/pages/Cockpit.tsx`: seleção, modos e deep-links; preservar comportamento existente.
- `work-modulo-3d/blender/README.md`: documenta CLI `/Applications/Blender.app/Contents/MacOS/Blender`. `build_layers.py` altera ativos do avião: não executar.

## Tasks & Acceptance

**Execução:**
- [x] `work-modulo-3d/blender/cockpit/` — criar gerador reproduzível, mapa exportado e cena `.blend` exclusivos; definir câmera frontal calibrada, vidro, aros, acabamento e luzes.
- [x] `work-modulo-3d/public/cockpit-render/` — gerar duas imagens otimizadas com mesma proporção/câmera; registrar dimensões, pesos e origem. Alvo inicial 3200×1910, ajustável após inspeção de nitidez e custo; preservar masters fora de `public/`.
- [x] `work-modulo-3d/src/components/cockpit/RenderedPanel.tsx` — camada de imagens, carregamento/erro e recortes/máscaras para categorias/seleção; sem duplicar handlers.
- [x] `work-modulo-3d/src/components/cockpit/CockpitPanel.tsx` — integrar camada sob interação existente e manter fallback vetorial e miniaturas.
- [x] `_bmad-output/visual-review/painel-renderizado/` — registrar capturas e ensaios de matriz, identidade/alinhamento, falha de imagem, filtros e navegação; preservar baselines anteriores.

**Critérios de aceitação:**
- Dado o cockpit aberto, quando comparado à versão SVG, então a imagem evidencia espessura, sombras de contato, materiais diferenciados e aros/controles modelados, não só textura plana.
- Dados os 56 instrumentos, quando comparados ao mapa, então cada centro e área correspondem ao desenho renderizado sem deslocamentos; cliques reais amostrados distinguem vizinhos.
- Dados os arquivos 3D aprovados, quando concluída a entrega, então seus hashes permanecem iguais aos registros anteriores.
- Dados desktop e mobile, quando o usuário navega entre 3D e cockpit, então a imagem permanece acessível e as fichas e controles funcionam sem novo canvas WebGL no cockpit.

## Implementation Notes

- Cena independente em `work-modulo-3d/blender/cockpit/`, com texturas embarcadas e câmera ortográfica; publicação de dois WebPs 3200×1910, sem runtime WebGL adicional.
- Integração limitada a `RenderedPanel.tsx` e à camada de arte de `CockpitPanel.tsx`. `artwork.tsx`, `Cockpit.tsx`, `usePanZoom.ts`, dados técnicos e avião preservados.
- Auditoria independente: 22 fontes 3D e 28 arquivos de contratos/dados/home sem divergências; GLB servido em 3000 conserva SHA `11776870db30eca87b4fefc1060315b245c3df1ccff37975c11aaa643e15c71a`.
- `npm --prefix work-modulo-3d run verify` passou após os patches: TypeScript/Vite, 39 negativos GLB, runtime, foco e smoke. Mantido aviso preexistente de chunks maiores que 500 kB.

Matriz aferida em `_bmad-output/visual-review/painel-renderizado/verificacao-navegador.json` (64 verificações aprovadas, origem 3000):

| Linha aprovada | Evidência |
|---|---|
| Abertura | HTTP 200/decodificação dos dois modos, 56 IDs, geometria e mapeamento intrínseco/canônico, sem canvas nem fallback residual; capturas diurna/noturna inspecionadas. |
| Falha/carregamento | Fetch pausado com clique real, retomada sem perder seleção, falhas isoladas dia/noite mantendo arte e interação. |
| Inspeção | Cliques reais em vizinhos, teclado, busca, links reativos e miniaturas vetoriais. |
| Categorias/tour | IDs, formas e estilos exatos nos dois modos; seleção fora da categoria isenta; oito máscaras de paradas. |
| Dia/noite | Capturas dos dois modos e mapeamento comum; crossfade desprezível sob movimento reduzido. |
| Tela estreita | 1440/768/390, reset, zoom, pan, resize sem recarga e pinch touch real; retorno do 3D sem canvas residual. |

## Spec Change Log

## Review Triage Log

Primeira revisão: três camadas executadas; cada achado registrado antes do agrupamento.

| ID | Veredito | Evidência e encaminhamento |
|---|---|---|
| B1 | medium | A borda acolchoada cruza visualmente a parte superior do OAT; o corpo fica atrás do volume da borda. Patch: folga em profundidade, sem mover hotspot. |
| B2 | medium | Decal retangular recorta legendas maiores que a área imprimível, visível em magnetos/freio. Patch: limitar inscrições pela largura real disponível. |
| B3 | medium | verify-assets inicializa aprovado e finally grava mesmo após exceção. Patch: falha explícita no relatório e saída não zero; reproduzir arquivo ausente. |
| B4 | medium | Cleanup aguarda evento exit futuro mesmo se Chrome já encerrou; pipeline pode ficar suspenso após falha. Patch no ciclo de vida do conversor/verificador. |
| B5 | medium | Comando CDP sem prazo no conversor deixa promessa pendente se browser desconecta. Patch: prazo e rejeição dos pendentes. |
| B6 | medium | Converter masters antigos após editar fonte registra hashes atuais, não os usados no render. Patch: registrar impressões digitais na geração e compará-las na conversão. |
| B7 | medium | Projeção atual usa coordenada ideal calculada, não a posição do objeto Blender; não detecta desvio de geometria. Patch: aferir corpos reais dos 56 instrumentos e manter inspeção de imagem. |
| B8 | medium | Manifesto com lista vazia não valida nenhum WebP; dimensões são declaradas, não decodificadas nesse verificador. Patch: exigir par exato e conferir dimensões do container. |
| B9 | medium | Suíte persistida usa mouse em viewport estreito. Auditoria independente desta sessão já passou pinch touch real, mas está em /tmp. Patch: incorporar cobertura touch/resize na suíte persistida. |
| B10 | maybe-false | Decodificar os dois modos custa aproximadamente 49 MB, explicitamente documentados. Não há medição demonstrando falha ou lentidão; seriam necessários testes em aparelho de baixa memória. Impacto adicional presumido low: rejeitado, sem introduzir variantes/responsividade raster não justificadas por evidência. |
| E1 | medium | Mesmo defeito de B5: ausência de prazo/rejeição em desconexão. Agrupado no patch de ciclo de vida. |
| E2 | medium | Mesmo defeito de B4: listener tardio pode aguardar exit já emitido. Agrupado no patch de ciclo de vida. |
| E3 | medium | CHROME_PATH inexistente em reprodução dispara erro sem tratamento do subprocesso e perde cleanup. Patch de ciclo de vida, com caso negativo demonstrável. |
| E4 | medium | Mesmo defeito de B3: relatório pode contradizer falha de leitura/JSON. Agrupado no patch de relatório. |
| V1 | medium | Gap pré-verificado: alterar x/width de SVG image não muda CTM, portanto comparação de pontos idênticos não detecta deslocamento. Auditoria /tmp já verifica retângulo; patch para persistir essa proteção na suíte principal. |
| V2 | medium | Gap pré-verificado: contar 46 formas não detecta fillOpacity=0 nem formas incorretas. Patch: IDs, geometria e atenuação computada em ambos modos. |

Encaminhamento: patches locais sem nova superfície pública; preservar arquitetura, câmera/IDs e o avião. Nenhuma mudança de intenção ou de especificação é necessária.

Fechamento: B1/B2 resolvidos e conferidos visualmente; B3–B9, E1–E4 e V1/V2 corrigidos e verificados. As causas duplicadas mantêm seus registros individuais acima. O pipeline agora mede corpos reais e inscrições, encadeia fingerprints e falha explicitamente diante de dados/processos inválidos. O aceite final do agente principal passou: build/contratos, ativos, 64 verificações de navegador e 22 contraprovas do pipeline. Auditoria independente também passou após a versão definitiva. B10 rejeitado por impacto não demonstrado; nenhuma entrada deferida e nenhuma correção confirmada pendente. Limites de memória e aparelhos não ensaiados estão documentados. Diff final em `_bmad-output/visual-review/painel-renderizado-auditoria/alteracoes-finais.diff`; sem commit porque a pasta não possui Git.

## Design Notes

Intenção resolvida pela escolha explícita do usuário; sem efeitos irreversíveis. Não é alteração pequena: exige pipeline de geração, ativos e integração, portanto rota dispatch. Usar vista frontal ortográfica para impedir divergência entre perspectiva e hotspots; detalhes têm volume real, mas a apresentação final é uma imagem leve. Preservar miniaturas vetoriais nesta entrega. Referências anteriores orientam acabamento, não legitimam instrumentos inventados; não afirmar comparação direta com anexos indisponíveis.

## Verification

- Executar gerador novo via Blender background com `--python-exit-code 1`, sem abrir/salvar o arquivo do avião.
- `npm --prefix work-modulo-3d run verify`: build e contratos; não substitui ensaio no navegador.
- Reutilizar/adaptar verificador de cockpit com saída isolada: testar os 56 IDs, hit-testing, filtros, tour, miniaturas, teclado, zoom e 390/768/1440.
- Confirmar por HTTP o carregamento das imagens; bloquear cada imagem em ensaio controlado para verificar fallback. Inspecionar alinhamento em zoom e ambas as iluminações, peso dos recursos e ausência de erros inesperados.
- Comparar hashes de `_bmad-output/verificacao-final-retomada/fontes-sha256.json` e GLB aprovado; guardar relatório.
