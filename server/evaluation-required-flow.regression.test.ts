import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("evaluation required flow", () => {
  it("shows a clear candidate action and routes to the authenticated evaluation", () => {
    const page = read("client/src/pages/EvaluationSpace.tsx");
    expect(page).toContain("evaluationRequired");
    expect(page).toContain("Évaluation rapide à compléter");
    expect(page).toContain("/evaluation?source=client-space");
    expect(page).toContain("Cette étape doit être terminée avant l’examen des documents");
  });

  it("keeps the admin editor manual and removes visible AI generation controls", () => {
    const editor = read("client/src/components/EvaluationDeliveryEditor.tsx");
    expect(editor).toContain("Bloc-notes du conseiller");
    expect(editor).toContain("Valider et envoyer par e-mail");
    expect(editor).toContain("Ouvrir WhatsApp avec le bilan");
    expect(editor).not.toContain("Générer un brouillon IA");
    expect(editor).not.toContain("Assistant IA — éléments à contrôler");
  });

  it("records declared prior evaluation as validated during registration", () => {
    const candidate = read("server/routers/candidate.ts");
    expect(candidate).toContain("evaluationAlreadyCompleted");
    expect(candidate).toContain('evaluationDeclarationStatus: \"validated\" as const');
    expect(candidate).toContain("Évaluation déjà reçue déclarée lors de l’inscription");
  });
});
