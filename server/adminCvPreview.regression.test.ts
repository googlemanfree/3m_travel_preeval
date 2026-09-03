import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectFile = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("aperçu CV dans la fiche dossier admin", () => {
  it("projette une URL de lecture pour les documents opérationnels", () => {
    const router = projectFile("server/routers/admin.ts");
    expect(router).toContain("documentUrl: document.fileKey ? `/manus-storage/${document.fileKey}` : null");
    expect(router).toContain("cvDocument:");
  });

  it("expose une action d’aperçu lisible et un état CV manquant dans l’interface", () => {
    const workspace = projectFile("client/src/components/Candidate360Workspace.tsx");
    expect(workspace).toContain("CV utilisé pour l’évaluation");
    expect(workspace).toContain("Aperçu lisible");
    expect(workspace).toContain("CV non disponible");
    expect(workspace).toContain("DocumentPreviewModal");
  });
});

function sourceContract() {
  return projectFile("client/src/components/Candidate360Workspace.tsx");
}

it("rattache la sélection du CV aux documents du dossier avant le fallback", () => {
  expect(sourceContract()).toContain("documents.find((document: any)");
  expect(sourceContract()).toContain("data?.cvDocument");
});
