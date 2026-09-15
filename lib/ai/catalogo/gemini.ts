/**
 * CATÁLOGO DA API DO GEMINI, TRADUZIDO PARA O QUE O SISTEMA SABE GUARDAR.
 *
 * Diferente da OpenRouter, o Google AI Studio tem modelos que não passam pelo
 * proxy da OpenRouter (ou passam com limitações). Este módulo busca direto da
 * fonte: `https://generativelanguage.googleapis.com/v1beta/models`.
 *
 * Por que ter os dois (OpenRouter + Gemini):
 * - OpenRouter: tem Claude, GPT, Llama, Mistral, etc.
 * - Gemini direto: tem os modelos mais novos do Google (3.x) com preços atualizados
 *   e sem as restrições da OpenRouter para contas free.
 */

/** Modelo como a API do Gemini devolve. */
export interface ModeloDoGemini {
  name: string; // ex: "models/gemini-3.5-flash"
  baseModelId: string; // ex: "gemini-3.5-flash"
  version: string;
  displayName: string;
  description: string;
  inputTokenLimit: number;
  outputTokenLimit: number;
  supportedGenerationMethods: string[];
  temperature: number;
  topP: number;
  topK: number;
}

/** Uma linha pronta para o upsert em `ai_models`. */
export interface LinhaDeCatalogoGemini {
  provider: string;
  model_id: string;
  display_name: string;
  description: string | null;
  context_window: number | null;
  input_price_per_million_cents: number | null;
  output_price_per_million_cents: number | null;
  supports_tools: boolean;
  supports_vision: boolean;
  source: string;
}

export const FONTE_GEMINI = "gemini";

/**
 * Tabela de preços do Gemini (set/2026). Fonte: https://ai.google.dev/gemini-api/docs/pricing
 * Em centavos por milhão de tokens. `null` = modelo não tem preço público separado.
 */
const PRECOS_GEMINI: Record<string, { input: number | null; output: number | null }> = {
  // Gemini 3.5 Flash-Lite (mais barato)
  "gemini-3.5-flash-lite": { input: 30, output: 250 }, // $0.30 / $2.50
  // Gemini 3.8 Flash
  "gemini-3.8-flash": { input: 75, output: 375 }, // $0.75 / $3.75
  // Gemini 3.7 Flash
  "gemini-3.7-flash": { input: 75, output: 375 }, // $0.75 / $3.75
  // Gemini 3.6 Flash
  "gemini-3.6-flash": { input: 75, output: 375 }, // $0.75 / $3.75
  // Gemini 3.5 Flash
  "gemini-3.5-flash": { input: 150, output: 900 }, // $1.50 / $9.00
  // Gemini 3.1 Flash-Lite
  "gemini-3.1-flash-lite": { input: 25, output: 150 }, // $0.25 / $1.50
  "gemini-3.1-flash": { input: 50, output: 300 }, // $0.50 / $3.00
  "gemini-3.1-pro-preview": { input: 200, output: 1200 }, // $2.00 / $12.00
  // Gemini 2.5 (legacy mas ainda usado)
  "gemini-2.5-flash-lite": { input: 10, output: 40 }, // $0.10 / $0.40
  "gemini-2.5-flash": { input: 30, output: 250 }, // $0.30 / $2.50
  "gemini-2.5-pro": { input: 125, output: 1000 }, // $1.25 / $10.00
  // Gemini 3 Flash Preview (legacy)
  "gemini-3-flash-preview": { input: 50, output: 300 },
  // Embeddings
  "gemini-embedding-2": { input: 20, output: null }, // $0.20 por milhão
  // Image generation
  "gemini-3.1-flash-image": { input: 50, output: 300 }, // texto = preço base
  "gemini-3.1-flash-lite-image": { input: 25, output: 150 },
  "gemini-3-pro-image": { input: 200, output: 1200 },
  // Video
  "veo-3.1-generate-preview": { input: null, output: null }, // por segundo, não por token
  // TTS
  "gemini-2.5-flash-preview-tts": { input: 50, output: 1000 },
  "gemini-2.5-pro-preview-tts": { input: 100, output: 2000 },
  // Live
  "gemini-2.5-flash-native-audio-preview-12-2025": { input: 50, output: 200 },
  "gemini-3.1-flash-live-preview": { input: 75, output: 450 },
  "gemini-3.5-live-translate-preview": { input: 350, output: 2100 },
  "gemini-3.5-transcribe": { input: 200, output: 1200 },
  "gemini-3.5-transcribe-live": { input: 350, output: 2100 },
  // Omni (video gen)
  "gemini-omni-1.1-flash": { input: 150, output: 900 },
  "gemini-omni-flash-preview": { input: 150, output: 900 },
};

/** Modelos que suportam tool calling (function calling). */
const MODELOS_COM_TOOLS: Set<string> = new Set([
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.1-pro-preview",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
]);

/** Modelos que aceitam input de imagem (vision). */
const MODELOS_COM_VISION: Set<string> = new Set([
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.1-pro-preview",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
  "gemini-3.1-flash-image",
  "gemini-3.1-flash-lite-image",
  "gemini-3-pro-image",
  "gemini-2.5-flash-native-audio-preview-12-2025",
  "gemini-3.1-flash-live-preview",
]);

/** Remove o prefixo "models/" que a API do Gemini manda. */
function idLimpo(nomeComPrefixo: string): string {
  return nomeComPrefixo.replace(/^models\//, "");
}

/** Traduz UM modelo do Gemini. `null` quando não é utilizável (ex: deprecated). */
export function traduzirModeloGemini(m: ModeloDoGemini): LinhaDeCatalogoGemini | null {
  const id = idLimpo(m.name ?? "");
  if (id === "") return null;

  // Ignora modelos que não são de chat/generation (a API lista TUDO)
  const metodos = m.supportedGenerationMethods ?? [];
  if (!metodos.includes("generateContent") && !metodos.includes("streamGenerateContent")) {
    return null;
  }

  const precos = PRECOS_GEMINI[id] ?? { input: null, output: null };

  return {
    provider: "google",
    model_id: id,
    display_name: m.displayName?.trim() || id,
    description: m.description?.trim()?.slice(0, 300) || null,
    context_window: m.inputTokenLimit ?? null,
    input_price_per_million_cents: precos.input,
    output_price_per_million_cents: precos.output,
    supports_tools: MODELOS_COM_TOOLS.has(id),
    supports_vision: MODELOS_COM_VISION.has(id),
    source: FONTE_GEMINI,
  };
}

/** Traduz o catálogo inteiro, removendo duplicatas. */
export function traduzirCatalogoGemini(modelos: readonly ModeloDoGemini[]): LinhaDeCatalogoGemini[] {
  const porId = new Map<string, LinhaDeCatalogoGemini>();
  for (const m of modelos) {
    const linha = traduzirModeloGemini(m);
    if (linha === null) continue;
    porId.set(linha.model_id, linha);
  }
  return [...porId.values()];
}

/** Busca o catálogo da API do Gemini. Precisa de `GEMINI_API_KEY` no env. */
export async function buscarCatalogoGemini(apiKey: string): Promise<ModeloDoGemini[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    throw new Error(`Gemini API ${res.status}: ${res.statusText}`);
  }

  const data = (await res.json()) as { models?: ModeloDoGemini[] };
  return data.models ?? [];
}
