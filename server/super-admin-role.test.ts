import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const schemaSource = readFileSync(resolve(projectRoot, "drizzle/schema.ts"), "utf8");
const authSource = readFileSync(resolve(projectRoot, "server/routers/adminAuth.ts"), "utf8");
const migrationSource = readFileSync(resolve(projectRoot, "drizzle/0031_add_admin_account_role.sql"), "utf8");

describe("super administrator role", () => {
  it("defines admin and super_admin roles with admin as the safe default", () => {
    expect(schemaSource).toContain('role: mysqlEnum("role", ["admin", "super_admin"]).default("admin").notNull()');
    expect(migrationSource).toContain("enum('admin','super_admin') NOT NULL DEFAULT 'admin'");
  });

  it("promotes only the designated account in the migration", () => {
    expect(migrationSource).toContain("LOWER(`email`) = 'aureoldonfack@gmail.com'");
    expect(migrationSource).toContain("SET `role` = 'super_admin'");
  });

  it("protects account listing, invitations and password resets with the server guard", () => {
    expect(authSource).toContain("export async function requireSuperAdminSession");
    expect(authSource).toContain("if (admin.role !== \"super_admin\")");
    expect(authSource).toContain("await requireSuperAdminSession(input.sessionToken);");
    expect(authSource).toContain("role: admin.role");
  });
});
