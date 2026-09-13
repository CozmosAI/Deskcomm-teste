/**
 * Tema Azul — TDD RED → GREEN
 *
 * Exige:
 *  1. Semente/accent padrão do produto é #1447e6 (não #506d48 verde)
 *  2. Rampa de 11 stops derivada de #1447e6 é coerente (stop K é #1447e6)
 *  3. REGUA_DO_PRODUTO não contém nenhum stop verde da Sage
 *  4. globals.css não tem os hexes verde de marca no bloco :root nem no dark
 *  5. CORES_DA_MARCA e MarcaDoProduto usam azul, não verde
 *  6. tokens.ts palette sage foi substituída ou não é mais a active palette
 *
 * Os testes de CONTRASTE, RAMPA e BRANDING-SAIDA já vigiam a forma;
 * este arquivo vigia a COR CONCRETA escolhida para o produto.
 */

import { readFileSync, readdirSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { razaoDeContraste } from "@/lib/branding/contraste";
import { CORES_DA_MARCA } from "@/lib/branding/desenho";
import { rampaDeSemente } from "@/lib/branding/rampa";
import { REGUA_DO_PRODUTO } from "@/lib/branding/regua-do-produto";

const ROOT = path.resolve(__dirname, "../..");

// ── helpers ───────────────────────────────────────────────────────────────────

function lerCss(): string {
  return readFileSync(path.join(ROOT, "app/globals.css"), "utf-8");
}

function arquivosTsx(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const absoluto = path.join(dir, entrada.name);
    if (entrada.isDirectory()) return arquivosTsx(absoluto);
    return entrada.isFile() && entrada.name.endsWith(".tsx") ? [absoluto] : [];
  });
}

/** Extrai o bloco :root do globals.css */
function blocoRoot(css: string): string {
  const inicio = css.indexOf(":root {");
  const fim = css.indexOf("}\n\n[data-theme", inicio);
  return css.slice(inicio, fim);
}

/** Extrai o bloco [data-theme="dark"] do globals.css */
function blocoDark(css: string): string {
  const inicio = css.indexOf('[data-theme="dark"] {');
  // termina no próximo bloco (data-theme="light"] ou fim do dark)
  const fim = css.indexOf("\n}\n\n/*", inicio);
  return css.slice(inicio, fim > inicio ? fim : css.length);
}

// ── constantes dos dois mundos ─────────────────────────────────────────────

/** A semente que o produto DEVE usar agora: azul */
const SEMENTE_AZUL = "#1447e6";

/** Cor verde que NÃO deve mais aparecer como accent do produto */
const VERDE_SEMENTE = "#506d48";
/** Paradas verde adjacentes que identificam a rampa Sage */
const VERDE_RAMPA = ["#82a077", "#67885d", "#41573b", "#374731", "#2f3c2b", "#171f15", "#a4ba9a", "#c8d6c1", "#e4ebe0", "#f3f6f1"];

// ── 1. REGUA_DO_PRODUTO deve usar rampa azul ──────────────────────────────────

describe("REGUA_DO_PRODUTO — paleta azul", () => {
  it("o stop K (índice 6) é #1447e6", () => {
    expect(REGUA_DO_PRODUTO.rampaDoProduto[6]).toBe(SEMENTE_AZUL);
  });

  it("não tem nenhum stop da rampa Sage verde", () => {
    const stops = [...REGUA_DO_PRODUTO.rampaDoProduto];
    for (const verdeStop of [VERDE_SEMENTE, ...VERDE_RAMPA]) {
      expect(stops, `stop verde ${verdeStop} ainda presente`).not.toContain(verdeStop);
    }
  });

  it("a rampa derivada de #1447e6 coincide com a da régua (stop 6)", () => {
    const derivada = rampaDeSemente(SEMENTE_AZUL);
    // stop 6 é a âncora — deve ser idêntica
    expect(derivada[6]).toBe(SEMENTE_AZUL);
    // todos os 11 stops devem existir
    expect(derivada).toHaveLength(11);
  });
});

// ── 2. globals.css — accent stops devem ser azul, não verde ──────────────────

