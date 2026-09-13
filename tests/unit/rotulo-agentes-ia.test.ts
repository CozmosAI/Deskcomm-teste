import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("rótulo da tela de agentes de IA", () => {
  it("usa português correto no título e na descrição", () => {
    const pagina = readFileSync(resolve(process.cwd(), "app/app/ai/agents/page.tsx"), "utf8");

    expect(pagina).toContain('traduzir("Agentes de IA", idioma)');
    expect(pagina).toContain("Configure o comportamento dos agentes que respondem no WhatsApp.");
    expect(pagina).not.toContain("Agents de IA");
    expect(pagina).not.toContain("dos agents");
  });
});
