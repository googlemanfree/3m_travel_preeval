/**
 * Test vitest — Validation de la clé OpenAI
 */

import { describe, it, expect } from "vitest";

describe("OpenAI API", () => {
  it("should have OPENAI_API_KEY configured", () => {
    const apiKey = process.env.OPENAI_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");
    expect(apiKey).toMatch(/^sk-/);
  });

  it("should be able to import OpenAI module", async () => {
    const { OpenAI } = await import("openai");
    expect(OpenAI).toBeDefined();
  });

  it("should initialize OpenAI client with valid key", async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const { OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey });
    expect(client).toBeDefined();
    expect(client.apiKey).toBeDefined();
  });
});
