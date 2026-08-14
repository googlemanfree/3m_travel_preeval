import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("Rôle administrateur commun", () => {
  it("ne conserve aucun verrou super_admin dans l’authentification serveur", () => {
    const source = read("server/routers/adminAuth.ts");
    expect(source).toContain("export async function requireSuperAdminSession(sessionToken: string)");
    expect(source).toContain("return requireValidAdminSession(sessionToken);");
    expect(source).not.toContain('admin.role !== "super_admin"');
    expect(source).toContain('role: "admin"');
  });

  it("déclare un seul rôle admin dans le schéma et normalise les comptes existants", () => {
    const schema = read("drizzle/schema.ts");
    const migration = read("drizzle/migrations/0006_admin_common_role.sql");
    expect(schema).toContain('role: mysqlEnum("role", ["admin"])');
    expect(schema).not.toContain('role: mysqlEnum("role", ["admin", "super_admin"])');
    expect(migration).toContain("UPDATE `admin_accounts` SET `role` = 'admin'");
    expect(migration).toContain("enum('admin')");
  });

  it("n’affiche pas de sous-rôle super administrateur dans les écrans admin", () => {
    const dashboard = read("client/src/pages/SuperAdminDashboard.tsx");
    const list = read("client/src/pages/AdminsList.tsx");
    const adminDashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(dashboard).not.toContain('role === "super_admin"');
    expect(dashboard).toContain("Administrateur");
    expect(list).not.toContain('role: "super_admin"');
    expect(list).toContain('role: "admin"');
    expect(adminDashboard).not.toContain('localStorage.getItem("adminType") === "super_admin"');
  });
});
