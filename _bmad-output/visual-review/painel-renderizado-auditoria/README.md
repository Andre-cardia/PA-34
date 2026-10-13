# Auditoria independente do painel renderizado

Aplicação inspecionada: `http://127.0.0.1:3000/cockpit`, servida por `work-modulo-3d/`.

## Evidências já executadas

- `auditoria.json`: inspeção CDP independente, com Chrome isolado e encerramento ao concluir. Ambas as imagens prontas, sem fallback indevido, mesma transformação para imagem e 56 hotspots, ausência de canvas no cockpit.
- Dois retornos por links reais entre 3D e cockpit com cache habilitado: imagens reaparecem sem fallback preso em carregamento.
- Resize sem recarga e pinch por eventos touch reais em 768 e 390 px: escala aumenta e os 56 hotspots continuam alinhados. Gestos iniciados na área arrastável; hotspots preservam o bloqueio de propagação preexistente.
- Bloqueio independente das imagens dia/noite: o modo afetado exibe fallback vetorial, enquanto o outro continua disponível.
- Movimento reduzido: transições praticamente nulas (0,00001 s, impostas pelo CSS global).
- Nenhuma exceção JavaScript inesperada nesses ensaios.
- `dia-1440.png`: captura do compositor durante a auditoria. Pode mostrar anéis de sugestão iniciais; não constitui aprovação estética do usuário.

## Integridade

A conferência independente registrou 22 fontes do módulo 3D e 28 arquivos de dados/home/geometria sem divergências do baseline. A resposta HTTP de `/models/pa34-camadas.glb` no servidor 3000 foi conferida também: 200, assinatura glTF, 20.070.308 bytes e o mesmo hash aprovado abaixo. GLB aprovado: `11776870db30eca87b4fefc1060315b245c3df1ccff37975c11aaa643e15c71a`.

A abertura independente de `painel-seneca-i.blend` no Blender confirmou 834 objetos (822 meshes), uma câmera ortográfica, as duas texturas empacotadas e nenhuma biblioteca externa vinculada. O painel é uma cena própria com geometria, não uma captura do SVG.

A auditoria final projeta os vértices avaliados dos 56 corpos reais, com erro máximo de centro inferior a 0,00006 e de extensão inferior a 0,00009 unidade do mapa. Os masters têm 3200×1910, mantendo a proporção 1600×955; imagens diurna e noturna são distintas.

## Contraprovas do pipeline após revisão

O helper `chrome-cdp.mjs` foi testado independentemente em quatro situações controladas:

1. Executável inexistente por `CHROME_PATH`: erro ENOENT tratado em aproximadamente 76 ms, sem perfil residual.
2. Encerramento SIGTERM durante comando pendente: promessa rejeitada e perfil removido, sem esperar indefinidamente um evento de saída já ocorrido.
3. `Runtime.evaluate` sem resolução: prazo CDP atingido em aproximadamente 2 s e Chrome encerrado pelo cleanup.
4. Cleanup chamado somente depois do evento `exit`: concluiu em 10 ms, removendo o perfil sem esperar outro evento de saída.

O novo `verify-assets.mjs` também foi exercitado em diretórios isolados: arquivo ausente, JSON inválido, lista de imagens vazia e WebP com largura VP8X alterada (inclusive com SHA recalculado). Os quatro casos produziram saída não zero e relatório `falhou`, com a causa correta. Os ativos reais não foram usados como alvo de mutação.

Nenhum desses ensaios alterou o aplicativo, as imagens ou a cena do avião.

## Limites e reprodução

Este relatório complementa, não substitui, a suíte principal em `../painel-renderizado/verificar-painel.mjs`, que cobre clique, teclado, busca, filtros, tour, miniaturas e carregamento pendente. O script independente desta sessão está em `/tmp/pa34-auditar-render-browser.mjs`; a auditoria de hashes está em `/tmp/pa34-auditar-preservacao-render.py`. Esses scripts temporários dependem do baseline local e não são o pipeline de reprodução do produto.

A captura e os testes independentes foram reexecutados sobre os WebPs definitivos: diurno `94435d6ef3b8d79a9ace390a5aa7bd41c3c580a3e6749904ea59508761d7f102` (420598 bytes) e noturno `b2279f3104529036e7fbe888451119a56f990cb2996449013501b802f2ce38de` (355668 bytes). Transparência correta; OAT desobstruído e legendas de magnetos/freio completas. O aceite principal foi conferido: 64 verificações CDP, 22 contraprovas do pipeline, verificador de ativos e `npm run verify` aprovados. A última regeneração de proveniência manteve exatamente esses pixels; o build final inclui o manifesto definitivo.

`alteracoes-finais.diff` registra as alterações contra o baseline local, excluindo imagens/binários e relatórios gerados volumosos. Não há repositório Git nem commit criado. Nenhuma correção confirmada ficou pendente; variantes raster para aparelhos de baixa memória não foram adicionadas por falta de evidência de falha. Permanecem os limites documentados de memória decodificada, inscrições pequenas e ausência de ensaio em aparelhos físicos de baixo custo. Aparência didática, não certificada nem instrumento de navegação operacional.
