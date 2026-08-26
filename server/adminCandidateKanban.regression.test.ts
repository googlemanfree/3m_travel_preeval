import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Kanban des dossiers clients", () => {
  it("conserve les cinq étapes opérationnelles et une alternative clavier", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/components/AdminCandidateKanban.tsx"), "utf8");
    for (const status of ["PENDING_48H", "PUBLISHED", "DOCUMENTS_CHECK", "SUBMITTED", "APPROVED"]) expect(source).toContain(status);
    expect(source).toContain("draggable");
    expect(source).toContain("onValueChange");
    expect(source).toContain("aria-label={`Déplacer ${candidate.fullName}`}");
  });

  it("demande une confirmation et réutilise la mutation de statut admin", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/AdminDashboard.tsx"), "utf8");
    expect(source).toContain("Confirmer le déplacement");
    expect(source).toContain("trpc.admin.updateCandidateStatus.useMutation");
    expect(source).toContain("notifyClient: true");
  });
});
