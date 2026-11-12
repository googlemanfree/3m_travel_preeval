import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { askBilanAssistant, bilanAiAvailable } from "./services/bilanAi";

const messages = [{ role: "system", content: "Relis." }, { role: "user", content: "Texte du bilan" }];
const ok = (content: string) => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content } }] }) });

beforeEach(() => {
  delete process.env.PERPLEXITY_API_KEY;
  delete process.env.OPENAI_API_KEY;
});
afterEach(() => {
  delete process.env.PERPLEXITY_API_KEY;
  delete process.env.OPENAI_API_KEY;
});

describe("assistant de relecture du bilan : un fournisseur suffit", () => {
  it("disponible avec Perplexity seul, avec OpenAI seul, indisponible sans aucun des deux", () => {
    expect(bilanAiAvailable()).toBe(false);
    process.env.OPENAI_API_KEY = "cle-openai-test";
    expect(bilanAiAvailable()).toBe(true);
    delete process.env.OPENAI_API_KEY;
    process.env.PERPLEXITY_API_KEY = "cle-pplx-test";
    expect(bilanAiAvailable()).toBe(true);
  });

  it("sans clé Perplexity, utilise OpenAI (sans recherche web) et nettoie la réponse", async () => {
    process.env.OPENAI_API_KEY = "cle-openai-test";
    const fetcher = vi.fn().mockResolvedValue(ok("Voici la version corrigée :\n\nBilan propre."));
    const text = await askBilanAssistant(messages, { fetcher: fetcher as unknown as typeof fetch });
    expect(text).toBe("Bilan propre.");
    expect(fetcher.mock.calls[0][0]).toBe("https://api.openai.com/v1/chat/completions");
    expect(fetcher.mock.calls[0][1].headers.Authorization).toBe("Bearer cle-openai-test");
  });

  it("si Perplexity échoue et qu'OpenAI est configuré, bascule au lieu de bloquer", async () => {
    process.env.PERPLEXITY_API_KEY = "cle-pplx-test";
    process.env.OPENAI_API_KEY = "cle-openai-test";
    const fetcher = vi.fn().mockImplementation(async (url: string) =>
      url.includes("perplexity") ? { ok: false, status: 503, json: async () => ({}) } : ok("Bilan relu."),
    );
    expect(await askBilanAssistant(messages, { fetcher: fetcher as unknown as typeof fetch })).toBe("Bilan relu.");
    expect(fetcher.mock.calls.some(([url]) => String(url).includes("openai"))).toBe(true);
  });

  it("si Perplexity échoue seul, l'erreur remonte (pas de repli fantôme)", async () => {
    process.env.PERPLEXITY_API_KEY = "cle-pplx-test";
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });
    await expect(askBilanAssistant(messages, { fetcher: fetcher as unknown as typeof fetch })).rejects.toThrow(/503/);
  });

  it("aucune clé : message explicite", async () => {
    await expect(askBilanAssistant(messages)).rejects.toThrow(/manquante/);
  });
});
