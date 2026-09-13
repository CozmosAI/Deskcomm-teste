import { createClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { listConversationsHandler } from "@/app/api/v1/conversations/_handler";

describe("contrato PostgREST da última mensagem no preview", () => {
  it("limita um embed por conversa e preserva escopo/paginação do pai", async () => {
    let url = new URL("https://qa.invalid");
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      url = new URL(String(input));
      return new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });
    });
    const sb = createClient("https://qa.invalid", "qa-not-a-secret", { global: { fetch } });
    await listConversationsHandler(sb, {
      organization_id: "qa-org", requestId: "qa-request", actor: { type: "user", id: "qa-user" },
    }, { limit: 5, status: undefined, comando: undefined });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(url.searchParams.get("select")).toContain("latest_message:messages!messages_conversation_id_fkey(type,body,sent_at,revoked_at)");
    expect(url.searchParams.get("latest_message.limit")).toBe("1");
    expect(url.searchParams.get("latest_message.order")).toBe("sent_at.desc,created_at.desc,id.desc");
    expect(url.searchParams.get("latest_message.organization_id")).toBe("eq.qa-org");
    expect(url.searchParams.get("organization_id")).toBe("eq.qa-org");
    expect(url.searchParams.get("limit")).toBe("6");
    expect(url.searchParams.get("order")).toBe("last_message_at.desc.nullslast,id.desc");
  });
});
