// Dados verbatim do SOP VoeFloripa REV.13 — capítulos 04 e 09 (fonte: src/data/callouts_seguranca.md)

export interface CalloutRow {
  fase: string
  condicao: string
  callout: string
  critico?: boolean
}

export const CALLOUTS_DECOLAGEM: CalloutRow[] = [
  { fase: 'ACIONAMENTO', condicao: 'Área dos motores', callout: '"CLEAR"' },
  { fase: 'TÁXI', condicao: 'Check de freios', callout: '"CHECK BRAKES" / "BRAKES CHECKED"' },
  { fase: 'ALINHAMENTO', condicao: 'Na cabeceira para a decolagem', callout: '"RWY xx HEADING xxx°"' },
  { fase: 'DECOLAGEM', condicao: 'Iniciando a decolagem', callout: '"TAKEOFF"' },
  { fase: 'DECOLAGEM', condicao: 'Potência ajustada', callout: '"THRUST SET"' },
  { fase: 'DECOLAGEM', condicao: 'Indicação do velocímetro', callout: '"AIRSPEED ALIVE"' },
  { fase: 'DECOLAGEM', condicao: 'Na V1/VR', callout: '"V1" / "ROTATE"', critico: true },
  { fase: 'DECOLAGEM', condicao: 'Razão de subida positiva e recolhimento do trem', callout: '"POSITIVE RATE OF CLIMB" / "LANDING GEAR UP"' },
  { fase: 'DECOLAGEM', condicao: 'Na altitude de aceleração (400 ft AGL)', callout: '"ACCELERATION ALTITUDE"', critico: true },
  { fase: 'DECOLAGEM', condicao: 'Recolhimento de flaps, ajuste de potência e hélice', callout: '"FLAPS UP" / "THROTTLE & PROPELLERS SET"' },
]

export const CALLOUTS_SUBIDA: CalloutRow[] = [
  { fase: 'SUBIDA', condicao: 'Ao cruzar a MSA', callout: '"MSA xxxx ft" / "ALTIMETERS xxxx hPa"', critico: true },
  { fase: 'SUBIDA', condicao: 'Ao cruzar a TA e ajuste de altímetros', callout: '"TRANSITION ALTITUDE" / "ALTIMETERS RESET ONE ZERO ONE THREE"' },
  { fase: 'SUBIDA', condicao: '100 ft para a restrição', callout: '"100ft TO ALTITUDE"' },
  { fase: 'SUBIDA', condicao: '1000 ft para o FL previsto', callout: '"1000ft TO LEVEL OFF"' },
  { fase: 'SUBIDA', condicao: '100 ft para o nivelamento', callout: '"100ft TO LEVEL"' },
]

export const CALLOUTS_CRUZEIRO: CalloutRow[] = [
  { fase: 'CRUZEIRO', condicao: 'Ao atingir a restrição', callout: '"ALTITUDE OFF"' },
  { fase: 'CRUZEIRO', condicao: 'Ao atingir o FL', callout: '"LEVEL OFF"' },
  { fase: 'CRUZEIRO', condicao: 'Ajuste de potência e hélice', callout: '"THROTTLE & PROPELLERS SET"' },
  { fase: 'CRUZEIRO', condicao: 'Antes da descida', callout: '"APPROACH BRIEFING"' },
]

export const CALLOUTS_DESCIDA: CalloutRow[] = [
  { fase: 'DESCIDA', condicao: 'Ao cruzar o Nível de Transição', callout: '"TRANSITION LEVEL ALTIMETERS xxxx hPa"' },
  { fase: 'DESCIDA', condicao: 'Ao cruzar a MSA', callout: '"MSA xxxx ft" / "CROSS CHECK ALTIMETERS xxxx hPa"', critico: true },
  { fase: 'DESCIDA', condicao: '100 ft para a restrição', callout: '"100ft TO ALTITUDE"' },
  { fase: 'DESCIDA', condicao: 'Em aproximação VFR 500 ft AGL', callout: '"500ft STABILIZED"', critico: true },
]

