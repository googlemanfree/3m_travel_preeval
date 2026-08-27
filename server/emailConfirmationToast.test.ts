import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("confirmation email redirect toast", () => {
  it("announces the automatic redirect before navigating to login", () => {
    const source = readFileSync(
      resolve(process.cwd(), "client/src/pages/VerifyEmailLink.tsx"),
      "utf8",
    );

    expect(source).toContain('toast.info(requiresEvaluation ? "Redirection vers votre évaluation…" : "Redirection vers votre espace candidat…"');
    expect(source).toContain('"Votre évaluation déclarée restera soumise à vérification humaine."');
    expect(source).toContain("navigate(nextPath)");
  });

  it("keeps a visible success toast after activation", () => {
    const source = readFileSync(
      resolve(process.cwd(), "client/src/pages/VerifyEmailLink.tsx"),
      "utf8",
    );

    expect(source).toContain('toast.success("E-mail vérifié avec succès"');
    expect(source).toContain('duration: 3000');
  });
});
