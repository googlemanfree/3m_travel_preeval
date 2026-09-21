import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("candidate evaluation visibility", () => {
  it("requires an evaluation only when no evaluation exists", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/EvaluationSpace.tsx"), "utf8");
    expect(source).toContain("const evaluationRequired = !latestEvaluation && cProfile.evaluationDeclarationStatus !== \"validated\" && (Boolean(workflow?.evaluationRequired) || cProfile.evaluationDeclarationStatus === \"not_declared\" || cProfile.evaluationDeclarationStatus === \"refused\");");
  });

  it("keeps the direct admin delivery action available", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/components/EvaluationDeliveryEditor.tsx"), "utf8");
    expect(source).toContain("Envoyer");
    expect(source).toContain("e-mail");
    expect(source).toContain('data-testid="candidate-bilan-editor"');
    expect(source).toContain("Bilan à envoyer au candidat");
    expect(source).toContain("<RichTextEditor");
    expect(source).toContain("Enregistrer le brouillon");
    expect(source).toContain("Aperçu espace candidat");
  });
});