export const CALLOUTS_NDB_VOR: CalloutRow[] = [
  { fase: 'NDB/VOR', condicao: 'A 10 NM do bloqueio', callout: '"SET RADIOS FOR APPROACH NDB/VOR"' },
  { fase: 'NDB/VOR', condicao: 'Movimento do CDI do VOR', callout: '"CDI ALIVE"' },
  { fase: 'NDB/VOR', condicao: 'No bloqueio da estação', callout: '"NDB/VOR xxxx ft TIME"' },
  { fase: 'NDB/VOR', condicao: '1000 ft AGL — GUMPS', callout: '"ONE THOUSAND STABILIZED"', critico: true },
  { fase: 'NDB/VOR', condicao: '100 ft acima da MDA', callout: '"ONE HUNDRED TO MINIMUMS"' },
  { fase: 'NDB/VOR', condicao: 'MDA', callout: '"MINIMUMS"', critico: true },
  { fase: 'NDB/VOR', condicao: 'Pista avistada', callout: '"RUNWAY IN SIGHT, LANDING"' },
  { fase: 'NDB/VOR', condicao: 'Não avistou a pista na VDP/MAPT', callout: '"RUNWAY NOT IN SIGHT GO AROUND"', critico: true },
  { fase: 'NDB/VOR', condicao: 'Arremetida iniciada, aeronave configurada 400 ft acima da MDA', callout: '"SET RADIOS FOR MISSED APPROACH"' },
]

export const CALLOUTS_ILS: CalloutRow[] = [
  { fase: 'ILS', condicao: 'Início do arco DME ou vetoração radar', callout: '"SET RADIOS FOR APPROACH ILS"' },
  { fase: 'ILS', condicao: '1º movimento do CDI, em curva de procedimento ou proa de interceptação', callout: '"LOCALIZER ALIVE"' },
  { fase: 'ILS', condicao: '1º movimento do glide slope, estabilizado no curso do localizador', callout: '"GLIDE SLOPE ALIVE"' },
  { fase: 'ILS', condicao: 'Passando o FAF', callout: '"FINAL APPROACH FIX xxxx ft"' },
  { fase: 'ILS', condicao: '1000 ft AGL — GUMPS', callout: '"ONE THOUSAND STABILIZED"', critico: true },
  { fase: 'ILS', condicao: '500 ft acima da AGL', callout: '"FIVE HUNDRED"' },
  { fase: 'ILS', condicao: '100 ft acima da DA', callout: '"ONE HUNDRED TO MINIMUMS"' },
  { fase: 'ILS', condicao: 'DA', callout: '"MINIMUMS"', critico: true },
  { fase: 'ILS', condicao: 'Pista avistada', callout: '"RUNWAY IN SIGHT, LANDING"' },
  { fase: 'ILS', condicao: 'Não avistou a pista na DA', callout: '"RUNWAY NOT IN SIGHT GO AROUND"', critico: true },
  { fase: 'ILS', condicao: 'Arremetida iniciada, aeronave configurada 400 ft acima da DA', callout: '"SET RADIOS FOR MISSED APPROACH"' },
]

export const CALLOUTS_DESVIOS: CalloutRow[] = [
  { fase: 'DESVIO', condicao: 'Mais ou menos 200 pés do nível ou altitude estabelecida', callout: '"ALTITUDE"' },
  { fase: 'DESVIO', condicao: 'Variações significativas de velocidade, proximidade da VNE (217 MPH) ou, nas aproximações, Vapp −5 kt ou +20 kt', callout: '"SPEED" / "VELOCIDADE"' },
  { fase: 'DESVIO', condicao: 'Inclinação superior a 45° VMC ou 30° IMC', callout: '"BANK" / "INCLINAÇÃO"' },
  { fase: 'DESVIO', condicao: 'Deslocamento excessivo do eixo do LOC ou CDI do GPS superior a 1 DOT', callout: '"LOCALIZER"' },
  { fase: 'DESVIO', condicao: 'Variações significativas na rampa do GS superiores a 1 DOT', callout: '"GLIDE SLOPE"' },
]

