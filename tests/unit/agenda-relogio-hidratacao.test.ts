import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const raiz = join(__dirname, "..", "..");
const pagina = readFileSync(join(raiz, "app", "app", "agenda", "page.tsx"), "utf8");
const cliente = readFileSync(join(raiz, "app", "app", "agenda", "_client.tsx"), "utf8");

describe("Agenda usa o mesmo relógio no SSR e na hidratação", () => {
  it("injeta no cliente o instante criado uma vez no servidor", () => {
    expect(pagina).toContain("agoraInicialIso={agora.toISOString()}");
    expect(cliente).toContain("agoraInicialIso: string");
  });

  it("não cria relógios diferentes nas props visíveis do primeiro render", () => {
    expect(cliente).not.toMatch(/agora=\{new Date\(\)\}/);
    expect(cliente).toContain("agora={agora}");
    expect(cliente).toContain("hidratado ? <AgendaInterativa");
  });
});
