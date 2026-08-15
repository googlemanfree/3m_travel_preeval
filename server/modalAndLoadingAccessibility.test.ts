import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("modales et boutons candidat accessibles", () => {
  it("maintient le focus, ferme par Échap et le restitue à l’ouverture d’une modale", () => {
    const hook = source("client/src/hooks/useFocusTrap.ts");
    expect(hook).toContain('event.key === "Escape"');
    expect(hook).toContain('event.key !== "Tab"');
    expect(hook).toContain("previousFocus?.focus()");
    expect(hook).toContain("last.focus()");
  });

  it("connecte les deux modales de connexion au focus-trap et aux rôles de dialogue", () => {
    const login = source("client/src/pages/Login.tsx");
    expect(login).toContain("useFocusTrap(showResendModal");
    expect(login).toContain("useFocusTrap(showForgotPasswordModal");
    expect(login).toContain('aria-modal="true"');
    expect(login).toContain('aria-labelledby="resend-title"');
    expect(login).toContain('aria-labelledby="forgot-title"');
  });

  it("active Google configuré et annonce clairement Facebook encore indisponible", () => {
    const login = source("client/src/pages/Login.tsx");
    const register = source("client/src/pages/Register.tsx");
    expect(login).toContain('window.location.assign("/api/auth/google/start")');
    expect(register).toContain('window.location.assign("/api/auth/google/start")');
    expect(login).toContain('aria-describedby="facebook-coming-soon"');
    expect(login).toContain("Bientôt disponible");
    expect(register).toContain('aria-describedby="register-facebook-coming-soon"');
  });

  it("annonce les opérations longues dans les formulaires candidats", () => {
    const login = source("client/src/pages/Login.tsx");
    const register = source("client/src/pages/Register.tsx");
    const forgot = source("client/src/pages/ForgotPassword.tsx");
    expect(login).toContain("aria-busy={loginMutation.isPending}");
    expect(register).toContain('role="progressbar"');
    expect(forgot).toContain("aria-busy={resetMutation.isPending}");
    expect(forgot).toContain("Loader2");
  });
});
