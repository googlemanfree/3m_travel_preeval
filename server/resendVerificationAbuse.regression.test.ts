import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.JWT_SECRET ??= "test-only-jwt-secret-0123456789abcdef";
});

const fakeDb = {
  select: () => ({ from: () => ({ where: () => ({ limit: async () => [] }) }) }),
  update: () => ({ set: () => ({ where: async () => undefined }) }),
  execute: async () => ({ rows: [] }),
};

vi.mock("./db", () => ({ getDb: vi.fn(async () => fakeDb) }));
vi.mock("./_core/email", () => ({ sendEmail: vi.fn(async () => undefined) }));
vi.mock("./emailService", () => ({
  sendVerificationLink: vi.fn(async () => undefined),
  sendVerificationOtp: vi.fn(async () => undefined),
  sendPasswordResetEmail: vi.fn(async () => undefined),
  sendWelcomeEmail: vi.fn(async () => undefined),
  sendEmailChangeConfirmation: vi.fn(async () => undefined),
}));

import { candidateRouter } from "./routers/candidate";
import { simpleAuthRouter } from "./routers/simpleAuth";

const root = resolve(import.meta.dirname, "..");
const ctx = { req: { headers: {}, socket: { remoteAddress: "10.0.0.3" } } } as any;

/**
 * Chaque appel de `candidate.resendVerificationEmail` remplace le jeton de vérification en base : sans plafond, un
 * tiers pouvait invalider en boucle le lien reçu par le candidat et inonder sa boîte. `simpleAuth` et `signup`
 * répondaient en plus « Cet email n'existe pas » / « Compte introuvable » : énumération des comptes.
 */
describe("renvoi de vérification d'e-mail : plafonné et sans énumération", () => {
  it("candidate.resendVerificationEmail : 3 demandes par adresse, puis refus, réponse identique si le compte n'existe pas", async () => {
    for (let i = 0; i < 3; i += 1) {
      const result: any = await candidateRouter.createCaller(ctx).resendVerificationEmail({ email: "inconnu@example.test" });
      expect(result.success).toBe(true);
    }
    await expect(candidateRouter.createCaller(ctx).resendVerificationEmail({ email: "inconnu@example.test" })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });

  it("simpleAuth.resendVerificationEmail : ne révèle plus l'inexistence du compte, 3 demandes par adresse", async () => {
    const message = "Si un compte existe avec cet email, un nouvel email de vérification a été envoyé.";
    for (let i = 0; i < 3; i += 1) {
      await expect(simpleAuthRouter.createCaller(ctx).resendVerificationEmail({ email: "fantome@example.test" })).resolves.toMatchObject({ success: true, message });
    }
    await expect(simpleAuthRouter.createCaller(ctx).resendVerificationEmail({ email: "fantome@example.test" })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });

  it("simpleAuth.forgotPassword : 3 demandes par adresse, puis refus", async () => {
    for (let i = 0; i < 3; i += 1) {
      await expect(simpleAuthRouter.createCaller(ctx).forgotPassword({ email: "oubli@example.test" })).resolves.toMatchObject({ success: true });
    }
    await expect(simpleAuthRouter.createCaller(ctx).forgotPassword({ email: "oubli@example.test" })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });

  it("le routeur signup (inscription désactivée, sans appelant, qui révélait les comptes) est retiré", () => {
    expect(existsSync(resolve(root, "server/routers/signup.ts"))).toBe(false);
    const source = readFileSync(resolve(root, "server/routers.ts"), "utf8");
    expect(source).not.toMatch(/\bsignup\s*:\s*signupRouter/);
    expect(source).not.toContain('from "./routers/signup"');
  });
});
