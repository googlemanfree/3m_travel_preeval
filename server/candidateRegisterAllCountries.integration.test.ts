import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => {
  process.env.JWT_SECRET ??= "test-only-jwt-secret-0123456789abcdef";
  return {
    inserted: [] as Array<Record<string, unknown>>,
    selectResults: [] as Array<Array<Record<string, unknown>>>,
  };
});

const fakeDb = {
  select: () => ({
    from: () => ({
      where: () => ({
        limit: async () => state.selectResults.shift() ?? [],
        orderBy: () => ({ limit: async () => state.selectResults.shift() ?? [] }),
      }),
    }),
  }),
  insert: () => ({
    values: async (values: Record<string, unknown>) => {
      state.inserted.push(values);
    },
  }),
};

vi.mock("./db", () => ({ getDb: vi.fn(async () => fakeDb) }));
vi.mock("./emailService", () => ({ sendVerificationLink: vi.fn(async () => undefined) }));
vi.mock("./portraitVerification", () => ({
  verifyPortraitProof: vi.fn(() => ({ url: "https://storage.example.test/portrait.jpg", captureMethod: "camera" })),
}));

import { candidateRouter } from "./routers/candidate";

const base = {
  fullName: "Aïcha Nkolo",
  email: "aicha.nkolo@example.test",
  password: "Motdepasse1!",
  portraitVerificationToken: "p".repeat(64),
};

const register = (input: Record<string, unknown>) =>
  candidateRouter.createCaller({} as any).register({ ...base, ...input } as any);

describe("candidate.register — tous les pays du monde et formulaire adaptatif", () => {
  beforeEach(() => {
    state.inserted.length = 0;
    state.selectResults.length = 0;
    state.selectResults.push([], [{ id: 1 }]);
  });

  it("accepte un pays qui n'était pas dans l'ancienne liste, enregistré sous son nom officiel", async () => {
    await register({ preferredDestinations: ["senegal"] });

    expect(state.inserted).toHaveLength(1);
    expect(state.inserted[0].preferredDestinations).toBe(JSON.stringify(["Sénégal"]));
    expect(state.inserted[0].destination).toBe("autre");
  });

  it("normalise l'orthographe et les doublons, et dérive la catégorie large du premier pays", async () => {
    await register({ preferredDestinations: ["canada", "  FRANCE ", "france"] });

    expect(state.inserted[0].preferredDestinations).toBe(JSON.stringify(["Canada", "France"]));
    expect(state.inserted[0].destination).toBe("canada");
  });

  it("enregistre les questions de projet facultatives, nettoyées, et laisse le reste à null", async () => {
    await register({ preferredDestinations: ["France"], visaType: "  Études ", languageLevel: "DELF B2" });

    expect(state.inserted[0]).toMatchObject({ visaType: "Études", languageLevel: "DELF B2", educationLevel: null, employmentStatus: null });
  });

  it("n'exige aucune question de projet : le formulaire réduit reste valide", async () => {
    await register({ preferredDestinations: ["Sénégal"] });

    expect(state.inserted[0]).toMatchObject({ visaType: null, educationLevel: null, employmentStatus: null, languageLevel: null });
  });

  it("refuse ce qui n'est pas un pays, sans rien enregistrer", async () => {
    await expect(register({ preferredDestinations: ["Canada", "Narnia"] })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("Narnia"),
    });
    expect(state.inserted).toHaveLength(0);
  });

  it("refuse zéro ou plus de trois destinations, et des réponses de projet démesurées", async () => {
    await expect(register({ preferredDestinations: [] })).rejects.toThrow();
    await expect(register({ preferredDestinations: ["Canada", "France", "Belgique", "Japon"] })).rejects.toThrow();
    await expect(register({ preferredDestinations: ["Canada"], languageLevel: "x".repeat(101) })).rejects.toThrow();
    expect(state.inserted).toHaveLength(0);
  });
});
