import { describe, expect, it } from "vitest";
import { getCountryProcedureFields, getProceduresForCountry } from "@/lib/destinationProcedureCatalog";

describe("questions adaptées au pays et au type de visa (au-delà du Canada)", () => {
  const keys = (projectType: any, country: string, procedureLabel?: string) => {
    const procedure = procedureLabel ? ({ procedureLabel, id: procedureLabel } as any) : getProceduresForCountry(projectType, country)[0];
    return getCountryProcedureFields(projectType, country, procedure).map((field) => field.key);
  };

  it("études dans l'espace Schengen : admission, langue du programme, preuve de langue, financement", () => {
    for (const country of ["France", "Belgique", "Luxembourg", "Espagne"]) {
      expect(keys("etudes", country, "Visa études"), country).toEqual(expect.arrayContaining(["admissionLetter", "programLanguage", "languageProof", "studyFunding"]));
    }
  });

  it("travail dans l'espace Schengen : offre, reconnaissance du diplôme, langue, métier", () => {
    expect(keys("travail", "Luxembourg", "Visa travail")).toEqual(expect.arrayContaining(["jobOffer", "qualificationRecognition", "workLanguageLevel", "occupation"]));
  });

  it("formation en alternance : contrat de formation et niveau de langue", () => {
    expect(keys("etudes", "Allemagne", "Formation en alternance")).toEqual(expect.arrayContaining(["trainingContract", "workLanguageLevel", "qualificationRecognition"]));
    expect(keys("etudes", "Allemagne", "Visa études")).not.toContain("trainingContract");
  });

  it("Royaume-Uni, Australie et Nouvelle-Zélande ont leurs propres pièces (CAS, certificat de parrainage, inscription)", () => {
    expect(keys("etudes", "Royaume-Uni", "Visa étudiant")).toContain("casStatus");
    expect(keys("travail", "Royaume-Uni", "Visa travail")).toContain("sponsorshipCertificate");
    expect(keys("etudes", "Australie", "Visa étudiant")).toContain("enrolmentConfirmation");
    expect(keys("etudes", "Nouvelle-Zélande", "Visa étudiant")).toContain("enrolmentConfirmation");
  });

  it("le Canada et l'e-Visa gardent leurs questions ; un pays sans catalogue n'en reçoit pas d'inventées", () => {
    expect(keys("etudes", "Canada", "Visa études")).toContain("canadaDli");
    expect(keys("etudes", "Canada", "Visa études")).not.toContain("admissionLetter");
    expect(keys("travail", "Japon", "Visa travail")).toEqual(["selectedProcedure"]);
  });

  it("chaque question a une clé unique, un libellé français et des options non vides", () => {
    for (const [type, country, label] of [["etudes", "France", "Visa études"], ["travail", "Luxembourg", "Visa travail"], ["etudes", "Allemagne", "Formation"], ["etudes", "Royaume-Uni", "Visa étudiant"]] as const) {
      const procedure = { procedureLabel: label, id: label } as any;
      const fields = getCountryProcedureFields(type, country, procedure);
      expect(new Set(fields.map((f) => f.key)).size, `${country} ${type}`).toBe(fields.length);
      for (const f of fields) {
        expect(f.label.length).toBeGreaterThan(3);
        if (f.kind === "select") expect((f.options ?? []).length, f.key).toBeGreaterThan(1);
      }
    }
  });
});
