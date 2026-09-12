import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import {
  CHANNEL_SESSIONS_QUERY_KEY,
  removeChannelSessionFromCache,
  updateChannelSessionInCache,
  type ChannelSession,
} from "./useChannelSessions";

function canal(over: Partial<ChannelSession> = {}): ChannelSession {
  return {
    id: "canal-1",
    waha_session_name: "sessao-1",
    display_name: "Vendas",
    phone_number: "5511999999999",
    status: "WORKING",
    status_reason: null,
    last_health_check_at: null,
    last_status_change_at: null,
    daily_message_limit: 250,
    is_warmup_complete: true,
    created_at: "2026-09-12T00:00:00.000Z",
    ...over,
  };
}

function cacheCom(canais: ChannelSession[]) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(CHANNEL_SESSIONS_QUERY_KEY, { data: canais });
  return queryClient;
}

describe("cache compartilhado dos canais após mutação", () => {
  it("remove o canal excluído imediatamente do card e do contador", () => {
    const queryClient = cacheCom([canal(), canal({ id: "canal-2" })]);

    removeChannelSessionFromCache(queryClient, "canal-1");

    expect(queryClient.getQueryData(CHANNEL_SESSIONS_QUERY_KEY)).toEqual({
      data: [expect.objectContaining({ id: "canal-2" })],
    });
  });

  it("aplica o estado devolvido pela reconexão imediatamente", () => {
    const queryClient = cacheCom([canal({ status: "FAILED", status_reason: "connection_repair_required" })]);

    updateChannelSessionInCache(queryClient, {
      id: "canal-1",
      status: "STARTING",
      status_reason: null,
    });

    expect(queryClient.getQueryData(CHANNEL_SESSIONS_QUERY_KEY)).toEqual({
      data: [expect.objectContaining({ id: "canal-1", status: "STARTING", status_reason: null })],
    });
  });
});
