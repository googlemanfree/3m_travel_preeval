import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  agencyDocumentDisplayType,
  fileKeyFromDocumentUrl,
  mapAgencyVerificationToReviewStatus,
  parseDocumentsReceivedList,
  previewCountryVisaChecklist,
} from "./services/publishAgencyDocumentsToCase";
import { pickActiveCaseRequirements } from "../client/src/lib/documentChecklist";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("publishAgencyDocumentsToCase helpers", () => {
  it("normalise les types scannés vers des libellés client lisibles", () => {
    expect(agencyDocumentDisplayType("passport")).toBe("Passeport");
    expect(agencyDocumentDisplayType("cv")).toBe("CV");
    expect(agencyDocumentDisplayType("diploma")).toBe("Diplôme");
    expect(agencyDocumentDisplayType("other", "PASSEPORT_SIEWE.pdf")).toBe("Passeport");
  });

  it("extrait la clé de stockage depuis /manus-storage/", () => {
    expect(fileKeyFromDocumentUrl("/manus-storage/agency-dossiers/12/documents/a.pdf")).toBe("agency-dossiers/12/documents/a.pdf");
    expect(fileKeyFromDocumentUrl("https://cdn.example/manus-storage/agency-dossiers/1/x.pdf?sig=1")).toBe("agency-dossiers/1/x.pdf");
    expect(fileKeyFromDocumentUrl("agency-dossiers/9/documents/y.pdf")).toBe("agency-dossiers/9/documents/y.pdf");
    expect(fileKeyFromDocumentUrl("")).toBeNull();
  });

  it("mappe les statuts de vérification agence vers reviewStatus case", () => {
    expect(mapAgencyVerificationToReviewStatus("verified")).toBe("approved");
    expect(mapAgencyVerificationToReviewStatus("rejected")).toBe("rejected");
    expect(mapAgencyVerificationToReviewStatus("pending")).toBe("pending");
    expect(mapAgencyVerificationToReviewStatus(null)).toBe("received");
  });

  it("parse la liste libre des pièces déjà remises", () => {
    expect(parseDocumentsReceivedList("CV, passeport ; diplôme\nphoto")).toEqual([
      "CV",
      "passeport",
      "diplôme",
      "photo",
    ]);
    expect(parseDocumentsReceivedList("  ")).toEqual([]);
  });

  it("construit une checklist dynamique Canada × Études", () => {
    const checklist = previewCountryVisaChecklist({
      destination: "Canada",
      visaType: "Études",
      documentsReceived: "Lettre de motivation",
    });
    expect(checklist.label.toLowerCase()).toMatch(/étude|study/);
    expect(checklist.documents.some((item) => /passeport/i.test(item.documentType))).toBe(true);
    expect(checklist.documents.some((item) => /lettre d’admission|admission/i.test(item.documentType))).toBe(true);
    expect(checklist.documents.some((item) => /lettre de motivation/i.test(item.documentType))).toBe(true);
  });
});

describe("pickActiveCaseRequirements — dossier actif vs EVAL", () => {
  it("privilégie le dossier 3M-AGN actif plutôt que EVAL-", () => {
    const requirements = pickActiveCaseRequirements(
      [
        { caseNumber: "EVAL-99", requirements: [{ id: 1, documentType: "Ancien", status: "pending" }], updatedAt: "2026-01-01" },
        { caseNumber: "3M-AGN-0012", requirements: [{ id: 2, documentType: "Passeport valide", status: "received" }], updatedAt: "2026-10-01" },
      ],
      ["3M-AGN-0012", "EVAL-99"],
    );
    expect(requirements.map((item) => item.id)).toEqual([2]);
  });

  it("retombe sur le dossier le plus récent avec exigences si aucune clé ne matche", () => {
    const requirements = pickActiveCaseRequirements(
      [
        { caseNumber: "A", requirements: [{ id: 1, documentType: "CV", status: "pending" }], updatedAt: "2026-01-01" },
        { caseNumber: "B", requirements: [{ id: 2, documentType: "Photo", status: "pending" }], updatedAt: "2026-09-01" },
      ],
      ["INCONNU"],
    );
    expect(requirements.map((item) => item.id)).toEqual([2]);
  });
});

describe("branchement admin / upload / UI", () => {
  it("expose publication, seed custom et sync upload", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("publishAgencyScannedDocumentsToClient");
    expect(admin).toContain("previewCountryVisaChecklist");
    expect(admin).toContain("publishAgencyDocumentsToCase");
    expect(admin).toContain("customDocuments: receivedPieces");
    expect(admin).toContain("documentsReceived");

    const upload = read("server/routers/agencyDossierUpload.ts");
    expect(upload).toContain("publishAgencyDocumentsToCase");
    expect(upload).toContain("publishedToClient");

    const seed = read("server/services/seedCountryProcedureCase.ts");
    expect(seed).toContain("customDocuments");

    const center = read("client/src/components/AgencyDossierDocumentCenter.tsx");
    expect(center).toContain("publishAgencyScannedDocumentsToClient");
    expect(center).toContain("Publier vers l’espace client");

    const space = read("client/src/pages/EvaluationSpace.tsx");
    expect(space).toContain("pickActiveCaseRequirements");

    const modal = read("client/src/pages/AdminDashboard.tsx");
    expect(modal).toContain("previewCountryVisaChecklist");
    expect(modal).toContain("import-checklist-preview");
    expect(modal).toContain("Ajouter un dossier déjà inscrit en agence");
  });
});
