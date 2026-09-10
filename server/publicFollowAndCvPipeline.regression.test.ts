import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (relativePath: string) => readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");

describe("Suivi public et pipeline CV candidat", () => {
  it("privilégie la session courante et ne mélange pas deux comptes dans le suivi", () => {
    const auth = read("client/src/hooks/useCandidateAuth.ts");
    const dossier = read("client/src/pages/MonDossier.tsx");
    expect(auth).toContain("sessionStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY)");
    expect(auth).toContain("sessionStorage.getItem(CANDIDATE_KEY) ?? localStorage.getItem(CANDIDATE_KEY)");
    expect(dossier).toContain("const associatedApplication = myDossierQuery.data?.data?.application");
    expect(dossier).toContain("const associatedEmail = associatedApplication?.email ?? candidate?.email ?? \"\"");
    expect(dossier).toContain("setCredentials({ dossierNumber: associatedDossierNumber, email: associatedEmail })");
    expect(dossier).toContain("{(!hasAssociatedDossier && (!submitted || error)) ? (");
  });

  it("rattache les CV agence au dossier exact et les expose comme cvDocument", () => {
    const upload = read("server/routers/candidateUpload.ts");
    const admin = read("server/routers/admin.ts");
    const uploadPage = read("client/src/pages/DocumentUploadPage.tsx");
    expect(upload).toContain('documentType === "cv" ? "cv"');
    expect(upload).toContain("dossierId: agencyDossier.id");
    expect(upload).toContain('source: "candidate_upload"');
    expect(admin).toContain("agencyDossierDocuments");
    expect(admin).toContain("const agencyCvDocument");
    expect(admin).toContain("cvDocument: agencyCvDocument ?");
    expect(uploadPage).toContain("sessionStorage.getItem('3m_candidate_token') || localStorage.getItem('3m_candidate_token')");
  });
});
