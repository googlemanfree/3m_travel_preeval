import { describe, expect, it } from "vitest";
import {
  AGENCY_DOSSIER_STATUS_VALUES,
  isLuxembourgEmploymentProcedure,
  isLuxembourgEmploymentStatus,
} from "../shared/agencyDossierStatus";

describe("statuts agence adaptés à la procédure", () => {
  it("réserve les étapes employeur et ADEM aux procédures de travail au Luxembourg", () => {
    expect(AGENCY_DOSSIER_STATUS_VALUES).toContain("recherche_employeur");
    expect(AGENCY_DOSSIER_STATUS_VALUES).toContain("validation_adem");
    expect(isLuxembourgEmploymentStatus("validation_adem")).toBe(true);
    expect(isLuxembourgEmploymentProcedure("Luxembourg", "Permis de Travail")).toBe(true);
    expect(isLuxembourgEmploymentProcedure("Luxembourg", "Visa Tourisme")).toBe(false);
    expect(isLuxembourgEmploymentProcedure("Canada", "Permis de Travail")).toBe(false);
  });
});
