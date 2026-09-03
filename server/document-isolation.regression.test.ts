import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("Isolation documentaire par dossier", () => {
  it("borne les détails d’application par evaluationId", () => {
    const source = read("server/routers/admin.ts");
    expect(source).toContain("eq(clientDocuments.evaluationId, app[0].id)");
  });

  it("borne Candidate360 par l’application liée au dossier agence", () => {
    const source = read("server/routers/admin.ts");
    expect(source).toContain("eq(clientDocuments.evaluationId, linkedApplication.id)");
    expect(source).toContain("eq(applications.fullName, sourceRecord.fullName)");
  });

  it("conserve la validation individuelle par identifiant documentaire", () => {
    const source = read("server/routers/admin.ts");
    expect(source).toContain("where(eq(clientDocuments.id, input.documentId))");
    expect(source).toContain("where(eq(candidateFiles.id, input.documentId))");
  });
});

function resolveProjectPath(relativePath: string) {
  return resolve(process.cwd(), relativePath);
}

void resolveProjectPath;
