// Geometria compartilhada da projeção superior do PA-34 Seneca I.

export const TOP_VIEW_PATHS = {
  fuselagem:
    'M 600 90 C 622 100 640 150 643 220 L 646 380 C 646 470 640 560 634 640 C 624 780 614 920 608 1060 L 606 1112 L 594 1112 L 592 1060 C 586 920 576 780 566 640 C 560 560 554 470 554 380 L 557 220 C 560 150 578 100 600 90 Z',
  asaEsquerda: 'M 568 470 L 96 516 L 78 524 L 78 552 L 96 558 L 568 642 Z',
  asaDireita: 'M 632 470 L 1104 516 L 1122 524 L 1122 552 L 1104 558 L 632 642 Z',
  flapEsq: 'M 556 596 L 420 576',
  flapDir: 'M 644 596 L 780 576',
  nacelaEsq:
    'M 380 330 C 396 332 408 348 410 372 L 412 560 C 412 610 400 650 380 656 C 360 650 348 610 348 560 L 350 372 C 352 348 364 332 380 330 Z',
  nacelaDir:
    'M 820 330 C 836 332 848 348 850 372 L 852 560 C 852 610 840 650 820 656 C 800 650 788 610 788 560 L 790 372 C 792 348 804 332 820 330 Z',
  estabilizador: 'M 420 938 L 780 938 L 796 948 L 796 966 L 420 966 Z',
  leme: 'M 596 880 L 604 880 L 602 1110 L 598 1110 Z',
  paraBrisa: 'M 566 252 L 634 252 L 642 296 L 558 296 Z',
  janelaEsq: 'M 560 310 L 556 520',
  janelaDir: 'M 640 310 L 644 520',
  heliceEsq: 'M 380 236 L 380 424',
  heliceDir: 'M 820 236 L 820 424',
}

export const TOP_VIEW_CIRCLES = {
  discoHeliceEsq: { cx: 380, cy: 330, r: 104 },
  discoHeliceDir: { cx: 820, cy: 330, r: 104 },
  tremEsq: { cx: 330, cy: 690, r: 16 },
  tremDir: { cx: 870, cy: 690, r: 16 },
  tremNariz: { cx: 600, cy: 640, r: 12 },
}
