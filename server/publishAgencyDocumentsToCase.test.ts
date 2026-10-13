import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  agencyDocumentDisplayType,
  fileKeyFromDocumentUrl,
  mapAgencyVerificationToReviewStatus,
  parseDocumentsReceivedList,
  previewCountryVisaChecklist,
  publishAgencyDocumentsToCase,
} from "./services/publishAgencyDocumentsToCase";
import { pickActiveCaseRequirements } from "../client/src/lib/documentChecklist";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

vi.mock("./services/seedCountryProcedureCase", () => ({
  seedCountryProcedureChecklist: vi.fn(async () => ({ added: 0, label: "Procédure standard" })),
}));
vi.mock("./services/clientWhatsAppNotify", () => ({
  notifyAgencyDocumentsPublishedWhatsApp: vi.fn(async () => ({ sent: false, attempted: false })),
}));

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

describe("publishAgencyDocumentsToCase — sync statut sans création", () => {
  it("sans dossier ops et createCaseIfMissing:false : no-op (ne crée pas de case)", async () => {
    const db = {
      select: vi.fn()
        .mockReturnValueOnce({
          from: () => ({
            where: () => ({
              limit: async () => [{
                id: 12,
                email: "client@example.com",
                phone: null,
                fullName: "Client Test",
                destination: "Canada",
                visaType: "Études",
                status: "documents_review",
                createdAt: new Date("2026-10-01"),
              }],
            }),
          }),
        })
        .mockReturnValueOnce({
          from: () => ({
            where: () => ({
              limit: async () => [{ id: 42, phone: null }],
            }),
          }),
        })
        .mockReturnValueOnce({
          from: () => ({
            where: () => ({
              limit: async () => [],
            }),
          }),
        }),
      insert: vi.fn(),
      update: vi.fn(),
    } as any;

    const result = await publishAgencyDocumentsToCase(db, {
      agencyDossierId: 12,
      documentIds: [7],
      notify: false,
      createCaseIfMissing: false,
    });
    expect(result).toMatchObject({ reason: "no_case", published: 0, updated: 0, caseId: null });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("aligne reviewStatus quand la pièce existe déjà et passe en verified", async () => {
    const values = vi.fn(async () => undefined);
    const insert = vi.fn(() => ({ values }));
    const whereUpdate = vi.fn(async () => undefined);
    const setUpdate = vi.fn(() => ({ where: whereUpdate }));
    const update = vi.fn(() => ({ set: setUpdate }));
    const requirement = {
      id: 55,
      documentType: "Passeport valide",
      status: "received",
    };
    const operational = {
      id: 9,
      caseNumber: "3M-AGN-0012",
      candidateId: 42,
      legacyAgencyDossierId: 12,
      countryTarget: "Canada",
      visaType: "Études",
    };
    const dossier = {
      id: 12,
      email: "client@example.com",
      phone: null,
      fullName: "Client Test",
      destination: "Canada",
      visaType: "Études",
      status: "documents_review",
      createdAt: new Date("2026-10-01"),
    };
    const db = {
      select: vi.fn()
        .mockReturnValueOnce({ from: () => ({ where: () => ({ limit: async () => [dossier] }) }) })
        .mockReturnValueOnce({ from: () => ({ where: () => ({ limit: async () => [{ id: 42, phone: null }] }) }) })
        .mockReturnValueOnce({ from: () => ({ where: () => ({ limit: async () => [operational] }) }) })
        .mockReturnValueOnce({
          from: () => ({
            where: () => ({
              orderBy: async () => [{
                id: 7,
                dossierId: 12,
                documentType: "passeport",
                documentName: "passeport.pdf",
                documentUrl: "/manus-storage/agency-dossiers/12/documents/passeport.pdf",
                fileSize: 12,
                source: "agency_scan",
                verificationStatus: "verified",
                verificationComment: null,
                createdAt: new Date("2026-10-12T11:00:00.000Z"),
              }],
            }),
          }),
        })
        .mockReturnValueOnce({
          from: () => ({
            where: async () => [{
              id: 1,
              fileName: "passeport.pdf",
              fileKey: "agency-dossiers/12/documents/passeport.pdf",
              documentType: "Passeport",
              reviewStatus: "received",
            }],
          }),
        })
        .mockReturnValueOnce({
          from: () => ({ where: async () => [requirement] }),
        }),
      insert,
      update,
    } as any;

    const result = await publishAgencyDocumentsToCase(db, {
      agencyDossierId: 12,
      documentIds: [7],
      notify: false,
      createCaseIfMissing: false,
      actorEmail: "admin@3mtravelagency.com",
    });
    expect(result).toMatchObject({ published: 0, updated: 1, skipped: 0, reason: "ok" });
    expect(update).toHaveBeenCalled();
    expect(requirement.status).toBe("approved");
    expect(values).toHaveBeenCalled(); // activity log
  });
});

describe("branchement admin / upload / UI + sync à l’approbation", () => {
  it("expose publication, seed custom et sync upload", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("publishAgencyScannedDocumentsToClient");
    expect(admin).toContain("previewCountryVisaChecklist");
    expect(admin).toContain("publishAgencyDocumentsToCase");
    expect(admin).toContain("customDocuments: receivedPieces");
    expect(admin).toContain("documentsReceived");
    expect(admin).toContain("[Admin updateDocumentStatus] sync agency case_documents:");
    expect(admin).toContain("createCaseIfMissing: false");

    const agencyDocs = read("server/routers/agencyDossierDocuments.ts");
    expect(agencyDocs).toContain("publishAgencyDocumentsToCase");
    expect(agencyDocs).toContain("[agencyDossierDocuments.updateVerificationStatus] sync case_documents:");
    expect(agencyDocs).toContain("createCaseIfMissing: false");

    const upload = read("server/routers/agencyDossierUpload.ts");
    expect(upload).toContain("publishAgencyDocumentsToCase");
    expect(upload).toContain("publishedToClient");
    expect(upload).toContain("publishReason");

    const seed = read("server/services/seedCountryProcedureCase.ts");
    expect(seed).toContain("customDocuments");

    const center = read("client/src/components/AgencyDossierDocumentCenter.tsx");
    expect(center).toContain("publishAgencyScannedDocumentsToClient");
    expect(center).toContain("Publier vers l’espace client");
    expect(center).toContain("agencyCoffreSyncUploadMessage");
    expect(center).toContain("toast.warning");
    expect(center).not.toContain("synchronisé avec l’espace candidat");

    const space = read("client/src/pages/EvaluationSpace.tsx");
    expect(space).toContain("pickActiveCaseRequirements");

    const modal = read("client/src/pages/AdminDashboard.tsx");
    expect(modal).toContain("previewCountryVisaChecklist");
    expect(modal).toContain("import-checklist-preview");
    expect(modal).toContain("Ajouter un dossier déjà inscrit en agence");

    const docsUi = read("client/src/components/AdminDocumentsManagement.tsx");
    expect(docsUi).toContain('doc.source === "agency" ? "agency" : "client"');
  });
});
