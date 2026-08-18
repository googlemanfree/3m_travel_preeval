import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("versions documentaires et attestation de remise", () => {
  it("autorise uniquement le remplacement d’un document rejeté appartenant au candidat", () => {
    const candidateRouter = readFileSync(resolve(root, "server/routers/candidate.ts"), "utf8");
    expect(candidateRouter).toContain("replacesFileId");
    expect(candidateRouter).toContain("replaced.status !== \"rejected\"");
    expect(candidateRouter).toContain("replaced.fileType !== input.fileType");
  });

  it("rattache la correction du tableau client au document rejeté et expose l’historique au conseiller", () => {
    const dashboard = readFileSync(resolve(root, "client/src/pages/ClientDashboard.tsx"), "utf8");
    const adminManager = readFileSync(resolve(root, "client/src/components/AdminDocumentsManagement.tsx"), "utf8");
    expect(dashboard).toContain("replacesFileId: Number(correctionTarget.id)");
    expect(adminManager).toContain("Correction de la version");
  });

  it("rend l’attestation de remise accessible seulement après validation complète", () => {
    const dashboard = readFileSync(resolve(root, "client/src/pages/ClientDashboard.tsx"), "utf8");
    expect(dashboard).toContain("allDocumentsVerified");
    expect(dashboard).toContain("ATTESTATION DE REMISE DE PIÈCES");
    expect(dashboard).toContain("Attestation de remise");
  });
});
