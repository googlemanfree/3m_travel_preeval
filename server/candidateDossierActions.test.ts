import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("actions de dossier candidat", () => {
  it("sécurise le lien entre une pièce requise et le candidat connecté", () => {
    const router = read("server/routers/caseTracking.ts");
    expect(router).toContain("submitMyRequirementDocument");
    expect(router).toContain("eq(cases.candidateId, ctx.candidate.id)");
    expect(router).toContain("documentRequirements.status");
    expect(router).toContain('uploadedByRole: "candidate"');
    expect(router).toContain('actionType: "document_submitted"');
  });

  it("renvoie un historique de statut au candidat sans exposer le contrôle administratif", () => {
    const candidateRouter = read("server/routers/candidate.ts");
    expect(candidateRouter).toContain("applicationStatusHistory");
    expect(candidateRouter).toContain("statusHistory,");
    expect(candidateRouter).toContain("Dossier créé et enregistré.");
  });

  it("autorise uniquement la suppression de documents appartenant au candidat et non validés", () => {
    const candidateRouter = read("server/routers/candidate.ts");
    expect(candidateRouter).toContain("deleteDocument: candidateProcedure");
    expect(candidateRouter).toContain("eq(candidateFiles.candidateId, ctx.candidate.id)");
    expect(candidateRouter).toContain("Un document validé ne peut pas être supprimé");
    expect(candidateRouter).toContain("documentId: Number");
  });

  it("propose le dépôt direct, la chronologie filtrable et le contact d’assistance dans le dashboard", () => {
    const dashboard = read("client/src/pages/ClientDashboard.tsx");
    expect(dashboard).toContain("Pièces à compléter");
    expect(dashboard).toContain("handleRequirementUpload");
    expect(dashboard).toContain("Dépôt confirmé");
    expect(dashboard).toContain("Historique du dossier");
    expect(dashboard).toContain("Chronologie des changements de statut");
    expect(dashboard).toContain("history-type");
    expect(dashboard).toContain("history-sort");
    expect(dashboard).toContain("Contacter l’assistance");
    expect(dashboard).toContain("https://wa.me/");
  });

  it("permet au candidat de modifier uniquement ses informations de base", () => {
    const dashboard = read("client/src/pages/ClientDashboard.tsx");
    expect(dashboard).toContain("candidate.updateProfile.useMutation");
    expect(dashboard).toContain("Enregistrer le profil");
    expect(dashboard).toContain("L’adresse e-mail est protégée");
    expect(dashboard).toContain("profile-name");
  });

  it("propose un avatar vérifié, l’aperçu du dernier document et une synthèse globale", () => {
    const dashboard = read("client/src/pages/ClientDashboard.tsx");
    expect(dashboard).toContain("updateAvatar.useMutation");
    expect(dashboard).toContain("portraitVerificationToken");
    expect(dashboard).toContain("Photo de profil");
    expect(dashboard).toContain("globalProgress");
    expect(dashboard).toContain("Progression globale du dossier");
    expect(dashboard).toContain("Prévisualiser");
  });

  it("guide le candidat vers l’action manquante, recadre le portrait et explique un refus", () => {
    const dashboard = read("client/src/pages/ClientDashboard.tsx");
    const candidateRouter = read("server/routers/candidate.ts");
    expect(dashboard).toContain("navigateToIncompleteSection");
    expect(dashboard).toContain("Étape prioritaire");
    expect(dashboard).toContain("AvatarCropperModal");
    expect(dashboard).toContain("Motif : {doc.rejectionReason");
    expect(dashboard).toContain("Document refusé — correction requise");
    expect(candidateRouter).toContain("rejectionReason: doc.rejectionReason");
  });

  it("attache le commentaire candidat à une correction de document et le transmet au suivi", () => {
    const dashboard = read("client/src/pages/ClientDashboard.tsx");
    const candidateRouter = read("server/routers/candidate.ts");
    const trackingRouter = read("server/routers/caseTracking.ts");
    expect(dashboard).toContain("Votre commentaire explicatif");
    expect(dashboard).toContain("handleCorrectionSubmission");
    expect(dashboard).toContain("correctionComment:");
    expect(candidateRouter).toContain("correctionComment: input.correctionComment ?? null");
    expect(trackingRouter).toContain("Commentaire candidat");
  });

  it("conserve le parcours d’ouverture à 65 000 XAF et le sécurise par le candidat connecté", () => {
    const dashboard = read("client/src/pages/ClientDashboard.tsx");
    const applicationRouter = read("server/routers/application.ts");
    const schema = read("drizzle/schema.ts");
    expect(dashboard).toContain("Frais d’ouverture de dossier");
    expect(dashboard).toContain("initiateMyCinetPayPayment");
    expect(dashboard).toContain("justificatif_paiement");
    expect(applicationRouter).toContain("initiateMyCinetPayPayment: candidateProcedure");
    expect(applicationRouter).toContain("ctx.candidate.id");
    expect(applicationRouter).toContain("65000");
    expect(schema).toContain("justificatif_paiement");
  });
});
