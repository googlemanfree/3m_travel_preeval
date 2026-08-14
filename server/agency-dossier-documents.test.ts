import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("Centre documentaire par dossier", () => {
  it("expose un upload admin avec contrôle de type, taille et signature", () => {
    const source = readProjectFile("server/routers/agencyDossierUpload.ts");
    expect(source).toContain("registerAgencyDossierUploadRoute");
    expect(source).toContain("MAX_FILE_SIZE = 15 * 1024 * 1024");
    expect(source).toContain("hasExpectedSignature");
    expect(source).toContain('user.role !== "admin"');
    expect(source).toContain("agency-dossiers/");
  });

  it("délivre des URLs signées après contrôle de propriété", () => {
    const candidateSource = readProjectFile("server/routers/candidate.ts");
    const adminSource = readProjectFile("server/routers/agencyDossierDocuments.ts");
    expect(candidateSource).toContain("getMyAgencyDocuments");
    expect(candidateSource).toContain("ctx.candidate.email");
    expect(candidateSource).toContain("storageGetSignedUrl");
    expect(adminSource).toContain("listForAdmin");
    expect(adminSource).toContain("storageGetSignedUrl");
  });

  it("exige le Bearer candidat et synchronise les dépôts vers le dossier d’agence", () => {
    const uploadSource = readProjectFile("server/routers/candidateUpload.ts");
    expect(uploadSource).toContain('if (!authorization?.startsWith("Bearer "))');
    expect(uploadSource).toContain("agencyDossierDocuments");
    expect(uploadSource).toContain('source: "candidate_upload"');
    expect(uploadSource).toContain("agencyDossierHistory");
  });

  it("affiche le centre côté candidat et côté administrateur", () => {
    const candidatePage = readProjectFile("client/src/pages/EvaluationSpace.tsx");
    const adminPage = readProjectFile("client/src/pages/AdminAgencyDossiers.tsx");
    expect(candidatePage).toContain("AgencyDocumentsPanel");
    expect(adminPage).toContain("AgencyDossierDocumentCenter");
  });

  it("rafraîchit la checklist après un dépôt et propose une décharge PDF", () => {
    const candidatePage = readProjectFile("client/src/pages/EvaluationSpace.tsx");
    const checklist = readProjectFile("client/src/components/DossierDocumentChecklist.tsx");
    const receipt = readProjectFile("client/src/components/DocumentReceiptButton.tsx");
    expect(candidatePage).toContain("DossierDocumentChecklist");
    expect(candidatePage).toContain("getMyAgencyDocuments.invalidate");
    expect(checklist).toContain("requiredDocuments");
    expect(receipt).toContain("jsPDF");
    expect(receipt).toContain("Décharge PDF");
  });

  it("notifie après un dépôt candidat ou agence sans bloquer le stockage", () => {
    const candidateUpload = readProjectFile("server/routers/candidateUpload.ts");
    const agencyUpload = readProjectFile("server/routers/agencyDossierUpload.ts");
    expect(candidateUpload).toContain("notifyDocumentSubmission");
    expect(candidateUpload).toContain("Notification document non envoyée");
    expect(agencyUpload).toContain("notifyDocumentSubmission");
    expect(agencyUpload).toContain("Notification document non envoyée");
  });

  it("permet des corrections ciblées uniquement sur les documents refusés", () => {
    const adminSource = readProjectFile("server/routers/agencyDossierDocuments.ts");
    const candidateSource = readProjectFile("server/routers/candidate.ts");
    const adminPanel = readProjectFile("client/src/components/AgencyDossierDocumentCenter.tsx");
    const candidatePanel = readProjectFile("client/src/components/AgencyDocumentsPanel.tsx");
    expect(adminSource).toContain("addCorrectionAnnotation");
    expect(adminSource).toContain('document.verificationStatus !== "rejected"');
    expect(adminSource).toContain("agencyDossierDocumentAnnotations");
    expect(candidateSource).toContain("agencyDossierDocumentAnnotations");
    expect(adminPanel).toContain("Ajouter une annotation");
    expect(candidatePanel).toContain("Correction demandée");
  });
});
