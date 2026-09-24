import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => {
  process.env.JWT_SECRET ??= "test-only-jwt-secret-0123456789abcdef";
  return { candidate: {} as Record<string, unknown> };
});

const fakeDb = {
  select: () => ({ from: () => ({ where: () => ({ limit: async () => [state.candidate] }) }) }),
  update: () => ({ set: () => ({ where: async () => undefined }) }),
  insert: () => ({ values: async () => undefined }),
};

vi.mock("./db", () => ({ getDb: vi.fn(async () => fakeDb) }));
vi.mock("./emailService", () => ({
  sendVerificationLink: vi.fn(async () => undefined),
  sendVerificationOtp: vi.fn(async () => undefined),
  sendPasswordResetEmail: vi.fn(async () => undefined),
  sendWelcomeEmail: vi.fn(async () => undefined),
  sendEmailChangeConfirmation: vi.fn(async () => undefined),
}));

import { candidateRouter } from "./routers/candidate";

const root = resolve(import.meta.dirname, "..");
const caller = () => candidateRouter.createCaller({ req: { headers: {}, socket: { remoteAddress: "10.0.0.1" } } } as any);
const setCandidate = (values: Record<string, unknown>) => {
  state.candidate = { fullName: "Aïcha Nkolo", email: "aicha@example.test", destination: "autre", preferredDestinations: null, ...values };
};

/**
 * `candidate.verifyEmail` renvoyait un jeton de session pour tout compte déjà vérifié, sans contrôler le code :
 * `verifyEmail({ candidateId: N, otp: "000000" })` donnait la session du candidat N (identifiant séquentiel).
 */
describe("candidate.verifyEmail : aucun jeton sans preuve", () => {
  it("ne renvoie aucun jeton de session pour un compte déjà vérifié, quel que soit le code", async () => {
    setCandidate({ id: 101, emailVerified: true, emailOtp: null, emailOtpExpiresAt: null });
    const result: any = await caller().verifyEmail({ candidateId: 101, otp: "000000" });
    expect(result.success).toBe(true);
    expect(result.alreadyVerified).toBe(true);
    expect(result.token).toBeUndefined();
    expect(JSON.stringify(result)).not.toMatch(/eyJ/); // aucun JWT nulle part dans la réponse
  });

  it("refuse un mauvais code, puis bloque après 6 essais même avec le bon code", async () => {
    setCandidate({ id: 102, emailVerified: false, emailOtp: "123456", emailOtpExpiresAt: new Date(Date.now() + 60_000) });
    for (let i = 0; i < 6; i += 1) {
      await expect(caller().verifyEmail({ candidateId: 102, otp: "000000" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
    await expect(caller().verifyEmail({ candidateId: 102, otp: "123456" })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });

  it("accepte le bon code d'un compte non vérifié et renvoie alors un jeton", async () => {
    setCandidate({ id: 103, emailVerified: false, emailOtp: "654321", emailOtpExpiresAt: new Date(Date.now() + 60_000) });
    const result: any = await caller().verifyEmail({ candidateId: 103, otp: "654321" });
    expect(result.success).toBe(true);
    expect(typeof result.token).toBe("string");
  });

  it("limite les renvois de code à 3 par compte", async () => {
    setCandidate({ id: 104, emailVerified: false, emailOtp: null, emailOtpExpiresAt: null });
    for (let i = 0; i < 3; i += 1) await caller().resendOtp({ candidateId: 104 });
    await expect(caller().resendOtp({ candidateId: 104 })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });
});

describe("codes de vérification des dossiers et ancien routeur OTP", () => {
  it("application : essais et renvois de code plafonnés", () => {
    const source = readFileSync(resolve(root, "server/routers/application.ts"), "utf8");
    const verify = source.slice(source.indexOf("verifyApplicationOtp: publicProcedure"), source.indexOf("verifyApplicationOtp: publicProcedure") + 900);
    expect(verify).toContain("otpVerifyLimiter.check(");
    expect(verify).toContain("TOO_MANY_REQUESTS");
    const resend = source.slice(source.indexOf("resendApplicationOtp: publicProcedure"), source.indexOf("resendApplicationOtp: publicProcedure") + 900);
    expect(resend).toContain("otpResendLimiter.check(");
    expect(resend).toContain("TOO_MANY_REQUESTS");
  });

  it("candidateAuthOTP (qui n'a jamais contrôlé le code) est retiré et non monté", () => {
    expect(existsSync(resolve(root, "server/routers/candidateAuthOTP.ts"))).toBe(false);
    const source = readFileSync(resolve(root, "server/routers.ts"), "utf8");
    expect(source).not.toMatch(/candidateAuthOTP\s*:/);
    expect(source).not.toContain('from "./routers/candidateAuthOTP"');
  });
});
