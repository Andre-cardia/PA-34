# Plano de revisão de fidelidade — painel Seneca I (ref. PR-FLM)

Referência: `painel-real-prflm.png` (foto interna em perspectiva da cabine PR-FLM).
Decisões do usuário (26/09): copiar exatamente a foto **incluindo aviônicos modernos** (GPS colorido,
transponder digital, stack de rádios); **revisão completa** de todos os instrumentos; **hotspots podem
ser movidos/reagrupados**, preservando os IDs para não quebrar deep-links `?i=`.

Isto renegocia formalmente: (1) a regra do AGENTS.md de não adicionar aviônicos modernos — suspensa por
ordem explícita; (2) a spec `spec-painel-renderizado-interativo.md` (estava `done`) — reaberta.

## Leitura da foto (regiões confirmadas)

- **Painel do piloto (esq.):** six-pack grande (ASI, AI, ALT em cima; TC, HSI/DG, VSI embaixo) em subchapa
  preta; à esquerda coluna de instrumentos menores (relógio/OAT/etc.) e o manche em W com logo Piper.
- **Fila de motor (centro-baixo esq.):** manifold (IN HG ABS), tacômetro duplo (RPM, faixa verde), fluxo —
  faces claras/creme, escalas nítidas.
- **Stack central de rádios:** áudio no topo, GPS colorido grande (retrofit), transponder digital laranja,
  DME/ADF digitais, placa de limitações "GEAR DOWN/UP/EXTENDED", dois NAV/COM embaixo.
- **Painel do copiloto (dir.):** segundo six-pack grande e completo (ASI, AI, ALT; TC, HSI com avião laranja,
  VSI) — não mostradores minúsculos.
- **Pedestal central único (vertical):** quadrante de 6 manetes (2 pretas potência, 2 azuis hélice,
  2 vermelhas mistura) com trilhos serrilhados; abaixo ALT AIR OFF/ON flanqueado por 2 puxadores prata;
  face vertical com 2 bolas pretas COWL FLAP L/R e placas; eixo descendo ao piso.
- **Manches:** dois yokes em W pretos com logo Piper, saindo do painel (piloto e copiloto).

## Defeitos priorizados (meu painel atual → real)

1. ~~Six-pack do copiloto: 6 mostradores minúsculos vazios → 6 instrumentos grandes completos.~~
   **CORRIGIDO (26/09).** `CopilotoPack` reescrito para reusar a arte real (`GenericGauge` ASI/VSI,
   `Horizonte`, `Altimetro`, `Coordenador`, `GiroDirecional`) com r=54 — praticamente igual ao piloto
   (r=58). Bloco ampliado para 336×232 em x=996; coluna auxiliar (relógio/12V e disjuntores) movida
   para x=1346 com 188 de largura. Geometria em `build_panel.py` acompanhando (6 `gauge` r=54).
   Legendas centrais de ASI/VSI encurtadas para não colidir com as escalas nessa escala.
   Verificado: 56 corpos medidos (erro máx. 5,9e-05), 64 assertivas de navegador, alinhamento 1e-13.
2. Instrumentos de motor: faces escuras genéricas → faces **claras/creme** com faixas verdes no arco
   externo, escalas escuras legíveis e bisel cromado (confirmado no recorte ampliado).
3. Manetes: 3 painéis planos separados → pedestal central único (potência+hélice+mistura), com
   trilhos serrilhados, ALT AIR OFF/ON entre dois puxadores prata e COWL FLAP L/R em bolas pretas.
4. Rádios: coluna de caixas didáticas → stack vertical com GPS colorido, transponder digital, NAV/COM.
5. Manches em W com logo Piper: ausentes → adicionar geometria física nas duas posições.
6. Cor do painel: verde-oliva → preto acetinado (foto).

## Camadas afetadas

- `panel-map.json` / `panel-data.ts`: novas posições/tamanhos das caixas reagrupadas (IDs preservados).
- `artwork.tsx` + `export-map.mjs`: arte impressa dos mostradores (faces claras, GPS, digitais).
- `build_panel.py`: geometria (six-pack grande, pedestal, manches, cor da chapa).
- `RenderedPanel.tsx` / `CockpitPanel.tsx`: só se a proporção do viewBox mudar.
- Regerar atlas → Blender → WebP → manifesto; revalidar alinhamento e interação.

## Execução em rodadas

R1. Congelar referência e plano (esta rodada). Definir novo layout canônico (coordenadas).
R2. Atualizar `panel-map.json`/`panel-data.ts` com o novo agrupamento; verificar consumidores dos IDs.
R3. Revisar `artwork.tsx` (faces claras de motor, six-pack, GPS/digitais) e reexportar atlas.
R4. Reescrever geometria em `build_panel.py` (six-pack grande, pedestal, manches, cor).
R5. Regerar imagens; revalidar alinhamento/interação/preservação do avião; apresentar.
