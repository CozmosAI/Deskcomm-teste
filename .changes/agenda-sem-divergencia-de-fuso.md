---
impacto: nada_mudou
secao: corrigido
titulo: Agenda hidrata corretamente em qualquer fuso
---

A grade da Agenda deixa de comparar a hora UTC do servidor com a hora local do navegador durante a hidratação. O conteúdo temporal interativo entra após a hidratação e o relógio é atualizado a cada minuto, eliminando o erro React #418 para usuários fora de UTC.