describe("globals.css — tokens de accent são azul", () => {
  const css = lerCss();
  const root = blocoRoot(css);
  const dark = blocoDark(css);

  it(":root tem --color-accent-600: #1447e6", () => {
    expect(root).toContain("--color-accent-600: #1447e6");
  });

  it(":root não tem a semente verde como accent", () => {
    // #506d48 nunca deve aparecer como valor de --color-accent-NNN no :root
    expect(root).not.toMatch(/--color-accent-\d+:\s*#506d48/);
  });

  it("dark não tem --color-accent-600: #506d48", () => {
    expect(dark).not.toMatch(/--color-accent-600:\s*#506d48/);
  });

  it("dark tem --color-accent apontando para stop 400 azul", () => {
    // no dark, --color-accent usa stop 400 (mais claro para contraste)
    expect(dark).toContain("--color-accent: var(--color-accent-400)");
  });

  it("dark usa foreground escuro com contraste AA sobre o azul 400", () => {
    expect(dark).toContain("--color-accent-fg: #161510");
    expect(razaoDeContraste("#161510", "#5b8cff")).toBeGreaterThanOrEqual(4.5);
  });

  it("tokens de sucesso também usam azul nos temas claro e escuro", () => {
    expect(root).toContain("--color-success: #1447e6");
    expect(dark).toContain("--color-success: #5b8cff");
    for (const verde of ["#5a8a5f", "#41673f", "#82a077", "#a4ba9a"]) {
      expect(root).not.toContain(verde);
      expect(dark).not.toContain(verde);
    }
  });
});

describe("UI publicada — nenhum estado visual usa verde hardcoded", () => {
  it("app e components usam tokens semânticos, não classes green/emerald", () => {
    const arquivos = [
      ...arquivosTsx(path.join(ROOT, "app")),
      ...arquivosTsx(path.join(ROOT, "components")),
    ];
    const residuos = arquivos.flatMap((arquivo) =>
      readFileSync(arquivo, "utf-8")
        .split("\n")
        .flatMap((linha, indice) =>
          /(?:green|emerald)-\d/.test(linha)
            ? [`${path.relative(ROOT, arquivo)}:${indice + 1}`]
            : [],
        ),
    );
    expect(residuos).toEqual([]);
  });
});

// ── 3. CORES_DA_MARCA — símbolo deve ser azul ─────────────────────────────────

describe("CORES_DA_MARCA — símbolo é azul", () => {
  it("claro: símbolo não é mais #506d48 (verde)", () => {
    expect(CORES_DA_MARCA.claro.simbolo).not.toBe("#506d48");
  });

  it("claro: símbolo é #1447e6 (stop 600 azul)", () => {
    expect(CORES_DA_MARCA.claro.simbolo).toBe(SEMENTE_AZUL);
  });

  it("escuro: símbolo não é mais #82a077 (verde claro)", () => {
    expect(CORES_DA_MARCA.escuro.simbolo).not.toBe("#82a077");
  });
});

// ── 4. MarcaDoProduto — classes de cor são azul, não verde ───────────────────

describe("MarcaDoProduto.tsx — CLASSES_DE_COR usam azul", () => {
  it("SIMBOLO_CLARO_ESCURO não contém verde #506d48", () => {
    // importado via arquivo porque é constante de módulo
    const src = readFileSync(
      path.join(ROOT, "components/branding/MarcaDoProduto.tsx"),
      "utf-8",
    );
    expect(src).not.toContain("#506d48");
  });

  it("SIMBOLO_CLARO_ESCURO contém #1447e6", () => {
    const src = readFileSync(
      path.join(ROOT, "components/branding/MarcaDoProduto.tsx"),
      "utf-8",
    );
    expect(src).toContain("#1447e6");
  });
});

// ── 5. tokens.ts — paleta ativa não é Sage verde ─────────────────────────────

describe("app/design/lib/tokens.ts — paleta Blue existe", () => {
  it("o arquivo tem uma entrada 'blue' ou o stop 600 da sage foi substituído", () => {
    const src = readFileSync(
      path.join(ROOT, "app/design/lib/tokens.ts"),
      "utf-8",
    );
    // ou a palette "blue" existe, ou o 600 da sage já é azul
    const temBlue = src.includes('"blue"') || src.includes("600: \"#1447e6\"");
    expect(temBlue).toBe(true);
  });
});
