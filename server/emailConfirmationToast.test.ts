import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("confirmation email redirect toast", () => {
  it("announces the automatic redirect before navigating to login", () => {
    const source = readFileSync(
      resolve(process.cwd(), "client/src/pages/VerifyEmailLink.tsx"),
      "utf8",
    );

    expect(source).toContain('toast.info("Redirection vers la page de connexion…"');
    expect(source).toContain('description: "Votre compte est activé. Connectez-vous avec vos identifiants."');
    expect(source).toContain('navigate("/login")');
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
