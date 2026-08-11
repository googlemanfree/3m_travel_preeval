import { describe, expect, it } from "vitest";
import { PDF_CATEGORIES } from "../shared/pdfResources";
import { filterProcedureResources, getAllProcedureResources, getProcedureGuideUrl } from "../shared/procedureGuide";

describe("procedureGuide helpers", () => {
  it("aplatit toutes les ressources du catalogue sans perte", () => {
    const expected = PDF_CATEGORIES.reduce((sum, category) => sum + category.resources.length, 0);
    expect(getAllProcedureResources()).toHaveLength(expected);
    expect(getAllProcedureResources().length).toBeGreaterThanOrEqual(100);
  });

  it("filtre par pays, titre ou type de document", () => {
    expect(filterProcedureResources("Canada").length).toBeGreaterThan(0);
    expect(filterProcedureResources("visa travail").every((resource) => resource.title.toLowerCase().includes("visa travail"))).toBe(true);
    expect(filterProcedureResources("docx").every((resource) => resource.type === "docx")).toBe(true);
    expect(filterProcedureResources("destination-inexistante")).toHaveLength(0);
  });

  it("génère un lien partageable stable sans double slash", () => {
    expect(getProcedureGuideUrl("https://www.3mtravelagency.click/")).toBe("https://www.3mtravelagency.click/guide-procedures");
    expect(getProcedureGuideUrl("https://www.3mtravelagency.click")).toBe("https://www.3mtravelagency.click/guide-procedures");
  });
});
