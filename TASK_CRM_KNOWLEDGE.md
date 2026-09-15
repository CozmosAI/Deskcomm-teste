# TASK CRM — Conhecimento do Sistema

> Repositório oficial do produto final, operando sob marca própria. Código herdado do DeskcommCRM, com modificações ativas para qualidade de atendimento.

## Sobre o projeto
O **Task CRM** é a sua central de atendimento omnicanal própria (WhatsApp oficial, META via Cloud API e WAHA em fallback).

## Estrutura do Repositório

| Pasta | O que tem |
|-------|-----------|
| `app/` | Next.js App Router |
| `app/api/` | API REST (`route handler`) |
| `components/` | Componentes de UI |
| `lib/` | Lógica de negócio |
| `workers/` | Workers cron e fila (`Dockerfile.worker`) |

## Branding

- **Nome da interface:** Task CRM (exibido ao usuário e em emails).
- **Tema de cor:** `#1447e6` — fundo branco, foreground escuro no dark mode.
- **Marcaçōes de upstream (git);** Os componentes seguem `components/branding/MarcaDoProduto.tsx` — nunca use textos soltos (sempre via componente).

## Enviroment Variáveis Críticas (Render)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://....supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
SUPABASE_DB_URL=postgres://postgres:...
AI_CRED_AES_KEY=...
INTERNAL_CRON_SECRET=... (gerado no Render)
NEXT_PUBLIC_APP_URL=https://task-crm-v2.onrender.com
WAHA_API_BASE_URL=... (se estiver habilitado)
WAHA_API_KEY=...
```

## Rotinas e Regras

1. **Typecheck** (`pnpm tsc --noEmit`) - zero erros.
2. **Lint** (`pnpm eslint`) - zero warnings e errors.
3. **Testes** (`pnpm vitest`) - pasam na base.
4. **Deploy** — sempre merge + push pro `main`. O Render sobe em ~2min em modo observável.

## Integração WhatsApp

O modelo aprovado pelo cliente é META whatsapp. O server side usa um **pool REST intermediado** (`channels/adapters`) para não expor tokens ao browser:
   - `connect`: inicializa sessão.
   - `reconnect`: restabelece a conexão.
   - `enviarMensagem`: dispara envio e marca em `outbound_message`.
   - `webhook`: recebe mensrum turnos inbound e salva em `messages` (cascade `crm_events` filtrado via RLS).

A visao **front do navegador** usa o cliente Supabase (`createClient`) e escuta eventos somente via subscribe (`postgres_changes`).

## Futuros - Planejamento

1. Consolidar o CRM antigo (arquitetura `C:\Users\edson\Documents\CRM Novo\task-crm-work`) aqui:
   - Copiar o agente SQL para o novo projeto
   - Remover triggers duplicados e revalidar as relações
   - Finalizar o design visual completo (está em andamento o tema azul)
2. Implementar automacao de resposta AI (WHILE YOU WAIT / SLEEPING mode)
3. Webhook logs (ate 40 envios por request, throttle 90 req/seg)

## Repositórios Relacionados

- **Upstream/Desenvolvimento continuo:** `melgarafael/DeskcommCRM`  
- **Ferramentas Internas:** `CozmosAI/CRM Novo` não é publico

---

**Edson & Equipe TASK**