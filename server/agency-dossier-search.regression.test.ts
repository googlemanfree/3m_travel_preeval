import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

describe("agency dossier admin search", () => {
  it("includes the numeric dossier id in the server-side search contract", () => {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(resolve(currentDir, "routers/agencyDossier.ts"), "utf8");

    expect(source).toContain("CAST(${agencyDossiers.id} AS CHAR) LIKE");
    expect(source).toContain("like(agencyDossiers.fullName");
    expect(source).toContain("like(agencyDossiers.email");
    expect(source).toContain("like(agencyDossiers.phone");
  });

  it("keeps the client-side id filter for the legacy agency list", () => {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(resolve(currentDir, "../client/src/pages/AdminAgencyDossiers.tsx"), "utf8");

    expect(source).toContain("search: undefined");
    expect(source).toContain("String(d.id).includes(search.trim())");
  });
});
