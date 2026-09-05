import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const routerSource = fs.readFileSync(path.join(projectRoot, "server/routers/adminCandidateManagement.ts"), "utf8");
const workspaceSource = fs.readFileSync(path.join(projectRoot, "client/src/components/Candidate360Workspace.tsx"), "utf8");
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
  });

  it("conserve les aperçus avant envoi dans l’éditeur de bilan", () => {
    expect(editorSource).toContain("Aperçu");
    expect(editorSource).toContain("PDF");
    expect(editorSource).toContain("Valider et envoyer");
  });
});
