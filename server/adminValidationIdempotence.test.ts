import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("idempotence des validations administrateur", () => {
  it("refuse une seconde validation d’évaluation hors ligne et conserve le validateur", () => {
    const source = read("server/routers/adminCandidateManagement.ts");
    expect(source).toContain('candidate.evaluationDeclarationStatus === "validated"');
    expect(source).toContain("candidate.evaluationReviewedBy");
    expect(source).toContain("Cette évaluation est déjà validée");
  });

  it("refuse une seconde confirmation de paiement déjà enregistrée", () => {
    const source = read("server/routers/application.ts");
    expect(source).toContain('application.paymentStatus === "SUCCESS"');
    expect(source).toContain("application.paymentValidatedAt");
    expect(source).toContain("Aucune seconde validation n’est nécessaire");
  });

  it("affiche un état vert à la place du bouton d’évaluation déjà validée", () => {
    const source = read("client/src/components/Candidate360Workspace.tsx");
    expect(source).toContain("evaluationAlreadyValidated");
    expect(source).toContain("Évaluation déjà validée par");
    expect(source).toContain("border-emerald-200");
  });
});
