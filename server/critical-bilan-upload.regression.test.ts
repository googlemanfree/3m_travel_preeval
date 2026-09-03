import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const uploadRouter = readFileSync(resolve(root, "server/routers/candidateUpload.ts"), "utf8");
const uploader = readFileSync(resolve(root, "client/src/components/DocumentUploader.tsx"), "utf8");
const unifiedRouter = readFileSync(resolve(root, "server/routers/unifiedRequests.ts"), "utf8");

describe("correctifs critiques upload et préparation du bilan", () => {
  it("normalise les catégories usuelles et la catégorie Autres côté serveur", () => {
    expect(uploadRouter).toContain('autres: "other"');
    expect(uploadRouter).toContain('"autres/divers": "other"');
    expect(uploadRouter).toContain("function normalizeDocumentType");
    expect(uploadRouter).toContain("const documentType = normalizeDocumentType(rawDocumentType)");
    expect(uploadRouter).toContain('"application/pdf"');
    expect(uploadRouter).toContain('"image/jpeg"');
    expect(uploadRouter).toContain('"image/png"');
    expect(uploadRouter).toContain('"application/msword"');
    expect(uploadRouter).toContain('"application/vnd.openxmlformats-officedocument.wordprocessingml.document"');
  });

  it("permet de relancer un fichier en erreur depuis l’interface", () => {
    expect(uploader).toContain("const retryUpload = async (file: DocumentFile)");
    expect(uploader).toContain('onClick={() => void retryUpload(file)}');
    expect(uploader).toContain("Réessayer");
  });

  it("résout un dossier agence vers l’application liée par candidat ou e-mail", () => {
    expect(unifiedRouter).toContain("const [agencyDossier]");
    expect(unifiedRouter).toContain("eq(agencyDossiers.id, sourceRecordId)");
    expect(unifiedRouter).toContain("eq(applications.candidateId, agencyCandidate.id)");
    expect(unifiedRouter).toContain("eq(applications.email, agencyDossier.email)");
  });

  it("refuse la génération PDF tant que le conseiller n’a pas validé le brouillon", () => {
    expect(unifiedRouter).toContain("draft.advisorValidated !== true");
    expect(unifiedRouter).toContain("Validez explicitement le bilan en tant qu’administrateur avant de générer le PDF.");
  });
});
