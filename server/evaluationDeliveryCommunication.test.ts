import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { canAutoDeliverEvaluation } from "./scheduled/evaluationBilanJob";

const root = resolve(import.meta.dirname, "..");
const readProjectFile = (relativePath: string) => readFileSync(resolve(root, relativePath), "utf8");

describe("communication de bilan contrôlée", () => {
  it("expose un aperçu e-mail serveur qui ne déclenche pas de diffusion", () => {
    const routerSource = readProjectFile("server/routers/unifiedRequests.ts");
    expect(routerSource).toContain("previewEvaluationDeliveryEmail");
    expect(routerSource).toContain("requiresManualValidation: true");
    expect(routerSource).toContain("attachmentLabel");
  });

  it("propose des modèles de procédure et un aperçu e-mail dans l’éditeur", () => {
    const editorSource = readProjectFile("client/src/components/EvaluationDeliveryEditor.tsx");
    expect(editorSource).toContain("Canada — bilan et prochaines étapes");
    expect(editorSource).toContain("Luxembourg — bilan et pièces à préparer");
    expect(editorSource).toContain("Europe — orientation et plan d’action");
    expect(editorSource).toContain("Aperçu e-mail exact");
  });

  it("expose des modèles français et anglais et une impression sans envoi", () => {
    const editorSource = readProjectFile("client/src/components/EvaluationDeliveryEditor.tsx");
    expect(editorSource).toContain("English — Standard assessment");
    expect(editorSource).toContain("Langue du candidat");
    expect(editorSource).toContain("printEmailPreview");
    expect(editorSource).toContain("printWindow.print()");
  });

  it("expose dans la fiche seulement les métadonnées nécessaires à l’historique", () => {
    const adminSource = readProjectFile("server/routers/admin.ts");
    expect(adminSource).toContain("evaluationEmails.language");
    expect(adminSource).toContain("evaluationEmails.openedAt");
    expect(adminSource).not.toContain("evaluationEmails.reportContent");
    expect(adminSource).not.toContain("evaluationEmails.secureLink");
  });

  it("conserve l’aperçu séparé de la procédure d’envoi définitif", () => {
    const routerSource = readProjectFile("server/routers/unifiedRequests.ts");
    const previewBlock = routerSource.slice(routerSource.indexOf("previewEvaluationDeliveryEmail"), routerSource.indexOf("sendEvaluationTestEmail"));
    expect(previewBlock).toContain("requiresManualValidation: true");
    expect(previewBlock).toContain("recipient: application.email");
    expect(previewBlock).not.toContain("sendEmail(");
    expect(readProjectFile("client/src/components/EvaluationDeliveryEditor.tsx")).toContain("Aperçu exact de l’e-mail d’évaluation");
  });

  it("n’autorise une livraison planifiée qu’après validation humaine explicite", () => {
    const now = new Date("2026-08-18T12:00:00.000Z");
    const scheduled = {
      dossierStatus: "en_evaluation",
      evaluationDeliveryStatus: "scheduled",
      evaluationScheduledAt: new Date("2026-08-18T11:59:00.000Z"),
      createdAt: new Date("2026-08-18T01:00:00.000Z"),
      evaluationRequiresSecondApproval: false,
      evaluationApprovalStatus: "not_required",
      scoringDetails: JSON.stringify({ adminDraft: { verdict: "Prêt", advisorValidated: false } }),
    };
    expect(canAutoDeliverEvaluation(scheduled, now)).toBe(false);
    expect(canAutoDeliverEvaluation({ ...scheduled, scoringDetails: JSON.stringify({ adminDraft: { verdict: "Prêt", advisorValidated: true } }) }, now)).toBe(true);
  });
});
