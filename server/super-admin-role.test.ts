import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const schemaSource = readFileSync(resolve(projectRoot, "drizzle/schema.ts"), "utf8");
const authSource = readFileSync(resolve(projectRoot, "server/routers/adminAuth.ts"), "utf8");
const migrationSource = readFileSync(resolve(projectRoot, "drizzle/migrations/0006_admin_common_role.sql"), "utf8");

describe("rôle administrateur commun", () => {
  it("définit admin comme unique rôle opérationnel", () => {
    expect(schemaSource).toContain('role: mysqlEnum("role", ["admin"]).default("admin").notNull()');
    expect(schemaSource).not.toContain('role: mysqlEnum("role", ["admin", "super_admin"]).default("admin").notNull()');
    expect(migrationSource).toContain("UPDATE `admin_accounts` SET `role` = 'admin'");
    expect(migrationSource).toContain("enum('admin') NOT NULL DEFAULT 'admin'");
  });

  it("normalise les comptes existants sans conserver de compte privilégié séparé", () => {
    expect(migrationSource).toContain("WHERE `role` <> 'admin'");
    expect(migrationSource).not.toContain("SET `role` = 'super_admin'");
  });

  it("protège les fonctions admin avec une session serveur valide", () => {
    expect(authSource).toContain("export async function requireSuperAdminSession");
    expect(authSource).toContain("return requireValidAdminSession(sessionToken);");
    expect(authSource).not.toContain('if (admin.role !== "super_admin")');
    expect(authSource).toContain("await requireSuperAdminSession(input.sessionToken);");
  });
});
