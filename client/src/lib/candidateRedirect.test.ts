import { describe, expect, it } from "vitest";
import { resolveCandidateReturnPath } from "./candidateRedirect";

describe("redirection candidate après connexion", () => {
  it("conserve la destination de dossier interne provenant de l’e-mail", () => {
    expect(resolveCandidateReturnPath("/mon-espace?dossier=3M%2F2026%20001"))
      .toBe("/mon-espace?dossier=3M/2026 001");
  });

  it("rejette les destinations externes ou malformées", () => {
    expect(resolveCandidateReturnPath("https%3A%2F%2Fexample.com")).toBe("/dashboard");
    expect(resolveCandidateReturnPath("%E0%A4%A")).toBe("/dashboard");
  });
});
