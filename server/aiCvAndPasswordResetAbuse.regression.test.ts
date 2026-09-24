import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => {
  process.env.JWT_SECRET ??= "test-only-jwt-secret-0123456789abcdef";
  return { sent: 0 };
});

const fakeDb = {
  select: () => ({ from: () => ({ where: () => ({ limit: async () => [] }) }) }),
  update: () => ({ set: () => ({ where: async () => undefined }) }),
};

vi.mock("./db", () => ({ getDb: vi.fn(async () => fakeDb) }));
vi.mock("./emailService", () => ({
  sendVerificationLink: vi.fn(async () => undefined),
  sendVerificationOtp: vi.fn(async () => undefined),
  sendPasswordResetEmail: vi.fn(async () => {
    state.sent += 1;
  }),
  sendWelcomeEmail: vi.fn(async () => undefined),
  sendEmailChangeConfirmation: vi.fn(async () => undefined),
}));

import { candidateRouter } from "./routers/candidate";

const root = resolve(import.meta.dirname, "..");
const caller = () => candidateRouter.createCaller({ req: { headers: {}, socket: { remoteAddress: "10.0.0.2" } } } as any);

describe("candidate.requestPasswordReset : plafond de demandes", () => {
  it("accepte 3 demandes par adresse et par heure, puis refuse la 4e, que le compte existe ou non", async () => {
    for (let i = 0; i < 3; i += 1) {
      const result: any = await caller().requestPasswordReset({ email: "victime@example.test" });
      expect(result.success).toBe(true);
    }
    await expect(caller().requestPasswordReset({ email: "victime@example.test" })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    // Le refus dépend de l'adresse saisie, pas de l'existence du compte : une autre adresse reste acceptée.
    await expect(caller().requestPasswordReset({ email: "autre@example.test" })).resolves.toMatchObject({ success: true });
  });
});

/**
 * `evaluateCVWithAI` était publique, sans authentification ni limite : appel OpenAI payant pour n'importe quel
 * visiteur, et rapport IA envoyé à l'adresse de son choix sans validation administrateur. `sendCandidateMessage`
 * ajoutait sans borne du texte dans `adminNote`. Aucun appelant réel : retirées.
 */
describe("application : procédures publiques abusables retirées", () => {
  const source = readFileSync(resolve(root, "server/routers/application.ts"), "utf8");

  it("evaluateCVWithAI et sendCandidateMessage n'existent plus", () => {
    expect(source).not.toMatch(/\bevaluateCVWithAI\s*:/);
    expect(source).not.toMatch(/\bsendCandidateMessage\s*:/);
    expect(existsSync(resolve(root, "client/src/components/ScoringForm.tsx"))).toBe(false);
  });

  it("la lecture publique du suivi de dossier reste protégée par le couple numéro + e-mail", () => {
    const start = source.indexOf("getDossierStatus: publicProcedure");
    expect(start).toBeGreaterThan(-1);
    expect(source.slice(start, start + 2500)).toContain("input.email.trim().toLowerCase()");
  });
});
