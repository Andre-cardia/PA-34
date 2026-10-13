# Verificação — painel pré-renderizado

Escopo exclusivo: `work-modulo-3d/`. Spec: `../../implementation-artifacts/spec-painel-renderizado-interativo.md`.

## Entrega

- Cena própria `../../../work-modulo-3d/blender/cockpit/painel-seneca-i.blend`, gerada do zero sem abrir/importar o avião. Chapa, vidro, aros, acabamento, caixas, fixadores e controles modelados em volume; a impressão reaproveita o conteúdo vetorial local.
- Dois WebPs 3200×1910: **420.598 bytes diurno**, **355.668 bytes noturno** (776.266 bytes no total). Masters PNG fora de `public/`. Origem e SHA-256 em `../../../work-modulo-3d/public/cockpit-render/manifest.json`.
- `RenderedPanel.tsx` substitui somente a arte do palco; os 56 hotspots, handlers, rótulos, máscara do tour, miniaturas e transformação pan/zoom foram conservados. Sem canvas/WebGL adicional.
- Fallback individual por imagem durante carregamento/falha. Reentrada SPA com recurso cacheado coberta por `Image.decode()`; evento SVG `load` sozinho deixou o fallback preso durante um ensaio e foi corrigido.

## Evidências reproduzíveis

- `verificacao-ativos.json`: comparação exata do mapa com TypeScript, projeção dos vértices avaliados de 56 corpos reais (erro máximo dos centros **0,0000588**, das extensões **0,0000840** unidade canônica), hashes dos arquivos gerados, 22 fontes 3D históricas, fonte Blender aprovada e GLB. Todos aprovados.
- `verificacao-navegador.json`: **64 verificações aprovadas, zero exceções JavaScript** na execução completa de `verificar-painel.mjs`, incluindo as etapas finais de carregamento e falha; `status: passed`, todos os `ok: true`.
- `negativos-pipeline.json`: 22 negativos controlados aprovados, em cópias temporárias, sem danificar ativos: Chrome ausente/encerramento precoce nos dois CLIs, deadline/desconexão CDP, arquivos/JSON/par de imagens/assinatura/dimensões/hashes inválidos e recusa de fontes/atlas/masters obsoletos. Reproduzir com `node work-modulo-3d/blender/cockpit/test-pipeline.mjs`.
- Build/contratos da implementação anterior (não reexecutado nesta correção focada): `npm --prefix work-modulo-3d run verify` aprovado, incluindo TypeScript/Vite, 39 casos negativos do GLB, runtime/material, foco e smoke. Log final em `verificacao-build.log`. Build não é apresentado como teste de interação.
- Lint do novo `RenderedPanel.tsx` aprovado. Lint de `CockpitPanel.tsx` acusa duas expressões preexistentes (`ref={pz.ref}`, `{...pz.handlers}`) pela regra `react-hooks/refs`; não houve alteração dessas expressões nem desativação da regra.

## Matriz coberta pelo ensaio de navegador

| Linha da spec | Cobertura |
|---|---|
| Abertura | HTTP 200, decodificação real 3200×1910, raster visível, fallback desmontado, 56 IDs; x/y/width/height/aspect-fit e mapeamento intrínseco→canônico→tela verificados nas duas imagens antes/depois de zoom/resize/pinch, além de CTM. |
| Falha/carregamento | Respostas de imagem pausadas com CDP Fetch; clique real durante a espera; retomada sem perder seleção. Bloqueio independente do WebP dia e noite, fallback visível e outra imagem pronta. |
| Inspeção | Cliques reais em altímetro, NAV/COM vizinhos e instrumentos de óleo; Enter/Espaço, busca, deep-links e mudança reativa de query; miniaturas vetoriais contidas. |
| Categorias/tour | IDs exatos, geometria e fill/opacidade computados de cada forma não-motor nos dois modos (não só contagem46); seleção isenta, oito paradas com máscaras alinhadas. |
| Dia/noite | Duas iluminações com mesma dimensão/câmera e alternância; movimento reduzido limita transição a no máximo 0,001 s. |
| Tela estreita | 1440/768/390; reset/zoom/arrasto e ida/volta3D com cache. Resize sem recarga comprovado por sentinela e pinch touch real de dois contatos fora dos hotspots em768/390. |

## Inspeção visual

Baseline anterior preservado: `../refinamento-painel-2d/depois-1440-dia.png`. O novo master evidencia sombra de contato das caixas, espessura das molduras, aros especulares, chapa com microtextura, vidro e pomos tridimensionais; não é uma captura do SVG como fundo principal. O atlas SVG não contém a chapa.

Comparar `1440-dia.png` / `1440-noite.png` com esse baseline. Capturas `*-inicial.png` preservam pulsos sugeridos preexistentes. As capturas desktop limpas são feitas após selecionar, fechar e recentrar, sem modificar a interface para esconder recursos. Filtro/tour e falhas possuem capturas próprias.

Na inspeção do atlas, tipografia das escalas foi recomposta para reduzir colisões preexistentes (ASI e instrumentos pequenos de motor), preservando valores/ângulos/arcos. Coordenadas periféricas ficam limitadas pela margem útil do vidro, inclusive ADF. Legendas de instrumentos especiais foram mantidas fora do horizonte. Isso não altera `artwork.tsx`, miniaturas ou conteúdo técnico.

## Limites e riscos

- Material didático, não certificado; nenhuma promessa de operação real. Mostradores principais estáticos, miniaturas animadas conservadas.
- Inscrições pequenas exigem zoom em telas estreitas. Não foram ensaiados aparelhos físicos de baixo custo, Safari ou Firefox.
- Imagens somam menos de 0,8 MB de download, mas duas superfícies RGBA decodificadas podem ocupar cerca de **49 MB**. Não é orçamento de desempenho certificado.
- Persistem avisos preexistentes de chunks JavaScript >500 kB e os dois diagnósticos de lint acima.
- O gerador usa APIs Blender 5.2 com aviso de depreciação de `use_nodes` para Blender 6; reprodução nessa versão futura requer nova verificação.
