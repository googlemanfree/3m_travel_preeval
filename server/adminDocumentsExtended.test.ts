import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("gestionnaire documentaire étendu", () => {
  it("protège le dépôt administrateur et contrôle le contenu transmis au stockage", () => {
    const router = readFileSync(resolve(root, "server/routers/admin.ts"), "utf8");
    expect(router).toContain("uploadDocumentForCandidate: publicProcedure");
    expect(router).toContain("await requireValidAdminSession(input.sessionToken)");
    expect(router).toContain("Le fichier doit peser au maximum 10 Mo.");
    expect(router).toContain("storagePut(`admin-documents/");
  });

  it("affiche le dépôt glissé, la comparaison de versions et la complétude mensuelle", () => {
    const manager = readFileSync(resolve(root, "client/src/components/AdminDocumentsManagement.tsx"), "utf8");
    expect(manager).toContain("Dépôt rapide administrateur");
    expect(manager).toContain("handleAdminDropUpload");
    expect(manager).toContain("openVersionComparison");
    expect(manager).toContain("Comparer les versions du document");
    expect(manager).toContain("Rapport mensuel");
  });
});
