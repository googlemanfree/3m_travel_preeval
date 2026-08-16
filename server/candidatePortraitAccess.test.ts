import { describe, expect, it } from "vitest";
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
});
