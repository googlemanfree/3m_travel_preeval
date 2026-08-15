import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("password reset notifications", () => {
  const source = readFileSync(
    resolve(process.cwd(), "client/src/pages/ResetPassword.tsx"),
    "utf8",
  );

  it("confirms the successful password update with a toast", () => {
    expect(source).toContain('toast.success("Mot de passe réinitialisé avec succès"');
    expect(source).toContain("Votre nouveau mot de passe est enregistré.");
  });

  it("announces the automatic login redirect", () => {
    expect(source).toContain('toast.info("Redirection vers la page de connexion…"');
    expect(source).toContain('navigate("/login")');
    expect(source).toContain("aria-live=\"polite\"");
  });
});
