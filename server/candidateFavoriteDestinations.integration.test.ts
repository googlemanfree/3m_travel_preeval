import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => {
  process.env.JWT_SECRET ??= "test-only-jwt-secret-0123456789abcdef";
  return {
    candidate: {
      id: 7,
      email: "aicha.nkolo@example.test",
      fullName: "Aïcha Nkolo",
      emailVerified: true,
      deletedAt: null,
      avatarUrl: "https://storage.example.test/portrait.jpg",
      avatarVerificationStatus: "verified",
      destination: "autre",
      preferredDestinations: null,
    } as Record<string, unknown>,
    updates: [] as Array<Record<string, unknown>>,
  };
});

const fakeDb = {
  select: () => ({ from: () => ({ where: () => ({ limit: async () => [state.candidate] }) }) }),
  update: () => ({
    set: (values: Record<string, unknown>) => ({
      where: async () => {
        state.updates.push(values);
      },
    }),
  }),
};

vi.mock("./db", () => ({ getDb: vi.fn(async () => fakeDb) }));
vi.mock("./emailService", () => ({ sendVerificationLink: vi.fn(async () => undefined) }));
vi.mock("./portraitVerification", () => ({
  verifyPortraitProof: vi.fn(() => ({ url: "https://storage.example.test/portrait.jpg", captureMethod: "camera" })),
}));

import { candidateRouter, signCandidateToken } from "./routers/candidate";

const caller = () =>
  candidateRouter.createCaller({
    req: { headers: { authorization: `Bearer ${signCandidateToken(7)}` } },
  } as any);

describe("candidate.updateProfile — destinations favorites", () => {
  beforeEach(() => {
    state.updates.length = 0;
  });

  it("enregistre les pays à l'orthographe officielle, sans doublon, et redérive la catégorie large", async () => {
    await caller().updateProfile({ preferredDestinations: ["canada", "  FRANCE ", "france"] });

    expect(state.updates).toHaveLength(1);
    expect(state.updates[0].preferredDestinations).toBe(JSON.stringify(["Canada", "France"]));
    expect(state.updates[0].destination).toBe("canada");
  });

  it("dérive la destination principale du premier pays choisi", async () => {
    await caller().updateProfile({ preferredDestinations: ["emirats arabes unis", "Canada"] });

    expect(state.updates[0].preferredDestinations).toBe(JSON.stringify(["Émirats Arabes Unis", "Canada"]));
    expect(state.updates[0].destination).toBe("golfe");
  });

  it("refuse un pays qui ne fait pas partie de la liste supportée, sans rien écrire", async () => {
    await expect(caller().updateProfile({ preferredDestinations: ["Canada", "Atlantide"] })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("Atlantide"),
    });
    expect(state.updates).toHaveLength(0);
  });

  it("refuse une liste vide ou de plus de trois pays, sans rien écrire", async () => {
    await expect(caller().updateProfile({ preferredDestinations: [] })).rejects.toThrow();
    await expect(
      caller().updateProfile({ preferredDestinations: ["Canada", "France", "Belgique", "Portugal"] }),
    ).rejects.toThrow();
    expect(state.updates).toHaveLength(0);
  });

  it("ne touche ni aux destinations ni à la catégorie large quand elles ne sont pas envoyées", async () => {
    await caller().updateProfile({ phone: "+237 600 00 00 00" });

    expect(state.updates).toHaveLength(1);
    expect(state.updates[0]).toEqual({ phone: "+237 600 00 00 00" });
  });
});
