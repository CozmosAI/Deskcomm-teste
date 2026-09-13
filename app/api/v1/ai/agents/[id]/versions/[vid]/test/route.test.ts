/**
 * Runtime real do "Testar agente" (issue #71).
 *
 * O preview usa o mesmo core e as mesmas dependências de um turno normal. Este
 * teste fixa o contrato de falha desse caminho: o run guarda um checkpoint
 * útil e a pessoa recebe orientação legível, sem detalhes internos do provider.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLE_RANK, type AuthUser, type Role } from "@/lib/auth/types";
import { testAgentVersion } from "@/lib/agent-engine/agent/sandbox";
import { requestTurnDeps } from "@/lib/agent-engine/agent/request-deps";
import { getRequestPool } from "@/lib/agent-engine/db/request-pool";
import { logger } from "@/lib/logger";

vi.mock("@/lib/auth/require-role", () => ({ requireRole: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/audit", () => ({ audit: vi.fn(async () => undefined) }));
vi.mock("@/lib/agent-engine/agent/sandbox", () => ({
  testAgentVersion: vi.fn(async () => {
    throw new Error("AI_GATEWAY_API_KEY ausente");
  }),
}));
vi.mock("@/lib/agent-engine/agent/request-deps", () => ({ requestTurnDeps: vi.fn() }));
vi.mock("@/lib/agent-engine/db/request-pool", () => ({ getRequestPool: vi.fn() }));
vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

const ORG = "22222222-2222-4222-8222-222222222222";
const USER = "11111111-1111-4111-8111-111111111111";
const AGENT = "33333333-3333-4333-8333-333333333333";
const VERSION = "44444444-4444-4444-8444-444444444444";

function stubAdmin(
  atualizacoes: Record<string, unknown>[],
  errosDeUpdate: Array<{ code: string; message: string } | null> = [],
) {
  return {
    from: (table: string) => {
      if (table === "ai_agent_versions") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: {
                      id: VERSION,
                      agent_id: AGENT,
                      organization_id: ORG,
                      system_prompt: "oi",
                      provider: "anthropic",
                      model: "claude-sonnet-4-6",
                      channel_session_id: null,
                      max_steps: 3,
                      token_budget: 1000,
                      cost_budget_cents: 100,
                      tool_ids: [],
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      // ai_agent_runs
      return {
        insert: () => ({
          select: () => ({ single: async () => ({ data: { id: "run-1" }, error: null }) }),
        }),
        update: (payload: Record<string, unknown>) => {
          atualizacoes.push(payload);
          const chain = {
            eq: () => chain,
            then: (ok: (value: { error: { code: string; message: string } | null }) => unknown) =>
              Promise.resolve({ error: errosDeUpdate.shift() ?? null }).then(ok),
          };
          return chain;
        },
      };
    },
  };
}

describe("POST .../versions/:vid/test — core compartilhado", () => {
  const atualizacoes: Record<string, unknown>[] = [];
  const requestPool = { query: vi.fn() };
  const turnDeps = {};

  beforeEach(() => {
    vi.clearAllMocks();
    atualizacoes.length = 0;
    const user: AuthUser = {
      id: USER,
      email: "a@example.com",
      full_name: null,
      avatar_url: null,
      is_platform_admin: false,
      idioma: "pt-BR" as const,
      organizations: [{ organization_id: ORG, organization_name: "Org", role: "admin" }],
    };
    vi.mocked(requireRole).mockImplementation(async (min: Role) =>
      ROLE_RANK["admin"] >= ROLE_RANK[min]
        ? { ok: true, user, org: { orgId: ORG, name: "Org", role: "admin" } }
        : ({ ok: false, response: null } as never),
    );
    vi.mocked(createAdminClient).mockReturnValue(stubAdmin(atualizacoes) as never);
    vi.mocked(getRequestPool).mockReturnValue(requestPool as never);
    vi.mocked(requestTurnDeps).mockReturnValue(turnDeps as never);
  });

  it("falha do core vira checkpoint e orientação legível", async () => {
    const { POST } = await import("./route");
    const req = new NextRequest("http://localhost/x", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sample_message: "oi" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: AGENT, vid: VERSION }) });
    const body = (await res.json()) as { error?: { code?: string; message?: string } };

    expect(testAgentVersion).toHaveBeenCalledWith(
      requestPool,
      turnDeps,
      expect.objectContaining({
        organizationId: ORG,
        agentId: AGENT,
        versionId: VERSION,
        runId: "run-1",
        sampleMessage: "oi",
      }),
    );
    expect(res.status).toBe(422);
    expect(body.error).toMatchObject({
      code: "preview_failed",
      message: "Não foi possível executar o teste. Confira modelo, credencial e materiais do agente.",
    });
    expect(body.error?.message).not.toContain("AI_GATEWAY_API_KEY");
    expect(atualizacoes).toContainEqual(expect.objectContaining({
      status: "failed",
      completed_at: expect.any(String),
      error_code: "preview_failed",
    }));
  });

  it("registra diagnóstico correlacionável sem segredo, PII ou conteúdo da amostra", async () => {
    const mensagemPrivada = "conteúdo pessoal da amostra";
    vi.mocked(testAgentVersion).mockRejectedValueOnce(
      Object.assign(
        new Error(
          `Google recusou api_key=AIza1234567890SECRET para a@example.com, +55 1199999-9999: ${mensagemPrivada}`,
        ),
        { statusCode: 401 },
      ),
    );
    const { POST } = await import("./route");
    const req = new NextRequest("http://localhost/x", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sample_message: mensagemPrivada }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: AGENT, vid: VERSION }) });
    const body = await res.text();

    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      "ai agent preview failed",
      expect.objectContaining({
        request_id: expect.any(String),
        organization_id: ORG,
        agent_id: AGENT,
        agent_version_id: VERSION,
        run_id: "run-1",
        error_code: "credencial_recusada",
        http_status: 401,
        error_fingerprint: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    );
    const registro = JSON.stringify(vi.mocked(logger.error).mock.calls[0]);
    for (const privado of [
      "AIza1234567890SECRET",
      "a@example.com",
      "+55 1199999-9999",
      mensagemPrivada,
    ]) {
      expect(registro).not.toContain(privado);
      expect(body).not.toContain(privado);
    }
  });

  it("timeout do servidor terminaliza o run mesmo com o cliente desconectado", async () => {
    const timeoutDoServidor = new AbortController();
    timeoutDoServidor.abort(new DOMException("preview_timeout", "TimeoutError"));
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout").mockReturnValue(timeoutDoServidor.signal);
    let signalRecebido: AbortSignal | undefined;
    vi.mocked(testAgentVersion).mockImplementationOnce(async (_pool, _deps, input) => {
      signalRecebido = (input as typeof input & { abortSignal?: AbortSignal }).abortSignal;
      throw signalRecebido?.reason ?? new Error("sandbox sem AbortSignal do servidor");
    });
    const cliente = new AbortController();
    const { POST } = await import("./route");
    const req = new NextRequest("http://localhost/x", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sample_message: "oi" }),
      signal: cliente.signal,
    });
    cliente.abort();

    const res = await POST(req, { params: Promise.resolve({ id: AGENT, vid: VERSION }) });

    expect(timeoutSpy).toHaveBeenCalledWith(60_000);
    expect(signalRecebido).toBe(timeoutDoServidor.signal);
    expect(signalRecebido).not.toBe(req.signal);
    expect(res.status).toBe(422);
    expect(atualizacoes).toContainEqual(expect.objectContaining({
      status: "failed",
      completed_at: expect.any(String),
      error_code: "preview_failed",
    }));
    timeoutSpy.mockRestore();
  });

  it("sucesso usa o estado terminal aceito pelo schema do run", async () => {
    vi.mocked(testAgentVersion).mockResolvedValueOnce({
      candidates: [{ body: "Resposta sintética" }],
      proposals: [],
    } as never);
    const { POST } = await import("./route");
    const req = new NextRequest("http://localhost/x", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sample_message: "oi" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: AGENT, vid: VERSION }) });

    expect(res.status).toBe(200);
    expect(atualizacoes).toContainEqual(expect.objectContaining({
      status: "completed",
      completed_at: expect.any(String),
    }));
    expect(atualizacoes).not.toContainEqual(expect.objectContaining({ status: "ok" }));
  });

  it("falha ao terminalizar é tentada novamente e fica observável sem mensagem do banco", async () => {
    const erroDoBanco = { code: "DB_TIMEOUT", message: "detalhe privado do banco" };
    vi.mocked(createAdminClient).mockReturnValue(
      stubAdmin(atualizacoes, [erroDoBanco, erroDoBanco]) as never,
    );
    const { POST } = await import("./route");
    const req = new NextRequest("http://localhost/x", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sample_message: "oi" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: AGENT, vid: VERSION }) });
    const body = await res.text();

    expect(res.status).toBe(500);
    expect(atualizacoes.filter((u) => u.status === "failed")).toHaveLength(2);
    expect(logger.error).toHaveBeenCalledWith(
      "ai agent preview run finalization failed",
      expect.objectContaining({
        request_id: expect.any(String),
        organization_id: ORG,
        agent_id: AGENT,
        agent_version_id: VERSION,
        run_id: "run-1",
        terminal_status: "failed",
        database_error_code: "DB_TIMEOUT",
        attempts: 2,
      }),
    );
    const registro = JSON.stringify(vi.mocked(logger.error).mock.calls);
    expect(registro).not.toContain(erroDoBanco.message);
    expect(body).not.toContain(erroDoBanco.message);
  });
});

// Este teste isola o handler; autoridade de suporte é exercitada na suíte própria.
vi.mock("@/lib/impersonate/support", () => ({
  requireSupportWrite: vi.fn(async () => null),
}));
