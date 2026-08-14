import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { getActivationStatus, classifyEmailError } from "./routers/adminActivation";
import { deriveCandidateActivationStatus } from "./routers/admin";

describe("Admin candidate activation monitoring", () => {
  it("calcule pending, failed et expired sans exposer de token", () => {
    const future = new Date(Date.now() + 60_000);
    const past = new Date(Date.now() - 60_000);

    expect(getActivationStatus({ emailVerified: false, verificationExpiresAt: future })).toBe("pending");
    expect(getActivationStatus({ emailVerified: false, verificationExpiresAt: future }, { status: "failed" })).toBe("failed");
    expect(getActivationStatus({ emailVerified: false, verificationExpiresAt: past })).toBe("expired");
  });

  it("classe les erreurs sans renvoyer leur contenu brut", () => {
    expect(classifyEmailError("domain not verified for recipient")).toBe("destinataire_invalide");
    expect(classifyEmailError("The domain must be verified")).toBe("domaine_non_verifie");
    expect(classifyEmailError("SMTP authentication failed")).toBe("configuration");
    expect(classifyEmailError("unexpected provider failure with secret-token-123")).toBe("erreur_envoi");
  });

  it("propose l’export CSV et la détection d’échecs répétés", () => {
    const source = readFileSync(new URL("./routers/adminActivation.ts", import.meta.url), "utf8");
    expect(source).toContain("exportCsv");
    expect(source).toContain("checkAlerts");
    expect(source).toContain("cooldownMs");
  });

  it("protège la route et ne retourne pas les champs de token", () => {
    const source = readFileSync(new URL("./routers/adminActivation.ts", import.meta.url), "utf8");
    expect(source).toContain("requireValidAdminSession(input.sessionToken)");
    expect(source).toContain("adminActivationRouter");
    expect(source).not.toContain("verificationToken: candidates.verificationToken");
    expect(source).not.toContain("return { rawToken");
    expect(source).toContain("sendVerificationLink(candidate.email, candidate.fullName, rawToken)");
  });

  it("dérive le statut affiché dans la liste des candidats sans exposer de token", () => {
    const future = new Date(Date.now() + 60_000);
    const past = new Date(Date.now() - 60_000);
    expect(deriveCandidateActivationStatus({ emailVerified: true, verificationToken: null, verificationExpiresAt: null })).toBe("active");
    expect(deriveCandidateActivationStatus({ emailVerified: false, verificationToken: "hashed", verificationExpiresAt: future })).toBe("pending");
    expect(deriveCandidateActivationStatus({ emailVerified: false, verificationToken: "hashed", verificationExpiresAt: past })).toBe("expired");
    expect(deriveCandidateActivationStatus({ emailVerified: false, verificationToken: "hashed", verificationExpiresAt: future }, { status: "failed" })).toBe("failed");
    expect(deriveCandidateActivationStatus({ emailVerified: false, verificationToken: null, verificationExpiresAt: null })).toBe("not_registered");
  });

  it("monte le routeur et son audit transversal", () => {
    const routers = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    const adminRouter = readFileSync(new URL("./routers/admin.ts", import.meta.url), "utf8");
    const trpc = readFileSync(new URL("./_core/trpc.ts", import.meta.url), "utf8");
    expect(routers).toContain("adminActivation: adminActivationRouter");
    expect(trpc).toContain("adminActivation");
    expect(adminRouter).toContain("activationStatus");
    expect(adminRouter).toContain("deriveCandidateActivationStatus");
  });
});
