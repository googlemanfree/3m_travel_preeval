import { describe, expect, it } from "vitest";

describe("configuration Gemini", () => {
  it("accepte la clé serveur pour interroger la liste des modèles", async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    expect(apiKey).toBeTruthy();
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey!)}`);
    const body = await response.json().catch(() => ({})) as { models?: unknown[]; error?: { message?: string } };
    expect(response.ok, body.error?.message ?? "La vérification Gemini a échoué").toBe(true);
    expect(Array.isArray(body.models)).toBe(true);
  }, 20_000);
});
