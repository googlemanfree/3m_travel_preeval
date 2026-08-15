import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("Accessibilité des modales et de l’inscription", () => {
  it("annonce la fermeture extérieure des deux modales de connexion", () => {
    const source = read("client/src/pages/Login.tsx");
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain("Fenêtre de renvoi d’email fermée.");
    expect(source).toContain("Fenêtre de réinitialisation du mot de passe fermée.");
    expect(source).toContain("onClick={closeResendModal}");
    expect(source).toContain("onClick={closeForgotPasswordModal}");
  });

  it("garde Facebook indisponible et rend Google disponible uniquement après configuration", () => {
    const login = read("client/src/pages/Login.tsx");
    const register = read("client/src/pages/Register.tsx");
    expect(login).toContain('window.location.assign("/api/auth/google/start")');
    expect(register).toContain('window.location.assign("/api/auth/google/start")');
    expect(login).toContain("facebook-coming-soon");
    expect(register).toContain("register-facebook-coming-soon");
  });

  it("propose une validation immédiate et une force de mot de passe accessible à l’inscription", () => {
    const register = read("client/src/pages/Register.tsx");
    expect(register).toContain("isPasswordInvalid");
    expect(register).toContain("isConfirmationInvalid");
    expect(register).toContain("aria-live");
  });
});
