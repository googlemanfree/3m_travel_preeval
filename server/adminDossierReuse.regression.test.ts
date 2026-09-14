import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("réutilisation des applications lors de la création manuelle", () => {
  it("réutilise l’application active du candidat avant toute insertion", () => {
    const source = read("server/routers/adminDossier.ts");
    const lookupIndex = source.indexOf("const [existingApplication] = await db.select().from(applications)");
    const insertIndex = source.indexOf("await db\n          .insert(applications)");

    expect(lookupIndex).toBeGreaterThan(-1);
    expect(insertIndex).toBeGreaterThan(lookupIndex);
    expect(source).toContain("eq(applications.candidateId, candidate.id)");
    expect(source).toContain("isNull(applications.deletedAt)");
    expect(source).toContain("reusedExistingApplication: true");
    expect(source).toContain("existingApplication.dossierNumber");
  });

  it("conserve les champs de paiement et la référence lors de la réutilisation", () => {
    const source = read("server/routers/adminDossier.ts");
    const updateBlock = source.slice(source.indexOf("await db.update(applications).set({"), source.indexOf("}).where(eq(applications.id, existingApplication.id))"));

    expect(updateBlock).toContain("destination:");
    expect(updateBlock).toContain("visaType:");
    expect(updateBlock).not.toContain("paymentStatus:");
    expect(updateBlock).not.toContain("dossierNumber:");
  });
});
