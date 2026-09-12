import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const fonte = readFileSync(join(__dirname, "..", "..", "next.config.ts"), "utf8");

describe("Permissions-Policy compatível com navegadores atuais", () => {
  it("mantém bloqueios suportados sem declarar a feature obsoleta notifications", () => {
    expect(fonte).toContain('camera=(), microphone=(self), geolocation=()');
    expect(fonte).not.toMatch(/notifications=\(/);
  });
});
