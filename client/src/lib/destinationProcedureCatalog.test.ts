import { describe, expect, it } from "vitest";
import { getCountriesForProject, getCountryProcedureFields, getProceduresForCountry } from "./destinationProcedureCatalog";

describe("catalogue de procédures par destination", () => {
  it("relie la bibliothèque Travail au Canada et à sa procédure", () => {
    expect(getCountriesForProject("travail")).toContain("Canada");
    expect(getProceduresForCountry("travail", "Canada").some((procedure) => procedure.procedureLabel === "Visa Travail")).toBe(true);
  });

  it("expose les destinations e‑Visa issues du catalogue administré", () => {
    expect(getCountriesForProject("evisa")).toContain("Kenya");
    expect(getProceduresForCountry("evisa", "Kenya")[0]?.officialPortalUrl).toContain("etakenya.go.ke");
  });

  it("ajoute les informations spécifiques Canada pour une évaluation études", () => {
    const procedure = getProceduresForCountry("etudes", "Canada")[0];
    const fields = getCountryProcedureFields("etudes", "Canada", procedure);
    expect(fields.map((field) => field.key)).toEqual(expect.arrayContaining(["canadaDli", "letterOfAcceptance", "provincialAttestation"]));
  });
});
