/**
 * Test vitest — Validation de la clé OpenAI
 */

import { describe, it, expect } from "vitest";

describe("OpenAI API", () => {
  it("should have OPENAI_API_KEY configured", () => {
    const apiKey = process.env.OPENAI_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");
    expect(apiKey).toMatch(/^sk-/); // Les clés OpenAI commencent par sk-
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
  });

  it("should be able to call OpenAI API with test prompt", async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const { OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: "Respond with 'OK' only.",
        },
      ],
      max_tokens: 10,
    });

    expect(completion).toBeDefined();
    expect(completion.choices).toBeDefined();
    expect(completion.choices.length).toBeGreaterThan(0);
    expect(completion.choices[0].message.content).toBeDefined();
  });
});
