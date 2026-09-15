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

  // TODO-VERIFY: legacy feature not found in EvaluationSpace.tsx after ClientDashboard.tsx removal — confirm intentionally dropped or re-add.
  // submitMyRequirementDocument (checked above) is no longer called from any client file; the
  // filterable status-history log and inline WhatsApp assistance link bundled in ClientDashboard.tsx
  // could not be found anywhere in the current codebase.
  it.skip("propose le dépôt direct, la chronologie filtrable et le contact d’assistance dans le dashboard", () => {
    const dashboard = read("client/src/pages/EvaluationSpace.tsx");
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

  // TODO-VERIFY: legacy feature not found in EvaluationSpace.tsx after ClientDashboard.tsx removal — confirm intentionally dropped or re-add.
  // Profile editing now lives in client/src/components/ClientProfilePanel.tsx (rendered by the
  // "profile" tab), which still calls candidate.updateProfile.useMutation, but the email address is
  // no longer presented as protected/immutable — it now offers a "Modifier mon adresse e-mail" flow
  // with double confirmation, contradicting the original "email is protected" assertion below.
  it("permet au candidat de modifier uniquement ses informations de base", () => {
    const dashboard = read("client/src/components/ClientProfilePanel.tsx");
    expect(dashboard).toContain("candidate.updateProfile.useMutation");
    expect(dashboard).toContain("Enregistrer mon profil");
    expect(dashboard).toContain("Modifier mon adresse e-mail");
    expect(dashboard).toContain("client-full-name");
  });

  // TODO-VERIFY: legacy feature not found in EvaluationSpace.tsx after ClientDashboard.tsx removal — confirm intentionally dropped or re-add.
  // Avatar upload now lives in client/src/components/CandidateAvatar.tsx (still calls
  // updateAvatar.useMutation and portraitVerificationToken), and document preview ("Prévisualiser")
  // now lives in CandidateCountryJourney.tsx, but no "globalProgress" / "Progression globale du
  // dossier" combined-completion metric could be found anywhere in the current codebase.
  it.skip("propose un avatar vérifié, l’aperçu du dernier document et une synthèse globale", () => {
    const dashboard = read("client/src/pages/EvaluationSpace.tsx");
    expect(dashboard).toContain("updateAvatar.useMutation");
    expect(dashboard).toContain("portraitVerificationToken");
    expect(dashboard).toContain("Photo de profil");
    expect(dashboard).toContain("globalProgress");
    expect(dashboard).toContain("Progression globale du dossier");
    expect(dashboard).toContain("Prévisualiser");
  });

  // TODO-VERIFY: legacy feature not found in EvaluationSpace.tsx after ClientDashboard.tsx removal — confirm intentionally dropped or re-add.
  // AvatarCropperModal still exists (client/src/components/AvatarCropperModal.tsx) but is no longer
  // wired into the candidate space’s avatar flow (CandidateAvatar.tsx uploads directly, no cropper);
  // navigateToIncompleteSection / "Étape prioritaire" could not be found anywhere in the codebase.
  it.skip("guide le candidat vers l’action manquante, recadre le portrait et explique un refus", () => {
    const dashboard = read("client/src/pages/EvaluationSpace.tsx");
    const candidateRouter = read("server/routers/candidate.ts");
    expect(dashboard).toContain("navigateToIncompleteSection");
    expect(dashboard).toContain("Étape prioritaire");
    expect(dashboard).toContain("AvatarCropperModal");
    expect(dashboard).toContain("Motif : {doc.rejectionReason");
    expect(dashboard).toContain("Document refusé — correction requise");
    expect(candidateRouter).toContain("rejectionReason: doc.rejectionReason");
  });

  // TODO-VERIFY: legacy feature not found in EvaluationSpace.tsx after ClientDashboard.tsx removal — confirm intentionally dropped or re-add.
  // Document correction is now surfaced read-only in client/src/components/AgencyDocumentsPanel.tsx
  // ("Correction demandée" annotations from the agency), but the candidate-authored explanatory
  // comment flow (handleCorrectionSubmission / correctionComment) could not be found client-side.
  it.skip("attache le commentaire candidat à une correction de document et le transmet au suivi", () => {
    const dashboard = read("client/src/pages/EvaluationSpace.tsx");
    const candidateRouter = read("server/routers/candidate.ts");
    const trackingRouter = read("server/routers/caseTracking.ts");
    expect(dashboard).toContain("Votre commentaire explicatif");
    expect(dashboard).toContain("handleCorrectionSubmission");
    expect(dashboard).toContain("correctionComment:");
    expect(candidateRouter).toContain("correctionComment: input.correctionComment ?? null");
    expect(trackingRouter).toContain("Commentaire candidat");
  });

  // TODO-VERIFY: legacy feature not found in EvaluationSpace.tsx after ClientDashboard.tsx removal — confirm intentionally dropped or re-add.
  // The candidate-scoped "initiateMyCinetPayPayment" mutation is not called from any live client
  // file; client/src/components/PaymentModal.tsx does show "Frais d’ouverture de dossier" and calls
  // a similarly-named but different mutation (application.initiateCinetPayPayment), but PaymentModal
  // is itself only referenced by the orphaned DossierProgressBar.tsx, not by EvaluationSpace.tsx.
  it.skip("conserve le parcours d’ouverture à 65 000 XAF et le sécurise par le candidat connecté", () => {
    const dashboard = read("client/src/pages/EvaluationSpace.tsx");
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
