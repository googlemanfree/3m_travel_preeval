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
