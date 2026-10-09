import { describe, expect, it } from "vitest";
import {
  attachSiblingProcedures,
  procedureLabelForDossier,
  secondaryDossierEvaluationPath,
} from "../shared/clientMultiDossier";

describe("clientMultiDossier", () => {
  it("libellé Visa travail / études selon le type de procédure", () => {
    expect(procedureLabelForDossier({ visaType: "Travail qualifié" })).toBe("Visa travail");
    expect(procedureLabelForDossier({ projectType: "Études supérieures" })).toBe("Visa études");
    expect(procedureLabelForDossier({ destination: "Canada", dossierNumber: "3M-1" })).toBe("Canada");
  });

  it("construit l’URL d’évaluation pour un dossier secondaire", () => {
    expect(secondaryDossierEvaluationPath({ project: "etudes", destination: "Canada" })).toBe(
      "/evaluation?project=etudes&source=client-space-secondary&destination=Canada",
    );
    expect(secondaryDossierEvaluationPath({ project: "travail" })).toContain("project=travail");
  });

  it("attache les procédures sœurs du même e-mail pour l’admin", () => {
    const rows = attachSiblingProcedures([
      { id: "online_1", email: "a@test.com", folderCode: "3M-A", projectType: "Travail", destinationCountry: "Canada", paymentStatus: "SUCCESS", source: "WEB" },
      { id: "agency_2", email: "a@test.com", folderCode: "3M-AGN-0002", projectType: "Études", destinationCountry: "Canada", paymentStatus: "SUCCESS", source: "AGENCY_PHYSICAL" },
      { id: "online_3", email: "b@test.com", folderCode: "3M-B", projectType: "Tourisme", destinationCountry: "France", paymentStatus: "PENDING", source: "WEB" },
      { id: "account_9", email: "a@test.com", folderCode: "COMPTE-00009", projectType: "À qualifier", destinationCountry: "—", paymentStatus: "NOT_PAID", source: "ACCOUNT_ONLY" },
    ]);
    const first = rows.find((row) => row.id === "online_1")!;
    expect(first.siblingCount).toBe(2);
    expect(first.siblingProcedures).toHaveLength(1);
    expect(first.siblingProcedures[0].folderCode).toBe("3M-AGN-0002");
    expect(rows.find((row) => row.id === "online_3")!.siblingCount).toBe(1);
    expect(rows.find((row) => row.id === "account_9")!.siblingProcedures).toHaveLength(0);
  });
});
