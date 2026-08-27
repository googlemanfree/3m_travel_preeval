import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("demandes de pièces spécifiques d’une évaluation", () => {
  it("protège la création, la modification et le retrait par une session administrateur et un motif", () => {
    const source = read("server/routers/aiEvaluationManagement.ts");
    expect(source).toContain("createEvaluationDocumentRequirement");
    expect(source).toContain("updateEvaluationDocumentRequirement");
    expect(source).toContain("withdrawEvaluationDocumentRequirement");
    expect(source).toContain("requireValidAdminSession(input.sessionToken)");
    expect(source).toContain("reason: z.string().trim().min(8");
    expect(source).toContain("document_requirement_created");
    expect(source).toContain("document_requirement_updated");
    expect(source).toContain("document_requirement_withdrawn");
  });

  it("rattache une demande au candidat de l’évaluation et au dossier opérationnel plutôt qu’à une adresse fournie par le navigateur", () => {
    const source = read("server/routers/aiEvaluationManagement.ts");
    expect(source).toContain("requireEvaluationCandidate(db, input.evaluationId)");
    expect(source).toContain("ensureEvaluationCase(db, evaluation)");
    expect(source).toContain("candidateId: evaluation.candidateId");
    expect(source).not.toContain("candidateEmail: input");
  });

  it("expose au candidat les demandes actives et les raccourcis de dépôt, sans note ou identité administrative", () => {
    const checklist = read("client/src/components/DossierDocumentChecklist.tsx");
    const space = read("client/src/pages/EvaluationSpace.tsx");
    expect(checklist).toContain("customRequirements");
    expect(checklist).toContain("Demande de votre conseiller");
    expect(checklist).toContain("Déposer cette pièce");
    expect(checklist).not.toContain("actorId");
    expect(space).toContain("caseTracking.getMyCases.useQuery");
    expect(space).toContain("customRequirements={customRequirements}");
  });
});
