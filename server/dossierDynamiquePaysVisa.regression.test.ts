import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  normalizeAdminProcedureType,
  resolveDossierProcedureSelection,
} from "../shared/dossierProcedureSelection";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("dossier dynamique pays + visa", () => {
  it("normalise les libellés historiques vers le catalogue procédure", () => {
    expect(normalizeAdminProcedureType("Visa Étudiant")).toBe("Études");
    expect(normalizeAdminProcedureType("Visa Travail")).toBe("Travail");
    expect(normalizeAdminProcedureType("Visa Tourisme")).toBe("Tourisme / visite");
    expect(normalizeAdminProcedureType("Visa Famille")).toBe("Regroupement familial");
    expect(normalizeAdminProcedureType("e-Visa")).toBe("e-Visa / autorisation électronique");
  });

  it("refuse les catégories grossières et résout un pays catalogue", () => {
    const canada = resolveDossierProcedureSelection({ destination: "canada", visaType: "Visa Étudiant" });
    expect(canada.recognized).toBe(true);
    expect(canada.destination).toBe("Canada");
    expect(canada.visaType).toBe("Études");
    expect(canada.checklistKey).toBe("study_permit");
    expect(canada.coarseCategory).toBe("canada");

    const europe = resolveDossierProcedureSelection({ destination: "europe", visaType: "Travail" });
    expect(europe.recognized).toBe(false);

    const france = resolveDossierProcedureSelection({ destination: "France", visaType: "work_permit" });
    expect(france.destination).toBe("France");
    expect(france.visaType).toBe("Travail");
    expect(france.checklistKey).toBe("work_permit");
  });

  it("branche activation, import, seed checklist et UI admin", () => {
    const activation = read("server/routers/adminCandidateManagement.ts");
    expect(activation).toContain("resolveDossierProcedureSelection");
    expect(activation).toContain("seedCountryProcedureChecklist");
    expect(activation).toContain("evaluationWithoutCv");
    expect(activation).toContain("preferredDestinations: JSON.stringify(primaryProcedure.preferredDestinations)");

    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("resolveDossierProcedureSelection");
    expect(admin).toContain("seedCountryProcedureChecklist");

    expect(read("server/services/seedCountryProcedureCase.ts")).toContain("procedure_checklist_seeded");
    expect(read("client/src/components/AdminPreDossierAccountsPanel.tsx")).toContain("CountrySelect");
    expect(read("client/src/components/AdminPreDossierAccountsPanel.tsx")).toContain("ADMIN_PROCEDURE_TYPES");
    expect(read("client/src/components/AdminPreDossierAccountsPanel.tsx")).toContain("Sans CV");
    expect(read("client/src/pages/AdminDashboard.tsx")).toContain("ADMIN_PROCEDURE_TYPES");
    expect(read("client/src/pages/AdminDashboard.tsx")).toContain("CountrySelect");
  });
});
