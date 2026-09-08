import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const routerSource = fs.readFileSync(path.join(projectRoot, "server/routers/adminCandidateManagement.ts"), "utf8");
const workspaceSource = fs.readFileSync(path.join(projectRoot, "client/src/components/Candidate360Workspace.tsx"), "utf8");
const preDossierPanelSource = fs.readFileSync(path.join(projectRoot, "client/src/components/AdminPreDossierEvaluationPanel.tsx"), "utf8");
const dashboardSource = fs.readFileSync(path.join(projectRoot, "client/src/pages/AdminDashboard.tsx"), "utf8");
const editorSource = fs.readFileSync(path.join(projectRoot, "client/src/components/EvaluationDeliveryEditor.tsx"), "utf8");

describe("validation d’évaluation hors ligne", () => {
  it("protège la mutation par session et limite les canaux à appel/agence/email", () => {
    expect(routerSource).toContain("validateOfflineEvaluation");
    expect(routerSource).toContain('z.enum(["appel", "agence", "email"])');
    expect(routerSource).toContain("requireAdminTreatmentSession(ctx.req.headers.cookie, input.sessionToken)");
    expect(routerSource).toContain("evaluationReviewedAt: reviewedAt");
    expect(routerSource).toContain("evaluationReviewedBy: admin.email");
    expect(routerSource).toContain("evaluationReviewNote: traceNote");
  });

  it("expose le bouton et le formulaire de canal dans la fiche 360°", () => {
    expect(workspaceSource).toContain("Valider l’évaluation hors ligne");
    expect(workspaceSource).toContain("offlineEvaluationChannel");
    expect(workspaceSource).toContain("offlineEvaluationNote");
    expect(workspaceSource).toContain("validateOfflineEvaluation");
    expect(preDossierPanelSource).toContain("Valider l’évaluation hors ligne");
    expect(preDossierPanelSource).toContain("Appel téléphonique");
    expect(preDossierPanelSource).toContain("Bureau en agence");
    expect(preDossierPanelSource).toContain("E-mail");
    expect(dashboardSource).toContain("onOfflineValidate");
    expect(dashboardSource).toContain("validateOfflineEvaluation");
  });

  it("conserve les aperçus avant envoi dans l’éditeur de bilan", () => {
    expect(editorSource).toContain("Aperçu");
    expect(editorSource).toContain("PDF");
    expect(editorSource).toContain("Valider et envoyer");
  });
});

describe("rattachement des dossiers agence", () => {
  it("résout une fiche agence via sa référence composite et son e-mail candidat", () => {
    expect(routerSource).toContain('candidateId: z.string().regex(/^(online|agency)_\\d+$/)');
    expect(routerSource).toContain("resolveCandidateIdForAdmin(input.candidateId)");
    expect(routerSource).toContain("Compte candidat introuvable pour ce dossier");
    expect(workspaceSource).toContain("candidateId: candidate.id");
    expect(dashboardSource).toContain("candidateId: candidate.id");
  });

  it("prépare un protocole éditable avec garde de paiement et double diffusion", () => {
    expect(routerSource).toContain("sendAgreementProtocol");
    expect(routerSource).toContain("paymentConfirmed");
    expect(routerSource).toContain("Le protocole ne peut être envoyé qu’après confirmation du paiement.");
    expect(routerSource).toContain("agencyDossierDocuments");
    expect(routerSource).toContain("sendGenericEmail");
    expect(workspaceSource).toContain("agreementContent");
    expect(workspaceSource).toContain("Envoyer par e-mail et déposer");
  });
});