export const SEQ_DECOLAGEM = [
  { tick: 0, fala: '"CLEAR"', quem: 'CM1 — área dos motores livre' },
  { tick: 1, fala: '"TAKEOFF"', quem: 'CM1 — iniciando a decolagem' },
  { tick: 2, fala: '"THRUST SET"', quem: 'CM2 — potência ajustada' },
  { tick: 3, fala: '"AIRSPEED ALIVE"', quem: 'CM2 — velocímetro vivo' },
  { tick: 4, fala: '"V1" / "ROTATE"', quem: 'CM1 — 5 kt antes da V1/VR' },
  { tick: 5, fala: '"POSITIVE RATE OF CLIMB" / "LANDING GEAR UP"', quem: 'CM1 → CM2 confirma' },
  { tick: 6, fala: '"ACCELERATION ALTITUDE"', quem: 'CM1 — 400 ft AGL' },
]

export interface Regra {
  id: string
  titulo: string
  bullets: string[]
  chips?: string[]
}

export const REGRAS: Regra[] = [
  {
    id: '9.1',
    titulo: 'Apresentação para os voos',
    bullets: [
      'A apresentação deve se dar na sede da escola, com 1 (uma) hora de antecedência.',
      'Durante esse tempo será realizado o briefing: verificação do planejamento, cartas e meteorologia.',
    ],
  },
  {
    id: '9.2',
    titulo: 'Mínimos meteorológicos — voos de instrução',
    chips: ['VENTO DE CAUDA ≤ 5 KT', 'METAR + TAF ≥ MÍNIMOS', 'SEM CB / NEVOEIRO'],
    bullets: [
      'Os voos somente ocorrerão se os mínimos do tempo presente (METAR) e da previsão (TAF) forem iguais ou superiores aos previstos pela regulamentação para o tipo de voo (VFR ou IFR).',
      'Sem reportes ou previsão de chuva forte, nevoeiro, névoa ou outro fator que restrinja a visibilidade, como presença de CBs.',
      'A componente máxima de vento de cauda será de 5 kt para todas as operações.',
      'É responsabilidade do instrutor a verificação da condição meteorológica para o voo local, rota de navegação e destino.',
    ],
  },
  {
    id: '9.3',
    titulo: 'Procedimentos de acionamento & taxi',
    chips: ['CHECKLIST OBRIGATÓRIO', 'TAXI ≤ 15 KT', 'REBOQUE COM TRATOR PROIBIDO'],
    bullets: [
      'O uso do CHECKLIST é OBRIGATÓRIO.',
      'Na inspeção externa, assegurar a área livre de detritos e a área da hélice livre antes do acionamento; à noite, maior cuidado.',
      'Luzes de anticolisão e navegação ligadas antes da partida do motor.',
      'Rotas de taxi seguidas à risca pelas linhas amarelas; velocidade apropriada ao entorno — nunca superior a 15 kt.',
      'Taxiar com cautela na entrada dos estacionamentos; em caso de dúvidas, cortar o motor e manobrar com o garfo.',
      'WARNING: Reboque com trator é proibido.',
    ],
  },
  {
    id: '9.4',
    titulo: 'Pouso não planejado dentro e fora de aeródromo',
    bullets: [
      'Certifique-se de que a aeronave esteja segura e amarrada antes de buscar assistência.',
      'Se o pouso foi por pane ou emergência, a aeronave permanece em solo até ser reparada e verificada por mecânico autorizado e o voo autorizado pela Coordenação de Instrução Prática.',
      'Contato imediato com a Coordenação é obrigatório (telefones na pasta da aeronave).',
      'Prioridade em qualquer pouso de emergência: evitar o impacto vertical. Mantenha a aeronave voando até o toque no solo ou água — até o toque, o avião deve estar voando, e não caindo.',
    ],
  },
  {
    id: '9.5',
    titulo: 'Discrepâncias e ações corretivas de manutenção',
    bullets: [
      'Discrepâncias devem ser reportadas no Relatório Técnico da Aeronave (RTA) e à Coordenação de Instrução Prática.',
      'Voos não serão permitidos com discrepâncias, a não ser que reparadas e liberadas por mecânico autorizado, ou que o equipamento não essencial tenha sido rotulado inoperativo (INOP).',
      'Todo serviço de manutenção deve ser autorizado pela Coordenação de Instrução Prática.',
    ],
  },
  {
    id: '9.6',
    titulo: 'Segurança da aeronave',
    bullets: [
      'Amarração com no mínimo 3 estais; espaço mínimo de 1,5 m entre partes de aeronaves estacionadas.',
      'Calços sempre utilizados: últimos itens retirados antes do voo e primeiros ao estacionar; aeronave calçada para o abastecimento.',
      'Freio de estacionamento aplicado para inspeção externa, abastecimento e partida de motores.',
      'Travas de controles de voo após cada voo; na falta, prender o manche com o cinto.',
      'Capas de para-brisas, pitot e naceles (estas 20 min após o corte) quando parada por mais de uma hora.',
      'Trava de hélice sempre que a aeronave permanecer desacompanhada ou nos pernoites.',
    ],
  },
  {
    id: '9.7',
    titulo: 'Manobras no aeródromo base (SBFL)',
    bullets: [
      'Evite aproximar-se de aeronaves em movimento ou com motor/luz anticolisão acionados.',
      'Cautela com as rajadas de ar (jet blast) de aeronaves maiores — podem causar perda de controle direcional no solo, no pouso e na decolagem.',
      'Esteira de turbulência (wake turbulence): o encontro com a esteira de um 737 ou A320 pode causar perda de controle irrecuperável a baixa altura. Em caso de dúvidas, espere o tempo máximo antes de decolar ou aproximar seguindo uma aeronave maior.',
    ],
  },
  {
    id: '9.8',
    titulo: 'Abastecimento, combustível reserva',
    chips: ['AVGAS 100LL', 'RESERVA MÍN. 2H', 'DRENAGEM OBRIGATÓRIA'],
    bullets: [
      'Abastecimento pela BR Aviation (preferencialmente) ou Shell Aviation; combustível AvGas 100LL.',
      'Aeronave calçada e desenergizada; aterramento pelo operador; piloto assegura o fechamento das tampas.',
      'Após o abastecimento e acomodação do combustível, é obrigatória a drenagem.',
      'Nenhum abastecimento sob chuva forte; proibida qualquer transmissão por radiofrequência ou fonte de ignição.',
      'Autonomia mínima (2h ou o que for maior): Local VFR = lição + 1h · Local IFR = lição + alternativa + 45 min · Navegação VFR diurno = voo + alternativa + 30 min · Navegação IFR diurno = voo + alternativa + 45 min.',
    ],
  },
  {
    id: '9.9',
    titulo: 'Prevenção de colisão, em solo e em voo',
    bullets: [
      'Em solo: aderência às autorizações do ATC, cheque de área, luzes de anticolisão; checklists obrigatoriamente com a aeronave parada e freada.',
      'Em voo: cheques de área antes de curvas, mudanças de altitude e ingressos em circuitos; transmitir posição, principalmente fora de cobertura radar — em áreas de coordenação, frequência 123,45 e Rádio AFIS quando aplicável.',
      'Prevenção de incursão de pista: cotejar a instrução da torre e verificar as áreas de aproximação e a pista antes de ingressar.',
    ],
  },
  {
    id: '9.10',
    titulo: 'Áreas de instrução',
    bullets: [
      'Áreas de instrução respeitadas e utilizadas para o treinamento (acordo operacional com o DTCEA-FL); treinamento fora delas deve ser coordenado com o ATC.',
      'Todas as áreas são propensas a turbulência orográfica: evitar os morros, afastar-se de sotavento das elevações, atentar a nuvens lenticulares e convectivas.',
      'Atenção aos praticantes de voo livre, urubus em condições térmicas e ultraleves nas áreas litorâneas, principalmente no verão.',
    ],
  },
  {
    id: '9.11',
    titulo: 'Política antidrogas, medicamentos e fatores humanos',
    chips: ['ÁLCOOL: 8H (RBHA 91.17) — ESCOLA RECOMENDA 12H', 'FUMO PROIBIDO'],
    bullets: [
      'Proibido o fumo a bordo, independentemente da categoria (lei federal).',
      'Proibido apresentar-se para o voo havendo ingerido álcool em período inferior a 8 horas (RBHA 91.17) ou ainda sob seus efeitos; a escola recomenda 12 horas.',
      'Proibido o voo sob efeito de medicamentos sem supervisão médica e o uso de drogas ilícitas.',
      'Atitudes perigosas a reconhecer em si próprio: invulnerabilidade, anti-autoridade, macho, impulsividade, resignação.',
      'Tomada de decisão em 5 passos: reconhecer a mudança, definir o problema, escolher a linha de ação, implementar, verificar o efeito.',
    ],
  },
  {
    id: '9.12',
    titulo: 'Uso dos EPIs, Floripa Airport e Security',
    bullets: [
      'Todo voo inicia na sala de briefing; EPIs obrigatórios: abafadores de som e sapatos fechados — sem eles, proibido o acesso ao pátio.',
      'O instrutor sempre acompanhará o aluno até o avião e de volta, mesmo em voo solo.',
      'Atenção com bagagens desacompanhadas ou abordagens estranhas: reportar imediatamente à autoridade aeroportuária.',
    ],
  },
  {
    id: '9.13',
    titulo: 'Autorizações especiais de voo e RELPREV',
    bullets: [
      'Todo voo fora das características normais de operação deve ser previamente autorizado pela direção da escola.',
      'O Relatório de Prevenção de Acidentes (RELPREV) deve ser feito com a maior riqueza de detalhes possível — a escola recomenda a sua utilização.',
    ],
  },
  {
    id: '13.1',
    titulo: 'Anexo — Regras de operação',
    chips: ['TRAVÉS ≤ 13 KT', 'CAUDA ≤ 5 KT', 'VNO PROIBIDO — NOTURNO', 'MISSÃO MÁX. 3H30'],
    bullets: [
      'Mínimos IFR: teto 1.000 ft e visibilidade maior que 4.000 m; sem TCU, TS, GS e WS no METAR/TAF; IMC somente em condição "stratus".',
      'Aeródromos autorizados: SBFL, SBNF, SBJV, SBJA e SBPA (não efetuar TGL com pista molhada). SDEN: proibido TGL em treinamento com alunos.',
      'Limites de vento: través máxima 13 kt (operação do instrutor); cauda máxima 5 kt.',
      'Voo noturno proibido — programar decolagem diurna e regresso com luz visível.',
      'Nunca utilizar trator ou push-back conectado ao trem de nariz (Piper SB 1123B) — perigo de recolhimento involuntário do trem durante o taxi.',
    ],
  },
]

export const CARTAZ = [
  'Chegue 1 hora antes — briefing é parte do voo.',
  'Sem mínimos meteorológicos, não há instrução.',
  'Checklist é obrigatório. Sempre.',
  'Aeronave em pane fica em solo até liberação.',
  'Discrepância vai para o RTA e para a Coordenação.',
  'Amarrada, calçada, travada — avião seguro em solo.',
  'Respeite jet blast e esteira de turbulência.',
  'Abastecimento: calçada, desenergizada, drenada.',
  'Cheque de área antes de qualquer movimento.',
  'Fadiga e atitude perigosa derrubam mais que pane.',
]
