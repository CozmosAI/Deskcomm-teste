---
impacto: mudanca_visivel
secao: alterado
titulo: Rebrand completo para Task CRM
---

O produto passa a se chamar **Task CRM** em toda a interface: sidebar, login, e-mails de
autenticação do Supabase, título da aba do navegador, alerta de orçamento de IA e o User-Agent
registrado na Nuvemshop. A identidade visual azul `#1447e6` permanece. A catraca de marca
(`tests/unit/branding.test.ts`) foi atualizada para vigiar o novo nome e seguir impedindo
vazamento de marca hardcoded em código user-facing.

Os identificadores técnicos que SÃO contratos de integração — header `X-Deskcomm-Signature`
de webhooks, cookie de sessão `sb-deskcomm-auth`, chave de tema `deskcomm-theme` no
localStorage e o nome do servidor MCP — **não foram renomeados de propósito**: mudá-los
invalidaria webhooks de integradores ativos, deslogaria todos os usuários e quebraria
conexões MCP já configuradas. Eles ficam guardados na lista `MARCA_CONGELADA` como
`PROTOCOLO`/`INFRA`, com o motivo escrito ao lado.
