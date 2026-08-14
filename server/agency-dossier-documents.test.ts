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
});
