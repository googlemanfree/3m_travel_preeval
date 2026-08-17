import { describe, expect, it } from "vitest";
import { resolveCandidateReturnPath } from "../client/src/lib/candidateRedirect";

describe("redirection interne après connexion candidate", () => {
  it("restitue le dossier demandé par le lien e-mail", () => {
    expect(resolveCandidateReturnPath("/mon-espace?dossier=3M%2F2026%20001"))
      .toBe("/mon-espace?dossier=3M/2026 001");
  });

  it("refuse les destinations externes ou malformées", () => {
    expect(resolveCandidateReturnPath("https%3A%2F%2Fexample.com")).toBe("/dashboard");
    expect(resolveCandidateReturnPath("%E0%A4%A")).toBe("/dashboard");
  });
});
