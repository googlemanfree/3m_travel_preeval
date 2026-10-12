import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MAX_CHECKLIST_DOCUMENTS, MAX_UPLOAD_BATCH_FILES, capDocumentList } from "../shared/documentLimits";
import { assembleChecklistRequirements, FALLBACK_REQUIREMENTS, getRequirements, summarizeChecklist } from "../client/src/lib/documentChecklist";
import { buildCountryProcedureDocumentChecklist } from "../shared/countryProcedureChecklist";
import { allCaseDocuments, agencyDepositedDocuments } from "../client/src/components/CaseDocumentsPanel";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("client documents — capacité 16 et synchro bidirectionnelle", () => {
  it("expose une capacité partagée de 16 pièces / 16 fichiers", () => {
    expect(MAX_CHECKLIST_DOCUMENTS).toBe(16);
    expect(MAX_UPLOAD_BATCH_FILES).toBe(16);
    expect(capDocumentList(Array.from({ length: 20 }, (_, i) => i))).toHaveLength(16);
  });

  it("fournit un socle de préparation riche mais plafonné à 16", () => {
    expect(FALLBACK_REQUIREMENTS.length).toBe(16);
    expect(FALLBACK_REQUIREMENTS.length).toBeLessThanOrEqual(MAX_CHECKLIST_DOCUMENTS);
    const requirements = getRequirements(undefined, undefined);
    expect(requirements.length).toBeGreaterThan(5);
    expect(requirements.length).toBeLessThanOrEqual(16);
  });

  it("priorise les demandes conseiller et ne dépasse jamais 16 lignes", () => {
    const customs = Array.from({ length: 5 }, (_, index) => ({
      id: index + 1,
      documentType: `Pièce conseiller ${index + 1}`,
      status: "pending" as const,
    }));
    const assembled = assembleChecklistRequirements("Canada", "travail", customs);
    expect(assembled.total).toBeLessThanOrEqual(16);
    expect(assembled.customs).toHaveLength(5);
    expect(assembled.catalogue.length + assembled.customs.length).toBe(assembled.total);

    const summary = summarizeChecklist("Canada", "travail", [], customs);
    expect(summary.total).toBeLessThanOrEqual(16);
    expect(summary.missing).toBe(summary.total);
  });

  it("cap la checklist pays×procédure à 16 avec customs prioritaires", () => {
    const checklist = buildCountryProcedureDocumentChecklist({
      destination: "Canada",
      procedureType: "work_permit",
      customDocuments: ["Attestation spéciale A", "Attestation spéciale B"],
    });
    expect(checklist.documents.length).toBeLessThanOrEqual(16);
    expect(checklist.documents[0]?.documentType).toBe("Attestation spéciale A");
    expect(checklist.documents.some((line) => line.documentType === "Attestation spéciale B")).toBe(true);
  });

  it("expose côté client les pièces agence et les dépôts candidat du dossier", () => {
    const cases = [{
      documents: [
        { id: 1, documentType: "Passeport", fileName: "pass.pdf", uploadedByRole: "agency", reviewStatus: "approved" },
        { id: 2, documentType: "CV", fileName: "cv.pdf", uploadedByRole: "candidate", reviewStatus: "received" },
      ],
    }];
    expect(agencyDepositedDocuments(cases)).toHaveLength(1);
    expect(allCaseDocuments(cases)).toHaveLength(2);
    expect(allCaseDocuments(cases).map((doc) => doc.uploadedByRole)).toEqual(["agency", "candidate"]);
  });

  it("durcit les plafonds serveur / upload à 16", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain(".max(16).optional()");
    expect(admin).toContain("requirements.slice(0, 16)");
    expect(admin).toContain("files.slice(0, 16)");
    expect(read("client/src/components/SecureDocumentUpload.tsx")).toContain("const MAX_FILES = 16");
    expect(read("client/src/pages/EvaluationSpace.tsx")).toContain("allCaseDocuments");
    expect(read("client/src/pages/EvaluationSpace.tsx")).toContain("client-document-center");
    expect(read("client/src/pages/EvaluationSpace.tsx")).toContain("/16");
  });
});
