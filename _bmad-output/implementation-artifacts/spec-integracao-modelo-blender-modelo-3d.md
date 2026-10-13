---
title: 'Integração do modelo Blender no módulo 3D'
type: 'feature'
created: '2026-09-24'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context:
  - /Users/andrecardia/Github/PA-34/AGENTS.md
  - /Users/andrecardia/Github/PA-34/docs/project-map.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** O modelo interativo em `/modelo-3d` ainda usa o GLB anterior, enquanto existe um modelo PA-34 produzido no Blender que deve ser experimentado na apresentação visual do site. A troca precisa manter o enquadramento, as camadas e a identidade técnica do Seneca I.

**Approach:** Exportar a coleção aeronáutica do arquivo Blender fornecido para um GLB otimizado, integrá-lo ao carregador existente e classificar seus nomes em português nas camadas/componentes já usados pela interface. Preservar os fallbacks procedurais, deep-links, interação e atribuição de proveniência.

</frozen-after-approval>

## Implementation Notes

- Escopo restrito a `work-modulo-3d/`; `app/` permanece intocado.
- O ativo usa `/models/pa34-seneca-bipa-v12.glb`, exportado da coleção `PA-34 • Seneca bipá • revisão 08` com Draco, mantendo o `.blend` como fonte externa documentada.
- O mapeamento deve aceitar nomes em português/acentuados, manter IDs existentes e calibrar a escala para o enquadramento da cena.
- O aviso de atribuição deve distinguir o GLB legado ainda presente do novo modelo ativo fornecido pelo usuário.
- Implementados `glb.tsx`, `SenecaTechModel.tsx`, `BottomBar.tsx`, o aviso de atribuição e o ativo público GLB; a escala usa a meia-envergadura de `5,93994 m` para preservar o referencial dos componentes procedurais.
- A classificação normaliza acentos e reconhece espaços, lados `-1/1`, motores, hélices, trem, combustível e superfícies de comando sem alterar os IDs técnicos existentes.
- A exportação Draco reduziu o ativo para aproximadamente 1,2 MiB; `npm --prefix work-modulo-3d run build` passou com apenas o aviso conhecido de chunks grandes.
- Os materiais Blender são substituídos intencionalmente pelos materiais de tema do módulo para preservar raio-X, opacidade, destaque por camada e acessibilidade; a geometria e a proveniência permanecem no GLB.
- A verificação smoke passou a exigir o GLB ativo e seu registro de proveniência, evitando que a entrega volte silenciosamente ao ativo legado.
- A classificação normaliza os nomes sanitizados pelo GLTFLoader (`_` e acentos); carenagens e hélices permanecem em `exterior` para a vista montada, enquanto trem, combustível, comandos e camadas internas preservam seus toggles.
- A rota foi conferida em navegador headless a 1440 px com canvas WebGL, vista montada e `EXPLODIR TUDO`; o crédito ativo aparece como `BLENDER BIPA V12 · FONTE LOCAL`.

## Review Triage Log

- patch — A escala visual divergiria do referencial procedural; restaurada para `4.7 / 5.93994`, conferida contra pontas de asa, motores e trem do arquivo Blender.
- false — Os grupos procedurais não estão sob `GlbWrap`, mas o referencial físico do GLB foi alinhado aos pontos existentes da cena; envolver tudo alteraria a maquete legada.
- false — `GLB_Y = -1.1` mantém o centro das rodas próximo aos freios procedurais (`y ≈ -0.94`); a grade inferior é plataforma decorativa, não critério de contato do ativo.
- patch — Meshes de motor sem lado explícito podiam desaparecer; `GP('motores', 'centro')` agora renderiza o grupo central.
- patch — Peças do trem dianteiro sem sufixo eram classificadas como principais; a classificação por nomes-base separa a perna dianteira dos conjuntos `.001/.002`.
- patch — Tampas de combustível eram concentradas no lado esquerdo; os slots `0–4` e `5–9` agora selecionam os tanques esquerdo/direito.
- false — O fallback de nós desconhecidos para exterior é deliberado para não perder geometria; prefixos `07/08` e nomes de sistemas têm classificação explícita.
- false — O carregamento Draco foi exercitado no navegador local sem requisição adicional de decoder; `useGLTF` resolve o formato no bundle atual.
- patch — Comentário de dispositivo fraco dizia `~17k tris`; substituído por descrição compatível com o GLB Draco atual.
- false — Os materiais temáticos substituem intencionalmente os materiais Blender para manter raio-X, opacidade e destaque por camada; isso está registrado nas notas de implementação.
- patch — `verify-build.mjs` passou a exigir o GLB ativo e o arquivo de proveniência.
- defer — Cobertura automatizada de nós, Draco, seleção e toggles requer runner de navegador; a validação manual local passou e o item foi registrado em `deferred-work.md`.
- defer — ESLint ainda acusa padrões legados de refs/React Compiler nos componentes R3F e na página; TypeScript/Vite e smoke passam, e a correção ampla está fora deste escopo.
- defer — URLs root-absolute em deploy de subcaminho são uma questão preexistente de configuração; não há implantação em subpasta neste objetivo.
- patch — O aviso público deixou de expor o caminho absoluto da máquina e mantém apenas o nome do arquivo Blender fornecido.
- low rejeitado — O crédito permanece oculto abaixo de `xl` para não quebrar a barra compacta; o aviso continua acessível pela rota pública.
- low rejeitado — O GLB legado é mantido por compatibilidade/proveniência e não é o ativo usado pelo módulo; removê-lo ampliaria o escopo sem benefício comprovado.
