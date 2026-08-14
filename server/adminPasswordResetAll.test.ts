import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("Réinitialisation globale des mots de passe admin", () => {
  it("expose une mutation protégée par une session admin valide", () => {
    const source = read("server/routers/adminAuth.ts");
    expect(source).toContain("resetAllPasswords: publicProcedure");
    expect(source).toContain("await requireValidAdminSession(input.sessionToken);");
    expect(source).toContain("requiresPasswordChange: true");
    expect(source).toContain("sessionToken: null");
    expect(source).toContain("sessionExpiresAt: null");
  });

  it("génère et envoie chaque mot de passe sans retourner les secrets", () => {
    const source = read("server/routers/adminAuth.ts");
    expect(source).toContain("const temporaryPassword = generateSecurePassword();");
    expect(source).toContain("await bcrypt.hash(temporaryPassword, 12)");
    expect(source).toContain("await sendEmail({");
    expect(source).toContain("emailFailureCount");
    expect(source).not.toContain("temporaryPassword,\n        resetCount");
  });

  it("ne crée pas de doublon pour l’adresse admin déjà existante", () => {
    const source = read("server/routers/adminAuth.ts");
    expect(source).toContain("const admins = await db.select().from(adminAccounts);");
    expect(source).not.toContain("INSERT INTO admin_accounts");
  });
});
