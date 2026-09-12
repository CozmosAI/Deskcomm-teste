import { describe, expect, it } from "vitest";
import { describeWahaServer } from "./waha-server";

describe("capacidade medida do servidor, não inferência comercial", () => {
  it.each(["NOWEB", "noweb"])("2026.7.2 CORE/%s permite várias sessões antes do pairing", (engine) => {
    expect(describeWahaServer({ version: "2026.7.2", engine, tier: "CORE", apiKey: "nao-retornar" })).toEqual({
      version: "2026.7.2", engine: "NOWEB", tier: "CORE", multipleSessions: "supported",
    });
  });
  it.each([
    { version: "2026.7.3", engine: "NOWEB", tier: "CORE" },
    { version: "2026.7.2", engine: "WEBJS", tier: "PLUS" },
    { version: "2024.1.0", engine: "NOWEB", tier: "CORE" },
    { version: "future", tier: "CORE" },
    null,
  ])("identidade não medida permanece desconhecida: %j", (input) => {
    expect(describeWahaServer(input).multipleSessions).toBe("unknown");
  });
});
