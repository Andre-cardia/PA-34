# Plano — Site Técnico Interativo PA-34 (Seneca)

## Objetivo
Site técnico em português (pt-BR) sobre o avião PA-34, contendo:
1. **Módulo 3D interativo**: desenho técnico 3D do PA-34 com camadas removíveis (carenagem/fuselagem, motores, sistema combustível, elétrico, trem de pouso, controles de voo, aviónicos) — cada camada revela sistemas/peças/componentes; clique num componente → detalhes operacionais.
2. **Módulo 2D Cockpit**: painel detalhado com todos os instrumentos; cada instrumento com box de descrição.
3. **Seções do site**: seguindo a estrutura do documento SOP anexo (sop-PA34-voefloripa.pdf).

## Estágios

### Stage 0 — Extração do documento (Orchestrator)
- Ler `/mnt/agents/upload/sop-PA34-voefloripa.pdf` e extrair: estrutura de seções, sistemas abordados, dados operacionais (limitações, velocidades, checklists, specs).
- Output: sumário estruturado para alimentar conteúdo e navegação do site.

### Stage 1 — Conteúdo técnico (sub-agente `explore` + dados do SOP)
- Compilar dados técnicos estruturados do PA-34 Seneca: sistemas (motor, hélice, combustível, elétrico, hidráulico, trem de pouso, controles de voo, aviónicos/instrumentos, cabine), especificações, limitações, instrumentos do cockpit com descrições operacionais.
- Fonte primária: PDF do SOP; suplemento: pesquisa web (POH PA-34, specs públicas).
- Output: arquivos de dados (JSON/TS) prontos para o app.

### Stage 2 — Construção do webapp (skill: vibecoding-webapp-swarm)
- Carregar `/app/.agents/skills/vibecoding-webapp-swarm/SKILL.md` e seguir o workflow.
- App React + Three.js (react-three-fiber):
  - Modelo 3D procedural estilizado do PA-34 (twin low-wing, trem retrátil) com camadas toggleáveis: Exterior → Estrutura → Motores → Combustível → Elétrico → Trem de pouso → Controles de voo → Aviónicos. Raycasting para clicar em componentes → painel lateral com detalhes operacionais.
  - Tela 2D do cockpit: painel vetorial (SVG) com hotspots clicáveis em cada instrumento → box de descrição.
  - Seções de conteúdo conforme SOP: Apresentação, Especificações, Limitações, Procedimentos/Checklists, Sistemas, Emergências, etc.
- Design: tema técnico/aeronáutico, baixa saturação, idioma pt-BR.

### Stage 3 — Validação e entrega
- Build, teste, screenshot de validação.
- Entrega via `mshtools-website_version_manager` (action: build_version, type: static).
