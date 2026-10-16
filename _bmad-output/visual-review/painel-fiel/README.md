# Painel fiel à foto PR-FLM: E2 implementada — aguardando aprovação

Spec: `../../implementation-artifacts/spec-painel-fiel-prflm.md`.

**Estado: E2 implementada, aguardando a aprovação humana da comparação foto × render.** A E1 (layout 1600×960, 54 IDs = 49 + 5 do pedestal, arte vetorial e fallback) foi aprovada em 2026-10-16. Na E2 o painel foi refeito no Blender a partir do mesmo `panel-data.ts`. Saíram renders dia/noite de 3200×1920 para o painel e para os manches, uma camada opcional com fundo transparente. O site voltou a mostrar o raster Blender, e o fallback vetorial continua com o mesmo layout.

Capturas feitas com Playwright (Chromium headless, movimento reduzido) contra o Vite dev em `http://127.0.0.1:4175`. Para reproduzir, rode da raiz: `APP_URL=http://127.0.0.1:4175 node _bmad-output/visual-review/painel-fiel/gerar-capturas.mjs`. As capturas `03`–`07` (vetor) são refeitas com os WebPs bloqueados, para forçar o fallback.

## Comparação principal (E2)

| Arquivo | Conteúdo |
|---|---|
| `09-lado-a-lado-foto-antigo-novo-{dia,noite}.png` | **Foto × render antigo × render novo**, lado a lado |
| `10-lado-a-lado-foto-x-render-manches-{dia,noite}.png` | Foto × render novo com a camada dos manches |
| `11-sobreposicao-foto-50pct-sobre-render-dia.png` | Foto a 50% sobre o render novo, pela retificação de `panel-data.ts` (x ≈ 1,56·xFoto + 10, y ≈ 1,6·yFoto). A sobreposição é afim, não uma retificação real: o desalinhamento nas bordas vem da perspectiva da foto, não do render |
| `08-render-novo-1440-{dia,noite}[-manches].png` | Palco de `/cockpit` em 1440, render Blender, sem e com manches |
| `08-render-novo-390-{dia,noite}[-manches].png` | Palco em 390×844, primeira carga, enquadrado no six-pack do piloto |
| `08-render-novo-390-{dia,noite}-reset.png` | Em 390, depois de RESET: painel inteiro |

## Referências e E1

| Arquivo | Conteúdo |
|---|---|
| `01-foto-prflm.png` | Foto de referência `work-modulo-3d/blender/cockpit/referencia/painel-real-prflm.png` (1024×640) |
| `02-render-antigo-{dia,noite}.png` | Render Blender antigo (layout 1600×700) |
| `render-antigo/` | Cópia dos WebPs e do manifesto antigos (3200×1400), que o pipeline novo substituiu em `public/cockpit-render/` |
| `03`–`07` | Fallback vetorial (E1): 1440, 390, manches vetoriais, painel isolado, foto × vetor |
| `verificador/` | Saída de `../painel-renderizado/verificar-painel.mjs` contra 4175, **modo `raster`**: 69 verificações, 0 puladas |
| `gerar-capturas.mjs` | Script que gera as imagens acima |

## O que conferir

- Mesma região relativa da foto: piloto à esquerda, stack no centro, copiloto à direita, faixa creme e pedestal embaixo.
- Hotspots sobre os componentes renderizados. Medido no Blender: 54 corpos com erro < 0,001 e 54 raios frontais sem oclusão.
- Imagem noturna alinhada à diurna (mesma câmera ortográfica).
- Diferenças que continuam em relação à foto: o render é frontal e limpo, sem desgaste, reflexo de janela nem perspectiva. Pedais, bancos e carpete ficam fora do escopo. A tela do GNS é a arte didática do vetor.
