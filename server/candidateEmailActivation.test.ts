import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { hashVerificationToken, issueVerificationToken } from "./routers/candidate";

describe("Candidate email activation", () => {
  it("génère un token brut aléatoire et ne conserve qu’un hash", () => {
    const first = issueVerificationToken();
    const second = issueVerificationToken();

    expect(first.rawToken).toMatch(/^[a-f0-9]{64}$/);
    expect(first.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.rawToken).not.toBe(first.tokenHash);
    expect(hashVerificationToken(first.rawToken)).toBe(first.tokenHash);
    expect(second.rawToken).not.toBe(first.rawToken);
  });

  it("ne renvoie aucun JWT candidat avant l’activation et bloque les comptes non vérifiés", () => {
    const source = readFileSync(new URL("./routers/candidate.ts", import.meta.url), "utf8");

    expect(source).toContain('message: "EMAIL_VERIFICATION_REQUIRED"');
    expect(source).toContain("candidateToken: null");
    expect(source).toContain("eq(candidates.verificationToken, hashVerificationToken(input.token))");
    expect(source).toContain("sendVerificationLink(input.email, input.fullName, rawToken)");
  });

  it("utilise le contrat tRPC actif pour renvoyer le lien depuis l’écran d’attente", () => {
    const source = readFileSync(new URL("../client/src/pages/VerifyEmailSent.tsx", import.meta.url), "utf8");

    expect(source).toContain("trpc.candidate.resendVerificationEmail.useMutation");
    expect(source).not.toContain("/api/auth/resend-verification-email");
  });
});
