import { describe, expect, it } from "vitest";
import { procedureChecklistFor } from "./routers/admin";

describe("procedure-specific document checklists", () => {
  it("maps a work label to employment documents", () => {
    const result = procedureChecklistFor("Luxembourg · Travailleur", "Luxembourg");
    expect(result.label).toBe("Travail / permis de travail");
    expect(result.documents.map((item) => item.documentType).some((document) => /contrat|offre d’emploi/i.test(document))).toBe(true);
  });

  it("maps study and visitor labels without requiring enum keys", () => {
    expect(procedureChecklistFor("Études", "Canada").documents.map((item) => item.documentType)).toContain("Lettre d’admission");
    expect(procedureChecklistFor("Visiteur", "Luxembourg").documents.map((item) => item.documentType)).toContain("Itinéraire de voyage");
  });
});
