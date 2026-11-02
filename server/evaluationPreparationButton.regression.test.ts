import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dashboard = readFileSync(resolve(root, "client/src/pages/AdminDashboard.tsx"), "utf8");
const editor = readFileSync(resolve(root, "client/src/components/EvaluationDeliveryEditor.tsx"), "utf8");
const router = readFileSync(resolve(root, "server/routers/unifiedRequests.ts"), "utf8");

describe("préparation manuelle du bilan", () => {
  it("met l’éditeur au premier plan après le clic depuis la fiche dossier", () => {
    expect(dashboard).toContain("<Dialog open={!evaluationEditorOpen}");
    expect(dashboard).toContain("onOpenEditor={() => setEvaluationEditorOpen(true)}");
    expect(dashboard).toContain("sourceType={evaluationEditorSourceType}");
    expect(dashboard).toContain("Chargement de l’espace de préparation du bilan");
  });

  it("conserve la validation humaine obligatoire avant diffusion", () => {
    expect(editor).toContain("validateDraft.mutateAsync");
    expect(editor).toContain("if (!(await persist())) return false;");
    expect(router).toContain("Le brouillon doit être validé par un conseiller avant envoi");
    expect(router).toContain("validé et envoyé immédiatement dans l’espace client et par e-mail.");
    expect(router).toContain("previewConfirmed: z.literal(true)");
  });

  it("bloque proprement la prévisualisation et l’enregistrement d’un brouillon sans aucun contenu de bilan", () => {
    // Plus de recommandation obligatoire : un bilan collé (ou un simple message) suffit.
    expect(editor).toContain("Saisissez le bilan (quelques lignes au moins).");
    expect(editor).toContain("disabled={locked || busy || !text.trim() || !dirty}");
    expect(editor).toContain("Bilan non enregistré");
    expect(editor).toContain("Validation impossible");
    expect(editor).toContain("Envoi impossible");
    expect(editor).toContain("catch (caught)");
  });
});
