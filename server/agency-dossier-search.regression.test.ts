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
});
