import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("gestionnaire de fichiers administrateur", () => {
  const source = readFileSync(resolve(import.meta.dirname, "../client/src/components/AdminDocumentsManagement.tsx"), "utf8");

  it("propose les filtres de statut, origine, type et dossier", () => {
    expect(source).toContain("sourceFilter");
    expect(source).toContain("documentTypeFilter");
    expect(source).toContain("dossierFilter");
    expect(source).toContain("Vue dossiers et complétude");
  });

  it("conserve une action groupée contrôlée qui notifie les candidats", () => {
    expect(source).toContain("handleBulkStatus");
    expect(source).toContain("updateDocumentStatusMutation.mutateAsync");
    expect(source).toContain("Chaque candidat concerné sera notifié");
  });
});
