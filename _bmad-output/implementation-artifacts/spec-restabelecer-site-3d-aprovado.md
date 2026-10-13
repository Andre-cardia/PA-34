---
title: 'Restabelecer o site com o modelo 3D aprovado e preservar o painel novo'
type: 'bugfix'
created: '2026-09-25'
status: 'done'
route: 'oneshot'
baseline_commit: 'NO_VCS'
review_loop_iteration: 0
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Corrigir imediatamente a regressão percebida ao abrir o site: o servidor em 3000 foi iniciado em `app/`, que não contém a entrega 3D aprovada de `work-modulo-3d/`. Voltar a servir a aplicação com as nove camadas Blender e os 68 componentes aprovados, preservando integralmente suas fontes e ativos; nenhuma reconstrução de modelo é necessária. Manter o painel 2D recém-entregue acessível nessa aplicação por integração cirúrgica do redesenho do cockpit, sem apagar correções próprias de `work-modulo-3d/`. Não sincronizar outras páginas nem dados técnicos entre aplicações.

</frozen-after-approval>

## Implementation Notes

- Causa comprovada pelo processo Vite de porta 3000: cwd `app/`. As 22 fontes de `_bmad-output/verificacao-final-retomada/fontes-sha256.json` continuam byte a byte iguais; o GLB mantém SHA-256 `11776870db30eca87b4fefc1060315b245c3df1ccff37975c11aaa643e15c71a`.
- Correção operacional: interromper somente o job iniciado nesta sessão, iniciar `npm --prefix work-modulo-3d run dev -- --host 127.0.0.1 --port 3000 --strictPort` e reabrir `/modelo-3d`.
- Escopo de código restrito ao cockpit em `work-modulo-3d/`: arte, mapa, hotspots/rótulos e centro mobile. Conferir diffs para preservar correções próprias do destino antes de transplantar mudanças.
- Verificar novamente os hashes 3D, o GLB servido por HTTP, build/verify do destino e a navegação 3D/cockpit. Sem operações Git ou publicação remota.
- Migração concluída dos três componentes de desenho e somente centro mobile na página. Preservadas correções exclusivas do destino para URL reativa, remoção de seleção e resize com zoom. Nenhum arquivo de 3D alterado.
- `npm --prefix work-modulo-3d run verify` passou: build, 39 negativos, loader, materiais, foco e contratos. Navegador aprovou nove camadas, 68 componentes, explosão/raio-X e fallbacks em três larguras. Cockpit também passou no mesmo servidor.
- O ensaio original de cockpit falhou porque pressupunha `aria-label`; o destino utiliza corretamente `aria-labelledby`. Corrigido o verificador para resolver o nome acessível, aguardar o drawer e suportar múltiplos IDs; não alterado o Drawer da aplicação.
- Teste adicional de integração passou: 22 hashes iguais, GLB HTTP aprovado, home com canvas/modelo, navegação SPA 3D → cockpit → 3D, deep-links consecutivos/remoção e resize sem recarregar. Evidências em `../visual-review/restabelecimento-3d/README.md`.

## Review Triage Log

- R1 — medium, diferido: mapa histórico descreve aplicação antiga, favorecendo erro de pasta. Registrada orientação operacional correta na entrega; atualização ampla de contexto/documentação diferida no ledger.
- R2 — low, corrigido: o verificador de cockpit mantém porta padrão histórica 4175; comando explícito para 3000 e verificação de identidade pelo hash HTTP foram documentados e executados.
- R3 — low, corrigido: aceitar qualquer h3 esconderia falha de nome acessível; o verificador agora resolve os IDs de `aria-labelledby` antes de `aria-label`, sem fallback arbitrário.
- R4 — medium, corrigido: teste anterior recarregava a página entre links; teste adicional confirmou mudança de instrumento e foco sem reload e fechamento ao remover a query.
- R5 — low, corrigido: teste anterior recarregava depois de resize; ensaio adicional redimensionou durante seleção e confirmou preservação de ficha e palco visível.
- R6 — medium, corrigido: faltava ida/volta real entre módulos; ensaio clicou links SPA, retornou ao modelo e acionou camada sem drawer residual.
- R7 — low, corrigido: faltava entrada pela home; ensaio confirmou canvas e solicitação do GLB aprovado, navegando em seguida ao módulo 3D.

