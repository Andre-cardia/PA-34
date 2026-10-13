// Dados verbatim do SOP VoeFloripa REV.13 — capítulo 11 (fonte: src/data/multimotor.md)

export interface SiglaSE {
  sigla: string
  definicao: string
  dot: 'critica' | 'mono' | 'normal' | 'cautela'
}

export const SIGLAS_SE: SiglaSE[] = [
  { sigla: 'V1', definicao: 'Velocidade de decisão. Velocidade em que, se abortar a decolagem, teremos pista suficiente para a parada total da aeronave.', dot: 'cautela' },
  { sigla: 'VR', definicao: 'Velocidade de rotação. Velocidade na qual se aplica pressão no manche para trás e faz "rodar" a aeronave.', dot: 'normal' },
  { sigla: 'VLOF', definicao: 'Velocidade de saída do solo. Velocidade na qual a aeronave sai do chão (alguns fabricantes referem VR = VLOF).', dot: 'normal' },
  { sigla: 'VX', definicao: 'Velocidade de melhor ângulo de subida — maior altitude numa dada distância.', dot: 'normal' },
  { sigla: 'VY', definicao: 'Velocidade de melhor razão de subida — maior altitude num dado tempo.', dot: 'normal' },
  { sigla: 'VXSE', definicao: 'Velocidade de melhor ângulo de subida monomotor.', dot: 'mono' },
  { sigla: 'VYSE', definicao: 'Velocidade de melhor razão de subida monomotor. Marcada com uma linha azul no velocímetro. Acima do teto máximo de operação monomotor, indica a menor razão de descida monomotora.', dot: 'mono' },
  { sigla: 'VSSE', definicao: 'Velocidade de segurança em operação monomotora em voo de treinamento.', dot: 'mono' },
  { sigla: 'VMC', definicao: 'Velocidade mínima de controle com o motor crítico inoperante. Marcada com uma linha radial vermelha no velocímetro (Red Line). No voo de teste prevê-se a perda do motor, máxima deflexão do leme para controlar, rolagem de até 5° para o lado do motor bom e manutenção do voo nivelado.', dot: 'critica' },
  { sigla: 'VMCA', definicao: 'Mínima velocidade na qual é possível recuperar o controle da aeronave após a falha do motor crítico e manter o voo retilíneo com derrapagem nula, com ângulo de inclinação máximo de 5° para o lado do motor operante, em potência máxima de decolagem.', dot: 'critica' },
]

export const PASSOS_IDENTIFICACAO = [
  {
    id: 1,
    titulo: 'PEDAL DO LADO DO MOTOR BOM',
    texto: 'O lado do motor bom é aquele que oferece resistência ao pé; no lado do motor ruim, o pedal estará "morto" — "dead foot, dead engine". Calçar o pedal até centralizar a bolinha do Turn Coordinator.',
  },
  {
    id: 2,
    titulo: 'ATÉ 5° DE ASAS PARA O MOTOR BOM',
    texto: 'Inclinar o manche até 5° para o lado do motor bom, de modo a manter uma trajetória reta.',
  },
  {
    id: 3,
    titulo: 'MISTURA RICA · PASSO À FRENTE · FULL POWER',
    texto: 'Ajustar: Mistura Rica; Passo todo à frente (mínimo); Potência toda à frente (Full Power).',
  },
  {
    id: 4,
    titulo: '"MEIA BOLINHA ESPIRRADA" + LIMPAR A AERONAVE',
    texto: 'Aliviar um pouco mais o pedal e buscar "meia bolinha espirrada": ausência de derrapagem e máxima performance. Com o motor identificado e a aeronave controlada, recolher trem de pouso e flaps. Velocidade mínima: Vyse (blue line = 105 MPH – 91 kt).',
  },
]

export const REGRAS_CURVAS = [
  'Evitar curvas a baixa altura (abaixo de 400 pés AGL), próximo à VMCA e, sobretudo, para o lado do motor ruim — "Raise the dead engine".',
  'A Blue Line é uma velocidade bastante segura para curvar, independentemente do lado requerido.',
  'Executar as curvas de maneira suave e coordenada, evitando passar da curva padrão.',
  'Evitar curvas com inclinação acima de 30° voando monomotor.',
]

export const TRAFEGO_NOTAS = [
  'O trem de pouso deverá ser baixado normalmente no travess da cabeceira.',
  'A aplicação de flaps se dará na curta final.',
  'O circuito deve ser feito de modo que, na curta final, seja possível reduzir gradativamente o motor e eliminar a potência assimétrica.',
]

export const IFR_PASSOS = [
  'Continuar a navegação conforme o procedimento publicado.',
  'Caso esteja IMC, buscar cumprir cada fase do procedimento como se estivesse bimotor.',
]
