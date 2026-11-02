import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { hasUsableCandidatePortrait } from "./routers/candidate";

describe("hasUsableCandidatePortrait", () => {
  it("autorise un portrait explicitement vérifié", () => {
    expect(hasUsableCandidatePortrait({ avatarVerificationStatus: "verified", avatarUrl: "https://example.test/portrait.jpg" })).toBe(true);
  });

  it("autorise un portrait historique présent qui attend encore la synchronisation de statut", () => {
    expect(hasUsableCandidatePortrait({ avatarVerificationStatus: "pending", avatarUrl: "https://example.test/portrait.jpg" })).toBe(true);
    expect(hasUsableCandidatePortrait({ avatarVerificationStatus: "missing", avatarUrl: "https://example.test/portrait.jpg" })).toBe(true);
  });

  it("exige un portrait vérifié pour tout compte créé à partir du 2026-10-20 (photo importée ou statut « pending » insuffisants)", () => {
    const url = "https://example.test/portrait.jpg";
    const created = new Date("2026-10-20T08:00:00.000Z");
    expect(hasUsableCandidatePortrait({ avatarVerificationStatus: "pending", avatarUrl: url, createdAt: created })).toBe(false);
    expect(hasUsableCandidatePortrait({ avatarVerificationStatus: "missing", avatarUrl: url, createdAt: created.toISOString() })).toBe(false);
    expect(hasUsableCandidatePortrait({ avatarVerificationStatus: "verified", avatarUrl: url, createdAt: created })).toBe(true);
    // Un compte antérieur garde la tolérance historique.
    expect(hasUsableCandidatePortrait({ avatarVerificationStatus: "pending", avatarUrl: url, createdAt: new Date("2026-10-19T23:59:59.000Z") })).toBe(true);
  });

  it("l'inscription par e-mail refuse la création sans preuve de portrait, côté formulaire comme côté serveur", () => {
    const router = readFileSync(new URL("./routers/candidate.ts", import.meta.url), "utf8");
    const page = readFileSync(new URL("../client/src/pages/Register.tsx", import.meta.url), "utf8");
    expect(router).toContain("portraitVerificationToken: portraitVerificationTokenSchema,");
    expect(router).toContain("verifyPortraitProof(input.portraitVerificationToken, input.email.toLowerCase())");
    expect(page).toContain("Un portrait humain vérifié est obligatoire pour finaliser l’inscription.");
  });

  it("bloque un portrait absent ou explicitement rejeté", () => {
    expect(hasUsableCandidatePortrait({ avatarVerificationStatus: "missing", avatarUrl: null })).toBe(false);
    expect(hasUsableCandidatePortrait({ avatarVerificationStatus: "rejected", avatarUrl: "https://example.test/portrait.jpg" })).toBe(false);
  });

  it("conserve le tableau de bord client et son indicateur de portrait requis", () => {
    const source = readFileSync(new URL("./routers/candidate.ts", import.meta.url), "utf8");
    expect(source).toContain("getClientDashboardSummary:");
    expect(source).toContain("requiresPortrait: !hasUsableCandidatePortrait(candidate)");
    expect(source).toContain("candidate.dossierStatus");
  });
});
