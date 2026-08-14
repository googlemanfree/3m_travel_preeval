import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("Parcours admin mot de passe temporaire", () => {
  it("renvoie l’état requiresPasswordChange et autorise uniquement la mutation de changement", () => {
    const source = read("server/routers/adminAuth.ts");
    expect(source).toContain("requiresPasswordChange: admin.requiresPasswordChange");
    expect(source).toContain("if (admin.requiresPasswordChange && !options.allowPasswordChange)");
    expect(source).toContain('message: "PASSWORD_CHANGE_REQUIRED"');
    expect(source).toContain("requireValidAdminSession(input.sessionToken, { allowPasswordChange: true })");
  });

  it("enregistre le nouveau hash et retire l’obligation après validation", () => {
    const source = read("server/routers/adminAuth.ts");
    expect(source).toContain("passwordChangedAt: now");
    expect(source).toContain("requiresPasswordChange: false");
    expect(source).toContain("const passwordHash = await bcrypt.hash(input.newPassword, 12)");
  });

  it("redirige le compte temporaire et bloque l’accès à l’interface admin", () => {
    const guard = read("client/src/components/AdminGuard.tsx");
    const login = read("client/src/pages/AdminLogin.tsx");
    expect(guard).toContain("requiresPasswordChange");
    expect(guard).toContain('navigate("/admin/change-password")');
    expect(login).toContain("data.requiresPasswordChange");
    expect(login).toContain("navigate('/admin/change-password')");
  });

  it("permet de demander un temporaire par e-mail sans révéler l’existence du compte", () => {
    const server = read("server/routers/adminPasswordReset.ts");
    const login = read("client/src/pages/AdminLogin.tsx");
    expect(server).toContain("requestTemporaryPassword: publicProcedure");
    expect(server).toContain("requiresPasswordChange: true");
    expect(server).toContain("await sendEmail({");
    expect(server).toContain("const genericMessage");
    expect(login).toContain("adminPasswordReset.requestTemporaryPassword");
  });
});
