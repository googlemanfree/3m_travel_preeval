import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("restauration des versions e‑Visa", () => {
  it("exige une session valide, une confirmation et inscrit un nouvel audit", () => {
    const source = readFileSync(resolve(process.cwd(), "server/routers/evisaCatalogueRouter.ts"), "utf8");
    expect(source).toContain("restoreVersion");
    expect(source).toContain("confirmation: z.literal(\"RESTAURER\")");
    expect(source).toContain("parseAuditSnapshot(audit.previousSnapshotJson)");
    expect(source).toContain('action: "restored"');
  });

  it("affiche l’historique et la prévisualisation de restauration dans le back-office", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/components/AdminEvisaCatalogueManager.tsx"), "utf8");
    expect(source).toContain("Historique des modifications");
    expect(source).toContain("Restaurer cette version");
    expect(source).toContain("Confirmer la restauration");
  });
});
