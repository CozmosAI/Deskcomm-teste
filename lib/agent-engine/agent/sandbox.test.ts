import { describe, expect, it, vi } from "vitest";

import { loadAgentVersionConfig } from "./agent-config";
import { runAgentPreview } from "./inbound-turn";
import { testAgentVersion } from "./sandbox";
import { withModelCallAbortSignal } from "../edge/llm/run-model-call";

vi.mock("./agent-config", () => ({
  loadAgentVersionConfig: vi.fn(async () => ({ agentId: "agent-1" })),
}));
vi.mock("./inbound-turn", () => ({
  runAgentPreview: vi.fn(async () => undefined),
}));
vi.mock("../edge/llm/run-model-call", () => ({
  withModelCallAbortSignal: vi.fn(async (_signal: AbortSignal, operacao: () => Promise<void>) =>
    operacao(),
  ),
}));

describe("testAgentVersion", () => {
  it("mantém o teto do servidor em todas as chamadas de modelo do preview", async () => {
    const controller = new AbortController();

    await testAgentVersion({} as never, {} as never, {
      organizationId: "22222222-2222-4222-8222-222222222222",
      agentId: "33333333-3333-4333-8333-333333333333",
      versionId: "44444444-4444-4444-8444-444444444444",
      runId: "run-1",
      sampleMessage: "oi",
      channelId: null,
      abortSignal: controller.signal,
    });

    expect(loadAgentVersionConfig).toHaveBeenCalledOnce();
    expect(withModelCallAbortSignal).toHaveBeenCalledWith(controller.signal, expect.any(Function));
    expect(runAgentPreview).toHaveBeenCalledOnce();
  });
});
