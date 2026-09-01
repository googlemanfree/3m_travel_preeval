import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("admin agency document upload", () => {
  it("uses the complete candidate directory for upload targets", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/components/AdminDocumentsManagement.tsx"), "utf8");
    expect(source).toContain("trpc.admin.listCandidates.useQuery");
    expect(source).toContain("candidateDirectory?.candidates");
    expect(source).not.toContain("documents.filter((document) => document.candidateId)");
  });

  it("keeps the server upload bound to an authenticated candidate id", () => {
    const source = readFileSync(resolve(process.cwd(), "server/routers/admin.ts"), "utf8");
    expect(source).toContain("requireValidAdminSession(input.sessionToken)");
    expect(source).toContain("where(eq(candidates.id, input.candidateId))");
    expect(source).toContain("storagePut(`admin-documents/");
  });
});


  it("exposes a separate audited metadata update for agency pre-dossiers", () => {
    const source = readFileSync(resolve(process.cwd(), "server/routers/agencyDossier.ts"), "utf8");
    expect(source).toContain("updateDossier: protectedProcedure");
    expect(source).toContain('action: "metadata_updated"');
    expect(source).toContain("isNull(agencyDossiers.deletedAt)");
  });

  it("links signup to the latest active agency dossier without case-sensitive email drift", () => {
    const source = readFileSync(resolve(process.cwd(), "server/routers/adminCandidateManagement.ts"), "utf8");
    expect(source).toContain("LOWER(${agencyDossiers.email}) = LOWER(${candidate.email})");
    expect(source).toContain("orderBy(desc(agencyDossiers.createdAt))");
    expect(source).toContain("isNull(agencyDossiers.deletedAt)");
  });

  it("keeps the admin pre-dossier form reusable for editing", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/AdminAgencyDossiers.tsx"), "utf8");
    expect(source).toContain("editingDossierId");
    expect(source).toContain("openEditModal");
    expect(source).toContain("updateDossierMutation");
    expect(source).toContain("AgencyDossierDocumentCenter");
  });


  it("supports dossier search and account linkage metadata in the admin list contract", () => {
    const source = readFileSync(resolve(process.cwd(), "server/routers/agencyDossier.ts"), "utf8");
    expect(source).toContain('search: z.string().trim().max(120).optional()');
    expect(source).toContain("linkedCandidateId");
    expect(source).toContain("linkedCandidateName");
  });

  it("shows the direct client-space link and synchronized agency summary", () => {
    const adminSource = readFileSync(resolve(process.cwd(), "client/src/pages/AdminAgencyDossiers.tsx"), "utf8");
    const clientSource = readFileSync(resolve(process.cwd(), "client/src/pages/EvaluationSpace.tsx"), "utf8");
    expect(adminSource).toContain("Ouvrir l’espace client");
    expect(adminSource).toContain("Compte candidat rattaché");
    expect(clientSource).toContain("Statut actuel du dossier");
    expect(clientSource).toContain("Synchronisation agence");
    expect(clientSource).toContain("agencyDocumentCount");
  });


  it("accepts PNG and PDF MIME variants only with matching content checks", () => {
    const candidateUpload = readFileSync(resolve(process.cwd(), "server/routers/candidateUpload.ts"), "utf8");
    const agencyUpload = readFileSync(resolve(process.cwd(), "server/routers/agencyDossierUpload.ts"), "utf8");
    const evaluationUpload = readFileSync(resolve(process.cwd(), "server/routers/evaluation.ts"), "utf8");
    for (const source of [candidateUpload, agencyUpload, evaluationUpload]) {
      expect(source).toContain("application/pdf");
      expect(source).toContain("application/x-pdf");
      expect(source).toContain("image/png");
      expect(source).toContain("0x25, 0x50, 0x44, 0x46");
    }
    expect(candidateUpload).toContain("0x89, 0x50, 0x4e, 0x47");
  });

  it("provides a direct human review queue for newly received evaluations", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/AdminAIEvaluationDashboard.tsx"), "utf8");
    expect(source).toContain("pendingQueueOnly");
    expect(source).toContain("Nouveaux à traiter");
    expect(source).toContain("Valider puis envoyer");
  });


  it("exposes a non-sending email preview before final validation", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/AdminAIEvaluationDashboard.tsx"), "utf8");
    expect(source).toContain("Aperçu de l’e-mail d’évaluation");
    expect(source).toContain("Aucun e-mail n’est envoyé depuis cet aperçu");
    expect(source).toContain("Prévisualiser l’e-mail");
    expect(source).toContain("Valider puis envoyer");
  });

  it("shows uploaded filename, detected format, size and human-review status", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/components/DocumentUploader.tsx"), "utf8");
    expect(source).toContain("Document reçu avec succès");
    expect(source).toContain("Format détecté");
    expect(source).toContain("en attente de vérification humaine");
    expect(source).toContain('lastUploaded.name');
    expect(source).toContain('lastUploaded.size');
  });

  it("offers distinct online and agency upload targets and preserves agency provenance", () => {
    const clientSource = readFileSync(resolve(process.cwd(), "client/src/components/AdminDocumentsManagement.tsx"), "utf8");
    const adminSource = readFileSync(resolve(process.cwd(), "server/routers/admin.ts"), "utf8");
    expect(clientSource).toContain("agency:${candidate.internalId}");
    expect(clientSource).toContain("agencyDossierId: targetId");
    expect(clientSource).toContain('doc.source === "agency" ? "agency"');
    expect(adminSource).toContain("agencyDossierDocuments");
    expect(adminSource).toContain('source: "agency"');
    expect(adminSource).toContain('target: "agency_dossier"');
  });

  it("provides recovery, autosave and origin cues in the evaluation editor", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/components/EvaluationDeliveryEditor.tsx"), "utf8");
    expect(source).toContain("Signaler au support technique");
    expect(source).toContain("Sauvegarde automatique");
    expect(source).toContain("Zone préparée par l’assistance IA");
    expect(source).toContain("proposition IA à relire");
  });
