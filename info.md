# Pesquisa — Site Técnico Interativo PA-34 Seneca

## Documento base (anexo do usuário)
`sop-PA34-voefloripa.pdf` — Standard Operating Procedures do Piper PA34-200 Seneca I, escola VoeFloripa, REV. 13 (167 páginas). O site deve ter SEÇÕES SEGUINDO ESTE DOCUMENTO.

### Estrutura do SOP (sumário oficial)
1. Introdução
2. Informações de utilização do manual
3. Uso do checklist
4. Standard Callouts (falas padronizadas entre tripulantes)
5. Generalidades
5.1. Especificações e Limitações (dimensões, pesos, motores, V-speeds, limites)
6. Performance (tabelas de decolagem, subida, cruzeiro, pouso)
7. Planejamento de voo
8. Sistemas Avançados:
   - 8.1 Sistema de combustível (4 tanques alares, bombas elétricas + de motor, seletoras, crossfeed)
   - 8.2 Sistema elétrico (28V, 2 alternadores, bateria, barramentos, luz de overvoltage)
   - 8.3 Sistema de vácuo (2 bombas, instrumentos giroscópicos)
   - 8.4 Sincronizador de hélices
   - 8.5 Trem de pouso retrátil (triciclo, eletro-hidráulico, 3 luzes verdes, avisos)
   - 8.6 Bagageiro do nariz
   - 8.7 Aquecimento, ventilação e desembaciamento
9. Regras e política de segurança VoeFloripa
10. Procedimentos normais (10.1 inspeção pré-voo → 10.15 corte dos motores — checklists por fase de voo)
11. Técnicas de pilotagem multimotor (voo assimétrico, "dead foot dead engine", embandeiramento, motor crítico, teto monomotor)
12. Procedimentos de emergência (12.1–12.21: pane de motor, fogo, falha elétrica, pouso com trem recolhido, gelo etc.)
13. Anexos
14. Current track

## Aeronave — Piper PA34-200 Seneca I (dados-chave)
- Bimotor leve, asa baixa, 4-6 lugares, trem de pouso triciclo retrátil
- Motores: 2× Lycoming IO-360-C1E6 (dir.) / LIO-360-C1E6 (esq., rotação oposta), 200 hp cada, injeção de combustível
- Hélices: Hartzell bipá, velocidade constante, full-feathering (embandeiramento)
- Painel clássico "six-pack": velocímetro, horizonte artificial, altímetro, giro direcional, coordenador de curva, variômetro + instrumentos de motor (manifold pressure duplo, RPM duplo, fuel flow/EGT, óleo, CHT, amperímetro, sucção, combustível 4 tanques)

## Dados de conteúdo para o app (gerados em /mnt/agents/output/content/)
- `especificacoes.json`, `performance.md`, `sistemas.json`, `procedimentos_normais.json`, `emergencias.json`, `multimotor.md`, `callouts_seguranca.md`, `intro_generalidades.md` (extraídos do SOP)
- `cockpit_instruments.json` (30+ instrumentos do painel com descrições operacionais), `componentes_3d.json` (componentes por camada do modelo 3D), `seneca_specs.md` (pesquisa técnica)

## Requisitos interativos centrais (do usuário)
1. **Desenho técnico 3D interativo** do PA-34 com profundidade em camadas — usuário pode REMOVER CAMADAS (explodir/ocultar) para visualizar sistemas, peças e componentes; identificação de sistemas e componentes com detalhes operacionais (clique → painel de detalhes). Implementação prevista: React Three Fiber, modelo procedural estilizado, camadas: Exterior → Estrutura → Motores → Combustível → Elétrico → Vácuo/Pitot → Trem de pouso → Controles de voo → Aviónicos/Cabine.
2. **Tela 2D do cockpit**: painel vetorial detalhado com TODOS os instrumentos; cada instrumento com box de descrição (hotspots clicáveis → tooltip/drawer com descrição e operação).
3. Seções de conteúdo seguindo o documento SOP anexo (estrutura acima).

## Idioma
Todo o site em português brasileiro (pt-BR).
