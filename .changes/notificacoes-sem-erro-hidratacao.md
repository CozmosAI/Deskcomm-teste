---
impacto: nada_mudou
secao: corrigido
titulo: Notificações hidratam sem descartar a interface
---

A tela de Notificações passa a usar um snapshot determinístico no servidor e na primeira hidratação. A permissão real do navegador continua sendo aplicada logo após a hidratação, sem o erro React #418 nem descarte da árvore renderizada.
