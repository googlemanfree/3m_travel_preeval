import { describe, expect, it } from "vitest";
import { procedureChecklistFor } from "./routers/admin";

describe("procedure-specific document checklists", () => {
  it("maps a work label to employment documents", () => {
    const result = procedureChecklistFor("Luxembourg · Travailleur", "Luxembourg");
    expect(result.label).toBe("Visa / permis de travail");
    expect(result.documents.map((item) => item.documentType)).toContain("Offre d’emploi ou contrat");
  });

  it("maps study and visitor labels without requiring enum keys", () => {
    expect(procedureChecklistFor("Études", "Canada").documents.map((item) => item.documentType)).toContain("Lettre d’admission");
    expect(procedureChecklistFor("Visiteur", "Luxembourg").documents.map((item) => item.documentType)).toContain("Itinéraire de voyage");
  });
});
