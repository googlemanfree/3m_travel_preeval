import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("confirm email CTA visible", () => {
  it("candidat : sendVerificationLink — bouton table, couleur solide, lien texte de secours", () => {
    const email = read("server/emailService.ts");
    const fn = email.slice(
      email.indexOf("export async function sendVerificationLink"),
      email.indexOf("export async function sendVerificationOtp"),
    );
    expect(fn).toContain('bgcolor="#1E3A8A"');
    expect(fn).toContain("background-color: #1E3A8A");
    expect(fn).toContain("color: #ffffff !important");
    expect(fn).toContain("Confirmer mon email");
    expect(fn).toContain("Si le bouton n’apparaît pas, copiez-collez ce lien");
    expect(fn).toContain("/verify-email-link?token=");
    expect(fn).not.toContain("linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); color: white");
    expect(fn).not.toContain("✓ Confirmer mon email");
  });

  it("candidat : sendEmailChangeConfirmation — bouton table, couleur solide, lien texte de secours", () => {
    const email = read("server/emailService.ts");
    const fn = email.slice(
      email.indexOf("export async function sendEmailChangeConfirmation"),
      email.indexOf("export async function sendWelcomeEmail"),
    );
    expect(fn).toContain('bgcolor="#1E3A8A"');
    expect(fn).toContain("background-color: #1E3A8A");
    expect(fn).toContain("color: #ffffff !important");
    expect(fn).toContain("Confirmer l’adresse");
    expect(fn).toContain("Si le bouton n’apparaît pas, copiez-collez ce lien");
    expect(fn).not.toContain("background:#B98932;color:#172033");
  });

  it("simpleAuth : renvoi confirmation — bouton table, couleur solide, lien texte de secours", () => {
    const src = read("server/routers/simpleAuth.ts");
    const fn = src.slice(
      src.indexOf("const verificationLink = `${baseUrl}/confirm-email?token="),
      src.indexOf("return {\n        success: true,\n        message: \"Si un compte existe avec cet email"),
    );
    expect(fn).toContain('bgcolor="#1E3A8A"');
    expect(fn).toContain("background-color:#1E3A8A");
    expect(fn).toContain("color:#ffffff !important");
    expect(fn).toContain("Confirmer mon email");
    expect(fn).toContain("Si le bouton n’apparaît pas, copiez-collez ce lien");
    expect(fn).toContain("/confirm-email?token=");
    expect(fn).not.toContain("linear-gradient(135deg,#1E3A8A,#2563EB)");
  });
});
