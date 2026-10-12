import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("password reset email CTA visible", () => {
  it("candidat : bouton table, couleur solide, lien texte de secours", () => {
    const email = read("server/emailService.ts");
    const fn = email.slice(email.indexOf("export async function sendPasswordResetEmail"), email.indexOf("type EmailChangeConfirmationInput"));
    expect(fn).toContain('bgcolor="#1E3A8A"');
    expect(fn).toContain("background-color: #1E3A8A");
    expect(fn).toContain("color: #ffffff !important");
    expect(fn).toContain("Réinitialiser mon mot de passe");
    expect(fn).toContain("Si le bouton n’apparaît pas, copiez-collez ce lien");
    expect(fn).toContain("/reset-password?token=");
    expect(fn).not.toContain("linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); color: white");
    expect(fn).not.toContain("🔑 Réinitialiser mon mot de passe");
  });

  it("admin : CTA avec couleur explicite #ffffff", () => {
    const tpl = read("server/_core/emailTemplates.ts");
    expect(tpl).toContain('bgcolor="#ff9800"');
    expect(tpl).toContain("color: #ffffff !important");
    expect(tpl).toContain("Réinitialiser mon mot de passe");
  });
});
